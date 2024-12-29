# QuickMail Bot

QuickMail Bot is a Telegram bot that provides temporary email services. It allows users to generate temporary emails, check their inbox, read emails, and download attachments. Built using Node.js, this bot utilizes the `node-telegram-bot-api` library for interacting with Telegram's API, and `axios` for making HTTP requests to a temporary email service API.

## Features

- **Generate Email**: Generate a random temporary email address.
- **Select Domain**: Choose a custom domain for your temporary email.
- **Check Mailbox**: Check for emails in the mailbox by providing the email address.
- **Read Emails**: Read an email by providing the email address and message ID.
- **Download Attachments**: Download attachments from an email by providing the email address, message ID, and filename.

## Prerequisites

To run this bot locally, ensure you have the following installed:

- Node.js (version 14 or higher)
- NPM or Yarn (for package management)
- Telegram Bot Token (from [@BotFather](https://core.telegram.org/bots#botfather))

## Installation

1. Clone this repository to your local machine:

   ```bash
   git clone https://github.com/yourusername/quickmail-bot.git
   cd quickmail-bot
   ```


2. Install the dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:

   ```env
   BOT_TOKEN=your-telegram-bot-token
   ```

   Replace `your-telegram-bot-token` with the token you received from [@BotFather](https://core.telegram.org/bots#botfather).

4. Start the bot:

   ```bash
   node bot.js
   ```

   This will start the bot, and it will listen for incoming messages and commands.

## Commands

- `/start` - Displays the welcome message and the main menu with options.
- `/generate` - Generates a random temporary email address.
- `/domains` - Shows a list of available domains and allows users to choose one.
- `/check <email>` - Check the inbox for a specific email address.
- `/read <email> <message_id>` - Read the message with the given ID for a specific email address.
- `/download <email> <message_id> <filename>` - Download an attachment from an email.

## Logging

The bot uses `winston` for logging errors and activity. Logs are saved to `bot.log` and are also displayed in the console.

## Contributing

Contributions are welcome! If you would like to contribute, please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api) for Telegram Bot integration.
- [axios](https://github.com/axios/axios) for making HTTP requests.
- [winston](https://github.com/winstonjs/winston) for logging.

