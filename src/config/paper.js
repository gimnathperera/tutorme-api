const paperMediums = [
  { id: 'Sinhala', title: 'Sinhala' },
  { id: 'English', title: 'English' },
  { id: 'Tamil', title: 'Tamil' },
];

const examTypes = [
  { id: 'Term Test', title: 'Term Test' },
  { id: 'Model Paper', title: 'Model Paper' },
  { id: 'Scholarship Exam', title: 'Scholarship Exam' },
  { id: 'GCE Exam', title: 'GCE Exam' },
  { id: 'Cambridge Exam', title: 'Cambridge Exam' },
  { id: 'Edexcel Exam', title: 'Edexcel Exam' },
];

const normalizeValue = (value) => value.trim().toLowerCase();

const getExamType = (value) => {
  if (typeof value !== 'string') return null;
  const norm = normalizeValue(value);
  return examTypes.find((e) => normalizeValue(e.id) === norm) || null;
};

const normalizeExamType = (value) => {
  const examType = getExamType(value);
  return examType ? examType.id : null;
};

const examTypeIds = examTypes.map((e) => e.id);

const getPaperMedium = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = normalizeValue(value);
  return paperMediums.find(
    (medium) => normalizeValue(medium.id) === normalizedValue || normalizeValue(medium.title) === normalizedValue
  );
};

const normalizePaperMedium = (value) => {
  const medium = getPaperMedium(value);
  return medium ? medium.id : null;
};

const paperMediumIds = paperMediums.map((medium) => medium.id);

const formatPaperMedium = (value) => {
  const medium = getPaperMedium(value);

  if (!medium) {
    return null;
  }

  return {
    id: medium.id,
    title: medium.title,
  };
};

const formatPaperMediums = (values) => {
  const mediumMap = new Map();

  values.forEach((value) => {
    const medium = formatPaperMedium(value);
    if (medium) {
      mediumMap.set(medium.id, medium);
    }
  });

  return Array.from(mediumMap.values());
};

module.exports = {
  paperMediums,
  paperMediumIds,
  formatPaperMedium,
  formatPaperMediums,
  getPaperMedium,
  normalizePaperMedium,
  examTypes,
  examTypeIds,
  getExamType,
  normalizeExamType,
};
