import bcrypt from 'bcrypt';
import { customAlphabet } from 'nanoid';
import simpleCrypto from './encryption.helper.js';
import generatePassword from 'generate-password';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

function generateBetterPassword() {
  const symbols = '!@#$%^&*()_+-=';
  const basePassword = generatePassword.generate({
    length: 11,
    numbers: true,
    uppercase: true,
    lowercase: true,
    symbols: false,
    strict: true,
    excludeSimilarCharacters: true,
  });

  const symbol = symbols[Math.floor(Math.random() * symbols.length)];

  const pos = Math.floor(Math.random() * basePassword.length);
  const password =
    basePassword.slice(0, pos) + symbol + basePassword.slice(pos);

  return password;
}

export function generateStaffUsername(restaurantName) {
    const base = restaurantName
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase()
        .slice(0, 5);
    const randomId = nanoid();
    return `${base}${randomId}`;
}

export async function generateStaffHashedPassword() {
    const plainPassword = generateBetterPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    const encryptedPassword = simpleCrypto.encrypt(plainPassword);

    return { hashedPassword, encryptedPassword };
}