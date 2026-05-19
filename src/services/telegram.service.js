const https = require('https');
const httpStatus = require('http-status');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');

const telegramRequest = async (method, body, fallbackErrorMessage) => {
  const { botToken } = config.telegram;
  if (!botToken) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Telegram bot token is not configured');
  }

  const payload = JSON.stringify(body);
  const options = {
    hostname: 'api.telegram.org',
    path: `/bot${botToken}/${method}`,
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
          const description = parsedBody.description || fallbackErrorMessage;
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

const ensureTutorGroupConfigured = () => {
  const { tutorGroupChatId } = config.telegram;

  if (!tutorGroupChatId) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Telegram tutor group is not configured');
  }

  return tutorGroupChatId;
};

const sendMessage = async (text) => {
  const tutorGroupChatId = ensureTutorGroupConfigured();

  return telegramRequest(
    'sendMessage',
    {
      chat_id: tutorGroupChatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    },
    'Telegram outreach failed'
  );
};

const createTutorInviteLink = async (tutorName) => {
  const tutorGroupChatId = ensureTutorGroupConfigured();
  const expiresInSeconds = 48 * 60 * 60;
  const expireDate = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const inviteName = `Tutor ${tutorName || 'Invite'}`.slice(0, 32);

  return telegramRequest(
    'createChatInviteLink',
    {
      chat_id: tutorGroupChatId,
      name: inviteName,
      expire_date: expireDate,
      member_limit: 1,
    },
    'Telegram invite link creation failed'
  );
};

module.exports = {
  sendMessage,
  createTutorInviteLink,
};
