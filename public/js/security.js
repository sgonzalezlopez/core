/* Session CSRF support for native forms, jQuery/XHR and fetch consumers. */
(function () {
    'use strict';
    if (window.__coreCsrfInstalled) return;
    window.__coreCsrfInstalled = true;
    function token() { const meta = document.querySelector('meta[name="csrf-token"]'); return meta && meta.content; }
    function unsafe(method, url) { return !/^(GET|HEAD|OPTIONS)$/i.test(method || 'GET') && new URL(url || location.href, location.href).origin === location.origin; }
    const open = XMLHttpRequest.prototype.open;
    const send = XMLHttpRequest.prototype.send;
    const setHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.setRequestHeader = function(name, value) { if (name.toLowerCase() === 'x-csrf-token') this.coreCsrfHeader = true; return setHeader.apply(this, arguments); };
    XMLHttpRequest.prototype.open = function(method, url) { this.coreCsrf = unsafe(method, url); this.coreCsrfHeader = false; return open.apply(this, arguments); };
    XMLHttpRequest.prototype.send = function() { if (this.coreCsrf && !this.coreCsrfHeader && token()) this.setRequestHeader('X-CSRF-Token', token()); return send.apply(this, arguments); };
    if (window.fetch) {
        const fetch = window.fetch;
        window.fetch = function(input, init) {
            const request = input instanceof Request ? input : null;
            const options = {...init};
            if (unsafe(options.method || (request && request.method), request ? request.url : input) && token()) {
                options.headers = new Headers(options.headers || (request ? request.headers : undefined));
                options.headers.set('X-CSRF-Token', token());
            }
            return fetch.call(this, input, options);
        };
    }
    document.addEventListener('submit', function(event) {
        const form = event.target;
        if (!unsafe(form.method, form.action) || !token()) return;
        let field = form.querySelector('input[name="_csrf"]');
        if (!field) { field = document.createElement('input'); field.type = 'hidden'; field.name = '_csrf'; form.appendChild(field); }
        field.value = token();
    }, true);
}());

