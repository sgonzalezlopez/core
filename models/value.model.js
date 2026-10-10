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
},{
    timestamps: true,
    // El formulario necesita `id` en la respuesta para identificar el nuevo valor en guardados posteriores.
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});


// exporting module to allow it to be imported in other files
module.exports = mongoose.model('Value', ValueSchema);
