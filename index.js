require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes
} = require('discord.js');

const cron = require('node-cron');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ]
});

let channelId = null;
let lastAnnonceMessage = null;

const ROLE_NAME = '𝕰𝖑 𝕴𝖒𝖕𝖊𝖗𝖎𝖔';

const commands = [

    new SlashCommandBuilder()
        .setName('setchannel')
        .setDescription('Définir le salon annonces'),

    new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Verrouiller le salon'),

    new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Déverrouiller le salon'),

    new SlashCommandBuilder()
        .setName('hide')
        .setDescription('Cacher le salon'),

    new SlashCommandBuilder()
        .setName('show')
        .setDescription('Afficher le salon'),

    new SlashCommandBuilder()
        .setName('testannonce')
        .setDescription('Envoyer une annonce test')

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {

    try {

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: commands }
        );

        console.log('✅ Commandes enregistrées');

    } catch (error) {
        console.error(error);
    }

})();

client.once('ready', () => {

    console.log(`${client.user.tag} connecté`);

    // ANNONCE À 13H
    cron.schedule('*/1 * * * *', async () => {

    console.log('🚀 CRON ANNONCE LANCÉ');
    console.log('Salon ID :', channelId);

    if (!channelId) {

        console.log('❌ Aucun salon configuré');
        return;

    }

    const channel = await client.channels.fetch(channelId);

    if (!channel) {

        console.log('❌ Salon introuvable');
        return;

    }

    lastAnnonceMessage = await channel.send(`
🚨 **ANNONCE IMPORTANTE - TOUS LA FAMILLE** 🚨

Merci de répondre avec UNE SEULE réaction uniquement :

✅ Présent
❌ Pas disponible
⏰ En retard

⚠️ Aucune autre réaction ne sera prise en compte.

🔥 ON A BESOIN DE VOUS, LA FAMILLE !
    `);

    console.log('✅ Annonce envoyée');

    await lastAnnonceMessage.react('✅');
    await lastAnnonceMessage.react('❌');
    await lastAnnonceMessage.react('⏰');

});

    // DM AUTOMATIQUE À 20H
    cron.schedule('0 18 * * *', async () => {

        if (!lastAnnonceMessage) return;

        const guild = lastAnnonceMessage.guild;

        const role = guild.roles.cache.find(
            r => r.name === ROLE_NAME
        );

        if (!role) return;

        const reactedUsers = new Set();

        for (const reaction of lastAnnonceMessage.reactions.cache.values()) {

            const users = await reaction.users.fetch();

            users.forEach(user => {

                if (!user.bot) {
                    reactedUsers.add(user.id);
                }

            });

        }

        for (const member of role.members.values()) {

            if (!reactedUsers.has(member.id)) {

                try {

                    await member.send(`
⚠️ Tu n’as pas répondu à l’annonce du jour.

Merci de voter rapidement :
✅ Présent
❌ Pas disponible
⏰ En retard

— El Imperio
                    `);

                    console.log(`DM envoyé à ${member.user.tag}`);

                } catch (err) {

                    console.log(
                        `Impossible d'envoyer un DM à ${member.user.tag}`
                    );

                }

            }

        }

    });

});

client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    const channel = interaction.channel;

    // TEST ANNONCE
    if (interaction.commandName === 'testannonce') {

        lastAnnonceMessage = await channel.send(`
🚨 **ANNONCE IMPORTANTE - TOUS LA FAMILLE** 🚨

Merci de répondre avec UNE SEULE réaction uniquement :

✅ Présent
❌ Pas disponible
⏰ En retard

⚠️ Aucune autre réaction ne sera prise en compte.

🔥 ON A BESOIN DE VOUS, LA FAMILLE !
        `);

        await lastAnnonceMessage.react('✅');
        await lastAnnonceMessage.react('❌');
        await lastAnnonceMessage.react('⏰');

        return interaction.reply({
            content: '✅ Annonce test envoyée',
            ephemeral: true
        });

    }

    // SETCHANNEL
    if (interaction.commandName === 'setchannel') {

        channelId = channel.id;

        return interaction.reply({
            content: '✅ Salon annonces configuré',
            ephemeral: true
        });

    }

    // LOCK
    if (interaction.commandName === 'lock') {

        await channel.permissionOverwrites.edit(
            interaction.guild.roles.everyone,
            {
                SendMessages: false
            }
        );

        return interaction.reply('🔒 Salon verrouillé');

    }

    // UNLOCK
    if (interaction.commandName === 'unlock') {

        await channel.permissionOverwrites.edit(
            interaction.guild.roles.everyone,
            {
                SendMessages: true
            }
        );

        return interaction.reply('🔓 Salon déverrouillé');

    }

    // HIDE
    if (interaction.commandName === 'hide') {

        await channel.permissionOverwrites.edit(
            interaction.guild.roles.everyone,
            {
                ViewChannel: false
            }
        );

        return interaction.reply('🙈 Salon caché');

    }

    // SHOW
    if (interaction.commandName === 'show') {

        await channel.permissionOverwrites.edit(
            interaction.guild.roles.everyone,
            {
                ViewChannel: true
            }
        );

        return interaction.reply('👀 Salon affiché');

    }

});

client.login(process.env.TOKEN);
