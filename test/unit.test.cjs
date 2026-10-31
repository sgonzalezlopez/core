'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const crypto = require('node:crypto');
const {fixture,loader,configuration,response,root} = require('./helpers.cjs');
const validation = require('../security/validation');
const id = 'a'.repeat(24);
test('user model: random salts, legacy password verification, secret redaction and invalidation', async()=>{
    const f=fixture();const a=new f.Users({username:'one',email:'one@example.test',active:true});const b=new f.Users({username:'two',email:'two@example.test'});
    assert.notEqual(a.salt,b.salt);
    a.hash=crypto.pbkdf2Sync('old',a.salt,1000,64,'sha512').toString('hex');
    assert.equal(a.validPassword('old'),true);assert.equal(a.validPassword(undefined),false);
    a.actionTokenHash='secret';a.actionTokenPurpose='reset';a.actionTokenExpiresAt=new Date();
    await a.setPassword('new');assert.equal(a.validPassword('new'),true);assert.equal(a.validPassword('old'),false);assert.equal(a.passwordVersion,1);assert.equal(a.actionTokenHash,undefined);
    a.actionTokenHash='secret';for(const value of [a.toJSON(),a.toObject()])for(const key of ['hash','salt','actionTokenHash','actionTokenPurpose','actionTokenExpiresAt'])assert.equal(Object.hasOwn(value,key),false);
    await assert.rejects(a.setPassword(''));assert.equal(a.validPassword('x'.repeat(2048)),false);
});
test('legacy null roles are removed without granting user or admin permissions', async()=>{const f=fixture();const user=new f.Users({username:'legacy',email:'x@y.test',roles:[null]});await user.validate();assert.deepEqual([...user.roles],[])});
test('roles reject arbitrary structures and preserve explicit administrative roles',()=>{assert.deepEqual(validation.roles(['coach','skater','coach']),['coach','skater']);for(const roles of [[null],{$ne:null},['admin',{}]])assert.throws(()=>validation.roles(roles));});
test('search accepts existing form fields and preserves false',()=>{const body={username:'user',email:'one@example.test',roles:['coach','skater'],active:'false'};const result=validation.userFilters(body);assert.equal(result.active,false);assert.deepEqual(result.roles,{$in:['coach','skater']});assert.equal(body.active,'false');assert.deepEqual(validation.userFilters({active:false}),{active:false});});
for(const input of [{$where:'true'},{$or:[{}]},{username:{$ne:null}},{roles:{$in:['admin']}},{active:{$ne:false}},{salt:'secret'},{hash:'hash'},{actionTokenHash:'x'},{'roles.0':'admin'},JSON.parse('{"__proto__":{"polluted":true}}')])test('search rejects injection '+JSON.stringify(input),()=>assert.throws(()=>validation.userFilters(input)));
test('redirects remain local',()=>{for(const value of ['https://evil.test','//evil.test','/\\evil.test','/\r\nLocation: bad'])assert.equal(validation.safeRedirect(value),'/');assert.equal(validation.safeRedirect('/private/profile?tab=1'),'/private/profile?tab=1')});
test('password changes enforce identity, old password and confirmation, with admin override',async()=>{
    const f=fixture();const user=new f.Users({_id:id,username:'one',email:'one@example.test',roles:['user']});await user.setPassword('old');let saved=0;user.save=async()=>{saved++};f.Users.findById=async()=>user;const service=f.load('security/passwords.js');
    await assert.rejects(service.change(null,id,{password:'new'}),{status:401});
    await assert.rejects(service.change({id:'b'.repeat(24),roles:['user']},id,{password:'new'}),{status:403});
    await assert.rejects(service.change(user,id,{password:'new',oldPassword:'wrong'}),{status:403});
    await assert.rejects(service.change(user,id,{password:'new',oldPassword:'old',passwordVerify:'other'}),{status:400});
    await service.change(user,id,{password:'new',oldPassword:'old',passwordVerify:'new'});assert.equal(saved,1);assert.equal(user.validPassword('new'),true);
    await service.change({id:'b'.repeat(24),roles:['admin']},id,{password:'admin reset'});assert.equal(saved,2);assert.equal(user.validPassword('admin reset'),true);
});
test('token issue stores only a digest and purpose-specific expiration',async()=>{
    const f=fixture();let query,update;f.Users.findOneAndUpdate=async(q,u)=>{query=q;update=u;return {}};const tokens=f.load('security/account-tokens.js');const raw=await tokens.issue({_id:id},'reset');
    assert.match(raw,/^[a-f0-9]{64}$/);assert.equal(update.$set.actionTokenHash,tokens.digest(raw));assert.notEqual(update.$set.actionTokenHash,raw);assert.equal(query.active,true);assert.equal(update.$set.actionTokenPurpose,'reset');assert.ok(update.$set.actionTokenExpiresAt>Date.now());assert.ok(update.$set.actionTokenExpiresAt-Date.now()<=30*60*1000);
});
test('invalid or legacy salt tokens never reach MongoDB',async()=>{const f=fixture();f.Users.findOne=()=>assert.fail('must not query');const tokens=f.load('security/account-tokens.js');for(const value of [null,{},'old-salt', 'a'.repeat(32),'g'.repeat(64)])assert.equal(await tokens.find(value),null)});
test('authorization reports 401/403 once and propagates database errors',async()=>{
    const failure=new Error('DB');const permission={find:async()=>{throw failure}};const auth=loader({[path.join(root,'models/permission.model.js')]:permission,[path.join(root,'middlewares/auth.jwt.js')]:{headerToken:()=>false}})('middlewares/authorization.js');
    let next=0;const missing=response();auth.checkPermision('user','R')({method:'POST',query:{}},missing,()=>next++);assert.equal(missing.code,401);assert.equal(next,0);
    const denied=response();auth.isAdmin({originalUrl:'/api/auth/reset',user:{roles:['user']}},denied,()=>next++);assert.equal(denied.code,403);
    let caught;await auth.checkPermision('user','R')({user:{roles:['user']}},response(),err=>caught=err);assert.equal(caught,failure);assert.equal(next,0);
});
test('authorization awaits JWT and does not mutate configured role arrays',async()=>{
    const auth=loader({[path.join(root,'models/permission.model.js')]:{find:async()=>[{}]},[path.join(root,'middlewares/auth.jwt.js')]:{headerToken:()=>true,verifyToken:async(req,res,next)=>{await Promise.resolve();req.user={roles:['coach']};return next();}}})('middlewares/authorization.js');
    const roles=['coach'];let next=0;await auth.isRole(roles)({originalUrl:'/api/x'},response(),()=>next++);assert.equal(next,1);assert.deepEqual(roles,['coach']);
});
test('JWT validates current account, version and role state rather than token claims',async()=>{
    const f=fixture();const current={id,active:true,roles:['user'],passwordVersion:2};f.Users.findOne=async()=>current;
    const jwt=f.load('middlewares/auth.jwt.js');const raw=jwt.generateToken({...current,roles:['admin']});
    const invoke=token=>new Promise((resolve,reject)=>{const res=response();res.send=value=>{res.body=value;resolve(res)};jwt.verifyToken({headers:{'x-access-token':token},method:'POST',query:{}},res,err=>err?reject(err):resolve(res));});
    assert.equal((await invoke(raw)).code,200);current.passwordVersion=3;assert.equal((await invoke(raw)).code,401);f.Users.findOne=async()=>null;assert.equal((await invoke(raw)).code,401);
});
test('signups cannot inject roles, respect validation and await persistence before mail',async()=>{
    const f=fixture();let saved=false;f.Users.prototype.save=async function(){saved=true;assert.deepEqual([...this.roles],['user']);assert.equal(this.active,false);};
    const controller=f.load('controllers/auth.controller.js');const res=response();await controller.signup({body:{username:'user',email:'one@example.test',password:'new',roles:['admin']},protocol:'http',get:()=> 'localhost'},res,assert.ifError);assert.equal(saved,true);assert.equal(res.body.message,'OK');assert.equal(f.mail.length,2);
    saved=false;const bad=response();await controller.signup({error:new Error('duplicate')},bad,assert.ifError);assert.equal(saved,false);assert.equal(bad.code,400);
});
test('failed persistence sends no success email and reaches next once',async()=>{const f=fixture();const failure=new Error('DB');f.Users.prototype.save=async()=>{throw failure};let caught;await f.load('controllers/auth.controller.js').register2({body:{username:'u',email:'u@e.test'}},response(),err=>caught=err);assert.equal(caught,failure);assert.equal(f.mail.length,0)});
test('user update supports active=false and never exposes credentials',async()=>{const f=fixture();const user=new f.Users({_id:id,username:'u',email:'u@e.test',active:true});user.save=async()=>{};f.Users.findById=async()=>user;const res=response();await f.load('controllers/user.controller.js').update({params:{id},body:{active:false}},res,assert.ifError);assert.equal(user.active,false);assert.equal(res.body.salt,undefined)});
test('session settings fail closed in production and use safe cookies',()=>{const {sessionOptions}=require('../security/http');const config=configuration().config;let options=sessionOptions(config);assert.equal(options.saveUninitialized,false);assert.equal(options.cookie.httpOnly,true);assert.equal(options.cookie.sameSite,'lax');config.app.ENV='production';assert.throws(()=>sessionOptions(config));options=sessionOptions(config,{});assert.equal(options.cookie.secure,true)});

for(const name of ['app','config','feature','permission','value'])test(name+' controller forwards asynchronous database errors exactly once',async()=>{
    const failure=new Error('DB');const query=Promise.reject(failure);query.sort=()=>query;
    const stubs={[path.join(root,'models/'+name+'.model.js')]:{find:()=>query},[path.join(root,'config/config.js')]:configuration(),[path.join(root,'config/email.config.js')]:{}};
    let caught,count=0;await loader(stubs)('controllers/'+name+'.controller.js').getAll({},response(),err=>{caught=err;count++});assert.equal(caught,failure);assert.equal(count,1);
});
test('browser client attaches tokens to same-origin XHR/fetch without leaking to other origins',async()=>{
    const vm=require('node:vm');const fs=require('node:fs');const sent=[];let fetchInit,listener;
    class XHR{open(){}setRequestHeader(key,value){sent.push([key,value])}send(){}}
    const window={fetch:async(input,init)=>{fetchInit=init;return {} }};
    const context={window,Request,Headers,URL,location:new URL('https://app.test/page'),XMLHttpRequest:XHR,document:{querySelector:()=>({content:'a'.repeat(64)}),addEventListener:(event,handler)=>listener=handler}};
    vm.runInNewContext(fs.readFileSync(path.join(root,'public/js/security.js'),'utf8'),context);
    const xhr=new XHR();xhr.open('POST','/api/user');xhr.send();assert.deepEqual(sent[0],['X-CSRF-Token','a'.repeat(64)]);
    const external=new XHR();external.open('POST','https://other.test/api');external.send();assert.equal(sent.length,1);
    await window.fetch('/api/user',{method:'PUT'});assert.equal(fetchInit.headers.get('X-CSRF-Token'),'a'.repeat(64));
    await window.fetch('https://other.test/api',{method:'POST'});assert.equal(fetchInit.headers,undefined);
    await window.fetch(new Request('https://app.test/api',{method:'DELETE',headers:{Accept:'application/json'}}));assert.equal(fetchInit.headers.get('Accept'),'application/json');assert.equal(fetchInit.headers.get('X-CSRF-Token'),'a'.repeat(64));
    let value;listener({target:{method:'POST',action:'https://app.test/change',querySelector:()=>({set value(input){value=input}})}});assert.equal(value,'a'.repeat(64));
});
test('production account mail rejects untrusted Host unless PUBLIC_ORIGIN is configured',async()=>{
    const f=fixture();f.config.config.app.ENV='production';const account=new f.Users({username:'u',email:'u@e.test',active:true});await account.setPassword('old');f.Users.findOne=async()=>account;
    let failure;await f.load('controllers/auth.controller.js').resetPass({body:{email:account.email},protocol:'https',get:()=> 'evil.test'},response(),err=>failure=err);assert.match(failure.message,/PUBLIC_ORIGIN/);assert.equal(f.mail.length,0);
});

test('empty database bootstrap requires explicit credentials and awaits persistence',async()=>{
    const f=fixture();const saved={email:process.env.INITIAL_ADMIN_EMAIL,password:process.env.INITIAL_ADMIN_PASSWORD};delete process.env.INITIAL_ADMIN_EMAIL;delete process.env.INITIAL_ADMIN_PASSWORD;
    try{f.Users.estimatedDocumentCount=async()=>0;let account;f.Users.prototype.save=async function(){account=this};const initialize=f.load('config/db.config.js').initializeDB;await assert.rejects(initialize(),/INITIAL_ADMIN/);assert.equal(account,undefined);process.env.INITIAL_ADMIN_EMAIL='admin@example.test';process.env.INITIAL_ADMIN_PASSWORD='explicit unique password';await initialize();assert.equal(account.email,'admin@example.test');assert.deepEqual([...account.roles],['admin']);assert.equal(account.validPassword('explicit unique password'),true);assert.notEqual(account.salt,'b22aed538e76b1a70b2b8b20b57de4ae');}finally{for(const [key,value]of Object.entries({INITIAL_ADMIN_EMAIL:saved.email,INITIAL_ADMIN_PASSWORD:saved.password})){if(value===undefined)delete process.env[key];else process.env[key]=value}}
});
test('bootstrap leaves an existing database untouched without reading new credentials',async()=>{const f=fixture();f.Users.estimatedDocumentCount=async()=>1;f.Users.prototype.save=()=>assert.fail('must not create account');await f.load('config/db.config.js').initializeDB()});
