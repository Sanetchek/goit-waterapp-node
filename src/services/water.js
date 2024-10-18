import Users from "../db/models/Users.js";

export const getUserWaterRate = (filter) => {
    return Users.findOne(filter);
};

export const updateUserWaterRate = async (filter, data, options = {}) => {
    const updatedUser = await Users.findOneAndUpdate(filter, data, {
        includeResultMetadata: true, ...options,
    });

    if (!updatedUser) {
        return null;
    }

    return updatedUser;
};