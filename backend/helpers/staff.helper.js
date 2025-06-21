import bcrypt from 'bcrypt';
import { customAlphabet } from 'nanoid';
import simpleCrypto from './encryption.helper.js';
import generatePassword from 'generate-password';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

export function generateStaffUsername(restaurantName) {
    const base = restaurantName
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase()
        .slice(0, 5);
    const randomId = nanoid();
    return `${base}${randomId}`;
}

export async function generateStaffHashedPassword() {
    const plainPassword = generatePassword.generate({
        length: 12, 
        numbers: true,
        uppercase: true,
        lowercase: true,
        symbols: true,
        strict: true,
    });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    const encryptedPassword = simpleCrypto.encrypt(plainPassword);

    return { hashedPassword, encryptedPassword };
}

