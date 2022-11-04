// {"view" : "admin"}
const mongoose = require('mongoose');

// creating user schema
const Schema = mongoose.Schema({
    entity : {
        type : String,
        required : true
    },
    roles : {
        type : String,
        combo : { type: 'role'}
    },
    type : {
        type : [String],
        combo : { 
            values : [
                {value:'C', text:'Create'},
                {value:'R', text:'Read'},
                {value:'U', text:'Update'},
                {value:'D', text:'Delete'}
            ], 
            multiple : true}
    },
},{ timestamps: true });


// exporting module to allow it to be imported in other files
const Permission = module.exports = mongoose.model('Permission', Schema);
