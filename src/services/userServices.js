import UserCollection from '../db/models/Users.js';

const sanitizeUser = (user) => {
  const cleanUser = {
    ...user._doc
  };
  delete cleanUser.password;
  delete cleanUser.createdAt;
  delete cleanUser.updatedAt;
  return cleanUser;
};

export const getUserById = async (userId) => {
  const user = await UserCollection.findById(userId);
  return sanitizeUser(user);
};

export const updateUsers = async (filter, data, options) => {
  const rawResult = await UserCollection.findOneAndUpdate(filter, data, {
    new: true,
    includeResultMetadata: true,
    ...options,
  });
  if (!rawResult || !rawResult.value) return null;

  const user = rawResult.value;

  return {
    data: sanitizeUser(user),
    isNew: Boolean(rawResult?.lastErrorObject?.upserted),
  };
};

export const updateContact = async (id, data) => {
  // Use findByIdAndUpdate to update the user document
  const updatedUser = await UserCollection.findByIdAndUpdate(
    id,
    data, {
      new: true
    } // Return the updated document
  );

  // If the user was not found, return null
  if (!updatedUser) return null;

  // Return the updated user data
  return updatedUser;
};
