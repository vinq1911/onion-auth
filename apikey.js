const nJwt = require('njwt');
const secureRandom = require('secure-random');
const expiration = process.env.JWT_LIFETIME || 36000;
const { bulklogger } = require('./logger');


/// jwt middleware to handle bearer token validation
const createToken = ({iss, sub, scope}, signkey, logger = bulklogger) => {
    logger.debug(`Token created: ${iss} ${sub} ${scope}`);
    return nJwt.create({iss, sub, scope}, signkey).setExpiration(new Date().getTime() + (expiration*1000)).setNotBefore(new Date().getTime()).compact();
}

const enforceAuth = (next, logger = bulklogger) => (req, res) => {
    if (req.authorization?.authorized) {
        logger.debug('Passed authorized request forward');
        next(req, res);
    } else {
        logger.debug('Denied unauthorized request');
        res.status(401).send('Not authorized');
    }
}


const enforceScope = (_scope, cb, bcb, logger = bulklogger) => {
    return (req, res) => {
        const { iss, sub, scope } = req.authorization?.data?.body || {};
        if (iss && sub && scope && req.authorization.scopes?.includes(_scope)) {
            logger.info(`Authenticated call: ${iss}`);
            logger.debug(`Authorized scope: ${scope}`);
            cb(req, res);
        } else if (!bcb && req.authorization?.scopes && !req.authorization.scopes.includes(_scope)) {
            logger.info('Unauthorized call, invalid scope');
            logger.debug(req.authorization);
            res.status(401).send('Missing required scope');
        } else if (!bcb) {
            logger.info('Unauthorized call');
            logger.debug(req.authorization);
            res.status(403).send('Requires authorization');
        } else {
            logger.info(`Authenticated call: ${iss}`);
            logger.debug(`Missing scope. We have "${scope}" but we need "${_scope}". Anyway, we're allowed to go without having it.`);
            bcb(req, res);
        }
    }  
}

/// rudimentary api token health check middleware
/// injects token contents into request carrier

const checkApiKey = ({signkey}) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization?.split(" ");
        if (authHeader && authHeader[0] === "Bearer") {
            const token = authHeader[1];
            nJwt.verify(token, signkey, (e, jwt) => {
                req.authorization = e ? {authorized: false, data: e.userMessage} : {authorized: true, data: jwt, scopes: jwt.body.scope?.split(',').map(r =>  {return r.trim()} )}
                next();
            })
        } else {
            req.authorization = {authorized: false, data: 'no auth header'}
            next();
        }
    }
} 

/// util f() to provide random signing key

const init = () => {
    const signingKey = secureRandom(256, {type: 'Buffer'});
    return signingKey;
}

module.exports = {
    checkApiKey, init, enforceScope, createToken, enforceAuth
}