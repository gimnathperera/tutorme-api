/* eslint-disable no-console */
/**
 * One-time migration: populate subjectTitle on all existing Paper documents.
 *
 * Run with:
 *   node scripts/backfill-subject-titles.js
 *
 * Safe to re-run — only updates papers where subjectTitle is null/missing.
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

async function run() {
  await mongoose.connect(MONGODB_URL);
  console.log('Connected to MongoDB');

  const Paper = mongoose.model(
    'Paper',
    new mongoose.Schema({
      subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
      subjectTitle: { type: String, default: null },
    }),
    'paper'
  );

  const Subject = mongoose.model('Subject', new mongoose.Schema({ title: String }), 'subjects');

  const papers = await Paper.find({
    subject: { $exists: true, $ne: null },
    $or: [{ subjectTitle: null }, { subjectTitle: { $exists: false } }],
  })
    .select('_id subject')
    .lean();

  console.log(`Found ${papers.length} papers to backfill`);

  if (papers.length === 0) {
    console.log('Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  const subjectIds = [...new Set(papers.map((p) => String(p.subject)))];
  const subjects = await Subject.find({ _id: { $in: subjectIds } })
    .select('_id title')
    .lean();
  const subjectMap = Object.fromEntries(subjects.map((s) => [String(s._id), s.title]));

  const bulkOps = papers
    .filter((p) => subjectMap[String(p.subject)])
    .map((p) => ({
      updateOne: {
        filter: { _id: p._id },
        update: { $set: { subjectTitle: subjectMap[String(p.subject)] } },
      },
    }));

  if (bulkOps.length > 0) {
    const result = await Paper.bulkWrite(bulkOps);
    console.log(`Updated ${result.modifiedCount} papers`);
  }

  const skipped = papers.length - bulkOps.length;
  if (skipped > 0) {
    console.log(`Skipped ${skipped} papers (subject not found in subjects collection)`);
  }

  await mongoose.disconnect();
  console.log('Done');
}

run().catch((err) => {
  console.error(err);
  mongoose.disconnect();
  process.exit(1);
});
