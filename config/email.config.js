const path = require('path');
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.EMAIL_ACCOUNT,
    pass: process.env.EMAIL_PASS,
  },
});
transporter.verify().then(console.log).catch(console.error);

const Email = require('email-templates')

exports.sendTemplatedEmail = (template, to, data) => {
  const email = new Email({
    template : template,
    message: {
      from: process.env.ADMIN_EMAIL,
      to : to
    },
    views : {
      root : path.resolve('core/templates'),
      options : {
        extension : 'ejs'
      },
      locals : data,
    },
    // uncomment below to send emails in development/test env:
    send: true,
    preview : false,
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