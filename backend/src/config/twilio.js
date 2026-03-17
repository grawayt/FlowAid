const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

if (!accountSid || !authToken) {
  console.warn('Warning: Twilio credentials not set. WhatsApp messaging will fail.');
}

const client = twilio(accountSid, authToken);

const sendWhatsApp = async (to, body) => {
  return client.messages.create({
    from: `whatsapp:${whatsappNumber}`,
    to: `whatsapp:${to}`,
    body,
  });
};

module.exports = { client, sendWhatsApp };
