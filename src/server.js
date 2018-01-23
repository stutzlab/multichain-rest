'use strict';

const logger = require('console-server');
const express = require('express');
const bodyParser = require('body-parser');

const MultichainRouter = require('./multichain-router');

const PORT = 6000;
const app = express();

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

let multichainRouter = new MultichainRouter(
    process.env.MULTICHAIN_HOST,
    process.env.MULTICHAIN_PORT,
    process.env.MULTICHAIN_USER,
    process.env.MULTICHAIN_PASS
);

multichainRouter.setupRoutes(app);

app.get('/health', (req, res) => {
    res.send('OK');
});

let server = app.listen(PORT, function () {
    logger.info(`Multichain REST running on port ${PORT}`);
});

server.timeout = 15000;

