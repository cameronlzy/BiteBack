import jwt from 'jsonwebtoken';
import config from 'config';

export default function (req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
    req.user = decoded;
    next();
  }
  catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}