const paperMediums = [
  {
    id: 'Sinhala',
    title: 'Sinhala',
  },
  {
    id: 'English',
    title: 'English',
  },
  {
    id: 'Tamil',
    title: 'Tamil',
  },
];

const normalizeValue = (value) => value.trim().toLowerCase();

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
};
