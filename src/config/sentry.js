const Sentry = require('@sentry/node');
const config = require('./config');

const REDACTED = '[Filtered]';
const MAX_SANITIZE_DEPTH = 6;
const SENSITIVE_FIELD_PATTERN =
  /authorization|cookie|password|passcode|pin|otp|token|secret|api[-_]?key|access[-_]?key|refresh|jwt|session|credential|private/i;

const isEnabled = Boolean(config.sentry.dsn);

const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';

const shouldRedactKey = (key) => SENSITIVE_FIELD_PATTERN.test(String(key));

const sanitizeValue = (value, depth = 0) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (depth > MAX_SANITIZE_DEPTH) {
    return REDACTED;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (isPlainObject(value)) {
    return Object.keys(value).reduce(
      (sanitized, key) => ({
        ...sanitized,
        [key]: shouldRedactKey(key) ? REDACTED : sanitizeValue(value[key], depth + 1),
      }),
      {}
    );
  }

  return value;
};

const sanitizeHeaders = (headers = {}) =>
  Object.keys(headers).reduce(
    (sanitized, key) => ({
      ...sanitized,
      [key]: shouldRedactKey(key) ? REDACTED : headers[key],
    }),
    {}
  );

const sanitizeQueryString = (queryString) => {
  if (!queryString || typeof queryString !== 'string') {
    return queryString;
  }

  const params = new URLSearchParams(queryString);
  Array.from(params.keys()).forEach((key) => {
    if (shouldRedactKey(key)) {
      params.set(key, REDACTED);
    }
  });

  return params.toString();
};

const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('?')) {
    return url;
  }

  const [urlWithoutHash, hash] = url.split('#');
  const [path, queryString] = urlWithoutHash.split('?');
  const sanitizedQueryString = sanitizeQueryString(queryString);

  return `${path}?${sanitizedQueryString}${hash ? `#${hash}` : ''}`;
};

const sanitizeBreadcrumbData = (data) => {
  if (!isPlainObject(data)) {
    return sanitizeValue(data);
  }

  return Object.keys(data).reduce(
    (sanitized, key) => ({
      ...sanitized,
      [key]: /url|href/i.test(key) ? sanitizeUrl(data[key]) : sanitizeValue(data[key]),
    }),
    {}
  );
};

const sanitizeRequest = (request) => {
  const sanitizedRequest = {
    ...request,
    url: sanitizeUrl(request.url),
    headers: sanitizeHeaders(request.headers),
    query_string: sanitizeQueryString(request.query_string),
  };

  delete sanitizedRequest.cookies;

  if (request.data !== undefined) {
    sanitizedRequest.data = REDACTED;
  }

  return sanitizedRequest;
};

const sanitizeUser = (user) => {
  const sanitizedUser = sanitizeValue(user);

  if (isPlainObject(sanitizedUser)) {
    delete sanitizedUser.ip_address;
  }

  return sanitizedUser;
};

const beforeSend = (event) => {
  const sanitizedEvent = {
    ...event,
    ...(event.request && { request: sanitizeRequest(event.request) }),
    ...(event.extra && { extra: sanitizeValue(event.extra) }),
    ...(event.contexts && { contexts: sanitizeValue(event.contexts) }),
    ...(event.user && { user: sanitizeUser(event.user) }),
    ...(event.breadcrumbs && {
      breadcrumbs: event.breadcrumbs.map((breadcrumb) => ({
        ...breadcrumb,
        ...(breadcrumb.data && { data: sanitizeBreadcrumbData(breadcrumb.data) }),
      })),
    }),
  };

  return sanitizedEvent;
};

if (isEnabled) {
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.env,
    release: config.sentry.release,
    sendDefaultPii: false,
    tracesSampleRate: config.env === 'production' ? 0.05 : 0.1,
    beforeSend,
  });
}

const setupExpressErrorHandler = (app) => {
  if (isEnabled) {
    Sentry.setupExpressErrorHandler(app);
  }
};

const captureException = (error) => {
  if (isEnabled) {
    Sentry.captureException(error);
  }
};

const flush = (timeout = 2000) => (isEnabled ? Sentry.flush(timeout) : Promise.resolve(true));

module.exports = {
  Sentry,
  isEnabled,
  setupExpressErrorHandler,
  captureException,
  flush,
};
