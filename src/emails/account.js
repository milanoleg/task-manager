const sgMail = require('@sendgrid/mail');

const fromEmail = 'kanal.oleg@gmail.com';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  const message = {
    to: email,
    from: fromEmail,
    subject: `Welcome to the Task App`,
    text: 'Thanks for joining the Task App!',
    html: `<h3>Hello, ${name}! Thanks for joining the Task App!</h3>`,
  };

  sgMail.send(message);
};

module.exports = {
  sendWelcomeEmail,
};