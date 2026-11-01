'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {fixture, root} = require('./helpers.cjs');

test('service authentication runs before user JWT and cookie CSRF checks', async t => {
    const noop = (_req, _res, next) => next();
    const passport = {serializeUser() {}, deserializeUser() {}, initialize: () => noop, session: () => noop};
    const f = fixture({'connect-mongo': {create() { throw new Error('Unexpected database session store'); }}, passport, [path.join(root, 'passport.js')]: {}});
    const core = f.load('app.js');
    const app = await core.setup({configureServiceRoutes(app) {
        app.post('/api/v1/search', (req, res) => {
            if (req.get('authorization') !== 'Bearer service-key') return res.status(401).json({message: 'Invalid API key'});
            res.json({items: [], body: req.body});
        });
    }});
    app.post('/api/private', (_req, res) => res.json({ok: true}));
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const base = 'http://127.0.0.1:' + server.address().port;
    const post = (route, key) => fetch(base + route, {method: 'POST', headers: {
        'Content-Type': 'application/json', Cookie: 'connect.sid=browser-cookie',
        ...(key ? {Authorization: 'Bearer ' + key} : {})
    }, body: '{"limit":10}'});
    const response = await post('/api/v1/search', 'service-key');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {items: [], body: {limit: 10}});
    assert.equal((await post('/api/v1/search')).status, 401);
    assert.equal((await post('/api/v1/search', 'wrong')).status, 401);
    assert.equal((await post('/api/private', 'service-key')).status, 401);
    assert.equal((await post('/api/private')).status, 403);
});