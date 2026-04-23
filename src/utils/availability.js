const httpStatus = require('http-status');
const ApiError = require('./ApiError');

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAY_ORDER = new Map(WEEK_DAYS.map((day, index) => [day, index]));

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const normalizeAvailabilitySlot = (slot, index) => {
  if (!isPlainObject(slot)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `availability[${index}] must be an object`);
  }

  const day = typeof slot.day === 'string' ? slot.day.trim() : slot.day;
  const start = typeof slot.start === 'string' ? slot.start.trim() : slot.start;
  const end = typeof slot.end === 'string' ? slot.end.trim() : slot.end;

  if (!WEEK_DAYS.includes(day)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `availability[${index}].day must be a valid weekday`);
  }

  if (!TIME_PATTERN.test(start)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `availability[${index}].start must use HH:mm format`);
  }

  if (!TIME_PATTERN.test(end)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `availability[${index}].end must use HH:mm format`);
  }

  if (toMinutes(end) <= toMinutes(start)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `availability[${index}].end must be later than start`);
  }

  return { day, start, end };
};

const sortAvailability = (slots) =>
  [...slots].sort((left, right) => {
    const dayDiff = DAY_ORDER.get(left.day) - DAY_ORDER.get(right.day);
    if (dayDiff !== 0) {
      return dayDiff;
    }

    const startDiff = toMinutes(left.start) - toMinutes(right.start);
    if (startDiff !== 0) {
      return startDiff;
    }

    return toMinutes(left.end) - toMinutes(right.end);
  });

const normalizeAvailabilitySlots = (slots) => sortAvailability(slots.map(normalizeAvailabilitySlot));

const parseAvailabilityInput = (availability) => {
  if (availability === undefined) {
    return undefined;
  }

  let parsedAvailability = availability;

  if (typeof parsedAvailability === 'string') {
    try {
      parsedAvailability = JSON.parse(parsedAvailability);
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'availability must be valid JSON when provided as a string');
    }
  }

  if (!Array.isArray(parsedAvailability)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'availability must be an array of schedule slots');
  }

  return normalizeAvailabilitySlots(parsedAvailability);
};

const getSafeAvailability = (availability) => {
  if (availability === undefined || availability === null || availability === '') {
    return [];
  }

  try {
    return parseAvailabilityInput(availability) || [];
  } catch (error) {
    return [];
  }
};

const normalizeUserProfileFields = (payload) => {
  const normalizedPayload = { ...payload };

  if (
    Object.prototype.hasOwnProperty.call(normalizedPayload, 'fullName') &&
    typeof normalizedPayload.fullName === 'string' &&
    !Object.prototype.hasOwnProperty.call(normalizedPayload, 'name')
  ) {
    normalizedPayload.name = normalizedPayload.fullName;
  }

  if (
    Object.prototype.hasOwnProperty.call(normalizedPayload, 'contactNumber') &&
    typeof normalizedPayload.contactNumber === 'string' &&
    !Object.prototype.hasOwnProperty.call(normalizedPayload, 'phoneNumber')
  ) {
    normalizedPayload.phoneNumber = normalizedPayload.contactNumber;
  }

  if (
    Object.prototype.hasOwnProperty.call(normalizedPayload, 'dateOfBirth') &&
    !Object.prototype.hasOwnProperty.call(normalizedPayload, 'birthday')
  ) {
    normalizedPayload.birthday = normalizedPayload.dateOfBirth;
  }

  if (Object.prototype.hasOwnProperty.call(normalizedPayload, 'rate') && typeof normalizedPayload.rate === 'string') {
    normalizedPayload.rate = normalizedPayload.rate.trim();
  }

  if (Object.prototype.hasOwnProperty.call(normalizedPayload, 'availability')) {
    normalizedPayload.availability = parseAvailabilityInput(normalizedPayload.availability);
  }

  return normalizedPayload;
};

const serializeUserProfile = (user) => {
  const serializedUser = user && typeof user.toJSON === 'function' ? user.toJSON() : { ...user };

  return {
    ...serializedUser,
    rate: typeof serializedUser.rate === 'string' ? serializedUser.rate : '',
    availability: getSafeAvailability(serializedUser.availability),
  };
};

module.exports = {
  WEEK_DAYS,
  TIME_PATTERN,
  normalizeAvailabilitySlots,
  parseAvailabilityInput,
  normalizeUserProfileFields,
  serializeUserProfile,
  toMinutes,
};
