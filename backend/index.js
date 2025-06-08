const logger = require('./startup/logging');
const express = require('express');
const app = express();

process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION:', err);
});

app.enable('trust proxy');

require('./startup/config')();
require('./startup/cors')(app);
require('./startup/validation')();
require('./startup/routes')(app);
require('./startup/prod')(app);
require('./startup/server')();

app.use('/', require('./routes/status.route'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => logger.info(`Listening on port ${port}...`));

module.exports = server;