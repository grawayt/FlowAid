const { supabase } = require('../config/supabase');
const { getConversation, updateConversation, getSchool } = require('./conversationService');
const MESSAGES = require('../constants/messages');

/**
 * Resolve a message string from the MESSAGES object, applying language preference.
 * Handles both static strings and functions.
 */
function msg(key, lang = 'EN', ...args) {
  const entry = MESSAGES[key];
  if (!entry) return '';
  const localized = entry[lang] || entry['EN'];
  if (typeof localized === 'function') return localized(...args);
  return localized;
}

/**
 * Main message handler — processes an incoming WhatsApp message
 * and returns the reply text.
 */
async function handleIncomingMessage(from, body) {
  const text = body.trim();
  const upper = text.toUpperCase();
  const convo = await getConversation(from);

  // Global commands available at any point
  if (upper === 'HELP' || upper === 'MSAADA') {
    const school = await getSchool(from);
    const lang = school?.language_preference || 'EN';
    return msg('HELP', lang);
  }

  if (upper === 'STOP' || upper === 'SIMAMA') {
    await updateConversation(from, { opted_out: true });
    const school = await getSchool(from);
    const lang = school?.language_preference || 'EN';
    return msg('STOP_CONFIRMED', lang);
  }

  // Route based on conversation state
  switch (convo.current_step) {
    case 'new':
      return handleNew(from, convo);

    case 'awaiting_language':
      return handleLanguageChoice(from, text, convo);

    case 'awaiting_school_name':
      return handleSchoolName(from, text, convo);

    case 'awaiting_county':
      return handleCounty(from, text, convo);

    case 'awaiting_student_count':
      return handleStudentCount(from, text, convo);

    case 'awaiting_head_teacher_name':
      return handleHeadTeacherName(from, text, convo);

    case 'registered':
      return handleRegisteredUser(from, text, upper, convo);

    case 'awaiting_urgency':
      return handleUrgency(from, text, convo);

    case 'awaiting_quantity':
      return handleQuantity(from, text, convo);

    default:
      return handleRegisteredUser(from, text, upper, convo);
  }
}

// ── Registration Flow ──────────────────────────────────────

async function handleNew(from, convo) {
  await updateConversation(from, { current_step: 'awaiting_language' });
  return MESSAGES.WELCOME.EN; // Always show in both languages first
}

async function handleLanguageChoice(from, text, convo) {
  const lang = text === '2' ? 'SW' : 'EN';
  await updateConversation(from, {
    current_step: 'awaiting_school_name',
    temp_data: { ...convo.temp_data, language: lang },
  });
  return msg('ASK_SCHOOL_NAME', lang);
}

async function handleSchoolName(from, text, convo) {
  const lang = convo.temp_data?.language || 'EN';
  await updateConversation(from, {
    current_step: 'awaiting_county',
    temp_data: { ...convo.temp_data, school_name: text },
  });
  return msg('ASK_COUNTY', lang, text);
}

async function handleCounty(from, text, convo) {
  const lang = convo.temp_data?.language || 'EN';
  await updateConversation(from, {
    current_step: 'awaiting_student_count',
    temp_data: { ...convo.temp_data, county: text },
  });
  return msg('ASK_STUDENT_COUNT', lang);
}

async function handleStudentCount(from, text, convo) {
  const count = parseInt(text, 10);
  if (isNaN(count) || count <= 0) {
    const lang = convo.temp_data?.language || 'EN';
    return lang === 'SW'
      ? 'Tafadhali ingiza nambari halali.'
      : 'Please enter a valid number.';
  }

  const lang = convo.temp_data?.language || 'EN';
  await updateConversation(from, {
    current_step: 'awaiting_head_teacher_name',
    temp_data: { ...convo.temp_data, student_population: count },
  });
  return msg('ASK_HEAD_TEACHER_NAME', lang);
}

async function handleHeadTeacherName(from, text, convo) {
  const lang = convo.temp_data?.language || 'EN';
  const data = convo.temp_data || {};

  // Create school record
  const { error } = await supabase.from('schools').insert({
    whatsapp_number: from,
    name: data.school_name,
    county: data.county,
    head_teacher_name: text,
    student_population: data.student_population,
    language_preference: lang,
  });

  if (error) {
    console.error('Error creating school:', error);
    return lang === 'SW'
      ? 'Samahani, kulikuwa na tatizo. Tafadhali jaribu tena.'
      : 'Sorry, there was an error. Please try again.';
  }

  await updateConversation(from, {
    current_step: 'registered',
    temp_data: {},
  });

  return msg('REGISTRATION_COMPLETE', lang, text);
}

// ── Registered User Commands ───────────────────────────────

async function handleRegisteredUser(from, text, upper, convo) {
  const school = await getSchool(from);
  const lang = school?.language_preference || 'EN';

  // NEED / HITAJI command
  if (upper === 'NEED' || upper === 'HITAJI') {
    // Check for existing open need
    const { data: openNeeds } = await supabase
      .from('needs')
      .select('reference_code')
      .eq('school_id', school.id)
      .eq('status', 'open')
      .limit(1);

    if (openNeeds && openNeeds.length > 0) {
      return msg('NEED_ALREADY_OPEN', lang, openNeeds[0].reference_code);
    }

    await updateConversation(from, {
      current_step: 'awaiting_urgency',
      temp_data: { school_id: school.id },
    });
    return msg('ASK_URGENCY', lang);
  }

  // STATUS command
  if (upper === 'STATUS') {
    return handleStatus(school, lang);
  }

  // RECEIVED command
  if (upper.startsWith('RECEIVED')) {
    return handleReceived(from, text, school, lang);
  }

  return msg('UNKNOWN', lang);
}

// ── Need Posting Flow ──────────────────────────────────────

async function handleUrgency(from, text, convo) {
  const urgency = parseInt(text, 10);
  const lang = convo.temp_data?.language || (await getSchool(from))?.language_preference || 'EN';

  if (![1, 2, 3].includes(urgency)) {
    return lang === 'SW'
      ? 'Tafadhali jibu 1, 2, au 3.'
      : 'Please reply 1, 2, or 3.';
  }

  await updateConversation(from, {
    current_step: 'awaiting_quantity',
    temp_data: { ...convo.temp_data, urgency },
  });
  return msg('ASK_QUANTITY', lang);
}

async function handleQuantity(from, text, convo) {
  const quantity = parseInt(text, 10);
  const school = await getSchool(from);
  const lang = school?.language_preference || 'EN';

  if (isNaN(quantity) || quantity <= 0) {
    return lang === 'SW'
      ? 'Tafadhali ingiza nambari halali.'
      : 'Please enter a valid number.';
  }

  // Create the need
  const { data: need, error } = await supabase
    .from('needs')
    .insert({
      school_id: convo.temp_data.school_id || school.id,
      urgency: convo.temp_data.urgency,
      approximate_quantity: quantity,
    })
    .select('reference_code')
    .single();

  if (error) {
    console.error('Error creating need:', error);
    return lang === 'SW'
      ? 'Samahani, kulikuwa na tatizo. Tafadhali jaribu tena.'
      : 'Sorry, there was an error. Please try again.';
  }

  // Check for suspicious frequency (more than 1 need in past 7 days)
  const { data: recentNeeds } = await supabase
    .from('needs')
    .select('id')
    .eq('school_id', school.id)
    .gte('posted_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (recentNeeds && recentNeeds.length > 1) {
    await supabase
      .from('schools')
      .update({ flagged: true })
      .eq('id', school.id);
  }

  await updateConversation(from, {
    current_step: 'registered',
    temp_data: {},
  });

  return msg('NEED_POSTED', lang, need.reference_code);
}

// ── Status & Delivery ──────────────────────────────────────

async function handleStatus(school, lang) {
  const { data: needs } = await supabase
    .from('needs')
    .select('*, claimed_org:organisations!needs_claimed_by_fkey(name)')
    .eq('school_id', school.id)
    .order('posted_at', { ascending: false })
    .limit(5);

  if (!needs || needs.length === 0) {
    const statusMsgs = MESSAGES.STATUS[lang] || MESSAGES.STATUS['EN'];
    return statusMsgs.NO_NEEDS;
  }

  const statusMsgs = MESSAGES.STATUS[lang] || MESSAGES.STATUS['EN'];
  const lines = needs.map((n) => {
    const daysSince = Math.ceil((Date.now() - new Date(n.posted_at).getTime()) / 86400000);
    if (n.status === 'open') {
      return statusMsgs.OPEN(n.reference_code, n.approximate_quantity, daysSince);
    }
    if (n.status === 'claimed') {
      const orgName = n.claimed_org?.name || 'an organisation';
      return statusMsgs.CLAIMED(n.reference_code, orgName);
    }
    if (n.status === 'delivered') {
      return statusMsgs.DELIVERED(n.reference_code);
    }
    return '';
  });

  return lines.filter(Boolean).join('\n\n');
}

async function handleReceived(from, text, school, lang) {
  // Parse quantity from "RECEIVED 180"
  const parts = text.split(/\s+/);
  const quantity = parts.length > 1 ? parseInt(parts[1], 10) : null;

  // Find the most recent claimed need for this school
  const { data: claimedNeed } = await supabase
    .from('needs')
    .select('*, claimed_org:organisations!needs_claimed_by_fkey(name)')
    .eq('school_id', school.id)
    .eq('status', 'claimed')
    .order('claimed_at', { ascending: false })
    .limit(1)
    .single();

  if (!claimedNeed) {
    return msg('NO_PENDING_DELIVERY', lang);
  }

  const now = new Date().toISOString();

  // Update the need status
  await supabase
    .from('needs')
    .update({
      status: 'delivered',
      delivered_at: now,
      confirmed_by_school: true,
      confirmation_received_at: now,
    })
    .eq('id', claimedNeed.id);

  // Create/update delivery record
  const { data: delivery } = await supabase
    .from('deliveries')
    .select('id')
    .eq('need_id', claimedNeed.id)
    .single();

  if (delivery) {
    await supabase
      .from('deliveries')
      .update({
        quantity_delivered: quantity,
        confirmed: true,
        confirmation_timestamp: now,
        impact_logged: true,
      })
      .eq('id', delivery.id);
  } else {
    await supabase.from('deliveries').insert({
      need_id: claimedNeed.id,
      organisation_id: claimedNeed.claimed_by,
      school_id: school.id,
      quantity_delivered: quantity,
      confirmed: true,
      confirmation_timestamp: now,
      impact_logged: true,
    });
  }

  const orgName = claimedNeed.claimed_org?.name || 'the organisation';
  return msg('DELIVERY_CONFIRMED', lang, quantity || '(quantity not specified)', orgName);
}

module.exports = { handleIncomingMessage };
