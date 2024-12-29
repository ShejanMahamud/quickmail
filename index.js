const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const winston = require('winston');

// Logger Initialization
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'bot.log' }),
  ],
});

// Load environment variables
dotenv.config();

// Replace with your Telegram bot token
const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Base URL for the temporary email API
const API_BASE_URL = 'https://www.1secmail.com/api/v1/';

let userSelectedDomain = {};

// Bot start handler
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const keyboard = [
    [
      { text: 'Generate', callback_data: '/generate' },
      { text: 'Domains', callback_data: '/domains' },
    ],
    [
      { text: 'Check', callback_data: '/check' },
      { text: 'Read', callback_data: '/read' },
    ],
    [
      { text: 'Download', callback_data: '/download' },
    ]
  ];

  bot.sendMessage(chatId, `Welcome to QuickMail Bot!\n\nHere are some things you can do:\n` +
  `• Generate a random temporary email for your needs\n` +
  `• Get a list of active domains and choose one for your email\n` +
  `• Check your mailbox by providing the email address\n` +
  `• Read an email by providing the email address and message ID\n` +
  `• Download an attachment by providing the email, message ID, and filename`, {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
});

// Handle callback queries (button presses)
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  // Match the command with the appropriate function
  if (data === '/generate') {
    await generateEmail(chatId);
  } else if (data === '/domains') {
    await getDomains(chatId);
  } else if (data === '/check') {
    bot.sendMessage(chatId, 'Send your email address to check your mailbox. Example: /check username@domain');
  } else if (data === '/read') {
    bot.sendMessage(chatId, 'Send your email and message ID to read an email. Example: /read username@domain message_id');
  } else if (data === '/download') {
    bot.sendMessage(chatId, 'Send email, message ID, and filename to download an attachment. Example: /download username@domain message_id filename');
  }
});

// Handle written commands directly (for commands like /generate, /check, /read, etc.)
bot.onText(/\/(generate|domains|check|read|download)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const command = match[1]; // Get the command (generate, domains, check, etc.)

  if (command === 'generate') {
    await generateEmail(chatId);
  } else if (command === 'domains') {
    await getDomains(chatId);
  } else if (command === 'check') {
    bot.sendMessage(chatId, 'Send your email address to check your mailbox. Example: /check username@domain');
  } else if (command === 'read') {
    bot.sendMessage(chatId, 'Send your email and message ID to read an email. Example: /read username@domain message_id');
  } else if (command === 'download') {
    bot.sendMessage(chatId, 'Send email, message ID, and filename to download an attachment. Example: /download username@domain message_id filename');
  }
});

// Generate email
async function generateEmail(chatId) {
  try {
    let email;
    if (userSelectedDomain[chatId]) {
      const domain = userSelectedDomain[chatId];
      const username = Math.random().toString(36).substring(2, 12);
      email = `${username}@${domain}`;
    } else {
      const response = await axios.get(`${API_BASE_URL}?action=genRandomMailbox&count=1`);
      email = response.data[0];
    }

    // Formatting message
    const message = `
      <b>Email Generated:</b>
      <code>${email}</code>

      <i>Your temporary email is ready to use!</i>
    `;

    bot.sendMessage(chatId, message, {
      parse_mode: 'HTML',
    });
  } catch (error) {
    logger.error(`Error in /generate: ${error.message}`);
    bot.sendMessage(chatId, 'Failed to generate an email. Please try again later.');
  }
}

// Get the list of active domains and allow the user to choose one
async function getDomains(chatId) {
  try {
    const response = await axios.get(`${API_BASE_URL}?action=getDomainList`);
    const domains = response.data;
    const domainList = domains.map((domain, index) => `${index + 1}. ${domain}`).join('\n');

    bot.sendMessage(chatId, `Active domains:\n${domainList}\n\nReply with /select <number> to choose a domain.`);

    bot.once('message', (reply) => {
      const selected = parseInt(reply.text.split(' ')[1]);

      if (selected > 0 && selected <= domains.length) {
        userSelectedDomain[chatId] = domains[selected - 1];
        bot.sendMessage(chatId, `You selected: ${domains[selected - 1]}`);
      } else {
        bot.sendMessage(chatId, 'Invalid selection. Please try again.');
      }
    });
  } catch (error) {
    logger.error(`Error in /domains: ${error.message}`);
    bot.sendMessage(chatId, 'Failed to fetch domains. Please try again later.');
  }
}

// Check mailbox
bot.onText(/\/check (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const email = match[1];
  const [login, domain] = email.split('@');

  if (!login || !domain) {
    bot.sendMessage(chatId, 'Invalid email format. Use: /check username@domain');
    return;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}?action=getMessages&login=${login}&domain=${domain}`);
    const messages = response.data;

    if (messages.length === 0) {
      bot.sendMessage(chatId, 'No messages found.');
    } else {
      const messageList = messages.map(m => `ID: ${m.id}\nFrom: ${m.from}\nSubject: ${m.subject}\nDate: ${m.date}`).join('\n\n');
      bot.sendMessage(chatId, `Messages:\n\n${messageList}`);
    }
  } catch (error) {
    logger.error(`Error in /check: ${error.message}`);
    bot.sendMessage(chatId, 'Failed to fetch messages. Please try again later.');
  }
});

// Read an email
bot.onText(/\/read (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const args = match[1].split(' ');

  if (args.length < 2) {
    bot.sendMessage(chatId, 'Usage: /read username@domain message_id');
    return;
  }

  const [email, messageId] = args;
  const [login, domain] = email.split('@');

  try {
    const response = await axios.get(`${API_BASE_URL}?action=readMessage&login=${login}&domain=${domain}&id=${messageId}`);
    const { from, subject, date, body, attachments } = response.data;

    let messageDetails = `From: ${from}\nSubject: ${subject}\nDate: ${date}\n\nBody:\n${body}`;

    if (attachments.length > 0) {
      const attachmentList = attachments.map(a => `Filename: ${a.filename}, Size: ${a.size} bytes`).join('\n');
      messageDetails += `\n\nAttachments:\n${attachmentList}`;
    }

    bot.sendMessage(chatId, messageDetails);
  } catch (error) {
    logger.error(`Error in /read: ${error.message}`);
    bot.sendMessage(chatId, 'Failed to fetch the email. Please try again later.');
  }
});

// Download an attachment
bot.onText(/\/download (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const args = match[1].split(' ');

  if (args.length < 3) {
    bot.sendMessage(chatId, 'Usage: /download username@domain message_id filename');
    return;
  }

  const [email, messageId, filename] = args;
  const [login, domain] = email.split('@');

  try {
    const response = await axios({
      url: `${API_BASE_URL}?action=download&login=${login}&domain=${domain}&id=${messageId}&file=${filename}`,
      method: 'GET',
      responseType: 'stream',
    });

    const filePath = path.resolve(__dirname, filename);
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', () => {
      bot.sendDocument(chatId, filePath).then(() => fs.unlinkSync(filePath));
    });
    writer.on('error', () => {
      bot.sendMessage(chatId, 'Failed to download the attachment.');
    });
  } catch (error) {
    logger.error(`Error in /download: ${error.message}`);
    bot.sendMessage(chatId, 'Failed to download the attachment. Please try again later.');
  }
});

// Polling error handler
bot.on('polling_error', (error) => {
  logger.error(`Polling error: ${error.message}`);
});

// Example of logging
logger.info('Bot started');
