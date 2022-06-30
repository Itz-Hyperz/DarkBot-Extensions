let noReactions = [
    "328731272497201154"
];

module.exports = async function(client, con, app) {
    client.on('messageReactionAdd', async (reaction, user) => {
        if(user.bot) return;
        if (reaction.partial) await reaction.fetch();
        if (reaction.message.partial) await reaction.message.fetch();
        if(noReactions.includes(user.id)) {
            await reaction.users.remove(user.id);
            return;
        };
    });
};