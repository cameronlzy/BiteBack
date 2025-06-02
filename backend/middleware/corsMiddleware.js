const cors = require('cors');

const corsOptions = {
  origin: 'https://bite-back-indol.vercel.app',
  credentials: true,
  exposedHeaders: ['x-auth-token']
};

const corsMiddleware = [
  cors(corsOptions),
  // Explicitly handle preflight requests
  (req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Origin', corsOptions.origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.sendStatus(204);
    }
    next();
  }
];

module.exports = corsMiddleware;
