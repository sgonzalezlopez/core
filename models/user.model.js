// {"view" : "admin"}
const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
const config = require('../config/config')
const i18n = require('../i18n/i18n.config')

// creating user schema
const UserSchema = mongoose.Schema({
    username : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true
    },
    roles : {
        type : [String],
        default: ['user'],
        validate: value => Array.isArray(value) && value.every(role => typeof role === 'string' && /^[a-z][a-z0-9_:-]{0,63}$/i.test(role)),
        combo : { type: 'role', multiple : true}
    },
    active : {
        type : Boolean,
        default : true
    },
    lastLogin : {
        type : Date
    },
    passwordVersion: {type: Number, default: 0, hideInForm: true},
    actionTokenHash: {type: String, select: false, hideInForm: true},
    actionTokenPurpose: {type: String, enum: ['registration', 'reset'], select: false, hideInForm: true},
    actionTokenExpiresAt: {type: Date, select: false, hideInForm: true},
    hash : {
        type:String,
        hideInForm : true
    },
    salt : {
        type:String,
        hideInForm : true,
        default : () => crypto.randomBytes(16).toString('hex')
    }
},{ timestamps: true });

// method to set salt and hash the password for a user
// setPassword method first creates a salt unique for every user
// then it hashes the salt with user password and creates a hash
// this hash is stored in the database as user password
UserSchema.methods.setPassword = async function(password) {
    require('../security/validation').password(password)

    var regText = await config.getConfig('PASSWORD_COMPLEXITY');
    if (regText && !(new RegExp(regText)).test(password)) {
        const error = new Error(i18n.__('Password does not match complexity'))
        error.status = 400;
        error.detail = i18n.__(regText)
        throw (error);
    }

    this.passwordVersion = (this.passwordVersion || 0) + 1;
    this.actionTokenHash = undefined;
    this.actionTokenPurpose = undefined;
    this.actionTokenExpiresAt = undefined;
 // creating a unique salt for a particular user
    this.salt = crypto.randomBytes(16).toString('hex');
    // hashing user's salt and password with 1000 iterations, 64 length and sha512 digest
    this.hash = crypto.pbkdf2Sync(password, this.salt,
    1000, 64, 'sha512').toString('hex');
};

// method to check entered password is correct or not
// validPassword method checks whether the user password is correct or not
// It takes the user password from the request and salt from user database entry
// It then hashes user password and salt
// then checks if this generated hash is equal to user's hash in the database or not
// if user's hash is equal to generated hash then password is correct otherwise not
UserSchema.methods.validPassword = function(password) {
    if (typeof password !== 'string' || Buffer.byteLength(password) > 1024 || !this.salt || !this.hash) return false;
    var hash = crypto.pbkdf2Sync(password,
    this.salt, 1000, 64, 'sha512').toString('hex');
    const expected = Buffer.from(this.hash, 'hex');
    const actual = Buffer.from(hash, 'hex');
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

// Legacy [null] grants no roles; never promote an existing account implicitly.
UserSchema.pre('validate', function() { if (Array.isArray(this.roles)) this.roles = this.roles.filter(role => role !== null); });

function redact(_doc, value) {
    for (const key of ['salt', 'hash', 'actionTokenHash', 'actionTokenPurpose', 'actionTokenExpiresAt']) delete value[key];
    return value;
}
UserSchema.set('toJSON', {transform: redact});
UserSchema.set('toObject', {transform: redact});

// exporting module to allow it to be imported in other files
const User = module.exports = mongoose.model('User', UserSchema);
