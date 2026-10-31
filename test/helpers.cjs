'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createRequire} = require('node:module');
const root = path.resolve(__dirname, '..');
// Isolated module graph: production controllers/middlewares are loaded unchanged.
// Only explicit boundaries (config, mail, database) are substituted per fixture.
function loader(stubs = {}) {
    const cache = new Map();
    function load(file) {
        file = path.resolve(root, file);
        if (Object.hasOwn(stubs, file)) return stubs[file];
        if (cache.has(file)) return cache.get(file).exports;
        const module = {exports: {}};
        cache.set(file, module);
        const native = createRequire(file);
        function requireModule(id) {
            if (Object.hasOwn(stubs, id)) return stubs[id];
            const resolved = native.resolve(id);
            if (Object.hasOwn(stubs, resolved)) return stubs[resolved];
            if (resolved.startsWith(root + path.sep) && !resolved.includes(path.sep + 'node_modules' + path.sep) && resolved.endsWith('.js')) return load(resolved);
            return native(id);
        }
        const code = vm.runInThisContext('(function(exports, require, module, __filename, __dirname) {\n' + fs.readFileSync(file, 'utf8') + '\n})', {filename:file});
        code.call(module.exports, module.exports, requireModule, module, file, path.dirname(file));
        return module.exports;
    }
    return load;
}
function configuration() {
    const values = {PASSWORD_COMPLEXITY: null, ADMIN_EMAIL: 'admin@example.test'};
    const features = {SELF_REGISTER: true, TWO_STEPS_REGISTRY: true};
    return {config: {app: {ENV:'test', COOKIE_SECRET:'test-secret-at-least-32-characters-long'}, auth: {JWT_SECRET:'unit-test-secret'}, db:{CONFIGS:{},connectDB:async()=>{}}}, values, features,
        getConfig:key=>key === undefined || key === '' ? values : values[key], getFeature:key=>features[key], loadConfigs:async()=>{},loadFeatures:async()=>{}, forceSSL:(req,res,next)=>req.secure?next():res.redirect('https://' + req.get('host') + req.url)};
}
function fixture(extra = {}) {
    const mongoose = new (require('mongoose').Mongoose)();
    const config = configuration();
    const mail = [];
    const load = loader({mongoose, [path.join(root,'config/config.js')]:config, [path.join(root,'i18n/i18n.config.js')]:{__:s=>s,init:(req,res,next)=>{req.__=res.__=res.locals.__=s=>s;next();}}, [path.join(root,'config/email.config.js')]:{sendTemplatedEmail:async(template,to,data)=>{mail.push({template,to,data});}}, ...extra});
    const Users = load('models/user.model.js');
    return {mongoose, config, mail, load, Users};
}
function response() {return {code:200,__(s){return s},status(n){this.code=n;return this},send(value){this.body=value;return this},json(value){this.body=value;return this},redirect(value){this.redirected=value;return this}};}
module.exports = {loader, fixture, configuration, response, root};
