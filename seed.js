import 'dotenv/config';
import bcrypt from 'bcrypt';
import {users} from './config/mongoCollections.js';
import {closeConnection} from './config/mongoConnection.js';
import {checkEmail, checkPassword, checkUser} from './helpers.js';

const SALT_ROUNDS = 12;

async function ensureAdminUser() {
  const email = checkEmail(process.env.SEED_ADMIN_EMAIL || 'admin@stevens.edu');
  const username = checkUser(process.env.SEED_ADMIN_USERNAME || 'admin');
  const password = checkPassword(process.env.SEED_ADMIN_PASSWORD || 'Cs546#2026');

  const userCollection = await users();

  const existingByEmail = await userCollection.findOne({emailLower: email});
  if (existingByEmail) {
    if (existingByEmail.role !== 'admin') {
      await userCollection.updateOne({_id: existingByEmail._id}, {$set: {role: 'admin'}});
      console.log(`Promoted existing user to admin: ${email}`);
    } else {
      console.log(`Admin user already exists: ${email}`);
    }
    return;
  }

  const usernameLower = username.toLowerCase();
  const existingByUsername = await userCollection.findOne({usernameLower});
  if (existingByUsername) {
    throw new Error(
      `Cannot create admin: username "${username}" already exists (set SEED_ADMIN_USERNAME).`
    );
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const newAdmin = {
    email,
    emailLower: email,
    password: hashedPassword,
    username,
    usernameLower,
    role: 'admin',
    favoriteTrailIds: [],
    badges: [],
    milesHiked: 0
  };

  const insertInfo = await userCollection.insertOne(newAdmin);
  if (!insertInfo.acknowledged || !insertInfo.insertedId) {
    throw new Error('Failed to insert admin user.');
  }

  console.log(`Created admin user: ${email}`);
}

try {
  await ensureAdminUser();
  console.log('Seed complete.');
} catch (e) {
  console.error('Seed failed:', e?.message || e);
  process.exitCode = 1;
} finally {
  await closeConnection();
}

