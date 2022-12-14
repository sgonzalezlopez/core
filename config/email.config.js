const path = require('path');
const nodemailer = require('nodemailer');
const Email = require('email-templates');
const { existsSync } = require('fs');
const { getConfig } = require('./config');
const i18n = require('../i18n/i18n.config')


exports.sendTemplatedEmail = async (template, to, data) => {
  try {
    var send = getConfig('ENABLE_EMAIL_SEND')
    var preview = getConfig('ENABLE_EMAIL_PREVIEW')
  
    data.appName = i18n.__('APP_NAME')
  
    const transporter = nodemailer.createTransport({
      host: getConfig('SMTP_SERVER') || 'smtp.gmail.com',
      port: getConfig('SMTP_PORT') || 587,
      auth: {
        user: getConfig('EMAIL_ACCOUNT'),
        pass: getConfig('EMAIL_PASS'),
      },
    });
    await transporter.verify()
    console.log(`Conectado a email server ${transporter.options.host}`)
  
  
    const email = new Email({
      template : template,
      message: {
        from: getConfig('EMAIL_ACCOUNT_FROM'),
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
  
    await email.send({template : template})
  }
  catch(err) {
    console.error(err);
    throw err
  }
}