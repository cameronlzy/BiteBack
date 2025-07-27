import cors from 'cors';
import config from 'config';

const corsOptions = {
  origin: `${config.get('frontendLink')}`,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
};

export default function (app) {
  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));
};