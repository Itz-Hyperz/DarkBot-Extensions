# FiveM Status 
You can ignore the `(node:21232) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 connect listeners added to [Socket]. Use emitter.setMaxListeners() to increase limit` errors as these do not seem to be actual memory leaks. If you know how to fix that please tell [me](https://github.com/weirdbandkid)

To get started, you will need to install a package called Gamedig
```
npm i gamedig
```
Here is how to configure the extention
```js
const conf = {
        ip: "127.0.0.1", // Server IP Domains can work as well
        port: "30120", // Server port
        serverName: "My FiveM Server", // Server Name
        statusMessage: "974851090963132508", // Message ID (use the /embed command and use that message ID)
        statusChannel: "874124347487420448", // Channel ID the message is in
        guildId: "874124347009294396" // Guild ID of the guild the message is in
    }
```