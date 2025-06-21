import logger from './startup/logging.js';
import express from 'express';
import statusRoute from './routes/status.route.js';
import configSetup from './startup/config.js';
import corsSetup from './startup/cors.js';
import validationSetup from './startup/validation.js';
import routesSetup from './startup/routes.js';
import prodSetup from './startup/prod.js';
import serverSetup from './startup/server.js';
import { registerJobs } from './startup/jobs.js';

const app = express();

process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION:', err);
});

app.enable('trust proxy');

configSetup();
corsSetup(app);
validationSetup();
routesSetup(app);
prodSetup(app);
app.use('/', statusRoute);

export const serverPromise = (async () => {
  await serverSetup();
  registerJobs();

  const port = process.env.PORT || 3000;
  return app.listen(port, () => logger.info(`Listening on port ${port}...`));
})();
