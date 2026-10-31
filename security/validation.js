'use strict';
function invalid(message = 'Invalid input') { const error = new Error(message); error.status = 400; return error; }
function text(value, name, max = 254) {
    if (typeof value !== 'string' || !value.trim() || value.length > max) throw invalid('Invalid ' + name);
    return value.trim();
}
function email(value) {
    const result = text(value, 'email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw invalid('Invalid email');
    return result;
}
function id(value) { if (typeof value !== 'string' || !/^[a-f0-9]{24}$/i.test(value)) throw invalid('Invalid user id'); return value; }
function boolean(value) { if (value === true || value === 'true') return true; if (value === false || value === 'false') return false; throw invalid('Invalid active'); }
function roles(value) {
    const values = typeof value === 'string' ? [value] : value;
    if (!Array.isArray(values) || values.length > 32 || values.some(role => typeof role !== 'string' || !/^[a-z][a-z0-9_:-]{0,63}$/i.test(role))) throw invalid('Invalid roles');
    return [...new Set(values)];
}
function password(value) { if (typeof value !== 'string' || !value.length || Buffer.byteLength(value) > 1024) throw invalid('Invalid password'); return value; }
function userFilters(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalid('Invalid filters');
    const allowed = new Set(['id', '_id', 'username', 'email', 'roles', 'active', 'lastLogin', 'createdAt', 'updatedAt']);
    const filters = {};
    for (const [key, value] of Object.entries(body)) {
        if (!allowed.has(key)) throw invalid('Unsupported filter: ' + key);
        if (value === '' || value === null || value === undefined) continue;
        if (key === 'id' || key === '_id') filters._id = id(value);
        else if (key === 'active') filters.active = boolean(value);
        else if (key === 'roles') { const list = roles(value); if (list.length) filters.roles = { $in: list }; }
        else if (['lastLogin', 'createdAt', 'updatedAt'].includes(key)) {
            if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value) || !Number.isFinite(Date.parse(value))) throw invalid('Invalid date');
            filters[key] = new Date(value);
        } else filters[key] = text(value, key);
    }
    return filters;
}
function safeRedirect(value) {
    if (typeof value !== 'string' || !value.startsWith('/') || /[\\\r\n]/.test(value)) return '/';
    try { return new URL(value, 'https://local.invalid').origin === 'https://local.invalid' ? value : '/'; } catch { return '/'; }
}
function passwordBody(body = {}) {
    return {...body, password: body.newPassword !== undefined ? body.newPassword : body.password, passwordVerify: body.newPasswordVerify !== undefined ? body.newPasswordVerify : body.passwordVerify};
}
module.exports = {passwordBody, invalid, text, email, id, boolean, roles, password, userFilters, safeRedirect};

