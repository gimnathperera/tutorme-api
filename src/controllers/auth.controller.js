const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const config = require('../config/config');
const { authService, userService, tokenService, emailService } = require('../services');

const resolveResetPasswordAppUrl = (req) => {
  const { portal } = req.body;
  const origin = req.get('origin') || req.get('referer');

  if (portal === 'admin') {
    return config.app.adminUrl;
  }

  if (portal === 'user') {
    return config.app.userUrl;
  }

  if (origin) {
    try {
      const originUrl = new URL(origin).origin;
      if (originUrl === new URL(config.app.adminUrl).origin) {
        return config.app.adminUrl;
      }
      if (originUrl === new URL(config.app.userUrl).origin) {
        return config.app.userUrl;
      }
    } catch (err) {
      // Ignore malformed origins and fall back to the user portal.
    }
  }

  return config.app.userUrl;
};

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({
    user,
    tokens,
    requirePasswordChange: Boolean(user.forcePasswordReset),
  });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  const appUrl = resolveResetPasswordAppUrl(req);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken, appUrl);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
};
