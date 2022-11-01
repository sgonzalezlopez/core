module.exports.isAdmin = function isAdmin(req, res, next) {
    validateRole(req, res, next, 'admin')

}

module.exports.isRole = function isRole(role) {
    return function (req, res, next) {
        validateRole(req, res, next, role)
    }
}

function validateRole(req, res, next, profile) {
    if (!req.user) return res.status(400).send({message : res.__('ERR004')})


    if (req.user.roles.includes('admin') || req.user.roles.includes(profile)) return next()
    else return res.status(400).send({message : res.__('ERR005')})
}