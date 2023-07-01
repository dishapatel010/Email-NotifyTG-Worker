/* based on https://github.com/edevil/email_worker_parser/blob/0c3938d537ce134bc1a8a9f3b301badcb1c5ead0/src/index.js
notification to Telegram by @dishapatel010
*/

const PostalMime = require('postal-mime');

// Define a list of email addresses and their corresponding chatIds and forward email ids
      const emailList = [
        { to: "example@gmail.com", chatId: 5071059420, fMailid: "example@example.com", toForward: false }, //only sends notification as its false
        { to: "example1@example.com", chatId: 5071059420, fMailid: "example3@example.com", toForward: true }, //sends & forward
        { to: "example2@example.com", chatId: 5071059420, fMailid: "example4@example.com", toForward: false },
      ];

async function streamToArrayBuffer(stream, streamSize) {
  let result = new Uint8Array(streamSize);
  let bytesRead = 0;
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    result.set(value, bytesRead);
    bytesRead += value.length;
  }
  return result;
}
function emailToChatIdMap(emailList) {
  // Construct an object that maps email addresses to their corresponding chatIds and forward email ids, and toForward status
  const map = {};
  emailList.forEach(({ to, chatId, fMailid, toForward }) => {
    map[to] = { chatId, fMailid, toForward };
  });
  return map;
}

export default {
  async fetch(req, env, context) {
    try {
      const url = new URL(req.url)
      const id = url.pathname.split('/')[1] // get the id from the URL
      const data = await env.DB.prepare(`SELECT html FROM CFWTGW WHERE id = ?`).bind(id).raw(); // prepare SQL statement with bound parameter
      if (data.length === 0) {
        throw new Error('No data found');
      }
      const htmlContent = data[0];
      const r = new Response(htmlContent, {
        headers: { 'Content-Type': 'text/html' },
      });
      return r;
    } catch (e) {
      console.error(e);
      return new Response(`An error occurred: ${e.message}`, { status: 500 });
    }
  },
  
  async email(message, env, ctx) {
    // Define the Telegram API URL
    const tgToken = env.TOKEN;
    const telegramUrl = `https://api.telegram.org/bot${tgToken}/sendMessage`;
    const cfurl = env.CFURL;
    try {
      // Extract the email data
      const from = message.headers.get("from");
      const to = message.headers.get("to");
      const subject = message.headers.get("subject") || "[No Subject]";
      const date = message.headers.get("date");
      // Parse the raw email message using PostalMime
      const rawEmail = await streamToArrayBuffer(
        message.raw,
        message.rawSize
      );
      const parser = new PostalMime.default();
      const parsedEmail = await parser.parse(rawEmail);
      // Construct the notification message
      const attachmentCount = parsedEmail.attachments.length;
      let notificationMessage = `📧 New email received\n\nFrom: ${from}\nTo: ${to}\nDate: ${date}\nSubject: ${subject}\n\n`;
      if (parsedEmail.text) {
        const maxWords = 50; // determine the maximum number of words to display
        const words = parsedEmail.text.split(" ");
        const truncatedText = words.slice(0, maxWords).join(" ");
        notificationMessage += `Text version: ${truncatedText}\n...\n`; // add the truncated text to the message
      }
      if (attachmentCount == 0) {
        notificationMessage += "📎 No attachments";
      } else if (attachmentCount == 1) {
        notificationMessage += "📎 1 attachment";
      } else {
        notificationMessage += `📎 ${attachmentCount} attachments`;
      }
      // Map the email addresses to their corresponding chatIds and forward email ids
      const emailToChatId = emailToChatIdMap(emailList);
      // Find the chatId and fMailid for the current email based on its "to" address
      const { chatId, fMailid, toForward } = emailToChatId[to] || {};
      if (!chatId || !fMailid) {
        console.log(`No matching chatId or fMailid found for email to ${to}`);
        return;
      }
      const c = new Date().getTime();
     if (parsedEmail.html !== undefined) {
  const dhtml = parsedEmail.html;
  try {
    if (c && dhtml && cfurl) { // Check that both values are defined
      await env.DB.prepare('INSERT INTO CFWTGW (id, html) VALUES (?, ?)').bind(c, dhtml).run();
    } else {
      console.log('Error: One or more values are undefined');
    }
  } catch (e) {
    console.log({
      message: e.message,
      cause: e.cause ? e.cause.message : null
    });
    // Handle the error as needed
  }
}
      // Paste the raw message and html version into Spacebin
      const spacebinUrl = "https://spaceb.in/api/v1/documents/";
      const spacebinData = {
        title: `Email - ${subject}` || "none",
        from: from,
        to: to,
        date: date,
        text: parsedEmail.text,
        html: parsedEmail.html,
        count: attachmentCount,
      };
      
      const mypaste = `${spacebinData.title}\nFrom: ${spacebinData.from}\nTo: ${spacebinData.to}\nDate: ${spacebinData.date}\nText Version:\n${spacebinData.text}\nHtml Version:\n${spacebinData.html}`;
      const zc = new Date().getTime(); //new time for mytext
      const mytext = `
  <!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>View Email</title>
    <style>
      /* Common CSS styles */
      body {
        font-family: Arial, Helvetica, sans-serif;
        margin: 0;
        padding: 0;
      }
      .email-container {
        border: 1px solid #ddd;
        border-radius: 5px;
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.3);
        margin: 20px auto;
        max-width: 600px;
        padding: 20px;
      }
      h2 {
        font-size: 24px;
        line-height: 28px;
        margin-bottom: 10px;
      }
      p {
        font-size: 16px;
        line-height: 20px;
        margin: 0 0 10px;
      }
      pre {
        background-color: #eee;
        border: 1px solid #ccc;
        border-radius: 5px;
        font-family: monospace;
        font-size: 14px;
        line-height: 18px;
        padding: 10px;
        white-space: pre-wrap;
        word-wrap: break-word;
        margin: 0 0 20px;
      }
      
      /* Light theme CSS */
      .light-theme {
        background-color: #f6f6f6;
        color: #333;
      }
      .light-theme .email-container {
        background-color: #fff;
      }
      
      /* Dark theme CSS */
      .dark-theme {
        background-color: #333;
        color: #fff;
      }
      .dark-theme .email-container {
        background-color: #222;
        border: 1px solid #555;
      }
      .dark-theme h2 {
        color: #fff;
      }
      .dark-theme p {
        color: #ccc;
      }
      .dark-theme pre {
        background-color: #444;
        border: 1px solid #333;
      }
      
      /* Toggle button styles */
      .toggle {
        position: absolute;
        top: 20px;
        right: 20px;
        background: transparent;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
      }
      .toggle span {
        font-size: 24px;
      }
    </style>
  </head>
  <body onload="setTheme()">
    <div class="email-container">
      <h2>${spacebinData.title}</h2>
      <p>From: ${spacebinData.from}</p>
      <p>To: ${spacebinData.to}</p>
      <p>Date: ${spacebinData.date}</p>
      <p>Text Version:</p>
      <pre>${spacebinData.text}</pre>
      <p>Attachment Count: ${spacebinData.count}</p>
    </div>

    <button class="toggle" onclick="toggleTheme()">
      <span id="sun-icon">&#x1f31e;</span> 
      <span id="moon-icon">&#x1f319;</span>
    </button>

    <script>
      function setTheme() {
        const body = document.body;
        const theme = getCookie('theme');
        if (theme === 'dark') {
          body.classList.add('dark-theme');
        }
        setIcon(theme);
      }

      function toggleTheme() {
        const body = document.body;
        body.classList.toggle('dark-theme');
        const theme = body.classList.contains('dark-theme') ? 'dark' : 'light';
        setCookie('theme', theme, 365);
        setIcon(theme);
      }

      function setIcon(theme) {
        const sunIcon = document.getElementById('sun-icon');
        const moonIcon = document.getElementById('moon-icon');
        if (theme === 'dark') {
          sunIcon.style.display = 'inline-block';
          moonIcon.style.display = 'none';
        } else {
          sunIcon.style.display = 'none';
          moonIcon.style.display = 'inline-block';
        }
      }

      function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = 'expires=' + date.toUTCString();
        document.cookie = name + '=' + value + '; ' + expires + '; path=/';
      }

      function getCookie(name) {
        const cookieName = name + '=';
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
          let cookie = cookies[i];
          while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1);
          }
          if (cookie.indexOf(cookieName) === 0) {
            return cookie.substring(cookieName.length, cookie.length);
          }
        }
        return '';
      }
    </script>
  </body>
</html>
`;

      try {
  if (zc && mytext) {
    // Perform something
    await env.DB.prepare('INSERT INTO CFWTGW (id, html) VALUES (?, ?)').bind(zc, mytext).run();
  } else {
    // Pass
    console.log('Error: One or more values are undefined mytext');
  }
} catch (error) {
  console.log('An error occurred:', error);
}

      const spacebinResponse = await fetch(spacebinUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: mypaste,
          extension: "txt",
        }),
      });
      const spacebinJson = await spacebinResponse.json();
      const sbinUrl = `https://spaceb.in/${spacebinJson.payload.id}`;
      // Add the Spacebin URL to the notification message as an inline button
      const buttonText1 = "View Spacebin";
      const button1 = { text: buttonText1, url: sbinUrl };
      const zburl = cfurl + zc;
      const buttonText3 = "View TEXT";
      const button3 = { text: buttonText3, url: zburl };
      let replyMarkup;
      if (parsedEmail.html !== undefined) {
            const durl = cfurl + c;
            const buttonText2 = "View HTML";
            const button2 = { text: buttonText2, url: durl };
            replyMarkup = { inline_keyboard: [[button1, button2], [button3]] }
      } else {
            replyMarkup = { inline_keyboard: [[button1, button3]] };
      }
      // Send the notification to Telegram with the inline button
      await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId, // use the chatId from the emailToChatId mapping
          text: notificationMessage,
          reply_markup: replyMarkup,
          disable_web_page_preview: "True",
        }),
      });
      // Forward the email to the specified inbox
      if (toForward) {
        await message.forward(fMailid);
        }
    } catch  (error) {
      console.error(error);
      // handle the error here
    }
  },
};
