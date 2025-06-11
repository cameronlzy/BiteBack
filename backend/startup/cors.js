import cors from 'cors';

const corsOptions = {
  origin: 'https://bite-back-indol.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
};

export default function (app) {
  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));
};