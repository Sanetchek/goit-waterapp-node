import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import handlebars from 'handlebars';
import path from 'node:path';
import fs from 'node:fs/promises';

import UserCollection from '../db/models/Users.js';
import SessionCollection from '../db/models/Sessions.js';
import {
  accessTokenLifetime,
  refreshTokenLifetime,
} from '../constants/users.js';
import { SMTP, TEMPLATES_DIR } from '../constants/index.js';
import { env } from '../utils/env.js';
import { sendEmail } from '../utils/sendEmail.js';

// Helper Functions
const generateHash = (password) => bcrypt.hash(password, 10);

const sanitizeUser = (user) => {
  const cleanUser = { ...user._doc };
  delete cleanUser.password;
  delete cleanUser.createdAt;
  delete cleanUser.updatedAt;
  return cleanUser;
};

const createSession = () => ({
  accessToken: randomBytes(30).toString('base64'),
  refreshToken: randomBytes(30).toString('base64'),
  accessTokenValidUntil: new Date(Date.now() + accessTokenLifetime),
  refreshTokenValidUntil: new Date(Date.now() + refreshTokenLifetime),
});

const generateResetToken = (userId, email) =>
  jwt.sign({ sub: userId, email }, env('JWT_SECRET'), { expiresIn: '24h' });

// Main Exports
export const register = async ({ email, password, ...rest }) => {
  if (await UserCollection.findOne({ email })) {
    throw createHttpError(409, 'Email in use');
  }

  const hashedPassword = await generateHash(password);
  const newUser = await UserCollection.create({
    email,
    password: hashedPassword,
    ...rest,
  });

  const sessionData = createSession();
  const userSession = await SessionCollection.create({
    userId: newUser._id,
    ...sessionData,
  });

  return { user: sanitizeUser(newUser), session: userSession };
};

export const login = async ({ email, password }) => {
  const user = await UserCollection.findOne({ email });
  const check_password = await bcrypt.compare(password, user.password);
  if (!user || !check_password) {
    throw createHttpError(401, 'Email or password invalid');
  }


  await SessionCollection.deleteOne({ userId: user._id });
  const sessionData = createSession();
  const userSession = await SessionCollection.create({
    userId: user._id,
    ...sessionData,
  });

  return { user: sanitizeUser(user), session: userSession };
};

export const refreshSession = async ({ refreshToken, sessionId }) => {
  const oldSession = await SessionCollection.findOne({
    _id: sessionId,
    refreshToken,
  });
  if (!oldSession) throw createHttpError(401, 'Session not found');
  if (new Date() > oldSession.refreshTokenValidUntil)
    throw createHttpError(401, 'Session token expired');

  const user = await UserCollection.findById(oldSession.userId);
  if (!user) throw createHttpError(401, 'User not found');

  await SessionCollection.deleteOne({ _id: sessionId });
  const sessionData = createSession();
  const userSession = await SessionCollection.create({
    userId: user._id,
    ...sessionData,
  });

  return { user: sanitizeUser(user), session: userSession };
};

export const findSessionByAccessToken = (accessToken) =>
  SessionCollection.findOne({ accessToken });

export const logout = (sessionId) =>
  SessionCollection.deleteOne({ _id: sessionId });

export const findUser = (filter) => UserCollection.findOne(filter);

export const requestResetToken = async (email) => {
  const user = await UserCollection.findOne({ email });
  if (!user) throw createHttpError(404, 'User not found');

  const resetToken = generateResetToken(user._id, email);
  const resetPasswordTemplatePath = path.join(
    TEMPLATES_DIR,
    'reset-password-email.html',
  );
  const templateSource = await fs.readFile(resetPasswordTemplatePath, 'utf-8');
  const template = handlebars.compile(templateSource);

  const html = template({
    name: user.name,
    link: `${env('APP_DOMAIN')}/reset-password?token=${resetToken}`,
  });

  const mailOptions = await sendEmail({
    from: env(SMTP.SMTP_FROM),
    to: email,
    subject: 'Reset your password',
    html,
  });

  if (!mailOptions) {
    throw createHttpError(
      500,
      'Failed to send the email, please try again later.',
    );
  }
};

export const resetPassword = async ({ token, password }) => {
  let payload;
  try {
    payload = jwt.verify(token, env('JWT_SECRET'));
    console.log(payload);
  } catch (error) {
    throw createHttpError(401, error.message);
  }

  const user = await UserCollection.findOne({
    email: payload.email,
    _id: payload.sub,
  });
  if (!user) throw createHttpError(404, 'User not found');

  const hashedPassword = await generateHash(password);
  await UserCollection.updateOne(
    { _id: user._id },
    { password: hashedPassword },
  );
};
