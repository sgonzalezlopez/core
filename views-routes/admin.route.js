const express = require('express');
const router = express.Router();
const actions = require('./actions')

const viewRoute = 'admin/';

router.get('/', function (req, res, next) {

    if (!req.isAuthenticated()) return res.redirect("/login")
    actions.renderWithApps(req, res, next, 'subindex', {parentApp : '/' + viewRoute})
});

router.get('/:page', function (req, res, next) {
    var page = req.params.page;
    actions.renderWithApps(req, res, next, viewRoute + page, null)
});

router.get('/:page/:id', function (req, res, next) {
    var page = req.params.page;
    actions.renderWithApps(req, res, next, viewRoute + page, null, req.params.id)
});


module.exports = router;