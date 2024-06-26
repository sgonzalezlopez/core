// {"view" : "admin"}
const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
const { type } = require('os');

// creating user schema
const AppSchema = mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    type : {
        type : [String],
        combo : { type : "appPosition", multiple : true}
    },
    roles : {
        type : [String],
        combo : { type: 'role', multiple : true}
    },
    level : {
        type : Number,
        default : 0
    },
    link : {
        type : String,
    },
    icon : {
        type : String,
    },
    parent : {
        type : Schema.Types.ObjectId,
        ref : 'App',
        combo : { collection : {name : 'App', text : 'name'}}
    }
},{ timestamps: true });


// exporting module to allow it to be imported in other files
const App = module.exports = mongoose.model('App', AppSchema);
