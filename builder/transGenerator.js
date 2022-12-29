const fs = require('fs');
const path = require('path')
var basedir = '';

const default_params = {
   localesTarget: './locales'
}

const chain = [
   { f: readLocales, desc: "Reading locales..." },
   { f: writeLocales, desc: "Writting consolidated locales..." },

]

const localeData = {};

module.exports.generateLocales = function generateLocales(argv) {
   params = { ...default_params, ...argv }
   for (let i = 0; i < chain.length; i++) {
      const step = chain[i];
      console.log(`- (${i + 1}/${chain.length}) ${step.desc}`);
      step.f(params)
      console.log(`- (${i + 1}/${chain.length}) Done`);
   }
}

function readLocales(argv) {
   if (!Array.isArray(argv.locale)) argv.locale = [argv.locale]
   argv.locale.reverse()
   for (let i = 0; i < argv.locale.length; i++) {
      localesPath = path.join(argv.path, argv.locale[i])
      console.log("  Reading folder", localesPath);
      var dir = fs.readdirSync(localesPath)
      dir.forEach(localeFile => {
         var loc = localeFile.replace('.json', '')
         let locDataRaw = fs.readFileSync(path.join(localesPath, localeFile))
         let locData = JSON.parse(locDataRaw);
         console.log(`    Reading file ${localeFile}`);
         localeData[loc] = {...localeData[loc], ...locData}
      });
   }
}

function writeLocales(argv) {
   if (!fs.existsSync(argv.localeTarget)) fs.mkdirSync(argv.localeTarget);

   for (const key in localeData) {
      if (Object.hasOwnProperty.call(localeData, key)) {
         const element = localeData[key];
         console.log(`    Writting file ${path.join(argv.localeTarget, `${key}.json`)}`);
         fs.writeFileSync(path.join(argv.localeTarget, `${key}.json`), JSON.stringify(element, Object.keys(element).sort(), 2))
      }
   }
 }

