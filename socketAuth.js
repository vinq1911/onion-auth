const { bulklogger } = require('./logger');
const nJwt = require('njwt');

const ioCheckApiKey = ({signkey}, logger = bulklogger) => (socket, next) => {
    const token = socket.handshake.auth.token;
    nJwt.verify(token, signkey, (e, jwt) => {
      if (!e) {
          UserModel.findOne({ emailAddress: jwt.body?.sub }).then(r => {
              socket.authorization = e ? {authorized: false, data: e.userMessage} : {authorized: true, userData: r, data: jwt, scopes: jwt.body.scope?.split(',').map(r =>  {return r.trim()} )}
              next();
          }).catch(e => {
              socket.authorization = {authorized: false, data: 'user search error'}
              next();
          })
      } else {
          logger.error(message(e));
      }
    })
  }

const enforceSocketAuth = (socket, logger = bulklogger) => (req, res, next) => {
    if (socket.authorization?.authorized) {
        logger.info(message('Authorized socket message'));
        next();
    }
    res.status(401).send(message('Not authorized'));
}


module.exports = { ioCheckApiKey, enforceSocketAuth }