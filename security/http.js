'use strict';
const crypto = require('node:crypto');
const cors = require('cors');
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);
function origin(req) { return process.env.PUBLIC_ORIGIN ? new URL(process.env.PUBLIC_ORIGIN).origin : req.protocol + '://' + req.get('host'); }
function allowedOrigins() {
    return (process.env.CORS_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean).map(value => {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol) || url.origin !== value) throw new Error('CORS_ORIGINS must contain exact http(s) origins');
        return value;
    });
}
function corsPolicy() {
    const trusted = allowedOrigins();
    return (req, res, next) => {
        const source = req.get('origin');
        const permitted = !source || source === origin(req) || trusted.includes(source);
        if (!permitted) return res.status(403).json({message: 'Origin not allowed'});
        return cors({origin: source || false, credentials: true, methods: ['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Accept','Authorization','X-Access-Token','X-CSRF-Token','X-Requested-With']})(req, res, next);
    };
}
function sessionOptions(config, store) {
    const production = config.app.ENV === 'production';
    if (production && !store) throw new Error('A persistent session store is required in production');
    const lifetime = Number(process.env.SESSION_MAX_AGE_MS || 8 * 60 * 60 * 1000);
    if (!Number.isSafeInteger(lifetime) || lifetime <= 0 || lifetime > 30 * 24 * 60 * 60 * 1000) throw new Error('Invalid SESSION_MAX_AGE_MS');
    return {name: process.env.COOKIE_NAME || 'connect.sid', secret: config.app.COOKIE_SECRET, resave: false, saveUninitialized: false, ...(store ? {store} : {}), cookie: {httpOnly: true, secure: production, sameSite: 'lax', maxAge: lifetime}};
}
function csrfToken(req) {
    if (!req.session) throw new Error('Session middleware is required for CSRF');
    if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    return req.session.csrfToken;
}
function equal(left, right) {
    return typeof left === 'string' && typeof right === 'string' && /^[a-f0-9]{64}$/.test(left) && left.length === right.length && crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
}
function csrfProtection(req, res, next) {
    const render = res.render;
    res.render = function(view, options, callback) {
        if (typeof options === 'function') { callback = options; options = undefined; }
        const token = csrfToken(req);
        res.set('Cache-Control', 'no-store');
        return render.call(this, view, options, (error, html) => {
            if (error) return callback ? callback(error) : next(error);
            const metadata = '<meta name="csrf-token" content="' + token + '"><script src="/js/security.js"></script>';
            html = html.replace(/<\/head>/i, metadata + '</head>').replace(/<form\b[^>]*>/gi, tag => {
                if (!/\bmethod\s*=\s*(?:"post"|'post'|post(?=\s|>))/i.test(tag)) return tag;
                const action = tag.match(/\baction\s*=\s*["']([^"']*)["']/i);
                try { if (action && new URL(action[1], origin(req)).origin !== origin(req)) return tag; } catch { return tag; }
                return tag + '<input type="hidden" name="_csrf" value="' + token + '">';
            });
            return callback ? callback(null, html) : res.send(html);
        });
    };
    if (SAFE.has(req.method)) return next();
    // Only a JWT verified against an active account can bypass session CSRF.
    if (req.authenticationSource === 'token') return next();
    const sessionName = process.env.COOKIE_NAME || 'connect.sid';
    const hasCookie = (req.get('cookie') || '').split(';').some(part => part.trim().startsWith(sessionName + '='));
    // Preserve non-browser, stateless API calls (no ambient cookie credentials).
    if (req.path.startsWith('/api/') && !req.user && !hasCookie && !req.get('origin') && !req.get('sec-fetch-site')) return next();
    const supplied = req.get('x-csrf-token') || (req.body && req.body._csrf);
    if (!equal(supplied, req.session && req.session.csrfToken)) return res.status(403).json({message: 'Invalid CSRF token'});
    if (req.body && Object.hasOwn(req.body, '_csrf')) delete req.body._csrf;
    return next();
}
function csrfEndpoint(req, res) { res.set('Cache-Control', 'no-store'); res.json({csrfToken: csrfToken(req)}); }
module.exports = {corsPolicy, sessionOptions, csrfProtection, csrfEndpoint};

