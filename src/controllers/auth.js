import * as authServices from '../services/auth.js';
import { requestResetToken, resetPassword } from '../services/auth.js';

const setupSession = (res, session) => {
  res.cookie('refreshToken', session.refreshToken, {
    httpOnly: true,
    expire: new Date(Date.now() + session.refreshTokenValidUntil),
    sameSite: 'None',
    secure: true,
  });

  res.cookie('sessionId', session._id, {
    httpOnly: true,
    expire: new Date(Date.now() + session.refreshTokenValidUntil),
    sameSite: 'None',
    secure: true,
  });
};

export const registerController = async (req, res) => {
  const data = await authServices.register(req.body);

  res.status(201).json({
    status: 201,
    message: 'Successfully registered a user!',
    user: data.user,
    token: data.session.accessToken,
  });
};

export const loginController = async (req, res) => {
  const data = await authServices.login(req.body);

  setupSession(res, data.session);

  res.json({
    status: 200,
    message: 'Successfully logged in an user!',
    user: data.user,
    token: data.session.accessToken,
  });
};

export const refreshController = async (req, res) => {
  const { token } = req.body
  const { refreshToken, sessionId } = req.cookies;
  const data = await authServices.refreshSession({
    token,
    refreshToken,
    sessionId,
  });

  setupSession(res, data.session);
  const message = data.isRefreshed ? 'Successfully refreshed a session!' : 'Successfully checked access token!';

  res.json({
    status: 200,
    message,
    user: data.user,
    token: data.session.accessToken,
  });
};

export const logoutController = async (req, res) => {
  const { sessionId } = req.cookies;
  if (sessionId) {
    await authServices.logout(sessionId);
  }

  res.clearCookie('sessionId');
  res.clearCookie('refreshToken');

  res.status(204).send();
};

export const sendResetEmailController = async (req, res) => {
  await requestResetToken(req.body.email);
  res.json({
    status: 200,
    message: 'Reset password email was successfully sent.',
    data: {},
  });
};

export const resetPasswordController = async (req, res) => {
  const {
    token,
    password
  } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      status: 400,
      message: 'Token and password are required.',
    });
  }

  const user = await resetPassword({
    token,
    password
  });

  res.status(200).json({
    status: 200,
    message: 'Password has been successfully reset.',
    data: user,
  });
};
