const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    ADMIN_EMAIL: Joi.string().email().description('the admin email that receives tutor request match reports'),
    ADMIN_WHATSAPP_NUMBER: Joi.string().description('the admin WhatsApp number tutors can contact for support'),
    USER_APP_URL: Joi.string().uri().description('the user portal base url'),
    ADMIN_APP_URL: Joi.string().uri().description('the admin portal base url'),
    TELEGRAM_BOT_TOKEN: Joi.string().description('Telegram bot token used for tutor outreach messages'),
    TELEGRAM_TUTOR_GROUP_CHAT_ID: Joi.string().description('Telegram group/channel chat id for tutor outreach'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : ''),
    options: {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
      tls: {
        // Allow connections to servers with self-signed or invalid certificates.
        // Do NOT use this in production, as it bypasses certificate security.
        rejectUnauthorized: false,
      },
    },
    from: `"Tuition Lanka" <${process.env.EMAIL_FROM}>`,
    admin: envVars.ADMIN_EMAIL || envVars.EMAIL_FROM,
    adminWhatsAppNumber: envVars.ADMIN_WHATSAPP_NUMBER,
  },
  app: {
    userUrl: envVars.USER_APP_URL || 'https://www.tuitionlanka.com',
    adminUrl: envVars.ADMIN_APP_URL || 'https://admin.tuitionlanka.com',
  },
  telegram: {
    botToken: envVars.TELEGRAM_BOT_TOKEN,
    tutorGroupChatId: envVars.TELEGRAM_TUTOR_GROUP_CHAT_ID,
  },
};
