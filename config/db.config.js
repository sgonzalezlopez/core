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
    console.log(this.CONFIGS.MONGODB_URI);
    await mongoose.connect(this.CONFIGS.MONGODB_URI, {useNewUrlParser : true, useUnifiedTopology: true}, function(err) {
    //     // mongoose.db.command({ buildInfo :1 }, function (err, info) {
    //     //     console.log(info.version);
    //     // })

    // var admin = new mongoose.mongo.Admin(mongoose.connection.db);
    // admin.buildInfo(function (err, info) {
    //    console.log('DB version:', info.version);
    // });
  });
  
  // Get Mongoose to use the global promise library
  mongoose.Promise = global.Promise;
  //Get the default connection
  var db = mongoose.connection;
  
  //Bind connection to error event (to get notification of connection errors)
  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
}

module.exports.initializeDB = function () {
    Users.estimatedDocumentCount(async (err, count) => {
        if (!err && count === 0) {
            var user = new Users({
                username : 'admin',
                email : 'admin@localhost',
                roles : ['admin'],
                salt : 'b22aed538e76b1a70b2b8b20b57de4ae',
                hash : '4b1623733433161b53b3e39975cd7d3344e3e1de06e2dbb14c5a74089fff5a81b3eb49c18dc2079ce9a86390d35567d1949b4e8453c35b95d79d305fbf1fd24e'
            })
            await user.save();
        }
    })
}