// The sender has to be an email from the domain where you have Email Routing active.

import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";
export default {
  async fetch(request, env) {
    // Handle POST requests with form data
    if (request.method === 'POST') {
      const formData = await request.formData();
      const sname = formData.get('sname');
      const sender = formData.get('sender');
      const recipient = formData.get('recipient');
      const subject = formData.get('subject');
      const message = formData.get('message');
      // Create the email message using the form data
      const msg = createMimeMessage();
      msg.setSender({ name: sname, addr: sender });
      msg.setRecipient(recipient);
      msg.setSubject(subject);
      msg.addMessage({
          contentType: 'text/plain',
          data: message,
      });
      // Send the email using the Cloudflare Security Email Gateway (SEB)
      const emailMessage = new EmailMessage(
        sender,
        recipient,
        msg.asRaw()
      );
      try {
        await env.SEB.send(emailMessage);
        return new Response('Email sent successfully!');
      } catch (e) {
        return new Response(`Failed to send email: ${e.message}`, {status: 500});
      }
    }
    // Handle GET requests by returning the HTML form
    const html = `
      <!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f5f5f5;
      }

      form {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #fff;
        border-radius: 10px;
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
      }

      h1 {
        text-align: center;
        color: #333;
      }

      input[type=text],
      input[type=email],
      textarea {
        width: 100%;
        padding: 12px 20px;
        margin: 8px 0;
        display: inline-block;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-sizing: border-box;
        resize: none;
      }

      input[type=submit] {
        background-color: #3385ff;
        color: #fff;
        border: none;
        border-radius: 4px;
        padding: 12px 20px;
        cursor: pointer;
      }

      input[type=submit]:hover {
        background-color: #1a5ebd;
      }

      @media screen and (max-width: 480px) {
        form {
          padding: 10px;
        }

        input[type=text],
        input[type=email],
        textarea {
          padding: 8px 16px;
        }

        input[type=submit] {
          padding: 10px 16px;
        }
      }
    </style>
  </head>
  <body>
    <h1>Send an email</h1>
    <form method="POST">
      <label for="sname">Sender name:</label>
      <br>
      <input type="text" id="sname" name="sname">
      <br>
      <label for="sender">Sender email address:</label>
      <br>
      <input type="email" id="sender" name="sender">
      <br>
      <label for="recipient">Recipient email address:</label>
      <br>
      <input type="email" id="recipient" name="recipient">
      <br>
      <label for="subject">Subject:</label>
      <br>
      <input type="text" id="subject" name="subject">
      <br>
      <label for="message">Message:</label>
      <br>
      <textarea id="message" name="message"></textarea>
      <br>
      <input type="submit" value="Send">
    </form>
  </body>
</html>
    `;
    return new Response(html, {headers: {'content-type': 'text/html'}});
  }
};
