import UserCollection from '../db/models/Users.js';

export const getUserById = async (id) => {
  const users = await UserCollection.findById(id);
  return users;
};

export const updateUsers = async (filter, data, options) => {
  const rawResult = await UserCollection.findOneAndUpdate(filter, data, {
    new: true,
    includeResultMetadata: true,
    ...options,
  });
  if (!rawResult || !rawResult.value) return null;

  return {
    data: rawResult.value,
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
