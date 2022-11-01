const path = require('path');
const nodemailer = require('nodemailer');
const Email = require('email-templates');
const { existsSync } = require('fs');
const { getConfig } = require('./config');


const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.EMAIL_ACCOUNT,
    pass: process.env.EMAIL_PASS,
  },
});
transporter.verify().then(console.log('Conectado a email server')).catch(console.error);


exports.sendTemplatedEmail = async (template, to, data) => {
  var send = await getConfig('ENABLE_EMAIL_SEND')
  var preview = await getConfig('ENABLE_EMAIL_PREVIEW')

  const email = new Email({
    template : template,
    message: {
      from: process.env.ADMIN_EMAIL,
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