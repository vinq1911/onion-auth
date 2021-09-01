const assert = require('assert');

const nullLogger = {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {}
}

let secret, token; 
const mockreq = {
    headers: {
        authorization: 'Bearer: XXYYZZ'
    }
}
const mockres = {
    status: (status) => { send: (st) => console.log('mock status ' + status + ' message',st) }
}
const test1 = () => new Promise((resolve, reject) => {
    try {
        const { init } = require('./apikey');
        secret = init();
        resolve(true);
    } catch (e) {
        reject();
    }
});

const test2 = () => new Promise((resolve, reject) => {
    try {
        const { createToken } = require('./apikey');
        token = createToken({ iss: 'testIssuer', sub: 'testSubscriber', scope: 'tester,test'}, secret, nullLogger);
        mockreq.headers.authorization = `Bearer ${token}`;
        resolve(true);
    } catch (e) {
        reject();
    }
});

const test3 = () => new Promise((resolve, reject) => {
    try {
        const { checkApiKey } = require("./apikey");
        const middleware = checkApiKey({signkey: secret});
        middleware(mockreq, mockres, () => {
            resolve(mockreq.authorization.authorized ? true : false);
        });
    } catch (e) {
        reject();
    }
});

const test4 = () => new Promise((resolve, reject) => {
    try {
        const { enforceScope } = require('./apikey');
        const middleware1 = enforceScope('tester', () => resolve(true), () => resolve(false), nullLogger);
        middleware1(mockreq, mockres);
    } catch (e) {
        console.log('enforceScope failed', e);
        reject();
    }
});

const test5 = () => new Promise((resolve, reject) => {
    try {
        const { enforceScope } = require('./apikey');
        const middleware2 = enforceScope('bogus', () => resolve(false), () => resolve(true), nullLogger);
        middleware2(mockreq, mockres);
    } catch (e) {
        console.log('enforceScope failed', e);
        reject();
    }
});

describe('Testing onion-auth', () => {
    it('Initialization should not fail', () => test1().then(r => assert(r, true)));
    it('Should be able to generate key', () => test2().then(r => assert(r, true)));
    it('Generated API key should be sane', () => test3().then(r => assert(r, true)));
    it('Should correctly enforce the scope, if found', () => test4().then(r => assert(r, true)));
    it('Should correctly enforce the scope, if NOT found', () => test5().then(r => assert(r, true)));
});

