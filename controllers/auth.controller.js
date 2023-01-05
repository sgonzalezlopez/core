const config = require("../config/config");
const Users = require("../models/user.model");
const express = require('express')

var jwt = require("jsonwebtoken");
const Email = require("../config/email.config");
const apps = require('../controllers/app.controller')
const passport = require('passport');

// Registro desde la Web
// exports.register = async function (err, req, res, next) {
// 	if (err) return res.render('register', { layout: false, twoSteps: twoSteps, username : req.body.username, email : req.body.email, error: err })
// }
exports.register = async function (req, res, next) {
	try {
		twoSteps = config.getFeature('TWO_STEPS_REGISTRY')
		if (req.error) {
			error = req.error;
			delete req.error;
			return res.render('register', { layout: false, twoSteps: twoSteps, username: req.body.username, email: req.body.email, error: error })
		}

		const user = new Users({
			username: req.body.username,
			email: req.body.email,
			roles: ['user'],
			active: !twoSteps,
		});

		if (!twoSteps) user.setPassword(req.body.password)

		user.save((err, user) => {
			if (err) return next(err, null)
		});

		to = (config.config.app.ENV == 'development' ? (config.getConfig('ADMIN_EMAIL')) : user.email)

		if (twoSteps) await Email.sendTemplatedEmail('registration-twosteps', to, { user: user, link: req.protocol + '://' + req.get('host') + '/complete-registry/' + user.salt })
		else await Email.sendTemplatedEmail('registration-completed', to, { user: user, link: req.protocol + '://' + req.get('host') + '/login' })
		await Email.sendTemplatedEmail('new-registration', (config.getConfig('ADMIN_EMAIL')), { user: user })
		// res.render('login', { layout: false, message : res.__('Registration complete. You can now access.') })
		if (!twoSteps) q = 'registerSucceed'
		else q = 'registerPending'
		res.redirect('/login?' + q)
	} catch (err) {
		console.error(err);
		throw err;
	}
};

exports.completeRegistration = async function (req, res, next) {
	try {
		twoSteps = config.getFeature('TWO_STEPS_REGISTRY')
		if (req.error) {
			error = req.error;
			delete req.error;
			return res.render('complete-registry', { layout: false, token: req.body.token, error: error })
		}

		token = req.params.token || req.body.token
		user = await Users.findOne({ salt: token })
		if (!user) return res.redirect('/login?errorNotUser')

		await user.setPassword(req.body.password);
		user.active = true
		await user.save();

		req.body.username = user.username;
		passport.authenticate('local', (err, user, info) => {
			req.login(user, (err) => {
				res.redirect(req.query.url || "/")
			})
		})(req, res, next);

	}
	catch (err) {
		console.error(err);
		next(err, null)
	}
}

exports.register2 = async (req, res) => {
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
		to = (config.config.app.ENV == 'development' ? config.getConfig('ADMIN_EMAIL') : user.email)
		try {
			await Email.sendTemplatedEmail('registration', to, { user: user, link: req.protocol + '://' + req.get('host') + '/complete-registry/' + user.salt })
			await Email.sendTemplatedEmail('new-registration', config.getConfig('ADMIN_EMAIL'), { user: user })
			res.send({ message: 'OK' })
		}
		catch (err) {
			res.status(500).send({ message: res.__('An error ocurred. Contact your system administrator.') })
		}
	} catch (err) {
		console.error(err);
		res.status(400).send(err.message)
		throw err;
	}
};

exports.resetPass = async (req, res) => {
	try {
		Users.findOne({ email: req.body.email })
			.then(async user => {
				if (!user) res.status(500).send({ message: res.__('USER_NOT_FOUND') })
				else {
					to = await (config.config.app.ENV == 'development' ? config.getConfig('ADMIN_EMAIL') : user.email)
					try {
						await Email.sendTemplatedEmail('password-reset', to, { user: user, link: req.protocol + '://' + req.get('host') + '/complete-registry/' + user.salt })
						res.send({ message: res.__('Email sent with link to reset password') })
					}
					catch (err) {
						res.status(500).send({ message: res.__('An error ocurred. Contact your system administrator.') })
					}
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

		await user.setPassword(req.body.password)

		user.save((err, user) => {
			if (err) {
				res.status(500).send({ message: err });
				return;
			}
		});
		to = (config.config.app.ENV == 'development' ? config.getConfig('ADMIN_EMAIL') : user.email)
		await Email.sendTemplatedEmail('registration-confirmation', to, { user: user, link: req.protocol + '://' + req.get('host') })
		await Email.sendTemplatedEmail('new-registration', config.getConfig('ADMIN_EMAIL'), { user: user })
		res.send({ message: 'OK' })
	} catch (err) {
		console.error(err);
		throw err;
	}
};

exports.setPassword = async (req, res) => {
	try {
		Users.findById(req.params.id)
		.then(async user => {
			await user.setPassword(req.body.password)
			user.save((err, user) => {
				if (err) {
					res.status(500).send({ message: err });
					return;
				}
				res.send({ message: 'OK' })
			});
		})
		.catch(err => {
			console.error(err);
			res.status(400).send()
		})
	} catch (err) {
		console.error(err);
		throw err;
	}
};
exports.changepassword = async (req, res) => {
	try {
		const user = new Users({
			username: req.body.username,
			email: req.body.email,
			roles: ['user']
		});

		await user.setPassword(req.body.password)

		user.save((err, user) => {
			if (err) {
				res.status(500).send({ message: err });
				return;
			}
			res.send({ message: 'OK' })
		});
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
			.exec(async (err, user) => {
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

				var token = jwt.sign({ id: user.id, username: user.username, roles: user.roles }, config.config.auth.JWT_SECRET, {
					expiresIn: 86400 // 24 hours
				});

				user.lastLogin = new Date()
				user.save();

				var authorities = [];

				for (let i = 0; i < user.roles.length; i++) {
					authorities.push("ROLE_" + user.roles[i].toUpperCase());
				}
				req.session.apps = await apps.getApplications(req.user);
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