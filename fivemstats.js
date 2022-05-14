const { MessageEmbed } = require('discord.js')

module.exports = async function(client, con, app) {

    const conf = {
        ip: "127.0.0.1", // Server IP
        port: "30120", // Server port
        serverName: "My FiveM Server", // Server Name
        statusMessage: "974851090963132508", // Message ID (use the /embed command and use that message ID)
        statusChannel: "874124347487420448", // Channel ID the message is in
        guildId: "874124347009294396" // Guild ID of the guild the message is in
    }

    var net = require('net');
    let sock = new net.Socket();
     
    
    const Gamedig = require('gamedig')
    
    setInterval(async () => {
      if (!conf.statusMessage) return
    let stats;
    let color;
      sock.setTimeout(5000);
    await sock.connect(conf.port, conf.ip)
    .on('connect', function() {
        stats = "Online"
        color = "GREEN"
        sock.destroy();
        return;
    }).on('error', function(err) {
      stats = "Offline"
      color = "RED"
      sock.destroy();
        return;
      }).on('timeout', function(err) {
        stats = "Offline"
        color = "RED"
        sock.destroy();
        return;
      })//.catch(err => {});
    
    Gamedig.query({
      type: 'fivem',
      host: conf.ip, // server ip
      port: conf.port // server port
    }).then(async(state) => {
      var players = [];
         state.players.forEach(p => {
          players.push(`\`\`${p.name}\`\``)
      });
     
      var embed = new MessageEmbed()
          .setColor("GREEN")
          .setTitle(`${conf.serverName}`) 
          .addField('**Status**', `${stats}`, true)
          .addField('**Direct Connect:**', `\`${conf.ip}\``, true)
          .addField('**Online Players:**', `**Total:** \`${state.raw.clients}\` / \`${state.raw.sv_maxclients}\``, true)
          .addField('**Current Players:**', `${players.join(',  ').toString()}`)
          const maindiscord = client.guilds.cache.find(g => g.id === conf.guildId) 
          const statuschannel = maindiscord.channels.cache.find(c => c.id === conf.statusChannel); 
          statuschannel.messages.fetch(conf.fivem.statusMessage).then((msg) => { 
            msg.edit({embeds: [embed]})
          })
    }).catch(async => {
    
    
        var embed = new MessageEmbed()
          .setColor(color)
          .setTitle(`${conf.serverName}`) 
          .addField('**Status**', `${stats}`, true)
          .addField('**Direct Connect:**', `\`${conf.ip}:${conf.port}\``, true)
          const maindiscord = client.guilds.cache.find(g => g.id === conf.guildId) 
          const statuschannel = maindiscord.channels.cache.find(c => c.id === conf.statusChannel); 
          statuschannel.messages.fetch(conf.statusMessage).then((msg) => {
            msg.edit({embeds: [embed]})
          })
    
    
    });
    }, 15000) 


};
