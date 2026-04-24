import bcrypt from "bcrypt";
import { users } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";

import { checkId, checkEmail } from "../helpers.js";
import { getTrailsByIds } from "./trail.js";

const SALT_ROUNDS = 12; // number of hashing iterations basically the higher the more secure but the more expensive

export const createUser = async (
    email,
    password,
    username,
) => {
    if (!email || !password || !username) throw new Error("Missing arguments for user creation.");
    email = checkEmail(email);
    if (typeof username === 'string') username = username.trim();
    const usernameLower = String(username).toLowerCase();
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS); // hashing the password for secure storage in the db

    const newUser = {
        email: email,
        emailLower: email,
        password: hashedPassword,
        username: username,
        usernameLower: usernameLower,
        role: 'user',
        favoriteTrailIds: [], // array of trail ids "hearted" by the user
        badges: [], // initialized to none and will populate based on metrics we define
        milesHiked: 0, // initialized to 0 obv
    }

    const userCollection = await users();
    const existing = await userCollection.findOne({
      $or: [{ emailLower: email }, { usernameLower }]
    });
    if (existing?.emailLower === email) throw new Error(`An account with that email already exists.`);
    if (existing?.usernameLower === usernameLower) throw new Error(`An account with that username already exists.`);

    const insertInfo = await userCollection.insertOne(newUser);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) throw new Error("Failed to insert new user into database.");

    const user = await getUserById(insertInfo.insertedId.toString());

    return user;
}

export const getUserById = async (id) => {
    id = checkId(id);

    const userCollection = await users();
    const userMatch = await userCollection.findOne({ _id: new ObjectId(id) });

    if (!userMatch) throw new Error(`No user found in database with id ${id}`);

    userMatch._id = userMatch._id.toString();
    return userMatch;
}

export const getUserByEmail = async (email) => {
    email = checkEmail(email);

    const userCollection = await users();
    const userMatch = await userCollection.findOne({
      $or: [{ emailLower: email }, { email: email }]
    });

    if (!userMatch) throw new Error(`No user found with email ${email}`);

    userMatch._id = userMatch._id.toString();
    return userMatch;
};

export const addFavoriteTrail = async (userId, trailId) => {
  userId = checkId(userId);
  trailId = checkId(trailId);

  const userCollection = await users();
  const updateInfo = await userCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $addToSet: { favoriteTrailIds: trailId } }
  );
  if (updateInfo.matchedCount === 0) throw new Error("User not found");
  return true;
};

export const removeFavoriteTrail = async (userId, trailId) => {
  userId = checkId(userId);
  trailId = checkId(trailId);

  const userCollection = await users();
  const updateInfo = await userCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $pull: { favoriteTrailIds: trailId } }
  );
  if (updateInfo.matchedCount === 0) throw new Error("User not found");
  return true;
};

export const getFavoriteTrailsForUser = async (userId) => {
  userId = checkId(userId);
  const user = await getUserById(userId);
  const ids = Array.isArray(user.favoriteTrailIds) ? user.favoriteTrailIds : [];
  const trails = await getTrailsByIds(ids);
  return trails;
};