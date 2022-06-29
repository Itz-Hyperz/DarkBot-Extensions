# Darkbot API
This is a base template including Discord login for Dark Bot (1.3+). Those of you who are developers looking for more out of Dark Bot can feel free to use this as needed.

# Installation
- Drag the `Darkbot API` folder into your `extensions` folder for Darkbot.
- Run `npm i passport passport-discord-faxes multer body-parser express-session`.
- Fill out the `apiConfig.js` file for the extension.
- Add the oAuth2 redirect url to your Discord app: `https://example.com/auth/discord/callback`
- Restart Darkbot.

# Default Routes
- `/` = Go to home page.
- `/login` = Go to login page.

# Credits
- [@Hyperz](https://store.hyperz.net/discord) - *Original release.*