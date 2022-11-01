// importing modules
const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const TestSchema = mongoose.Schema({
    text1 : {
        type : String,
        required : true
    },
    text2 : {
        type : String,
        required : true,
        combo : { values : ["SI", "NO"]}
    },
    text3 : {
        type : String,
        required : true,
        combo : { multiple: true, values : ["ADMIN", "USER", "CONTRIBUTOR", "READER"]}
    },
    text4 : {
        type : String,
        readOnly : true
    },
    password : {
        type : String,
        required : true,
        password : true
    },
    listString : {
        type: [String],
        hideInForm : false
    },
    booleano : {
        type : Boolean,
        default : true
    },
    number : {
        type : Number,
        min : [6, 'MIN NOT REACHED'],
        max : [100, 'MIN NOT REACHED']
    },
    fecha : {
        type : Date
    },
    img: { 
        type : {
            data: Buffer,
            contentType: String
        },
        fileUpload : true
    },
},{ timestamps: true });


const Test = module.exports = mongoose.model('Test', TestSchema);