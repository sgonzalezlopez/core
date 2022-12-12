const path = require('path');
const nodemailer = require('nodemailer');
const Email = require('email-templates');
const { existsSync } = require('fs');
const { getConfig } = require('./config');
const i18n = require('../i18n/i18n.config')


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.EMAIL_ACCOUNT,
    pass: process.env.EMAIL_PASS,
  },
});
transporter.verify().then(console.log(`Conectado a email server ${transporter.host}`)).catch(console.error);


exports.sendTemplatedEmail = async (template, to, data) => {
  var send = getConfig('ENABLE_EMAIL_SEND')
  var preview = getConfig('ENABLE_EMAIL_PREVIEW')

  data.appName = i18n.__('APP_NAME')



  const email = new Email({
    template : template,
    message: {
      from: process.env.EMAIL_ACCOUNT,
      to : to
    },
    views : {
      root : existsSync(path.resolve('templates/'+ template)) ? path.resolve('templates') : path.resolve('core/templates'),
      options : {
        extension : 'ejs'
      },
      locals : data,
    },
    // uncomment below to send emails in development/test env:
    send: send,
    preview : preview,
    transport: transporter,
  });

  email.send({
    template : template
  })
  .then(() => {
    return;
  })
  .catch(console.error)
}