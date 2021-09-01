# Onion Auth

Simple JWT auth tool for express.js services

## Installation

`npm i onion-auth`

## Usage: create authentication token:

Sample code to demonstrate how to issue JWT for user. use JWT_LIFETIME .env variable (integer value, seconds) to control the jwt validity period. Example: `JWT_LIFETIME=3600`

```
const { createToken } require('onion-auth');

const signkey = 'your_super_secret_signkey'; // can be generated using 'init';

const iss = 'https://some.example.site'; // issuer part of jwt
const sub = 'authenticated@user.from.space'; // subscriber part of jwt
const scope = 'all,the,scopes,available,to,this,user'; // scopes, comma-separated

const token = createToken({iss, sub, scope}, signkey); // base64 encoded JWT

```

## Usage: check authentication token:

Sample code to produce express.js middleware, which injects JWT information to request carrier. 

```
const express = require('express');
const { checkApiKey } require('onion-auth');

const signkey = 'your_super_secret_signing_key';
const app = express();

app.use(checkApiKey({signkey})); // create express middleware, (req, res next) => {}

app.get('/', (req, res) => {
    const { authorized, data, scopes } = req.authorization;
    console.log('user authorization data', data); // jwt data object or error message from njwt
    console.log('user authorized scopes', scopes); // array of jwt scopes or undefined if error
    res.status(authorized ? 200 : 400);
});
```

## Usage: limit response based on scope:

Sample code to use enforceScope HOC to control access based on user scopes

```
const express = require('express');
const { checkApiKey, enforceScope } require('onion-auth');

const signkey = 'your_super_secret_signing_key';
const app = express();

app.use(checkApiKey({signkey})); // create express middleware, (req, res next) => {}

app.get('/scoped1', enforceScope('registered_users', (req, res) => { res.status(200).send('all ok') })); // user belongs to 'registered_users', send http 200
app.get('/scoped2', enforceScope('registered_users', (req, res) => { res.status(200).send('all ok') }, (req, res) => { res.status(403).send('not ok') })) // use third parameter to determine what to do if scope doesn't match. default is to send 4xx.
```

You can chain enforceScopes.
```
app.get(
    '/scoped-if-then', 
    enforceScope(
        'usergroup', 
        (req, res) => res.status(200).send('belongs to primary group'),
        enforceScope(
            'backupgroup',
            (req, res) => res.status(200).send('belongs to backup group'),
            enforceScope(
                'backupbackupgroup',
                (req, res) => res.status(200).send('part of backup of the backup group'),
                (req, res) => res.status(403).send('not part of any valid group')
            )
        )
    )
)
```

## Usage: logger interface

Last parameter of createToken and enforceScope can be set to contain logger object to produce logging output. This is made compatible with Winston.

Logger interface example:
```
const logger = {
    info: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.log
}
```






