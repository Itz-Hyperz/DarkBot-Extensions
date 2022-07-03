# Ticket Viewer
This lets you view ticket transcripts in a web browser.

# Installation
- Drag the `Ticket Viewer` folder into your `extensions` folder for Darkbot.
- Add the following to src/components/ticketClose.js after the transcript is made (look for `discordTranscripts.createTranscript`)

```js
   // change "attachment.attachment" to what the fucntions name is. If its named bruh, it should be bruh.attachment
      fs.appendFile(`${__dirname.replace('components', "")}/utils/tickets/transcript-${channel.id}.html`, attachment.attachment, (err) => { 
          if (err) console.log(err);
      })
```
- Restart Darkbot.

# Routes
- `/tickets/ticket-{channelId}.html` = Lets you view the ticket in a web browser.

# Credits
- [@weirdbandkid](https://github.com/weirdbandkid)