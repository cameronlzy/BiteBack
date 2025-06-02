const logger = require('./startup/logging');
const express = require('express');
const app = express();

app.enable('trust proxy');

require('./startup/cors')(app);
require('./startup/logging');
require('./startup/config')();
require('./startup/validation')();
require('./startup/prod')(app);
require('./startup/routes')(app);
require('./startup/server')();

const port = process.env.PORT || 3000;
const server = app.listen(port, () => logger.info(`Listening on port ${port}...`));

module.exports = server;