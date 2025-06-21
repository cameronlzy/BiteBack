import jwt from 'jsonwebtoken';
import config from 'config';

export function generateAuthToken(user) {
  return jwt.sign(
    {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      profile: user.profile,
    },
    config.get('jwtPrivateKey')
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
    config.get('jwtPrivateKey')
  );
}

