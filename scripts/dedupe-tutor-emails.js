/* eslint-disable no-console */
/**
 * One-time cleanup: remove duplicate tutor records that share the same email.
 *
 * Duplicates were created by a check-then-create race condition (two near-
 * simultaneous registrations both passed the availability check before either
 * insert landed). A unique index is being added to the `email` field, and that
 * index cannot build while duplicates exist — run this first.
 *
 * Strategy: within each duplicate email group, KEEP the oldest record
 * (earliest createdAt) and delete the newer ones.
 *
 * Usage:
 *   node scripts/dedupe-tutor-emails.js            # dry run — reports only
 *   node scripts/dedupe-tutor-emails.js --apply    # actually delete duplicates
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { MONGODB_URL } = process.env;
const APPLY = process.argv.includes('--apply');

if (!MONGODB_URL) {
  console.error('MONGODB_URL is not set in .env');
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGODB_URL);
  console.log(`Connected to MongoDB (${APPLY ? 'APPLY' : 'DRY RUN'} mode)`);

  const tutors = mongoose.connection.collection('tutors');

  // Group by normalized email; only keep groups with more than one document.
  const groups = await tutors
    .aggregate([
      {
        $group: {
          _id: { $toLower: { $trim: { input: '$email' } } },
          ids: { $push: { id: '$_id', createdAt: '$createdAt', status: '$status' } },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();

  if (groups.length === 0) {
    console.log('No duplicate emails found. Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${groups.length} email(s) with duplicates:\n`);

  const idsToDelete = groups.flatMap((group) => {
    // Oldest first — keep [0], delete the rest.
    const sorted = [...group.ids].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const keep = sorted[0];
    const remove = sorted.slice(1);

    console.log(`  ${group._id} (${group.count} records)`);
    console.log(`    KEEP   ${keep.id} [${keep.status}] ${new Date(keep.createdAt).toISOString()}`);
    remove.forEach((doc) => {
      console.log(`    DELETE ${doc.id} [${doc.status}] ${new Date(doc.createdAt).toISOString()}`);
    });

    return remove.map((doc) => doc.id);
  });

  console.log(`\nTotal records to delete: ${idsToDelete.length}`);

  if (!APPLY) {
    console.log('\nDry run — no changes made. Re-run with --apply to delete these records.');
    await mongoose.disconnect();
    return;
  }

  const result = await tutors.deleteMany({ _id: { $in: idsToDelete } });
  console.log(`\nDeleted ${result.deletedCount} duplicate tutor record(s).`);

  await mongoose.disconnect();
  console.log('Done');
}

run().catch((err) => {
  console.error(err);
  mongoose.disconnect();
  process.exit(1);
});
