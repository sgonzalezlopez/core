// importing modules
const mongoose = require('mongoose');
var Schema = mongoose.Schema;


// creating user schema
const FeatureSchema = mongoose.Schema({
    key : {
        type : String,
        required : true
    },
    description : {
        type : String
    },
    active : {
        type : Boolean
    },
},{ timestamps: true });


// exporting module to allow it to be imported in other files
const Feature = module.exports = mongoose.model('Feature', FeatureSchema);
