'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const net=require('node:net');
const {spawn}=require('node:child_process');
const crypto=require('node:crypto');
const {fixture,root}=require('./helpers.cjs');
let mongo,temporary,store,server,f,base,uri;
const env={};
const dbName='core_security_test_'+crypto.randomBytes(8).toString('hex');
async function port(){const server=net.createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;await new Promise(resolve=>server.close(resolve));return port;}
before(async()=>{
    for(const key of ['PUBLIC_ORIGIN','CORS_ORIGINS','COOKIE_NAME']){env[key]=process.env[key];delete process.env[key];}
    if(process.env.SECURITY_TEST_MONGODB_URI){uri=process.env.SECURITY_TEST_MONGODB_URI;}else{
        temporary=fs.mkdtempSync(path.join(os.tmpdir(),'core-security-mongo-'));
        const mongoPort=await port();let binary=process.env.MONGOD_BINARY || 'mongod';
        if (!process.env.MONGOD_BINARY && process.platform === 'win32') {
            const directory=path.join(process.env.ProgramFiles || 'C:/Program Files','MongoDB','Server');
            if (fs.existsSync(directory)) {
                const versions=fs.readdirSync(directory).sort((a,b)=>b.localeCompare(a,undefined,{numeric:true}));
                const installed=versions.map(version=>path.join(directory,version,'bin','mongod.exe')).find(file=>fs.existsSync(file));
                if (installed) binary=installed;
            }
        }
        mongo=spawn(binary,['--dbpath',temporary,'--port',String(mongoPort),'--bind_ip','127.0.0.1','--noauth','--logpath',path.join(temporary,'mongod.log')],{windowsHide:true,stdio:'ignore'});
        let spawnError;mongo.once('error',err=>{spawnError=err});
        let ready=false;for(let i=0;i<100;i++){if(spawnError)throw spawnError;ready=await new Promise(resolve=>{const socket=net.connect(mongoPort,'127.0.0.1');socket.once('connect',()=>{socket.destroy();resolve(true)});socket.once('error',()=>resolve(false));});if(ready)break;await new Promise(resolve=>setTimeout(resolve,100));}
        if(!ready)throw new Error('Temporary MongoDB did not start');uri='mongodb://127.0.0.1:'+mongoPort;
    }
    const mongoStore=require('connect-mongo');
    f=fixture({passport:new (require('passport').Passport)(),'connect-mongo':{create(options){store=mongoStore.create(options);return store;}}});
    f.mongoose.set('strictQuery', true);
    await f.mongoose.connect(uri,{dbName,serverSelectionTimeoutMS:5000});
    // MongoStore accepts dbName separately; configure URI pointing to our unique database.
    const sessionUri=new URL(uri);sessionUri.pathname='/'+dbName;
    f.config.config.db.CONFIGS.MONGODB_URI=sessionUri.toString();
    f.config.config.db.connectDB=async()=>{};
    global.__corePath=root;
    const core=f.load('app.js');const app=await core.setup();
    core.configureStatic(app);core.configureRoutes(app);core.configureErrorHandling(app);
    server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));base='http://127.0.0.1:'+server.address().port;
});
after(async()=>{
    if(server)await new Promise(resolve=>server.close(resolve));
    if(store){await store.collectionP;await store.close();}
    if(f&&f.mongoose.connection.readyState){if(!/^core_security_test_[a-f0-9]{16}$/.test(dbName))throw new Error('Unsafe test database name');await f.mongoose.connection.dropDatabase();await f.mongoose.disconnect();}
    if(mongo&&mongo.exitCode===null){mongo.kill();await new Promise(resolve=>mongo.once('exit',resolve));}
    if(temporary){const target=path.resolve(temporary),parent=path.resolve(os.tmpdir())+path.sep;if(!target.startsWith(parent)||!path.basename(target).startsWith('core-security-mongo-'))throw new Error('Unsafe cleanup path');fs.rmSync(target,{recursive:true,force:true});}
    for(const[key,value]of Object.entries(env)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
});
async function user(roles=['user'],active=true){const user=new f.Users({username:'u'+crypto.randomBytes(6).toString('hex'),email:crypto.randomBytes(6).toString('hex')+'@example.test',roles,active});await user.setPassword('old');await user.save();return user;}
function agent(){let cookie='',token='';return {get cookie(){return cookie},get token(){return token},async request(url,options={}){const res=await fetch(base+url,{redirect:'manual',...options,headers:{...(cookie?{Cookie:cookie}:{}),...options.headers}});const set=res.headers.get('set-cookie');if(set)cookie=set.split(';')[0];return res;},async csrf(){const res=await this.request('/api/csrf');token=(await res.json()).csrfToken;return token},async post(url,body={},headers={}){return this.request(url,{method:'POST',headers:{'Content-Type':'application/json',...(token?{'X-CSRF-Token':token}:{}),...headers},body:JSON.stringify(body)})},async login(user){await this.csrf();const res=await this.post('/login',{username:user.username,password:'old'});assert.equal(res.status,302);await this.csrf();return this;}};}
test('MongoDB: registration token stores only hash; consumption activates once under concurrency',async()=>{
    const account=await user(['user'],false);const tokens=f.load('security/account-tokens.js');const token=await tokens.issue(account,'registration');
    const stored=await f.Users.collection.findOne({_id:account._id});assert.equal(stored.actionTokenHash,tokens.digest(token));assert.notEqual(stored.actionTokenHash,token);assert.equal(stored.actionTokenPurpose,'registration');
    const results=await Promise.all([tokens.consume(token,'new'),tokens.consume(token,'new')]);assert.equal(results.filter(Boolean).length,1);
    const updated=await f.Users.findById(account.id);assert.equal(updated.active,true);assert.equal(updated.validPassword('new'),true);assert.equal(await tokens.consume(token,'other'),null);assert.equal((await f.Users.collection.findOne({_id:account._id})).actionTokenHash,undefined);
});
test('MongoDB: expiry, reissue, purpose and legacy salt are enforced',async()=>{
    const account=await user();const tokens=f.load('security/account-tokens.js');const first=await tokens.issue(account,'reset');const second=await tokens.issue(account,'reset');assert.equal(await tokens.consume(first,'new'),null);assert.equal(await tokens.find(account.salt),null);
    await f.Users.collection.updateOne({_id:account._id},{$set:{actionTokenExpiresAt:new Date(Date.now()-1000)}});assert.equal(await tokens.consume(second,'new'),null);
    const third=await tokens.issue(account,'reset');await f.Users.collection.updateOne({_id:account._id},{$set:{active:false}});assert.equal(await tokens.consume(third,'new'),null);
    await assert.rejects(tokens.issue(account,'registration').then(async raw=>{await f.Users.collection.updateOne({_id:account._id},{$set:{active:true}});assert.equal(await tokens.consume(raw,'new'),null);throw new Error('checked');}),/checked/);
});
test('HTTP + MongoDB: web registration sends opaque link, keeps URL, activates through existing form',async()=>{
    const a=agent();await a.csrf();const email=crypto.randomBytes(6).toString('hex')+'@example.test';const res=await a.post('/signup',{username:'new'+crypto.randomBytes(4).toString('hex'),email,roles:['admin']});assert.equal(res.status,302);
    const message=f.mail.findLast(item=>item.template==='registration-twosteps'&&item.to===email);assert.ok(message);const token=message.data.link.split('/').pop();assert.match(token,/^[a-f0-9]{64}$/);
    const account=await f.Users.findOne({email});assert.deepEqual([...account.roles],['user']);assert.equal(account.active,false);
    const page=await a.request('/complete-registry/'+token);assert.equal(page.status,200);assert.equal(page.headers.get('referrer-policy'),'no-referrer');const html=await page.text();assert.match(html,/name="_csrf"/);
    const complete=await a.post('/complete-registry/'+token,{password:'new',passwordVerify:'new'});assert.equal(complete.status,302);assert.equal(complete.headers.get('location'),'/');const updated=await f.Users.findOne({email});assert.equal(updated.active,true);assert.equal(updated.validPassword('new'),true);
    assert.equal((await a.request('/complete-registry/'+token)).headers.get('location'),'/login?errorNotUser');
});
test('HTTP + MongoDB: direct web registration works without TWO_STEPS_REGISTRY',async()=>{
    f.config.features.TWO_STEPS_REGISTRY=false;try{const a=agent();await a.csrf();const email=crypto.randomBytes(6).toString('hex')+'@example.test';const res=await a.post('/register',{username:'direct'+crypto.randomBytes(4).toString('hex'),email,password:'new',passwordVerify:'new'});assert.equal(res.status,302);assert.equal(res.headers.get('location'),'/login?registerSucceed');const account=await f.Users.findOne({email});assert.equal(account.active,true);assert.equal(account.validPassword('new'),true);}finally{f.config.features.TWO_STEPS_REGISTRY=true;}
});
test('HTTP + MongoDB: API signup retains approval, ignores admin roles and honors SELF_REGISTER',async()=>{
    const a=agent();const email=crypto.randomBytes(6).toString('hex')+'@example.test';const res=await a.post('/api/auth/signup',{username:'api'+crypto.randomBytes(4).toString('hex'),email,password:'new',roles:['admin']});assert.equal(res.status,200);const account=await f.Users.findOne({email});assert.equal(account.active,false);assert.deepEqual([...account.roles],['user']);
    f.config.features.SELF_REGISTER=false;try{assert.equal((await a.post('/api/auth/signup',{username:'disabled',email:'d@e.test',password:'new'})).status,403);}finally{f.config.features.SELF_REGISTER=true;}
});
test('HTTP + MongoDB: NoSQL filters and unauthenticated/admin access are rejected',async()=>{
    const account=await user(['admin']);const a=await agent().login(account);
    for(const body of [{$where:'true'},{username:{$ne:null}},{roles:{$in:['admin']}},{hash:'secret'}])assert.equal((await a.post('/api/user/find',body)).status,400);
    const response=await a.post('/api/user/find',{active:'false'});assert.equal(response.status,200);for(const account of await response.json()){assert.equal(account.active,false);assert.equal(account.hash,undefined);assert.equal(account.salt,undefined);assert.equal(account.actionTokenHash,undefined);}
    assert.equal((await agent().post('/api/user/find',{})).status,401);const ordinary=await agent().login(await user());assert.equal((await ordinary.post('/api/user/find',{})).status,403);
});
test('HTTP + MongoDB: old password, identity and admin override preserve user count',async()=>{
    const account=await user(),target=await user();const a=await agent().login(account);const count=await f.Users.countDocuments();
    assert.equal((await a.post('/api/auth/changepassword/'+account.id,{password:'new',oldPassword:'wrong'})).status,403);
    assert.equal((await a.post('/api/auth/changepassword/'+target.id,{password:'new',oldPassword:'old'})).status,403);
    assert.equal((await a.post('/api/auth/changepassword/'+account.id,{password:'new',oldPassword:'old'})).status,200);
    assert.equal(await f.Users.countDocuments(),count);assert.equal((await f.Users.findById(account.id)).validPassword('new'),true);
    const admin=await agent().login(await user(['admin']));assert.equal((await admin.post('/api/auth/changepassword/'+target.id,{password:'admin change'})).status,200);assert.equal((await f.Users.findById(target.id)).validPassword('admin change'),true);
});
test('HTTP + MongoDB: private form uses password field and updates existing account',async()=>{
    const account=await user();const a=await agent().login(account);const res=await a.post('/private/change-password',{id:account.id,password:'new',passwordVerify:'new',oldPassword:'old'});assert.equal(res.status,200);assert.equal((await f.Users.findById(account.id)).validPassword('new'),true);
});
test('HTTP + MongoDB: reset is still admin-only; new reset invalidates old sessions and JWT',async()=>{
    const account=await user();const oldSession=await agent().login(account);const jwt=f.load('middlewares/auth.jwt.js');const raw=jwt.generateToken(account);
    assert.equal((await oldSession.post('/api/auth/reset',{email:account.email})).status,403);
    const admin=await agent().login(await user(['admin']));assert.equal((await admin.post('/api/auth/reset',{email:account.email})).status,200);
    const mail=f.mail.findLast(item=>item.template==='password-reset'&&item.to===account.email);const token=mail.data.link.split('/').pop();const a=agent();await a.csrf();assert.equal((await a.post('/complete-registry/'+token,{password:'new',passwordVerify:'new'})).status,302);
    assert.equal((await oldSession.request('/api/user')).status,401);
    const bearer=await fetch(base+'/api/user',{headers:{Authorization:'Bearer '+raw}});assert.equal(bearer.status,401);
});
test('HTTP + MongoDB: current admin role state overrides stale JWT admin claim',async()=>{const account=await user(['admin']);const token=f.load('middlewares/auth.jwt.js').generateToken(account);await f.Users.updateOne({_id:account._id},{$set:{roles:['user']}});assert.equal((await fetch(base+'/api/user',{headers:{Authorization:'Bearer '+token}})).status,403)});
test('MongoDB: changing password invalidates outstanding account tokens',async()=>{const account=await user();const tokens=f.load('security/account-tokens.js');const token=await tokens.issue(account,'reset');await f.load('security/passwords.js').change(account,account.id,{password:'new',oldPassword:'old'});assert.equal(await tokens.consume(token,'other'),null)});
test('HTTP + MongoDB: session-bound CSRF rejects cookie mutation and forged token bypass',async()=>{const account=await user(['admin']);const a=await agent().login(account);assert.equal((await a.request('/api/user/find',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,403);assert.equal((await a.post('/api/user/find',{}, {'X-Access-Token':'forged'})).status,401)});

test('HTTP + MongoDB: admin can still create a passwordless account from the existing form',async()=>{const a=await agent().login(await user(['admin']));const email=crypto.randomBytes(6).toString('hex')+'@example.test';const created=await a.post('/api/user',{username:'form'+crypto.randomBytes(4).toString('hex'),email,roles:['user'],active:''});assert.equal(created.status,200);const body=await created.json();assert.equal(body.hash,undefined);assert.equal(body.salt,undefined);const account=await f.Users.findOne({email});assert.equal(account.active,false);assert.equal(account.validPassword(''),false);assert.equal((await a.post('/api/auth/setpass/'+account.id,{password:'new'})).status,200);assert.equal((await f.Users.findById(account.id)).validPassword('new'),true)});
test('HTTP + MongoDB: logout GET does not mutate session; POST requires CSRF',async()=>{const a=await agent().login(await user(['admin']));assert.equal((await a.request('/logout')).status,200);assert.equal((await a.request('/api/user')).status,200);assert.equal((await a.request('/logout',{method:'POST'})).status,403);assert.equal((await a.post('/logout')).status,302);assert.equal((await a.request('/api/user')).status,401)});
test('HTTP + MongoDB: query-token login requires a CSRF-protected confirmation',async()=>{const account=await user();const token=f.load('middlewares/auth.jwt.js').generateToken(account);const a=agent();await a.csrf();const confirmation=await a.request('/?token='+token+'&url=/private/profile');assert.equal(confirmation.status,200);assert.match(await confirmation.text(),/action="\/token-login"/);assert.equal((await a.request('/api/user')).status,401);const result=await a.post('/token-login',{token,url:'/private/profile'});assert.equal(result.status,302);assert.equal(result.headers.get('location'),'/private/profile');assert.equal((await a.request('/api/user')).status,403)});
test('HTTP + MongoDB: timetrack custom deserializer still receives an id and enriches coach/skater',async()=>{
    const account=await user(['coach','skater']);const a=await agent().login(account);let customStore,customServer;
    const mongoStore=require('connect-mongo');const other=fixture({passport:new (require('passport').Passport)(),'connect-mongo':{create(options){customStore=mongoStore.create(options);return customStore;}}});
    other.config.config.db.CONFIGS.MONGODB_URI=f.config.config.db.CONFIGS.MONGODB_URI;
    try{
        const app=await other.load('app.js').setup({deserializeUser(id,done){assert.equal(typeof id,'string');return f.Users.findById(id).then(user=>{user.clubs=['club1'];user.skater='skater1';done(null,user)})}});
        app.get('/probe',other.load('middlewares/authentication.js').isAuthenticated,(req,res)=>res.json({clubs:req.user.clubs,skater:req.user.skater}));customServer=app.listen(0,'127.0.0.1');await new Promise(resolve=>customServer.once('listening',resolve));const url='http://127.0.0.1:'+customServer.address().port+'/probe';
        const response=await fetch(url,{headers:{Cookie:a.cookie}});assert.equal(response.status,200);assert.deepEqual(await response.json(),{clubs:['club1'],skater:'skater1'});
        await f.load('security/passwords.js').change(account,account.id,{password:'new',oldPassword:'old'});assert.equal((await fetch(url,{headers:{Cookie:a.cookie}})).status,401);
    }finally{if(customServer)await new Promise(resolve=>customServer.close(resolve));if(customStore){await customStore.collectionP;await customStore.close();}}
});
test('HTTP + MongoDB: production cookie is Secure behind a trusted HTTPS proxy',async()=>{
    let secureStore,secureServer;const mongoStore=require('connect-mongo');const other=fixture({passport:new (require('passport').Passport)(),'connect-mongo':{create(options){secureStore=mongoStore.create(options);return secureStore;}}});other.config.config.app.ENV='production';other.config.config.db.CONFIGS.MONGODB_URI=f.config.config.db.CONFIGS.MONGODB_URI;
    try{const app=await other.load('app.js').setup();secureServer=app.listen(0,'127.0.0.1');await new Promise(resolve=>secureServer.once('listening',resolve));const url='http://127.0.0.1:'+secureServer.address().port+'/api/csrf';const res=await fetch(url,{headers:{'X-Forwarded-Proto':'https'}});assert.equal(res.status,200);assert.match(res.headers.get('set-cookie'),/; Secure/);assert.match(res.headers.get('set-cookie'),/HttpOnly/);assert.match(res.headers.get('set-cookie'),/SameSite=Lax/);const plain=await fetch(url,{redirect:'manual'});assert.equal(plain.status,302);assert.match(plain.headers.get('location'),/^https:/);}finally{if(secureServer)await new Promise(resolve=>secureServer.close(resolve));if(secureStore){await secureStore.collectionP;await secureStore.close();}}
});

test('MongoDB: initialization awaits all seed writes without modifying existing users',async()=>{const count=await f.Users.countDocuments();await f.load('config/initialize.js')();assert.equal(await f.Users.countDocuments(),count);assert.ok(await f.load('models/app.model.js').countDocuments()>0);assert.ok(await f.load('models/value.model.js').countDocuments()>0);assert.ok(await f.load('models/config.model.js').countDocuments()>0);assert.ok(await f.load('models/feature.model.js').countDocuments()>0)});

test('HTTP + MongoDB: API signin remains stateless, returns existing fields and rejects invalid identities',async()=>{const account=await user(['admin']);const a=agent();const res=await a.post('/api/auth/signin',{username:account.username,password:'old'});assert.equal(res.status,200);assert.equal(res.headers.get('set-cookie'),null);const body=await res.json();assert.deepEqual(body.roles,['ROLE_ADMIN']);assert.equal(body.email,account.email);assert.equal(body.id,account.id);assert.equal(typeof body.accessToken,'string');assert.equal((await fetch(base+'/api/user',{headers:{'X-Access-Token':body.accessToken}})).status,200);assert.equal((await a.post('/api/auth/signin',{username:account.username,password:'wrong'})).status,401);assert.equal((await a.post('/api/auth/signin',{username:{$ne:null},password:'old'})).status,400);await f.Users.updateOne({_id:account._id},{$set:{active:false}});assert.equal((await a.post('/api/auth/signin',{username:account.username,password:'old'})).status,401)});


test('HTTP + MongoDB: principal password aliases work for change and API signup',async()=>{const account=await user();const a=await agent().login(account);assert.equal((await a.post('/api/auth/changepassword/'+account.id,{newPassword:'alias',newPasswordVerify:'alias',oldPassword:'old'})).status,200);assert.equal((await f.Users.findById(account.id)).validPassword('alias'),true);const anonymous=agent();const email=crypto.randomBytes(6).toString('hex')+'@example.test';assert.equal((await anonymous.post('/api/auth/signup',{username:'alias'+crypto.randomBytes(4).toString('hex'),email,newPassword:'new',newPasswordVerify:'new'})).status,200);const created=await f.Users.findOne({email});assert.equal(created.validPassword('new'),true);assert.equal(created.active,false);const count=await f.Users.countDocuments();assert.equal((await anonymous.post('/api/auth/signup',{username:'badalias',email:'badalias@example.test',newPassword:'new',newPasswordVerify:'wrong'})).status,400);assert.equal(await f.Users.countDocuments(),count)});
