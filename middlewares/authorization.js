const Permission = require('../models/permission.model')
const jwt = require ('./auth.jwt')

module.exports.isAdmin = function isAdmin(req, res, next) {
    validateRole(req, res, next, 'admin')

}

module.exports.isRole = function isRole(role) {
    return function (req, res, next) {
        validateRole(req, res, next, role)
    }
}

function validateRole(req, res, next, profile) {
    if (!req.user) return res.redirect('/login?url=' + req.originalUrl)

    if (!Array.isArray(profile)) profile = [profile]

    profile.push('admin');

    if (req.user.roles.some(r=> profile.includes(r))) return next()
    else {
        console.log('Acceso denegado para', req.originalUrl, " al usuario ", req.user.username);
        return res.status(400).send({message : res.__('ERR005')})
    }


    // if (req.user.roles.includes('admin') || req.user.roles.includes(profile)) return next()
    // else {
    //     console.log('Acceso denegado para', req.originalUrl, " al usuario ", req.user.username);
    //     return res.status(400).send({message : res.__('ERR005')})
    // }
}

module.exports.checkPermision = function checkPermision(entity, access) {
    return function (req, res, next) {
        if (!req.user) jwt.verifyToken(req, res, next)
        
        if (!req.user) return res.status(400).send({message : res.__('ERR004')})

        if (req.user.roles.includes('admin')) return next();

        Permission.find({entity : entity, roles : {$in : req.user.roles}, $expr : { $in : [access, "$type"]}})
        // Permission.find({entity : entity, roles : {$in : req.user.roles}})
        // Permission.find({entity : entity})
        .then (items => {
            if (items.length > 0) return next();
            else {
                console.log('Acceso denegado para', req.originalUrl, " al usuario ", req.user.username);
                return res.status(400).send({message : res.__('ERR005')})
            }
        })  
    }
}

module.exports.getPermissionsForEntity = function (entity, user) {
    if (!user || !user.roles) return [];
    if (user && user.roles && user.roles.includes('admin')) return ['C', 'R', 'U', 'D'];
    return Permission.find({entity : entity.toLowerCase(), roles : {$in : user.roles}})
    .then (items => {
        var permissions = [];
        items.map(i => {
            permissions = [...permissions, ...i.type]
        })
        return permissions
    }) 

}