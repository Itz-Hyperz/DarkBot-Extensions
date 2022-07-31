# Languages
Below you will find a simple documentation article on custom languages within Dark Bot 1.3!

### Default Language
The default language in the config file is what will mainly be used within the bot, it is what the commands will be loaded as, and also what the bot will use by default each time it joins a guild. Setting this specific config option is crucial and will be primarily what your bot reads everything through by default.

Below you will find your options for this file.

- `english`
- `spanish`
- `german`
- `polish`
- `korean`
- `arabic`
- `french`
- `hindi`
- `irish`
- `turkish`
- `danish`

---

### Adding A Language
Personally, we recommend [this tool](https://hotpot.ai/file-translator?s=translate-json) which will allow you to convert the `english.json` file to whatever language you wish to have. Once done, feel free to [fork this repository](https://github.com/Itz-Hyperz/DarkBot-Extensions/fork) then add your language file changes, then simply just [create a pull request](https://github.com/Itz-Hyperz/DarkBot-Extensions/pulls) to have your new changes verified and pushed to the latest release!

Do take note of the requirements when creating a pull request:
- Add your own custom changes.
- Update this file to include your language in the list.
- Update the `language.json` file to add your new language to the array (if not already added).
