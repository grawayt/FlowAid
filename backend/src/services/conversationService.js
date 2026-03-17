const { supabase } = require('../config/supabase');

/**
 * Get or create a conversation state for a phone number.
 */
async function getConversation(whatsappNumber) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('whatsapp_number', whatsappNumber)
    .single();

  if (error && error.code === 'PGRST116') {
    // No conversation exists — create one
    const { data: newConvo, error: insertErr } = await supabase
      .from('conversations')
      .insert({ whatsapp_number: whatsappNumber, current_step: 'new' })
      .select()
      .single();

    if (insertErr) throw insertErr;
    return newConvo;
  }

  if (error) throw error;
  return data;
}

/**
 * Update conversation state and temp data.
 */
async function updateConversation(whatsappNumber, updates) {
  const { error } = await supabase
    .from('conversations')
    .update({ ...updates, last_message_at: new Date().toISOString() })
    .eq('whatsapp_number', whatsappNumber);

  if (error) throw error;
}

/**
 * Get the school record linked to a phone number.
 */
async function getSchool(whatsappNumber) {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('whatsapp_number', whatsappNumber)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data;
}

module.exports = { getConversation, updateConversation, getSchool };
