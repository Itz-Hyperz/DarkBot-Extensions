// Credit to aspectalex for fixing this btw.
// USE GAMEDIG VERSION 2.0.20

const { MessageEmbed } = require('discord.js')
const Gamedig = require('gamedig')
module.exports = async function(client, con, app) {

    const conf = {
        ip: "1.1.1.1", // Server IP Domains can work as well
        port: "30120", // Server port
        serverName: "Country Roleplay™", // Server Name
        statusMessage: "1371331749602398215", // Message ID (use the /embed command and use that message ID)
        statusChannel: "1369806911725109369", // Channel ID the message is in
        guildId: "1368671156118491307" // Guild ID of the guild the message is in
    }

    var net = require('net');
    let sock = new net.Socket();
     
    runsomeshit(client, con, app, conf, net, sock) // run on bot startup
    
    setInterval(async () => {
      runsomeshit(client, con, app, conf, net, sock);
    }, 480000) // Every 8 minutes


};

async function runsomeshit(client, con, app, conf, net, sock) {
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

    try {
        await client.user.setPresence({
            activities: [{
                name: `${conf.serverName} ${state.raw.clients} / ${state.raw.sv_maxclients}`,
                type: 'PLAYING'
            }],
            status: 'available'
        });
    } catch(e) {}
        
      var embed = new MessageEmbed()
          .setColor("GREEN")
          .setTitle(`${conf.serverName}`) 
          .addField('**Status**', `${stats}`, true)
          .addField('**Direct Connect:**', `\`${conf.ip}\``, true)
          .addField('**Online Players:**', `**Total:** \`${state.raw.clients}\` / \`${state.raw.sv_maxclients}\``, true)
          if(players.length > 0) {
          embed.addField('**Current Players:**', `${players.join(',  ').toString()}`)
          }
          const maindiscord = client.guilds.cache.find(g => g.id === conf.guildId) 
          const statuschannel = maindiscord.channels.cache.find(c => c.id === conf.statusChannel); 
          statuschannel.messages.fetch(conf.statusMessage).then((msg) => { 
            msg.edit({embeds: [embed]})
          })
    }).catch((e) => {
          
    
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
}
