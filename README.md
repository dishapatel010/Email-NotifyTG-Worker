# Email-NotifyTG-Worker

Email Worker that sends you notifications on Telegram once emails are received.

## Installation
1. Fork the repository
2. Set up the necessary environment variables in `wrangler.toml`:
   * `TOKEN`: Telegram bot token (get it from BotFather)
   * `database_id`: create D1 database `emaildb` & get it's id here
   * `CFURL`: `https://example.example.workers.dev/` your cf worker url with / trailing
3. Edit `src/index.js` email addresses to their corresponding chatIds and forward email ids, and toForward status
```javascript

      const emailList = [

        { to: "example@gmail.com", chatId: 5071059420, fMailid: "example@example.com", toForward: false }, //only sends notification as its false

        { to: "example1@example.com", chatId: 5071059420, fMailid: "example3@example.com", toForward: true }, //sends & forward

        { to: "example2@example.com", chatId: 5071059420, fMailid: "example4@example.com", toForward: false },

      ];
```

4. Set up the necessary environment variables secrets in `Settings`:
   * `CLOUDFLARE_TOKEN`: Generate from cloudflare account
5. Go to D1 `emaildb` database console & execute
```sql
CREATE TABLE CFWTGW (
  id INT PRIMARY KEY,
  html TEXT
);
```
5. Run `Deploy to Cloudflare Workers`action

## Usage
Once the app is running, it will listen for incoming messages on Telegram and automatically forward any received emails to the specified email address. Additionally, it will send a notification message to the specified Telegram chat with a link to the email content on Spacebin.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Screenshot
* mails on custom domain at cloudflare
![-215288_temp](https://github.com/dishapatel010/Email-NotifyTG-Worker/assets/71930916/4cb08d6e-9e30-41ff-ae97-50f20f4cbf4d)

* mails from gmail.com
![IMG_20230515_210157_926](https://github.com/dishapatel010/Email-NotifyTG-Worker/assets/71930916/66356e42-7c34-4b9a-b9b3-c8971d5fc7e4)
