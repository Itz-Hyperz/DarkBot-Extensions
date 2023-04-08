// This extension allows your server members to vote to change the server name, server icon, and whatever the "member" role name is.

let guildId = "1094126197471989881";
let mainRoleId = "1094127441880023083";
let votingTimerText = "3 MINUTES";
let votingTimerMS = 180000; // 3 Minutes in milliseconds

module.exports = async function(client) {
    client.on('messageCreate', async function(message) {
        if (!message.author) return;
        if (message.author.bot) return;
        if(message.channel.type == 'DM') return;

        if(message?.guild?.id == guildId) {
            if(!message.content.includes(' ')) return;
            if(message.content.toLowerCase().startsWith('vote!servername')) {
                let serverName = message.content.replaceAll('vote!servername ', '');
                if(serverName == '') return;
                message.reply({ content: `**ENDS IN ${votingTimerText}**\nVote to change the server name to: \`${serverName}\`` }).then(function(msg) { addReactions('servername', msg, serverName); });
            } else if(message.content.toLowerCase().startsWith('vote!servericon')) {
                let serverName = message.content.replaceAll('vote!servericon ', '');
                if(serverName == '' || !serverName.includes('.') || !serverName.includes('http')) return;		
                message.reply({ content: `**ENDS IN ${votingTimerText}**\nVote to change the server icon to: \n${serverName}` }).then(function(msg) { addReactions('servericon', msg, serverName); });
            } else if(message.content.toLowerCase().startsWith('vote!rolename')) {
                let serverName = message.content.replaceAll('vote!rolename ', '');
                if(serverName == '') return;		
                message.reply({ content: `**ENDS IN ${votingTimerText}**\nVote to change the main role name to: \n\`${serverName}\`` }).then(function(msg) { addReactions('rolename', msg, serverName); });
            };
        };
    });
};

async function addReactions(category, msg, value) {
	await msg.react('👍');
	await msg.react('👎');
	setTimeout(async function() {
		await msg.channel.messages.fetch(msg.id).then(function(passed) {
			let yes = passed.reactions.cache.get('👍').count;
			let no = passed.reactions.cache.get('👎').count;
			if(yes > no) return winnerVote(category, msg, value);
            if(typeof msg == 'undefined') return;
            msg?.edit({ content: `~~ ${msg.content} ~~\n\n**__VOTING HAS ENDED__**\n\`There were not enough votes...` }).catch(e => console.log(e));
		}).catch(e => console.log(e));
	}, votingTimerMS);
};

function winnerVote(category, msg, value) {
    if(typeof msg == 'undefined') return;
    if(category == 'servername') {
        msg.guild.setName(value);
    } else if(category == 'servericon') {
        msg.guild.setIcon(value);
    } else if(category == 'rolename') {
        let daRole = msg.guild.roles.cache.find(roleval => roleval.id == mainRoleId)
        daRole.edit({
            name: value
        }).catch(e => {console.log(e);});
    };
    if(typeof msg == 'undefined') return;
    msg?.edit({ content: `~~ ${msg.content} ~~\n\n**__VOTING HAS ENDED__**\n\`${category.toUpperCase()}\` has been changed!` }).catch(e => console.log(e));
};
