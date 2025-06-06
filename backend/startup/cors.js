const cors = require('cors');

const corsOptions = {
  origin: 'https://bite-back-indol.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
};

module.exports = function (app) {
  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));
};