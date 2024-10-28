import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import * as UserServices from '../services/userServices.js';
import saveFileToUploadDir from '../utils/saveFileToUploadDir.js';
import saveFileToCloudinary from '../utils/saveFileToCloudinary.js';
import { env } from '../utils/env.js';
import UserCollection from '../db/models/Users.js';

const enableCloudinary = env('ENABLE_CLOUDINARY');

export const getUserByIdController = async (req, res) => {
  const { id } = req.params;
  const data = await UserServices.getUserById(id);

  if (!data) {
    throw createHttpError(404, `User not found`);
  }

  res.json({
    status: 200,
    message: `User with ${id} successfully find`,
    data,
  });
};

export const upsertUserController = async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword, ...otherData } = req.body;

  if (newPassword) {
    const user = await UserCollection.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Incorrect old password' });
    }

    // Хешуємо новий пароль і додаємо до `otherData`
    otherData.password = await bcrypt.hash(newPassword, 10);
  }

  const { isNew, data } = await UserServices.updateUsers(
    { _id: id },
    req.body,
    { upsert: true },
  );

  console.log(data);

  const status = isNew ? 201 : 200;

  res.status(status).json({
    status: 200,
    message: 'Successfully patched a contact!',
    data,
  });
};

export const patchUserController = async (req, res) => {
  const { _id: id } = req.user;
  const avatar = req.file;

  let photoUrl;

  if (avatar) {
    if (enableCloudinary === 'true') {
      photoUrl = await saveFileToCloudinary(avatar);
    } else {
      photoUrl = await saveFileToUploadDir(avatar);
    }
  }

  const updatedData = {
    ...req.body,
    ...(photoUrl && { avatar: photoUrl }),
  };

  const result = await UserServices.updateContact(id, updatedData);
  if (!result) {
    throw createHttpError(404, `Contact with id=${id} not found`);
  }

  res.json({
    status: 200,
    message: 'Successfully patched the contact!',
    data: result,
  });
};
