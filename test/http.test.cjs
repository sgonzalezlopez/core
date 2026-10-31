'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const express=require('express');
const session=require('express-session');
const {fixture,configuration}=require('./helpers.cjs');
const security=require('../security/http');
let server,base,app;
const environment={};
before(async()=>{
    for(const key of ['PUBLIC_ORIGIN','CORS_ORIGINS','COOKIE_NAME']) {environment[key]=process.env[key];delete process.env[key];}
    process.env.CORS_ORIGINS='https://trusted.test';
    app=express();app.use(security.corsPolicy());app.use(express.json());app.use(express.urlencoded({extended:true}));app.use(session(security.sessionOptions(configuration().config)));
    const f=fixture();f.Users.findOne=async()=>({id:'a'.repeat(24),roles:['user'],passwordVersion:0,active:true});
    const jwt=f.load('middlewares/auth.jwt.js');
    app.use((req,res,next)=>{res.__=s=>s;req.isAuthenticated=()=>!!req.session.user;if(req.session.user)req.user={id:'a'.repeat(24),roles:['user']};next()});
    app.use(jwt.validateToken);app.use(security.csrfProtection);app.get('/api/csrf',security.csrfEndpoint);
    app.set('view engine','ejs');app.set('views',path.join(__dirname,'fixtures'));
    app.get('/static',(_req,res)=>res.send('static'));
    app.get('/form',(req,res)=>res.render('form',{value:req.query.value||''}));
    app.post('/login',(req,res)=>{req.session.user=true;res.json({ok:true})});
    app.post('/change',(req,res)=>res.json({ok:true}));
    app.post('/api/change',f.load('middlewares/authentication.js').isAuthenticated,(req,res)=>res.json({ok:true}));
    app.use((err,req,res,next)=>res.status(500).json({message:err.message}));
    server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));base='http://127.0.0.1:'+server.address().port;
});
after(async()=>{await new Promise(resolve=>server.close(resolve));for(const [key,value]of Object.entries(environment)){if(value===undefined)delete process.env[key];else process.env[key]=value}});
async function bootstrap(){const res=await fetch(base+'/api/csrf');return {cookie:res.headers.get('set-cookie').split(';')[0],token:(await res.json()).csrfToken}}
function post(url,headers={},body={}){return fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)})}
test('unused sessions do not set cookies',async()=>{const res=await fetch(base+'/static');assert.equal(res.status,200);assert.equal(res.headers.get('set-cookie'),null)});
test('CSRF endpoint returns uncacheable token and HttpOnly SameSite session cookie',async()=>{const res=await fetch(base+'/api/csrf');assert.match((await res.json()).csrfToken,/^[a-f0-9]{64}$/);assert.match(res.headers.get('set-cookie'),/HttpOnly/);assert.match(res.headers.get('set-cookie'),/SameSite=Lax/);assert.equal(res.headers.get('cache-control'),'no-store')});
test('rendered forms get server-side CSRF and browser support; external forms get no token',async()=>{const res=await fetch(base+'/form?value='+encodeURIComponent("'\"><script>bad()</script>"));const html=await res.text();assert.equal(res.status,200);assert.match(html,/<meta name="csrf-token" content="[a-f0-9]{64}">/);assert.match(html,/src="\/js\/security.js"/);assert.match(html,/name="_csrf"/);assert.match(html,/action="https:\/\/external.test\/pay"><\/form>/);assert.doesNotMatch(html,/<script>bad/)});
test('native login requires a CSRF token; valid token succeeds',async()=>{const {cookie,token}=await bootstrap();assert.equal((await post('/login',{Cookie:cookie})).status,403);assert.equal((await post('/login',{Cookie:cookie},{_csrf:token})).status,200)});
test('tokens cannot be used in another session or replaced with arbitrary headers',async()=>{const a=await bootstrap(),b=await bootstrap();assert.equal((await post('/change',{Cookie:b.cookie,'X-CSRF-Token':a.token})).status,403);assert.equal((await post('/change',{Cookie:b.cookie,'X-CSRF-Token':'a'.repeat(64)})).status,403)});
test('XHR and JSON mutation accept a session-bound header',async()=>{const {cookie,token}=await bootstrap();assert.equal((await post('/change',{Cookie:cookie,'X-CSRF-Token':token})).status,200)});
test('forged or malformed JWT never bypasses cookie CSRF',async()=>{const {cookie}=await bootstrap();assert.equal((await post('/api/change',{Cookie:cookie,'X-Access-Token':'forged'})).status,401)});
test('verified bearer token remains usable without cookies or CSRF',async()=>{const f=fixture();const raw=f.load('middlewares/auth.jwt.js').generateToken({id:'a'.repeat(24),username:'one',roles:['user']});assert.equal((await post('/api/change',{Authorization:'Bearer '+raw})).status,200)});
test('untrusted CORS origins are rejected, including preflight',async()=>{assert.equal((await post('/change',{Origin:'https://evil.test'})).status,403);const res=await fetch(base+'/api/change',{method:'OPTIONS',headers:{Origin:'https://evil.test','Access-Control-Request-Method':'POST'}});assert.equal(res.status,403);assert.equal(res.headers.get('access-control-allow-origin'),null)});
test('explicit CORS origin is echoed with CSRF and authorization headers allowed',async()=>{const res=await fetch(base+'/api/change',{method:'OPTIONS',headers:{Origin:'https://trusted.test','Access-Control-Request-Method':'POST'}});assert.equal(res.status,204);assert.equal(res.headers.get('access-control-allow-origin'),'https://trusted.test');assert.match(res.headers.get('access-control-allow-headers'),/X-CSRF-Token/);assert.equal(res.headers.get('access-control-allow-credentials'),'true')});
test('API session cookies require CSRF even when Origin is omitted',async()=>{const {cookie,token}=await bootstrap();await post('/login',{Cookie:cookie},{_csrf:token});assert.equal((await post('/api/change',{Cookie:cookie})).status,403);assert.equal((await post('/api/change',{Cookie:cookie,'X-CSRF-Token':token})).status,200)});
