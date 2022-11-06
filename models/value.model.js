// {"view" : "admin"}
const mongoose = require('mongoose');
var Schema = mongoose.Schema;


// creating user schema
const ValueSchema = mongoose.Schema({
    type: {
        type : String,
        required: true
    },
    value : {
        type : String,
        required : true
    },
    text : {
        type : String,
    },
    order : {
        type : Number,

    },
},{ timestamps: true });


// exporting module to allow it to be imported in other files
const Value = module.exports = mongoose.model('Value', ValueSchema);
