import bcrypt from "bcrypt";
import { users } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";

const SALT_ROUNDS = 12; // number of hashing iterations basically the higher the more secure but the more expensive

export const createUser = async (
    email,
    password,
    username,
) => {
    if (!email || !password || !username) throw new Error("Missing arguments for user creation.");
    email = checkEmail(email);
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS); // hashing the password for secure storage in the db

    const newUser = {
        email: email,
        password: hashedPassword,
        username: username,
        favoriteTrailIds: [], // array of trail ids "hearted" by the user
        badges: [], // initialized to none and will populate based on metrics we define
        milesHiked: 0, // initialized to 0 obv
    }

    const userCollection = await users();
    const insertInfo = await userCollection.insertOne(newUser);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) throw new Error("Failed to insert new user into database.");

    const user = getUserById(insertInfo.insertedId.toString());

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