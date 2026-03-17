// All user-facing text stored here for easy Swahili translation later.
// Each key has EN and SW variants.

const MESSAGES = {
  WELCOME: {
    EN: `Welcome to FlowAid 🌸
We help connect schools with sanitary pad supplies.

Reply in English or Swahili?
1 - English
2 - Kiswahili`,
    SW: `Karibu FlowAid 🌸
Tunasaidia shule kupata usambazaji wa pedi.

Jibu kwa Kiingereza au Kiswahili?
1 - English
2 - Kiswahili`,
  },

  ASK_SCHOOL_NAME: {
    EN: 'What is the name of your school?',
    SW: 'Jina la shule yako ni nini?',
  },

  ASK_COUNTY: {
    EN: (schoolName) => `Which county is ${schoolName} in?`,
    SW: (schoolName) => `${schoolName} iko katika kaunti gani?`,
  },

  ASK_STUDENT_COUNT: {
    EN: 'Approximately how many girls are enrolled?',
    SW: 'Takriban wasichana wangapi wamesajiliwa?',
  },

  ASK_HEAD_TEACHER_NAME: {
    EN: 'What is your name?',
    SW: 'Jina lako ni nani?',
  },

  REGISTRATION_COMPLETE: {
    EN: (name) => `Thank you ${name}.
Your school is now registered.

We will be in touch when supplies are available in your area.

To report that you need supplies at any time, just message us the word NEED.

To check your status, message STATUS.`,
    SW: (name) => `Asante ${name}.
Shule yako imesajiliwa sasa.

Tutawasiliana nawe vifaa vinapopatikana katika eneo lako.

Kutuma ombi la vifaa wakati wowote, tuma neno HITAJI.

Kuangalia hali yako, tuma STATUS.`,
  },

  ASK_URGENCY: {
    EN: `How urgent is your need?
1 - We are running low (have some left)
2 - We are almost out (less than 2 weeks supply)
3 - We are completely out`,
    SW: `Hali ya dharura ni ipi?
1 - Tunapungukiwa (bado tuna kiasi)
2 - Tunakaribia kuisha (chini ya wiki 2)
3 - Tumeisha kabisa`,
  },

  ASK_QUANTITY: {
    EN: 'Approximately how many pads do you need?',
    SW: 'Takriban unahitaji pedi ngapi?',
  },

  NEED_POSTED: {
    EN: (refCode) => `Thank you. Your request has been posted.
We will notify you when an organisation claims your request.

Reference number: ${refCode}`,
    SW: (refCode) => `Asante. Ombi lako limetumwa.
Tutakujulisha shirika linapochukua ombi lako.

Nambari ya kumbukumbu: ${refCode}`,
  },

  DELIVERY_INCOMING: {
    EN: (orgName, days) => `${orgName} has confirmed they are delivering supplies to your school.
Expected: within ${days} days.

Please reply RECEIVED once the delivery arrives, followed by the quantity received.

Example: RECEIVED 200`,
    SW: (orgName, days) => `${orgName} wamethibitisha wanaletea shule yako vifaa.
Inatarajiwa: ndani ya siku ${days}.

Tafadhali jibu RECEIVED vifaa vikifika, ikifuatiwa na idadi uliyopokea.

Mfano: RECEIVED 200`,
  },

  DELIVERY_CONFIRMED: {
    EN: (quantity, orgName) => `Thank you — delivery confirmed ✓
${quantity} pads received from ${orgName}.

This has been logged. Thank you for helping us track impact.`,
    SW: (quantity, orgName) => `Asante — upokeaji umethibitishwa ✓
Pedi ${quantity} zimepokelewa kutoka ${orgName}.

Hii imerekodiwa. Asante kwa kusaidia kufuatilia athari.`,
  },

  TERM_CHECKIN: {
    EN: (schoolName) => `Hello ${schoolName} — a new term is starting.
How are your sanitary pad supplies?

1 - Well stocked
2 - Running low
3 - Urgently need supplies

Reply with 1, 2 or 3.`,
    SW: (schoolName) => `Habari ${schoolName} — muhula mpya unaanza.
Hali ya pedi za usafi ikoje?

1 - Tuna vya kutosha
2 - Tunapungukiwa
3 - Tunahitaji dharura

Jibu 1, 2 au 3.`,
  },

  STATUS: {
    EN: {
      NO_NEEDS: 'You have no open requests. Message NEED to submit one.',
      OPEN: (refCode, qty, days) =>
        `Request ${refCode}: ${qty} pads — open for ${days} day(s). Waiting to be claimed.`,
      CLAIMED: (refCode, orgName) =>
        `Request ${refCode}: Claimed by ${orgName}. Delivery incoming.`,
      DELIVERED: (refCode) =>
        `Request ${refCode}: Delivered ✓`,
    },
    SW: {
      NO_NEEDS: 'Huna maombi yaliyo wazi. Tuma HITAJI kutuma ombi.',
      OPEN: (refCode, qty, days) =>
        `Ombi ${refCode}: pedi ${qty} — wazi kwa siku ${days}. Inasubiri kuchukuliwa.`,
      CLAIMED: (refCode, orgName) =>
        `Ombi ${refCode}: Limechukuliwa na ${orgName}. Upokeaji unakuja.`,
      DELIVERED: (refCode) =>
        `Ombi ${refCode}: Imepokelewa ✓`,
    },
  },

  HELP: {
    EN: `FlowAid Commands:
NEED — Report that you need supplies
STATUS — Check your current requests
RECEIVED [quantity] — Confirm a delivery
HELP — Show this message
STOP — Unsubscribe from messages`,
    SW: `Amri za FlowAid:
HITAJI — Ripoti kwamba unahitaji vifaa
STATUS — Angalia maombi yako ya sasa
RECEIVED [idadi] — Thibitisha upokeaji
HELP — Onyesha ujumbe huu
STOP — Jiondoe kwenye ujumbe`,
  },

  STOP_CONFIRMED: {
    EN: 'You have been unsubscribed. Message us anytime to re-subscribe.',
    SW: 'Umejiondoa. Tutumie ujumbe wakati wowote kujiandikisha tena.',
  },

  UNKNOWN: {
    EN: 'Sorry, I didn\'t understand that. Reply HELP for a list of commands.',
    SW: 'Samahani, sijaelewa. Jibu HELP kupata orodha ya amri.',
  },

  NEED_ALREADY_OPEN: {
    EN: (refCode) => `You already have an open request (${refCode}). Please wait for it to be fulfilled or message STATUS to check on it.`,
    SW: (refCode) => `Una ombi lililowazi tayari (${refCode}). Tafadhali subiri litimizwe au tuma STATUS kuliangalia.`,
  },

  NO_PENDING_DELIVERY: {
    EN: 'You don\'t have a pending delivery to confirm right now.',
    SW: 'Huna upokeaji unaosubiri kuthibitishwa sasa hivi.',
  },
};

module.exports = MESSAGES;
