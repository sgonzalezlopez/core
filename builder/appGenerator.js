const fs = require('fs');
const ejs = require('ejs')
const crypto = require('crypto')

var basedir = '';

const default_params = {
   appName: 'app',
   mongoServer : '',
   jwtToken : crypto.randomBytes(64).toString('hex'),
   cookieSecret : crypto.randomBytes(64).toString('hex'),
   locale : 'es'
}

const requiredFolders = [
   "./api",
   "./config",
   "./controllers",
   "./locales",
   "./models",
   "./public",
   "./public/css",
   "./public/js",
   "./sessions",
   "./templates",
   "./views",
   "./views-routes",
]

const requiredFiles = [
   {p : "./.gitignore", content : ".gitignore" },
   {p : "./api/routes.js", content : "routes.js" },
   {p : "./views-routes/routes.js", content : "routes.js" },
   {p : "./.env", content : "env" },
   {p : "./config/app.config.js", content : "app.config.js" },
   {p : "./config/initialize.js", content : "initialize.js" },
   {p : "./public/css/local-common.css", content : "local-common.css" },
   {p : "./public/js/local-common.js", content : "local-common.js" },
   {p : "./app.js", content : "app.js" },

]

const chain = [
   {f: createFolders, desc : "Creating required folders..."},
   {f: createFiles, desc : "Creating required files..."},

]

module.exports.generateApp = function generateApp(argv) {
   params = { ...default_params, ...argv }

   for (let i = 0; i < chain.length; i++) {
      const step = chain[i];
      console.log(`- (${i+1}/${chain.length}) ${step.desc}`);
      step.f(params)
      console.log(`- (${i+1}/${chain.length}) Done`);
   }
}

function createFolders(params) {
   requiredFolders.forEach(dir => {
      if (!fs.existsSync(dir)) {
         console.log("  Creating folder", dir);
         fs.mkdirSync(dir);
      }
   });
}

function createFiles(params) {
   requiredFiles.forEach(async file => {
      if (fs.existsSync(file.p)) console.log(`  File ${file.p} already exists.`);
      else {
         console.log("  Generating file", file.p);
         var text = await ejs.renderFile(`./core/builder/templates/${file.content}`, params)
         fs.writeFile(file.p, text, (err) => { if (err) throw err; })
      }
   })

}
