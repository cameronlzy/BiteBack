import jwt from 'jsonwebtoken';
import config from 'config';

const JWT_SECRET = config.get('jwtPrivateKey');

export function generateAuthToken(user) {
  return jwt.sign(
    {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      profile: user.profile,
    },
    JWT_SECRET
  );
}

export function generateTempToken(user) {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
    JWT_SECRET, { expiresIn: '15m' }
  );
}

export function staffGenerateAuthToken(staff) {
  return jwt.sign(
    {
      _id: staff._id,
      username: staff.username,
      role: staff.role,
      restaurant: staff.restaurant
    },
    JWT_SECRET
  );
}

export function generateUnsubscribeToken(customerId) {
  return jwt.sign(
    { 
      customerId 
    }, 
    JWT_SECRET, { expiresIn: '15m' }
  );
}

