const https = require('https');
const httpStatus = require('http-status');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');

const sendMessage = async (text) => {
  const { botToken, tutorGroupChatId } = config.telegram;

  if (!botToken || !tutorGroupChatId) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Telegram outreach is not configured');
  }

  const payload = JSON.stringify({
    chat_id: tutorGroupChatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });

  const options = {
    hostname: 'api.telegram.org',
    path: `/bot${botToken}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      let responseBody = '';

      response.on('data', (chunk) => {
        responseBody += chunk;
      });

      response.on('end', () => {
        let parsedBody;

        try {
          parsedBody = responseBody ? JSON.parse(responseBody) : {};
        } catch (parseError) {
          return reject(
            new ApiError(httpStatus.BAD_GATEWAY, 'Telegram returned an invalid response', true, parseError.stack)
          );
        }

        if (response.statusCode < 200 || response.statusCode >= 300 || parsedBody.ok === false) {
          const description = parsedBody.description || 'Telegram outreach failed';
          return reject(new ApiError(httpStatus.BAD_GATEWAY, description));
        }

        return resolve(parsedBody.result);
      });
    });

    request.on('error', () => {
      reject(new ApiError(httpStatus.BAD_GATEWAY, 'Unable to reach Telegram'));
    });

    request.write(payload);
    request.end();
  });
};

module.exports = {
  sendMessage,
};
