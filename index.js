require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    Events,
    PermissionFlagsBits,
    AttachmentBuilder
} = require('discord.js');
const express = require('express');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

// --- 1. UPTIMEROBOT İÇİN EXPRESS WEB SUNUCUSU ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot 7/24 Aktif! UptimeRobot Bağlantısı Sağlıklı.'));
app.listen(PORT, () => console.log(`[Express Web Engine] Port ${PORT} üzerinde dinleniyor.`));

// --- 2. DISCORD İSTEMCİ YAPILANDIRMASI ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const PREFIX = '.';

// Spotify Müzik Listesi
const spotifyList = [
    { title: "Ed Sheeran - Perfect", url: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT" },
    { title: "John Legend - All of Me", url: "https://open.spotify.com/track/1dGr1c8CrMLDpV6mviImv1" },
    { title: "Ed Sheeran - Shape of You", url: "https://open.spotify.com/track/7qiZ28P2fYyDUy9TsuPVI9" },
    { title: "The Weeknd - Blinding Lights", url: "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b" },
    { title: "Harry Styles - As It Was", url: "https://open.spotify.com/track/3U4isStE1c2E9StOfwDRyW" },
    { title: "Lana Del Rey - Video Games", url: "https://open.spotify.com/track/62aP921iL23d2D9M1ocR4A" }
];

// Evlilik teklif durumları
const evlilikTeklifleri = new Map();

// Hata yakalayıcılar (Botun çömesini engeller)
client.on('error', (error) => console.error('[Discord API Hatası]:', error.message));
process.on('unhandledRejection', (reason) => console.error('[Yakalanamayan Hata]:', reason));

// --- YARDIMCI CANVAS FONKSİYONLARI ---
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

/**
 * İtiraf Görseli Oluşturan Canvas
 */
async function createItirafCanvas(itirafMetni) {
    const canvas = createCanvas(800, 450);
    const ctx = canvas.getContext('2d');
    const ANONIM_GORSEL = "https://i.imgur.com/uahupKZ.jpg";

    try {
        const bgImage = await loadImage(ANONIM_GORSEL); 
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } catch (e) {
        ctx.fillStyle = '#1e1e2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.fillStyle = '#ff758c';
    ctx.font = 'bold 28px Sans-Serif';
    ctx.textAlign = 'center';
    ctx.fillText('🤫 GİZLİ İTİRAF', 400, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 22px Sans-Serif';
    
    const lines = wrapText(ctx, `"${itirafMetni}"`, 700);
    let startY = 160 - (lines.length * 12);

    for (let i = 0; i < lines.length && i < 7; i++) {
        ctx.fillText(lines[i], 400, startY + (i * 32));
    }

    ctx.fillStyle = '#cccccc';
    ctx.font = '14px Sans-Serif';
    ctx.fillText('BU İTİRAF TAMAMEN ANONİM OLARAK GÖNDERİLMİŞTİR.', 400, 410);

    return canvas.toBuffer('image/png');
}

/**
 * Ship Kartı Oluşturan Canvas
 */
async function createShipCanvas(user1, user2, rate) {
    const canvas = createCanvas(700, 320);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#fce4ec';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#4a4a4a';
    ctx.font = 'bold 22px Sans-Serif';
    ctx.textAlign = 'center';
    ctx.fillText('BÜYÜK AŞK', 350, 45);

    ctx.font = '14px Sans-Serif';
    ctx.fillStyle = '#777777';
    ctx.fillText('Tema: Şeker', 350, 295);

    const drawPolaroid = (x, y, width, height, name) => {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        ctx.fillRect(x, y, width, height);

        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#e91e63';
        ctx.font = 'bold 16px Sans-Serif';
        ctx.fillText(`• ${name}`, x + width / 2, y + height - 20);
    };

    drawPolaroid(40, 60, 180, 210, user1.username);
    drawPolaroid(480, 60, 180, 210, user2.username);

    const avatar1 = await loadImage(user1.displayAvatarURL({ extension: 'png', size: 256 }));
    const avatar2 = await loadImage(user2.displayAvatarURL({ extension: 'png', size: 256 }));

    ctx.drawImage(avatar1, 50, 70, 160, 160);
    ctx.drawImage(avatar2, 490, 70, 160, 160);

    // DİNAMİK KALP
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.arc(350, 160, 65, 0, Math.PI * 2);
    ctx.fill();

    const drawHeartPath = () => {
        ctx.beginPath();
        ctx.moveTo(350, 210);
        ctx.bezierCurveTo(350, 205, 295, 165, 295, 135);
        ctx.bezierCurveTo(295, 105, 325, 105, 350, 125);
        ctx.bezierCurveTo(375, 105, 405, 105, 405, 135);
        ctx.bezierCurveTo(405, 165, 350, 205, 350, 210);
        ctx.closePath();
    };

    drawHeartPath();
    ctx.fillStyle = '#f3d5e0';
    ctx.fill();

    ctx.save();
    drawHeartPath();
    ctx.clip();

    const heartTop = 105;
    const heartHeight = 105;
    const fillHeight = (rate / 100) * heartHeight;
    const fillY = (heartTop + heartHeight) - fillHeight;

    ctx.fillStyle = '#ff4081';
    ctx.fillRect(290, fillY, 120, fillHeight);
    ctx.restore();

    drawHeartPath();
    ctx.strokeStyle = '#ff4081';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#222222';
    ctx.font = 'bold 30px Sans-Serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'white';
    ctx.shadowBlur = 4;
    ctx.fillText(`%${rate}`, 350, 168);
    ctx.shadowColor = 'transparent';

    return canvas.toBuffer('image/png');
}

// --- BOT OLAY DİNLENİCİLERİ ---
client.once(Events.ClientReady, () => {
    console.log(`[BOT AKTİF] ${client.user.tag} olarak başarıyla giriş yapıldı!`);
    client.user.setActivity('.ship | .itiraf', { type: 3 });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // --- 1. .ITIRAFSETUP ---
    if (message.content.startsWith(`${PREFIX}itirafsetup`)) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("❌ Bu komutu kullanmak için `Yönetici` yetkisine sahip olmalısın.");
        }

        await message.delete().catch(() => {});

        const setupEmbed = new EmbedBuilder()
            .setTitle('🤫 Anonim İtiraf Paneli')
            .setDescription('Aşağıdaki **İtiraf Et 🤫** butonuna basarak sunucuya tamamen gizli ve anonim bir şekilde itirafta bulunabilirsin.\n\n*(Kimliğiniz hiçbir şekilde görünmez ve kaydedilmez.)*')
            .setColor('#2F3136')
            .setImage("https://i.imgur.com/uahupKZ.jpg")
            .setFooter({ text: `${message.guild.name} • İtiraf Sistemi`, iconURL: message.guild.iconURL() });

        const setupRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_itiraf_ac')
                .setLabel('İtiraf Et 🤫')
                .setStyle(ButtonStyle.Danger)
        );

        return message.channel.send({ embeds: [setupEmbed], components: [setupRow] });
    }

    // --- 2. .SHIP ---
    if (message.content.startsWith(`${PREFIX}ship`)) {
        // Gecikme yaşanmaması için "yükleniyor" mesajı yolluyoruz
        const loadingMsg = await message.reply("💖 Ship kartı çiziliyor, lütfen bekleyin...");

        let targetUser = message.mentions.users.first();

        if (!targetUser) {
            try {
                const fetchedMembers = await message.guild.members.fetch();
                const validMembers = fetchedMembers.filter(m => !m.user.bot && m.id !== message.author.id);
                
                if (validMembers.size === 0) {
                    await loadingMsg.delete().catch(() => {});
                    return message.reply("Sunucuda ship yapılabilecek başka bir kullanıcı bulunamadı.");
                }
                targetUser = validMembers.random().user;
            } catch (e) {
                const cacheMembers = message.guild.members.cache.filter(m => !m.user.bot && m.id !== message.author.id);
                if (cacheMembers.size === 0) {
                    await loadingMsg.delete().catch(() => {});
                    return message.reply("Sunucudaki üyelere ulaşılamadı. Lütfen birini etiketleyin: `.ship @kullanıcı`");
                }
                targetUser = cacheMembers.random().user;
            }
        }

        if (targetUser.id === message.author.id) {
            await loadingMsg.delete().catch(() => {});
            return message.reply("Kendinle ship yapamazsın! Başka birini etiketle veya direkt `.ship` yaz.");
        }

        const loveRate = Math.floor(Math.random() * 101);
        
        // Canvas işlemi burada çalışır
        const canvasBuffer = await createShipCanvas(message.author, targetUser, loveRate);

        const shipEmbed = new EmbedBuilder()
            .setTitle(`[ • ${message.author.username} & • ${targetUser.username} ]`)
            .setColor(loveRate >= 65 ? '#FF1493' : '#5865F2')
            .setImage('attachment://ship.png')
            .setTimestamp();

        const row = new ActionRowBuilder();

        if (loveRate >= 65) {
            const randomMusic = spotifyList[Math.floor(Math.random() * spotifyList.length)];
            shipEmbed.addFields({ 
                name: '🟢 ─────────────────── 🟢', 
                value: `🎧 **Aşk Parçanız:** [${randomMusic.title}](${randomMusic.url})\n\n> 🎵 **[Spotify'da Dinlemek İçin Tıklayın](${randomMusic.url})**` 
            });

            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`tanis_${message.author.id}_${targetUser.id}`)
                    .setLabel('Tanış 💌')
                    .setStyle(ButtonStyle.Primary)
            );
        }

        if (loveRate >= 75) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`opucuk_${message.author.id}_${targetUser.id}`)
                    .setLabel('Öpücük Kondur 💋')
                    .setStyle(ButtonStyle.Secondary)
            );
        }

        if (loveRate >= 90) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`evlen_${message.author.id}_${targetUser.id}_${loveRate}`)
                    .setLabel('Evlen 💍')
                    .setStyle(ButtonStyle.Success)
            );
        }

        // Yükleniyor mesajını silip sonucu yolluyoruz
        await loadingMsg.delete().catch(() => {});
        const replyMsg = await message.channel.send({
            embeds: [shipEmbed],
            files: [{ attachment: canvasBuffer, name: 'ship.png' }],
            components: row.components.length > 0 ? [row] : []
        });

        if (row.components.length > 0) {
            const collector = replyMsg.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 300000 // 5 dakika geçerli
            });

            collector.on('collect', async (interaction) => {
                const [action, authorId, partnerId, rate] = interaction.customId.split('_');

                if (interaction.user.id !== authorId) {
                    return interaction.reply({ content: '❌ Bu butona sadece ship komutunu başlatan kişi basabilir.', flags: 64 });
                }

                const pUser = await client.users.fetch(partnerId);

                if (action === 'tanis') {
                    try {
                        await pUser.send(`👋 Merhaba **${pUser.username}**! **${message.guild.name}** sunucusundaki **${interaction.user.username}** seninle \`.ship\` yaptı (Uyum: %${loveRate}) ve seninle tanışmak istiyor! ✨`);
                        await interaction.reply({ content: `✅ **${pUser.username}** kullanıcısının DM kutusuna tanışma isteğin iletildi!`, flags: 64 });
                    } catch (e) {
                        await interaction.reply({ content: `❌ **${pUser.username}** kullanıcısının DM kutusu kapalı olduğu için mesaj iletilemedi.`, flags: 64 });
                    }
                }

                if (action === 'opucuk') {
                    try {
                        await pUser.send(`💋 **${interaction.user.username}** sana **${message.guild.name}** sunucusundan tatlı bir öpücük gönderdi! 😘`);
                        await interaction.reply({ content: `✅ **${pUser.username}** kullanıcısına öpücük gönderildi! 💋`, flags: 64 });
                    } catch (e) {
                        await interaction.reply({ content: `❌ **${pUser.username}** kullanıcısının DM kutusu kapalı olduğu için öpücük iletilemedi.`, flags: 64 });
                    }
                }

                if (action === 'evlen') {
                    const offerId = `${authorId}_${partnerId}_${Date.now()}`;
                    evlilikTeklifleri.set(offerId, {
                        user1: authorId,
                        user2: partnerId,
                        user1Confirm: false,
                        user2Confirm: false
                    });

                    // Bellek temizliği (10 dakika sonra teklif verisi silinir)
                    setTimeout(() => evlilikTeklifleri.delete(offerId), 10 * 60 * 1000);

                    const sendMarriageDM = async (target, other) => {
                        const mRow = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId(`m_accept_${offerId}_${target.id}`).setLabel('Evlen 💍').setStyle(ButtonStyle.Success),
                            new ButtonBuilder().setCustomId(`m_reject_${offerId}_${target.id}`).setLabel('Reddet ❌').setStyle(ButtonStyle.Danger)
                        );

                        const mEmbed = new EmbedBuilder()
                            .setTitle('💍 EVLİLİK TEKLİFİ!')
                            .setDescription(`**${message.guild.name}** sunucusundaki Ship oranınız **%${rate}** çıktı!\n**${other.username}** ile evlenmek istiyor musun?`)
                            .setColor('#FF69B4');

                        return target.send({ embeds: [mEmbed], components: [mRow] });
                    };

                    try {
                        await sendMarriageDM(interaction.user, pUser);
                        await sendMarriageDM(pUser, interaction.user);
                        await interaction.reply({ content: `💍 İki tarafa da DM üzerinden evlilik teklif mesajı gönderildi! Lütfen DM kutularınızı kontrol edin.`, flags: 64 });
                    } catch (err) {
                        await interaction.reply({ content: `⚠️ Mesaj gönderilemedi. Taraflardan birinin DM kutusu kapalı olabilir.`, flags: 64 });
                    }
                }
            });
        }
    }
});

// --- MODAL VE DM BUTON DİNLENİCİSİ ---
client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'btn_itiraf_ac') {
        const modal = new ModalBuilder()
            .setCustomId('modal_itiraf_form')
            .setTitle('🤫 Gizli İtiraf Kutusu');

        const itirafInput = new TextInputBuilder()
            .setCustomId('txt_itiraf_icerik')
            .setLabel('İtirafınızı Giriniz')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Buraya yazacaklarınız tamamen gizli kalacaktır...')
            .setRequired(true)
            .setMaxLength(500);

        const firstActionRow = new ActionRowBuilder().addComponents(itirafInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
        return;
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_itiraf_form') {
        await interaction.deferReply({ flags: 64 });

        const itirafMetni = interaction.fields.getTextInputValue('txt_itiraf_icerik');

        const imageBuffer = await createItirafCanvas(itirafMetni);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'itiraf.png' });

        await interaction.channel.send({ files: [attachment] });
        await interaction.editReply({ content: '✅ İtirafınız resimli ve tamamen anonim olarak kanala gönderildi!' });
        return;
    }

    if (interaction.isButton() && !interaction.guildId) {
        const [type, status, offerId, userId] = interaction.customId.split('_');
        if (type !== 'm') return;

        const offer = evlilikTeklifleri.get(offerId);
        if (!offer) {
            return interaction.reply({ content: '❌ Bu evlilik teklifinin süresi dolmuş veya geçersiz.', flags: 64 });
        }

        const u1 = await client.users.fetch(offer.user1);
        const u2 = await client.users.fetch(offer.user2);

        if (status === 'reject') {
            evlilikTeklifleri.delete(offerId);
            await u1.send(`💔 Ne yazık ki evlilik teklifi taraflardan biri tarafından reddedildi.`).catch(() => {});
            await u2.send(`💔 Ne yazık ki evlilik teklifi taraflardan biri tarafından reddedildi.`).catch(() => {});
            return;
        }

        if (status === 'accept') {
            if (userId === offer.user1) offer.user1Confirm = true;
            if (userId === offer.user2) offer.user2Confirm = true;

            await interaction.reply({ content: '✅ Seçimin kaydedildi! Diğer tarafın cevabı bekleniyor...', flags: 64 });

            if (offer.user1Confirm && offer.user2Confirm) {
                evlilikTeklifleri.delete(offerId);

                const marriedEmbed = new EmbedBuilder()
                    .setTitle('🎉 TEBRİKLER! RESMEN EVLENDİNİZ! 💍')
                    .setDescription(`**${u1.username}** ❤️ **${u2.username}**\n\nSonsuza dek mutlu olmanız dileğiyle!`)
                    .setColor('#FF1493');

                await u1.send({ embeds: [marriedEmbed] }).catch(() => {});
                await u2.send({ embeds: [marriedEmbed] }).catch(() => {});
            }
        }
    }
});

// Bot Girişi
client.login(process.env.TOKEN);
