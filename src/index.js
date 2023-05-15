/* based on https://github.com/edevil/email_worker_parser/blob/0c3938d537ce134bc1a8a9f3b301badcb1c5ead0/src/index.js
notification to Telegram by @dishapatel010
*/

const PostalMime = require('postal-mime');
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
  async email(message, env, ctx) {
    // Define the Telegram API URL
    const tgToken = env.TOKEN //env VAR
    const telegramUrl = `https://api.telegram.org/bot${tgToken}/sendMessage`;
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
      // Define a list of email addresses and their corresponding chatIds and forward email ids
      const emailList = [
        { to: "example@gmail.com", chatId: 5071059420, fMailid: "example@example.com", toForward: false }, //only sends notification as its false
        { to: "example1@example.com", chatId: 5071059420, fMailid: "example3@example.com", toForward: true }, //sends & forward
        { to: "example2@example.com", chatId: 5071059420, fMailid: "example4@example.com", toForward: false },
      ];

      // Map the email addresses to their corresponding chatIds and forward email ids
      const emailToChatId = emailToChatIdMap(emailList);
      // Find the chatId and fMailid for the current email based on its "to" address
      const { chatId, fMailid, toForward } = emailToChatId[to] || {};
      if (!chatId || !fMailid) {
        console.log(`No matching chatId or fMailid found for email to ${to}`);
        return;
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
      };
      
      const mypaste = `${spacebinData.title}\nFrom: ${spacebinData.from}\nTo: ${spacebinData.to}\nDate: ${spacebinData.date}\nText Version:\n${spacebinData.text}\nHtml Version:\n${spacebinData.html}`;
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
      const buttonText = "View Spacebin";
      const button = { text: buttonText, url: sbinUrl };
      const replyMarkup = { inline_keyboard: [[button]] };
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
