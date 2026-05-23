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
    intents: [GatewayIntentBits.Guilds]
});

let channelId = null;

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

    // ANNONCE AUTOMATIQUE À 13H
    cron.schedule('0 13 * * *', async () => {

        if (!channelId) return;

        const channel = await client.channels.fetch(channelId);

        if (!channel) return;

        const message = await channel.send(`
🚨 **ANNONCE IMPORTANTE - TOUS LA FAMILLE** 🚨

Merci de répondre avec UNE SEULE réaction uniquement :

✅ Présent
❌ Pas disponible
⏰ En retard

⚠️ Aucune autre réaction ne sera prise en compte.

🔥 ON A BESOIN DE VOUS, LA FAMILLE !
        `);

        await message.react('✅');
        await message.react('❌');
        await message.react('⏰');

    });

});

client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    const channel = interaction.channel;

    // TEST ANNONCE
    if (interaction.commandName === 'testannonce') {

        const message = await channel.send(`
🚨 **ANNONCE IMPORTANTE - TOUS LA FAMILLE** 🚨

Merci de répondre avec UNE SEULE réaction uniquement :

✅ Présent
❌ Pas disponible
⏰ En retard

⚠️ Aucune autre réaction ne sera prise en compte.

🔥 ON A BESOIN DE VOUS, LA FAMILLE !
        `);

        await message.react('✅');
        await message.react('❌');
        await message.react('⏰');

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