const express = require('express');
const router = express.Router();
const { handleIncomingMessage } = require('../services/messageHandler');
const { sendWhatsApp } = require('../config/twilio');

/**
 * POST /api/whatsapp/webhook
 * Twilio sends a POST here every time a WhatsApp message arrives.
 * We process it and reply.
 */
router.post('/webhook', async (req, res) => {
  try {
    const from = req.body.From?.replace('whatsapp:', ''); // E.164 format
    const body = req.body.Body || '';

    if (!from) {
      return res.status(400).send('Missing sender');
    }

    console.log(`[WhatsApp] From: ${from} | Message: ${body}`);

    const reply = await handleIncomingMessage(from, body);

    // Send reply via Twilio
    await sendWhatsApp(from, reply);

    // Twilio expects a 200 with empty TwiML or just 200 OK
    res.status(200).send('<Response></Response>');
  } catch (err) {
    console.error('[WhatsApp] Error processing message:', err);
    res.status(500).send('Internal error');
  }
});

/**
 * GET /api/whatsapp/webhook
 * Twilio may send a GET for verification during setup.
 */
router.get('/webhook', (req, res) => {
  res.status(200).send('FlowAid WhatsApp webhook is live');
});

module.exports = router;
