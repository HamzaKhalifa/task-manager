const sgMail = require('@sendgrid/mail');

const API_KEY = process.env.SEND_GRID_API_KEY;

sgMail.setApiKey(API_KEY);

const sendWelcomeEmail = async (email, name) => {
  const msg = {
    to: email,
    from: 'hamza.khalifa@esprit.tn',
    subject: 'Thanks for joining in!',
    text: `Welcome to the app ${name}. Let me know how you get along with the app.`,
    // html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  };
  await sgMail.send(msg);
}

const sendCancelEmail = async (email, name) => {
  const msg = {
    to: email, 
    from: 'hamza.khalifa@esprit.tn',
    subject: 'Cancellation',
    text: 'Goodbye! Is there anything we could have done to keep you on baord? We hope we\'ll hear of you again.'
  }
  await sgMail.send(msg);
}

module.exports = { sendWelcomeEmail, sendCancelEmail };
