# Email-NotifyTG-Worker

Email Worker that sends you notifications on Telegram once emails are received.

## Installation
1. Fork the repository
2. Set up the necessary environment variables in `wrangler.toml`:
   * `TOKEN`: Telegram bot token (get it from BotFather)
   * `CHATID`: Telegram chat ID where you want to receive notifications
   * `FMAILID`: Email address where you want to forward received emails (verified on cf)
3. Set up the necessary environment variables secrets in `Settings`:
   * `CLOUDFLARE_TOKEN`: Generate from cloudflare account
4. Run `Deploy to Cloudflare Workers`action

## Usage
Once the app is running, it will listen for incoming messages on Telegram and automatically forward any received emails to the specified email address. Additionally, it will send a notification message to the specified Telegram chat with a link to the email content on Spacebin.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
