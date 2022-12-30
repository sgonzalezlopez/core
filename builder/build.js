const ejs = require('ejs')
const path = require('path');
const entityGenerator = require('./entityGenerator')
const appGenerator = require('./appGenerator')
const transGenerator = require('./transGenerator')

var argv;

build()

// **** // Parameters
// -i / --init : Initialize global app
// -t / --trans : Generate tralation files
// -l : Especify locale file to include in translation
// -p : Root path to find models folder
// -e : List of models to process
// -force : Force changes in all objects
// -forceController : Force changes in controller
// -forceAPI : Force changes in API
// -forceUI : Force changes in UI objects
// -forceForm : Force generation of forms page
// -forceList : Force generation of list page
// -forceSearch : Force generation of search page
// -generateFullForm : Indicates if the process generates the entire form page or a reference to dynamic form
// -fullForm : Equal to generateFullForm
// -view: Folder to contain the pages and class to process requests

function build() {
    argv = require('yargs/yargs')(process.argv.slice(2).join(' '))
        .alias('forceForm', 'ff')
        .alias('init', 'i')
        .alias('trans', 't')
        .alias('locale', 'l')
        .alias('localeTarget', 'lt')
        .alias('ent', 'e')
        .alias('path', 'p')
        .default('path', './')
        .default('localeTarget', './locales')
        .array('ent')
        .boolean('force')
        .boolean('init')
        .boolean('trans')
        .boolean('forceUI')
        // .boolean('forceForm')
        .boolean('forceList')
        .argv;

    var originDir = argv.path;
    var entities = argv.ent;



    if (argv.init) {
        // Inicializa aplicación global
        console.log("Initializing application");
        appGenerator.generateApp(argv)
    }
    else if (argv.trans) {
        transGenerator.generateLocales(argv)
    }
    else {
        // Crea codigo para entidades
        entityGenerator.processEntities(argv);
    }
}