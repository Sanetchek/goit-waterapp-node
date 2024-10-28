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
  console.log(rawResult);

  if (!rawResult || !rawResult.value) return null;

  return {
    data: rawResult.value,
    isNew: Boolean(rawResult?.lastErrorObject?.upserted),
  };
};
