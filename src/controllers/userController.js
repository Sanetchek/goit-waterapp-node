import createHttpError from 'http-errors';
import * as UserServices from '../services/userServices.js';
import saveFileToUploadDir from '../utils/saveFileToUploadDir.js';
import saveFileToCloudinary from '../utils/saveFileToCloudinary.js';
import { env } from '../utils/env.js';

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
  const { isNew, data } = await UserServices.updateUsers(
    { _id: id },
    req.body,
    { upsert: true },
  );
  const status = isNew ? 201 : 200;

  res.status(status).json({
    status: status, // Ensure the status here reflects the operation
    message: 'Successfully patched a user!', // Change 'contact' to 'user'
    data,
  });
};

export const patchUserController = async (req, res) => {
  const {
    _id: id
  } = req.user;
  const avatar = req.file;

  let photoUrl;

  if (avatar) {
    console.log('Uploaded Avatar:', avatar); // Debugging line

    if (enableCloudinary === 'true') {
      photoUrl = await saveFileToCloudinary(avatar);
      console.log('Photo URL from Cloudinary:', photoUrl); // Debugging line
    } else {
      photoUrl = await saveFileToUploadDir(avatar);
      console.log('Photo URL from local:', photoUrl); // Debugging line
    }
  }

  const updatedData = {
    ...req.body,
    ...(photoUrl && {
      avatar: photoUrl
    }),
  };

  console.log('Updated Data:', updatedData); // Debugging line

  const result = await UserServices.updateContact(id, updatedData);

  if (!result) {
    throw createHttpError(404, `User with id=${id} not found`);
  }

  console.log('result:', result); // Debugging line
  res.json({
    status: 200,
    message: 'Successfully patched the user!',
    data: result,
  });
};
