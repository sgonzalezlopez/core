const express = require('express');
const router = express.Router();
const viewRoute = 'admin/';

router.get('/', function (req, res, next) {

    if (!req.isAuthenticated()) return res.redirect("/login")

    var data = {};
    data.actions = [
        {name : 'users', href: '/admin/user-list'},
        {name : 'applications', href: '/admin/app-list'},
    ]

    require('./routes').renderWithApps(req, res, next, viewRoute + 'index', data)
});

router.get('/:page', function (req, res, next) {
    var page = req.params.page;
    require('./routes').renderWithApps(req, res, next, viewRoute + page, null)
});

router.get('/:page/:id', function (req, res, next) {
    var page = req.params.page;
    require('./routes').renderWithApps(req, res, next, viewRoute + page, null, req.params.id)
});


module.exports = router;