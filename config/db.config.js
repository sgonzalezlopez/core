const mongoose = require('mongoose');
const Users = require('../models/user.model');

const BASE_CONFIG = {MONGODB_URI : process.env.MONGODB_URI};

var LOCAL_CONFIG = {}

try {
    LOCAL_CONFIG = require('../../config/db.config').CONFIGS
}
catch {}

module.exports.CONFIGS = {...BASE_CONFIG, ...LOCAL_CONFIG};



module.exports.connectDB = async function() {
    mongoose.set('strictQuery', true);
    await mongoose.connect(this.CONFIGS.MONGODB_URI);

  // Get Mongoose to use the global promise library
  mongoose.Promise = global.Promise;
  //Get the default connection
  var db = mongoose.connection;
  
  //Bind connection to error event (to get notification of connection errors)
  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
}

// Existing databases are untouched. Empty databases require explicit bootstrap credentials.
module.exports.initializeDB = async function () {
    if (await Users.estimatedDocumentCount() !== 0) return;
    const validation = require('../security/validation');
    if (!process.env.INITIAL_ADMIN_PASSWORD || !process.env.INITIAL_ADMIN_EMAIL) throw new Error('INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD are required for an empty database');
    const user = new Users({username: validation.text(process.env.INITIAL_ADMIN_USERNAME || 'admin', 'username', 128), email: validation.email(process.env.INITIAL_ADMIN_EMAIL), roles: ['admin'], active: true});
    await user.setPassword(validation.password(process.env.INITIAL_ADMIN_PASSWORD));
    await user.save();
};
