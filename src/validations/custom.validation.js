const objectId = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('"{{#label}}" must be a valid mongo id');
  }
  return value;
};

const password = (value, helpers) => {
  if (value.length < 8) {
    return helpers.message('password must be at least 8 characters');
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.message('password must contain at least 1 letter and 1 number');
  }
  return value;
};

const base64FileSize = (maxBytes) => (value, helpers) => {
  const padding = (value.match(/=+$/) || [''])[0].length;
  const decodedBytes = Math.floor((value.length * 3) / 4) - padding;
  if (decodedBytes > maxBytes) {
    return helpers.message(`"{{#label}}" must decode to ${Math.round(maxBytes / (1024 * 1024))}MB or less`);
  }
  return value;
};

module.exports = {
  objectId,
  password,
  base64FileSize,
};
