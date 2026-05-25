/* eslint-disable */
/**
 * seed-missing-rates.js
 *
 * Uses the existing API to create TuitionRate records for every subject
 * in a grade that has no rate configured yet.
 *
 * Safe:
 *   - Only calls POST /tuition-rates (same as admin panel)
 *   - Never updates or deletes existing records
 *   - Duplicate insert blocked by the API's unique index (409 / 400 skipped)
 *   - Grades with zero rates are skipped (nothing to copy from)
 *
 * Usage:
 *   node scripts/seed-missing-rates.js              ← dry run (logs only, no writes)
 *   node scripts/seed-missing-rates.js --apply      ← actually creates records
 *
 * Set env vars or edit the CONFIG block below before running.
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000/v1';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@tuitionlanka.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const DRY_RUN = !process.argv.includes('--apply');

// Fallback rates for grades that have zero configured rates in the DB.
// Values taken from production screenshots.
const GRADE_FALLBACK_RATES = {
  'G.C.E Advanced Level (Technology Stream)': {
    universityStudentsRate: { minimumRate: 1000, maximumRate: 2500 },
    partTimeTutorRate:      { minimumRate: 1500, maximumRate: 3500 },
    fullTimeTutorRate:      { minimumRate: 2000, maximumRate: 5000 },
    moeTeacherRate:         { minimumRate: 2500, maximumRate: 6000 },
  },
  'Diplomas': {
    universityStudentsRate: { minimumRate: 1500, maximumRate: 3000 },
    partTimeTutorRate:      { minimumRate: 2000, maximumRate: 4000 },
    fullTimeTutorRate:      { minimumRate: 2000, maximumRate: 6000 },
    moeTeacherRate:         { minimumRate: 2500, maximumRate: 8000 },
  },
};

// ─── helpers ────────────────────────────────────────────────────────────────

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json };
}

// ─── main ────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(DRY_RUN ? '  DRY RUN — no records will be created' : '  APPLY MODE — records will be created');
  console.log(`  API: ${BASE_URL}`);
  console.log(`${'─'.repeat(60)}\n`);

  // 1. Login
  if (!ADMIN_PASSWORD) {
    console.error('❌  Set ADMIN_PASSWORD env var before running.');
    process.exit(1);
  }

  const loginRes = await api('/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });

  if (loginRes.status !== 200) {
    console.error('❌  Login failed:', (loginRes.data && loginRes.data.message) || loginRes.status);
    process.exit(1);
  }

  const token = loginRes.data && loginRes.data.tokens && loginRes.data.tokens.access && loginRes.data.tokens.access.token;
  console.log(`✓ Logged in as ${ADMIN_EMAIL}\n`);

  // 2. Fetch all grades (large limit to get all at once)
  const gradesRes = await api('/grades?limit=200');
  const grades = gradesRes.data.results || gradesRes.data.grades || [];

  if (!grades.length) {
    console.log('No grades found. Exiting.');
    return;
  }

  console.log(`Found ${grades.length} grades\n`);

  let totalCreated = 0;
  let totalSkipped = 0;
  let totalAlreadyExist = 0;

  for (const grade of grades) {
    const gradeId = grade.id || grade._id;

    // 3. Get grade detail with subjects
    const gradeDetailRes = await api(`/grades/${gradeId}`);
    const subjects = gradeDetailRes.data.subjects || [];

    if (!subjects.length) {
      console.log(`[SKIP] "${grade.title}" — no subjects`);
      totalSkipped++;
      continue;
    }

    // 4. Get existing tuition rates for this grade directly from TuitionRates collection
    let existingRates = [];
    let page = 1;
    while (true) {
      const ratesRes = await api(`/tuitionRates?grade=${gradeId}&limit=200&page=${page}`);
      const results = ratesRes.data.results || [];
      existingRates = existingRates.concat(results);
      if (page >= (ratesRes.data.totalPages || 1)) break;
      page++;
    }

    // All results from /tuitionRates?grade= are configured records
    const configuredRates = existingRates.filter(
      (r) => r.universityStudentsRate && r.universityStudentsRate.minimumRate != null
    );

    let template;
    if (configuredRates.length) {
      template = configuredRates[0];
    } else if (GRADE_FALLBACK_RATES[grade.title]) {
      template = GRADE_FALLBACK_RATES[grade.title];
      console.log(`[FALL] "${grade.title}" — no DB rates, using production fallback`);
    } else {
      console.log(`[SKIP] "${grade.title}" — no configured rates to copy from`);
      totalSkipped++;
      continue;
    }
    const configuredSubjectIds = new Set(
      configuredRates.map((r) => (r.subject && (r.subject.id || r.subject._id)))
    );

    const missingSubjects = subjects.filter(
      (s) => !configuredSubjectIds.has(s.id || s._id)
    );

    if (!missingSubjects.length) {
      console.log(`[OK]   "${grade.title}" — all ${subjects.length} subjects have rates`);
      continue;
    }

    console.log(`[FIX]  "${grade.title}" — ${missingSubjects.length} subject(s) missing rates:`);

    for (const subject of missingSubjects) {
      const subjectId = subject.id || subject._id;
      const payload = {
        subject: subjectId,
        grade: gradeId,
        universityStudentsRate: {
          minimumRate: template.universityStudentsRate.minimumRate,
          maximumRate: template.universityStudentsRate.maximumRate,
        },
        partTimeTutorRate: {
          minimumRate: template.partTimeTutorRate.minimumRate,
          maximumRate: template.partTimeTutorRate.maximumRate,
        },
        fullTimeTutorRate: {
          minimumRate: template.fullTimeTutorRate.minimumRate,
          maximumRate: template.fullTimeTutorRate.maximumRate,
        },
        moeTeacherRate: {
          minimumRate: template.moeTeacherRate.minimumRate,
          maximumRate: template.moeTeacherRate.maximumRate,
        },
      };

      if (DRY_RUN) {
        console.log(`   [DRY] Would create rate for "${subject.title}"`);
        totalCreated++;
        continue;
      }

      const createRes = await api('/tuitionRates', {
        method: 'POST',
        token,
        body: payload,
      });

      if (createRes.status === 201) {
        console.log(`   ✓ Created rate for "${subject.title}"`);
        totalCreated++;
      } else if (createRes.status === 400 || createRes.status === 409) {
        console.log(`   ~ Already exists for "${subject.title}" — skipped`);
        totalAlreadyExist++;
      } else {
        console.error(`   ✗ Failed for "${subject.title}" — ${createRes.status}: ${JSON.stringify(createRes.data)}`);
      }
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  if (DRY_RUN) {
    console.log(`  DRY RUN complete — ${totalCreated} record(s) would be created`);
    console.log(`  Run with --apply flag to actually create them`);
  } else {
    console.log(`  Created       : ${totalCreated}`);
    console.log(`  Already exist : ${totalAlreadyExist}`);
    console.log(`  Grades skipped: ${totalSkipped}`);
  }
  console.log(`${'─'.repeat(60)}\n`);
}

run().catch((err) => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
