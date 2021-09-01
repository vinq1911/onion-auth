const { checkApiKey, init, enforceScope, createToken } = require('./apikey');
const { ioCheckApiKey, enforceSocketAuth } = require('./socketAuth.js');

module.exports = {
    checkApiKey, init, enforceScope, createToken, ioCheckApiKey, enforceSocketAuth
}