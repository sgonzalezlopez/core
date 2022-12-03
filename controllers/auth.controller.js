const config = require("../config/config");
const Users = require("../models/user.model");

var jwt = require("jsonwebtoken");
const Email = require("../config/email.config");

exports.register = async (req, res) => {
	try {
		const user = new Users({
			username: req.body.username,
			email: req.body.email,
			roles: [null],
			active: false,
		});

		//user.setPassword(req.body.password)

		user.save((err, user) => {
			if (err) {
				res.status(500).send({ message: err });
				return;
			}
		});
		to = await (config.config.app.ENV == 'development' ? (await config.getConfig('ADMIN_EMAIL')) : user.email)
		Email.sendTemplatedEmail('registration', to, { user: user, link: req.protocol + '://' + req.get('host') + '/complete-registry/' + user.salt })
		Email.sendTemplatedEmail('new-registration', (await config.getConfig('ADMIN_EMAIL')), { user: user })
		res.send({ message: 'OK' })
	} catch (err) {
		console.error(err);
		throw err;
	}
};

exports.resetPass = async (req, res) => {
	try {
		Users.findOne({email : req.body.email})
		.then(async user => {
			if (!user) res.status(500).send({message : res.__('USER_NOT_FOUND')})
			else {
				to = await (config.config.app.ENV == 'development' ? (await config.getConfig('ADMIN_EMAIL')) : user.email)
				Email.sendTemplatedEmail('registration', to, { user: user, link: req.protocol + '://' + req.get('host') + '/complete-registry/' + user.salt })
			}
		})
	} catch (err) {
		console.error(err)
		res.status(400).send(err.message)
		throw err;
	}
};

exports.signup = async (req, res) => {
	try {
		const user = new Users({
			username: req.body.username,
			email: req.body.email,
			roles: [null],
			active: false,
		});

		user.setPassword(req.body.password)

		user.save((err, user) => {
			if (err) {
				res.status(500).send({ message: err });
				return;
			}
		});
		to = await (config.config.app.ENV == 'development' ? (await config.config.app.CONFIGS.ADMIN_EMAIL) : user.email)
		Email.sendTemplatedEmail('registration-confirmation', to, { user: user, link: req.protocol + '://' + req.get('host') })
		Email.sendTemplatedEmail('new-registration', (await config.config.app.CONFIGS.ADMIN_EMAIL), { user: user })
		res.send({ message: 'OK' })
	} catch (err) {
		console.error(err);
		throw err;
	}
};

exports.changepassword = (req, res) => {
	try {
		const user = new Users({
			username: req.body.username,
			email: req.body.email,
			roles: ['user']
		});

		user.setPassword(req.body.password)

		user.save((err, user) => {
			if (err) {
				res.status(500).send({ message: err });
				return;
			}
		});
		res.send({ message: 'OK' })
	} catch (err) {
		console.error(err);
		throw err;
	}
};


exports.signin = (req, res) => {
	try {

		if (!req.body.username) {
			res.status(500).send({ message: res.__('ERR001') })
			return;
		}

		Users.findOne({
			username: req.body.username, active: true
		})
			.exec((err, user) => {
				if (err) {
					res.status(500).send({ message: err });
					return;
				}

				if (!user) {
					return res.status(404).send({ message: res.__('ERR002') });
				}

				if (!user.validPassword(req.body.password)) {
					return res.status(401).send({
						accessToken: null,
						message: res.__('ERR002')
					});
				}

				var token = jwt.sign({ id: user.id, username: user.username, roles: user.roles }, config.auth.JWT_SECRET, {
					expiresIn: 86400 // 24 hours
				});

				var authorities = [];

				for (let i = 0; i < user.roles.length; i++) {
					authorities.push("ROLE_" + user.roles[i].toUpperCase());
				}
				res.status(200).send({
					id: user._id,
					username: user.username,
					email: user.email,
					roles: authorities,
					accessToken: token
				});
			});
	} catch (err) {
		console.error(err);
		throw err;
	}
};