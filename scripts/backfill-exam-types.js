/* eslint-disable no-console */
/**
 * One-time migration: extract and populate examType on all Paper documents from their titles.
 *
 * Run with:
 *   node scripts/backfill-exam-types.js
 *
 * Safe to re-run — only updates papers where examType is null/missing.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { MONGODB_URL } = process.env;

if (!MONGODB_URL) {
  console.error('MONGODB_URL is not set in .env');
  process.exit(1);
}

const extractExamType = (title) => {
  if (!title) return null;
  const t = title.toLowerCase();
  if (t.includes('g.c.e') || t.includes('gce')) return 'GCE Exam';
  if (t.includes('cambridge')) return 'Cambridge Exam';
  if (t.includes('edexcel')) return 'Edexcel Exam';
  if (t.includes('scholarship')) return 'Scholarship Exam';
  if (t.includes('term test')) return 'Term Test';
  if (t.includes('model paper')) return 'Model Paper';
  return null;
};

async function run() {
  await mongoose.connect(MONGODB_URL);
  console.log('Connected to MongoDB');

  const Paper = mongoose.model(
    'PaperMigration',
    new mongoose.Schema({
      title: String,
      examType: { type: String, default: null },
    }),
    'paper'
  );

  const papers = await Paper.find({
    $or: [{ examType: null }, { examType: { $exists: false } }],
  })
    .select('_id title')
    .lean();

  console.log(`Found ${papers.length} papers to backfill`);

  if (papers.length === 0) {
    console.log('Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  const bulkOps = [];
  let skipped = 0;

  papers.forEach((p) => {
    const examType = extractExamType(p.title);
    if (examType) {
      bulkOps.push({
        updateOne: {
          filter: { _id: p._id },
          update: { $set: { examType } },
        },
      });
    } else {
      skipped += 1;
      console.log(`  No match: "${p.title}"`);
    }
  });

  if (bulkOps.length > 0) {
    const result = await Paper.bulkWrite(bulkOps);
    console.log(`Updated ${result.modifiedCount} papers`);
  }

  if (skipped > 0) {
    console.log(`Skipped ${skipped} papers (no exam type pattern found in title)`);
  }

  await mongoose.disconnect();
  console.log('Done');
}

run().catch((err) => {
  console.error(err);
  mongoose.disconnect();
  process.exit(1);
});
