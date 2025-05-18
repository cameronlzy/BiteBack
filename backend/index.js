const winston = require('winston');
const infoLogger = require('./models/infoLogger');
const express = require('express');
const app = express();

require('./startup/logging')();
require('./startup/routes')(app);
require('./startup/server')();
require('./startup/config')();
require('./startup/validation')();

const port = process.env.PORT || 3000;
const server = app.listen(port, () => infoLogger.info(`Listening on port ${port}...`));

module.exports = server;