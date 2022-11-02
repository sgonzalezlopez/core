const Users = require("../models/user.model");
const Apps = require("../models/app.model");
const { initializeDB } = require("./db.config");

const applications = [
    {name: 'apps', type: ['action'], roles:['admin'], level:-1, link:'/admin/app-list', icon:'mdi mdi-apps'},
    {name: 'users', type: ['action'], roles:['admin'], level:-1, link:'/admin/user-list', icon:'fas fa-users'},
    {name: 'configs', type: ['action'], roles:['admin'], level:-1, link:'/admin/config-list', icon:'fas fa-users'},
    {name: 'features', type: ['action'], roles:['admin'], level:-1, link:'/admin/feature-list', icon:'fas fa-users'},
]



module.exports =  function initalize () {
    initializeDB()

    applications.forEach(a => {
        Apps.findOne({name : a.name})
        .then(async app => {
            if (!app) {
                await Apps.create(a)
            }
        })
    })
}