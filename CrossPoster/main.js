// This extension crossposts messages in announcement channels / publishes them automatically for you!
let channels = [
    "YOUR_CHANNEL_ID"
];
module.exports = async function(client) {
    client.on('messageCreate', async function(message) {
        if(!message.channel) return;
        if(!channels.includes(message.channel.id)) return;
        await message.crosspost();
    });
};