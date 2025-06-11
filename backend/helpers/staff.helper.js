import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { customAlphabet } from 'nanoid';

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
    const plainPassword = crypto.randomBytes(9).toString('base64').slice(0, 12);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    return hashedPassword;
}

