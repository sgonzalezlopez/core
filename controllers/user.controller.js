const { sendTemplatedEmail } = require("../config/email.config");
const Users = require("../models/user.model");

exports.getAll = (req, res) => {
    Users.find().select('-salt -hash')
    .then(users => {
        res.send(users)
    })
}

exports.get = (req, res) => {
    Users.findById(req.params.id).select('-salt -hash')
    .then(users => {
        res.send(users)
    })
}

exports.create = async (req, res) => {
    const user = new Users({
        username: req.body.username,
        email: req.body.email,
        roles : req.body.roles,
        active : req.body.active || false,
    });
  
    await user.setPassword(req.body.password)
    
    user.save((err, user) => {
        if (err) {
            res.status(400).send({ message: err });
            return;
        }
        delete user.salt;
        delete user.hash;       
        res.send(user)
    });
}

exports.updateProfile = (req, res) => {
    if (req.user._id != req.params.id) return res.status(400).send({message : res.__('INVALID_OPERATION')})
    Users.findById(req.params.id).select('-salt -hash')
    .then(async user => {
        if (req.body.email) user.email = req.body.email

        newuser = await user.save();
        delete newuser.salt;
        delete newuser.hash;
        res.send(newuser)
    })
}

exports.update = (req, res) => {
    Users.findById(req.params.id).select('-salt -hash')
    .then(async user => {
        if (req.body.email) user.email = req.body.email
        if (req.body.active) user.active = req.body.active
        if (req.body.roles) user.roles = req.body.roles

        newuser = await user.save();
        delete newuser.salt;
        delete newuser.hash;
        res.send(newuser)
    })
}

exports.delete = (req, res) => {
    Users.deleteOne({_id:req.params.id})
    .then(users => {
        res.send({message : 'OK'})
    })
}

exports.sendTestEmail = (req, res) => {
    Users.findById(req.params.id).select('-salt -hash')
    .then(users => {
        sendTemplatedEmail('registration', 'sgonzalezlopez@gmail.com', {user:users, link:'AAAAA'})
        res.send({message : 'OK'})
    })
}