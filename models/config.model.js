// importing modules
const mongoose = require('mongoose');

// creating user schema
const ConfigSchema = mongoose.Schema({
    key : {
        type : String,
        required : true
    },
    description : {
        type : String
    },
    value : {
        type : String,
        required : true
    },
},{ timestamps: true });


// exporting module to allow it to be imported in other files
const Config = module.exports = mongoose.model('Config', ConfigSchema);
