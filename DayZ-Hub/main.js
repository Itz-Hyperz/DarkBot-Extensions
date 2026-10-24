/**
 * DayZ Hub Extension for Dark-Bot
 * Multi-guild DayZ server status + basic BattlEye RCON
 *
 * Features:
 *  - Per-guild DayZ server configuration (MySQL)
 *  - Auto-updating status embed
 *  - /dayz status, /dayz players
 *  - /dayz setup, /dayz panel
 *  - Basic RCON: /dayz say, /dayz kick, /dayz rcon
 *
 * Requirements (run from Dark-Bot root):
 *  npm install gamedig battle-node
 */

const { MessageEmbed } = require('discord.js');
const Gamedig = require('gamedig');
const BattleNode = require('battle-node');

module.exports = async function (client, con, app) {
    console.log('[DayZ Hub] Extension loading...');

    await ensureTable(con);

    client.on('ready', async () => {
        try {
            await registerCommands(client);
            console.log('[DayZ Hub] Slash commands registered');
        } catch (err) {
            console.error('[DayZ Hub] Failed to register commands:', err.message);
        }
        startStatusLoop(client, con);
    });

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand()) return;
        if (interaction.commandName !== 'dayz') return;

        try {
            await handleDayzCommand(client, con, interaction);
        } catch (err) {
            console.error('[DayZ Hub] Interaction error:', err);
            const msg = { content: 'Something went wrong while processing that command.', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(msg).catch(() => {});
            } else {
                await interaction.reply(msg).catch(() => {});
            }
        }
    });
};

/* ------------------------------------------------------------------ */
/*  Database                                                           */
/* ------------------------------------------------------------------ */

function ensureTable(con) {
    return new Promise((resolve, reject) => {
        const sql = `
            CREATE TABLE IF NOT EXISTS dayz_servers (
                guildId VARCHAR(32) PRIMARY KEY,
                serverName VARCHAR(128) DEFAULT 'DayZ Server',
                ip VARCHAR(128) NOT NULL,
                queryPort INT NOT NULL,
                gamePort INT DEFAULT NULL,
                rconPort INT DEFAULT NULL,
                rconPassword VARCHAR(128) DEFAULT NULL,
                statusChannelId VARCHAR(32) DEFAULT NULL,
                statusMessageId VARCHAR(32) DEFAULT NULL,
                enabled TINYINT(1) DEFAULT 1,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;
        con.query(sql, (err) => {
            if (err) {
                console.error('[DayZ Hub] Failed to create table:', err.message);
                return reject(err);
            }
            con.query('ALTER TABLE dayz_servers ADD COLUMN IF NOT EXISTS rconPort INT DEFAULT NULL', () => {});
            con.query('ALTER TABLE dayz_servers ADD COLUMN IF NOT EXISTS rconPassword VARCHAR(128) DEFAULT NULL', () => {});
            console.log('[DayZ Hub] Database table ready');
            resolve();
        });
    });
}

function getGuildConfig(con, guildId) {
    return new Promise((resolve, reject) => {
        con.query('SELECT * FROM dayz_servers WHERE guildId = ?', [guildId], (err, rows) => {
            if (err) return reject(err);
            resolve(rows[0] || null);
        });
    });
}

function saveGuildConfig(con, data) {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO dayz_servers
                (guildId, serverName, ip, queryPort, gamePort, rconPort, rconPassword, statusChannelId, statusMessageId, enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                serverName = VALUES(serverName),
                ip = VALUES(ip),
                queryPort = VALUES(queryPort),
                gamePort = VALUES(gamePort),
                rconPort = VALUES(rconPort),
                rconPassword = VALUES(rconPassword),
                statusChannelId = VALUES(statusChannelId),
                statusMessageId = VALUES(statusMessageId),
                enabled = VALUES(enabled)
        `;
        const values = [
            data.guildId,
            data.serverName || 'DayZ Server',
            data.ip,
            data.queryPort,
            data.gamePort || null,
            data.rconPort || null,
            data.rconPassword || null,
            data.statusChannelId || null,
            data.statusMessageId || null,
            data.enabled !== undefined ? data.enabled : 1
        ];
        con.query(sql, values, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

function getAllEnabledConfigs(con) {
    return new Promise((resolve, reject) => {
        con.query(
            'SELECT * FROM dayz_servers WHERE enabled = 1 AND statusChannelId IS NOT NULL AND statusMessageId IS NOT NULL',
            (err, rows) => {
                if (err) return reject(err);
                resolve(rows || []);
            }
        );
    });
}

/* ------------------------------------------------------------------ */
/*  Slash command registration                                         */
/* ------------------------------------------------------------------ */

async function registerCommands(client) {
    const commands = [
        {
            name: 'dayz',
            description: 'DayZ server tools',
            options: [
                {
                    name: 'status',
                    description: 'Show current DayZ server status',
                    type: 1
                },
                {
                    name: 'players',
                    description: 'List online players (query protocol)',
                    type: 1
                },
                {
                    name: 'setup',
                    description: 'Configure the DayZ server for this Discord (Admin)',
                    type: 1,
                    options: [
                        { name: 'ip', description: 'Server IP or hostname', type: 3, required: true },
                        { name: 'queryport', description: 'Query port (often game port + 1)', type: 4, required: true },
                        { name: 'name', description: 'Friendly server name', type: 3, required: false },
                        { name: 'gameport', description: 'Game port (for connect string)', type: 4, required: false },
                        { name: 'rconport', description: 'BattlEye RCON port', type: 4, required: false },
                        { name: 'rconpassword', description: 'BattlEye RCON password', type: 3, required: false },
                        { name: 'channel', description: 'Channel for auto status embed', type: 7, required: false }
                    ]
                },
                {
                    name: 'panel',
                    description: 'Post / refresh the live status panel (Admin)',
                    type: 1,
                    options: [
                        { name: 'channel', description: 'Channel to post the status panel in', type: 7, required: true }
                    ]
                },
                {
                    name: 'say',
                    description: 'Broadcast a message to the DayZ server via RCON (Admin)',
                    type: 1,
                    options: [
                        { name: 'message', description: 'Message to broadcast in-game', type: 3, required: true }
                    ]
                },
                {
                    name: 'kick',
                    description: 'Kick a player by RCON player number (Admin)',
                    type: 1,
                    options: [
                        { name: 'number', description: 'Player number from /dayz rcon', type: 4, required: true },
                        { name: 'reason', description: 'Kick reason', type: 3, required: false }
                    ]
                },
                {
                    name: 'rcon',
                    description: 'Get live player list via BattlEye RCON (Admin)',
                    type: 1
                }
            ]
        }
    ];

    await client.application.commands.set(commands);
}

/* ------------------------------------------------------------------ */
/*  Command handler                                                    */
/* ------------------------------------------------------------------ */

async function handleDayzCommand(client, con, interaction) {
    const sub = interaction.options.getSubcommand();
    const isAdmin = interaction.memberPermissions?.has('ADMINISTRATOR');

    if (sub === 'setup') {
        if (!isAdmin) {
            return interaction.reply({ content: 'You need **Administrator** to configure the DayZ server.', ephemeral: true });
        }

        const ip = interaction.options.getString('ip');
        const queryPort = interaction.options.getInteger('queryport');
        const name = interaction.options.getString('name') || 'DayZ Server';
        const gamePort = interaction.options.getInteger('gameport');
        const rconPort = interaction.options.getInteger('rconport');
        const rconPassword = interaction.options.getString('rconpassword');
        const channel = interaction.options.getChannel('channel');

        const existing = await getGuildConfig(con, interaction.guildId);

        await saveGuildConfig(con, {
            guildId: interaction.guildId,
            serverName: name,
            ip,
            queryPort,
            gamePort: gamePort || existing?.gamePort || null,
            rconPort: rconPort || existing?.rconPort || null,
            rconPassword: rconPassword || existing?.rconPassword || null,
            statusChannelId: channel?.id || existing?.statusChannelId || null,
            statusMessageId: existing?.statusMessageId || null,
            enabled: 1
        });

        const embed = new MessageEmbed()
            .setColor('#2ecc71')
            .setTitle('DayZ Server Configured')
            .setDescription(`Settings saved for **${name}**`)
            .addField('IP', `\`${ip}\``, true)
            .addField('Query Port', `\`${queryPort}\``, true)
            .addField('Game Port', gamePort ? `\`${gamePort}\`` : (existing?.gamePort ? `\`${existing.gamePort}\`` : 'Not set'), true)
            .addField('RCON Port', (rconPort || existing?.rconPort) ? `\`${rconPort || existing.rconPort}\`` : 'Not set', true)
            .addField('RCON Password', (rconPassword || existing?.rconPassword) ? '•••••••• (saved)' : 'Not set', true)
            .setFooter({ text: 'Use /dayz panel to create the live status embed' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'panel') {
        if (!isAdmin) {
            return interaction.reply({ content: 'You need **Administrator** to manage the status panel.', ephemeral: true });
        }

        const config = await getGuildConfig(con, interaction.guildId);
        if (!config) {
            return interaction.reply({ content: 'No DayZ server configured. Run `/dayz setup` first.', ephemeral: true });
        }

        const channel = interaction.options.getChannel('channel');
        if (!channel || !channel.isText()) {
            return interaction.reply({ content: 'Please select a valid text channel.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const status = await queryServer(config);
        const embed = buildStatusEmbed(config, status);
        const msg = await channel.send({ embeds: [embed] });

        await saveGuildConfig(con, {
            ...config,
            statusChannelId: channel.id,
            statusMessageId: msg.id
        });

        return interaction.editReply({ content: `Live status panel posted in ${channel}. It auto-updates every few minutes.` });
    }

    if (sub === 'status' || sub === 'players') {
        const config = await getGuildConfig(con, interaction.guildId);
        if (!config) {
            return interaction.reply({ content: 'No DayZ server configured. An admin needs to run `/dayz setup`.', ephemeral: true });
        }

        await interaction.deferReply();
        const status = await queryServer(config);

        if (sub === 'status') {
            return interaction.editReply({ embeds: [buildStatusEmbed(config, status)] });
        }

        if (!status.online) {
            return interaction.editReply({ content: 'Server appears to be offline.' });
        }

        const players = status.players || [];
        if (players.length === 0) {
            return interaction.editReply({ content: `**${config.serverName}** is online with **0** players.` });
        }

        const list = players
            .map((p, i) => `\`${i + 1}.\` ${p.name || 'Unknown'}`)
            .join('\n')
            .slice(0, 3900);

        const embed = new MessageEmbed()
            .setColor('#3498db')
            .setTitle(`${config.serverName} — Online Players`)
            .setDescription(list)
            .setFooter({ text: `${players.length} / ${status.maxPlayers || '?'} players` })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'say' || sub === 'kick' || sub === 'rcon') {
        if (!isAdmin) {
            return interaction.reply({ content: 'You need **Administrator** to use RCON commands.', ephemeral: true });
        }

        const config = await getGuildConfig(con, interaction.guildId);
        if (!config) {
            return interaction.reply({ content: 'No DayZ server configured. Run `/dayz setup` first.', ephemeral: true });
        }
        if (!config.rconPort || !config.rconPassword) {
            return interaction.reply({
                content: 'RCON is not configured. Run `/dayz setup` again and include `rconport` and `rconpassword`.',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            if (sub === 'say') {
                const message = interaction.options.getString('message');
                const result = await sendRconCommand(config, `say -1 ${message}`);
                return interaction.editReply({ content: `Broadcast sent.\n\`\`\`\n${result || 'OK'}\n\`\`\`` });
            }

            if (sub === 'kick') {
                const number = interaction.options.getInteger('number');
                const reason = interaction.options.getString('reason') || 'Kicked by admin';
                const result = await sendRconCommand(config, `kick ${number} ${reason}`);
                return interaction.editReply({ content: `Kick command sent.\n\`\`\`\n${result || 'OK'}\n\`\`\`` });
            }

            if (sub === 'rcon') {
                const result = await sendRconCommand(config, 'players');
                const embed = new MessageEmbed()
                    .setColor('#9b59b6')
                    .setTitle(`${config.serverName} — RCON Players`)
                    .setDescription(`\`\`\`\n${(result || 'No response').slice(0, 3900)}\n\`\`\``)
                    .setFooter({ text: 'Use the player number with /dayz kick' })
                    .setTimestamp();
                return interaction.editReply({ embeds: [embed] });
            }
        } catch (err) {
            return interaction.editReply({ content: `RCON error: ${err.message}` });
        }
    }
}

/* ------------------------------------------------------------------ */
/*  Query (GameDig)                                                    */
/* ------------------------------------------------------------------ */

async function queryServer(config) {
    try {
        const state = await Gamedig.query({
            type: 'dayz',
            host: config.ip,
            port: config.queryPort,
            maxAttempts: 2,
            socketTimeout: 4000
        });

        return {
            online: true,
            name: state.name || config.serverName,
            map: state.map || 'Unknown',
            players: state.players || [],
            playerCount: state.players ? state.players.length : (state.numplayers || 0),
            maxPlayers: state.maxplayers || state.maxPlayers || '?',
            password: state.password || false,
            version: state.version || null,
            ping: state.ping || null
        };
    } catch (err) {
        return { online: false, error: err.message };
    }
}

function buildStatusEmbed(config, status) {
    const embed = new MessageEmbed()
        .setTitle(config.serverName || 'DayZ Server')
        .setTimestamp();

    if (!status.online) {
        return embed
            .setColor('#e74c3c')
            .setDescription('🔴 **Offline**')
            .addField('Address', `\`${config.ip}${config.gamePort ? ':' + config.gamePort : ''}\``, true)
            .addField('Query Port', `\`${config.queryPort}\``, true)
            .setFooter({ text: 'Last checked' });
    }

    const playerList = (status.players || [])
        .slice(0, 25)
        .map(p => p.name || 'Unknown')
        .join(', ');

    embed
        .setColor('#2ecc71')
        .setDescription('🟢 **Online**')
        .addField('Players', `**${status.playerCount}** / **${status.maxPlayers}**`, true)
        .addField('Map', status.map || 'Unknown', true)
        .addField('Password', status.password ? 'Yes' : 'No', true)
        .addField('Connect', `\`${config.ip}${config.gamePort ? ':' + config.gamePort : ''}\``, false);

    if (status.version) embed.addField('Version', status.version, true);
    if (status.ping) embed.addField('Ping', `${status.ping} ms`, true);
    if (playerList) {
        embed.addField('Online Players', playerList.length > 1000 ? playerList.slice(0, 1000) + '…' : playerList);
    }

    embed.setFooter({ text: 'Auto-updates every few minutes' });
    return embed;
}

/* ------------------------------------------------------------------ */
/*  BattlEye RCON                                                      */
/* ------------------------------------------------------------------ */

function sendRconCommand(config, command) {
    return new Promise((resolve, reject) => {
        const bnode = new BattleNode({
            ip: config.ip,
            port: config.rconPort,
            rconPassword: config.rconPassword
        });

        let settled = false;
        const timeout = setTimeout(() => {
            if (!settled) {
                settled = true;
                try { bnode.logout(); } catch (_) {}
                reject(new Error('RCON connection timed out'));
            }
        }, 10000);

        bnode.on('login', (err, success) => {
            if (settled) return;
            if (err || !success) {
                settled = true;
                clearTimeout(timeout);
                try { bnode.logout(); } catch (_) {}
                return reject(new Error(err ? err.message : 'RCON login failed (check password / port)'));
            }

            bnode.sendCommand(command, (response) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                try { bnode.logout(); } catch (_) {}
                resolve(typeof response === 'string' ? response : (response || 'OK'));
            });
        });

        bnode.on('error', (err) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            reject(err || new Error('RCON connection error'));
        });

        try {
            bnode.login();
        } catch (e) {
            if (!settled) {
                settled = true;
                clearTimeout(timeout);
                reject(e);
            }
        }
    });
}

/* ------------------------------------------------------------------ */
/*  Background status updater                                          */
/* ------------------------------------------------------------------ */

function startStatusLoop(client, con) {
    const INTERVAL = 3 * 60 * 1000;

    const tick = async () => {
        try {
            const configs = await getAllEnabledConfigs(con);
            for (const config of configs) {
                try {
                    const guild = client.guilds.cache.get(config.guildId);
                    if (!guild) continue;

                    const channel = guild.channels.cache.get(config.statusChannelId);
                    if (!channel) continue;

                    let message;
                    try {
                        message = await channel.messages.fetch(config.statusMessageId);
                    } catch {
                        continue;
                    }

                    const status = await queryServer(config);
                    const embed = buildStatusEmbed(config, status);
                    await message.edit({ embeds: [embed] });
                } catch (err) {
                    if (client.config?.debugmode) {
                        console.error(`[DayZ Hub] Update failed for guild ${config.guildId}:`, err.message);
                    }
                }
            }
        } catch (err) {
            console.error('[DayZ Hub] Status loop error:', err.message);
        }
    };

    setTimeout(tick, 20000);
    setInterval(tick, INTERVAL);
    console.log('[DayZ Hub] Status updater started (every 3 minutes)');
}
