const moment = require("moment-timezone");
const stringSimilarity = require('string-similarity');
const { TextStyle } = require("zca-js");

module.exports.config = {
    name: "menu",
    aliases: ['help'],
    version: "1.0.0",
    role: 0,
    author: "DucMinh",
    description: "Xem danh sách lệnh và info",
    category: "Tiện ích",
    usage: "[tên lệnh/all]",
    cooldowns: 2,
    dependencies: {
        "string-similarity": "",
        "moment-timezone": ""
    }
};

function getDayVN() {
    const days = {
        'Sunday': 'Chủ Nhật',
        'Monday': 'Thứ Hai',
        'Tuesday': 'Thứ Ba',
        'Wednesday': 'Thứ Tư',
        'Thursday': 'Thứ Năm',
        'Friday': 'Thứ Sáu',
        'Saturday': 'Thứ Bảy'
    };
    const thu = moment.tz('Asia/Ho_Chi_Minh').format('dddd');
    return days[thu] || thu;
}

function TextPr(permission) {
    return permission == 0 ? "Thành Viên" : permission == 1 ? "Support Bot" : permission == 2 ? "Admin Bot" : "Toàn Quyền";
}

function sortByLengthDesc(arr, key) {
    return arr.sort((a, b) => b[key].length - a[key].length);
}

function getUserRole(senderId, adminList, supportList) {
    if (Array.isArray(adminList) && adminList.includes(String(senderId))) return 2;
    if (Array.isArray(supportList) && supportList.includes(String(senderId))) return 1;
    return 0;
}

function buildCommandSection(title, commands) {
    if (!commands || commands.length === 0) return "";

    const icons = {
        "USER COMMANDS": "⚡",
        "SUPPORT COMMANDS": "🛡️",
        "ADMIN COMMANDS": "👑"
    };

    const lines = [`╭───── [ ${icons[title] || "✨"} ${title} ] ─────`];
    commands.forEach((cmd, index) => {
        const usage = cmd.usage || "Không có cú pháp";
        const desc = cmd.description || "Không có mô tả";
        const name = cmd.name || "unknown";
        lines.push(`│ ${index + 1}. ${name}  •  ${desc}`);
        lines.push(`│   ▸ ${usage}`);
    });
    lines.push(`╰────────────────────────────────────────`);
    return `${lines.join("\n")}\n\n`;
}

function buildPremiumHeader(nameBot) {
    const title = nameBot.toUpperCase();
    return `╔═══════════════════════════════════════╗\n║        ${title.padEnd(27, ' ')}║\n║        ${' '.repeat(27)}║\n╚═══════════════════════════════════════╝\n`;
}

function collectHighlightStyles(text, highlights) {
    const styles = [];

    for (const item of highlights) {
        const start = text.indexOf(item.text);
        if (start >= 0) {
            styles.push({ start, len: item.text.length, st: item.style });
        }
    }

    return styles;
}

async function sendSafeMessage(api, threadId, type, payload, ttl = 15000, maxLength = 1800) {
    const message = typeof payload === 'string' ? { msg: payload, ttl } : { ...payload, ttl: payload.ttl ?? ttl };
    if (!message.msg) return;
    if (message.msg.length <= maxLength) {
        return api.sendMessage(message, threadId, type);
    }

    const lines = message.msg.split(/\n/);
    let chunk = "";
    const chunks = [];

    for (const line of lines) {
        if ((chunk + line + "\n").length > maxLength && chunk.trim()) {
            chunks.push(chunk.trimEnd());
            chunk = line + "\n";
        } else {
            chunk += line + "\n";
        }
    }

    if (chunk.trim()) chunks.push(chunk.trimEnd());

    for (let i = 0; i < chunks.length; i++) {
        await api.sendMessage({ msg: chunks[i], ttl }, threadId, type);
    }
}

function styleImportant(text, targetText) {
    const start = text.indexOf(targetText);
    if (start < 0) return [];
    return [
        { start, len: targetText.length, st: TextStyle.Bold },
        { start, len: targetText.length, st: TextStyle.Italic }
    ];
}

async function sendMenuParts(api, threadId, type, parts) {
    for (const part of parts) {
        if (!part || !part.msg) continue;
        const payload = { msg: part.msg, ttl: 15000 };
        if (Array.isArray(part.styles) && part.styles.length) payload.styles = part.styles;
        await api.sendMessage(payload, threadId, type);
    }
}

module.exports.run = async function({ api, event, args, Threads }) {
    const { threadId, type, data } = event;
    const senderId = data.uidFrom;
    const cmds = global.client.commands;
    const TIDdata = (global.data && global.data.threadData && global.data.threadData.get)
        ? global.data.threadData.get(threadId) || {}
        : {};
    const config = global.config;
    const admin = Array.isArray(config.admin_bot) ? config.admin_bot : [];
    const support = Array.isArray(config.support_bot) ? config.support_bot : [];
    const NameBot = config.name_bot;
    const prefix = (typeof TIDdata.PREFIX === "string" && TIDdata.PREFIX.length > 0)
        ? TIDdata.PREFIX
        : config.prefix;
    const argType = args[0] ? args[0].toLowerCase() : "";
    const userRole = getUserRole(senderId, admin, support);
    let msg = "";

    const allVisibleCommands = Array.from(cmds.values())
        .map(cmd => cmd.config)
        .filter(cmd => {
            if (cmd.role === 2) return userRole >= 2;
            if (cmd.role === 1) return userRole >= 1;
            return true;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    if (argType === "all") {
        const commandGroups = {
            user: allVisibleCommands.filter(cmd => cmd.role === 0),
            support: allVisibleCommands.filter(cmd => cmd.role === 1),
            admin: allVisibleCommands.filter(cmd => cmd.role === 2)
        };

        const menuParts = [];
        menuParts.push({
            msg: buildPremiumHeader(NameBot),
            styles: collectHighlightStyles(buildPremiumHeader(NameBot), [
                { text: NameBot.toUpperCase(), style: TextStyle.Bold },
                { text: NameBot.toUpperCase(), style: TextStyle.Big }
            ])
        });

        if (commandGroups.user.length) menuParts.push({ msg: buildCommandSection("USER COMMANDS", commandGroups.user) });
        if (commandGroups.support.length) menuParts.push({ msg: buildCommandSection("SUPPORT COMMANDS", commandGroups.support) });
        if (commandGroups.admin.length) menuParts.push({ msg: buildCommandSection("ADMIN COMMANDS", commandGroups.admin) });

        return sendMenuParts(api, threadId, type, menuParts);
    }

    if (argType) {
        let command = Array.from(cmds.values()).find(cmd => cmd.config.name.toLowerCase() === argType);
        if (!command) {
            const commandNames = Array.from(cmds.keys());
            const checker = stringSimilarity.findBestMatch(argType, commandNames);
            if (checker.bestMatch.rating >= 0.5) {
                command = cmds.get(checker.bestMatch.target);
                msg = `⚠️ Không tìm thấy lệnh '${argType}'.\n📌 Gần giống: '${checker.bestMatch.target}'\n`;
            } else {
                msg = `⚠️ Không tìm thấy lệnh '${argType}' trong hệ thống.`;
                return api.sendMessage(msg, threadId, type);
            }
        }
        const cmd = command.config;
        const visible = (cmd.role === 2 && userRole >= 2) || (cmd.role === 1 && userRole >= 1) || cmd.role === 0;
        if (!visible) {
            return api.sendMessage(`❌ Lệnh ${cmd.name} chỉ dành cho ${TextPr(cmd.role)}.`, threadId, type);
        }

        msg += `╔════════════════════════════════════════╗\n║  THÔNG TIN LỆNH ${cmd.name.toUpperCase().padEnd(18, ' ')}║\n╚════════════════════════════════════════╝\n\n📌 Tên: ${cmd.name}\n🧩 Nhóm: ${cmd.category}\n🔐 Quyền: ${TextPr(cmd.role)}\n📝 Mô tả: ${cmd.description}\n⚙️ Cách dùng: ${prefix}${cmd.usage}\n⏳ Cooldown: ${cmd.cooldowns}s\n👤 Tác giả: ${cmd.author}`;
        const styles = [
            ...collectHighlightStyles(msg, [
                { text: cmd.name.toUpperCase(), style: TextStyle.Bold },
                { text: cmd.name.toUpperCase(), style: TextStyle.Big },
                { text: "Cách dùng", style: TextStyle.Bold },
                { text: "Quyền", style: TextStyle.Bold },
                { text: "Mô tả", style: TextStyle.Bold },
                { text: "Cooldown", style: TextStyle.Bold }
            ])
        ];
        return sendSafeMessage(api, threadId, type, { msg, styles }, 15000, 1800);
    }

    const userCommands = allVisibleCommands.filter(cmd => cmd.role === 0);
    const supportCommands = allVisibleCommands.filter(cmd => cmd.role === 1 && userRole >= 1);
    const adminCommands = allVisibleCommands.filter(cmd => cmd.role === 2 && userRole >= 2);

    const menuParts = [];
    menuParts.push({
        msg: buildPremiumHeader(NameBot),
        styles: collectHighlightStyles(buildPremiumHeader(NameBot), [
            { text: NameBot.toUpperCase(), style: TextStyle.Bold },
            { text: NameBot.toUpperCase(), style: TextStyle.Big }
        ])
    });

    const sections = [];
    if (userCommands.length) sections.push(buildCommandSection("USER COMMANDS", userCommands));
    if (supportCommands.length) sections.push(buildCommandSection("SUPPORT COMMANDS", supportCommands));
    if (adminCommands.length) sections.push(buildCommandSection("ADMIN COMMANDS", adminCommands));
    if (sections.length) {
        for (const section of sections) {
            menuParts.push({ msg: section });
        }
    } else {
        menuParts.push({ msg: "Không có lệnh nào hiển thị cho bạn." });
    }

    const threadData = await Threads.getData(event.threadId);
    const threadInfo = threadData?.data || {};
    const currentPrefix = threadInfo.prefix ? threadInfo.prefix : global.config.prefix;
    const footer = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n� Tổng lệnh: ${allVisibleCommands.length}\n👤 Quyền: ${TextPr(userRole)}\n🕒 ${moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss | DD/MM/YYYY")}\n💡 Gõ help <tên lệnh> để xem chi tiết\n💡 Gõ help all để xem toàn bộ lệnh\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    menuParts.push({
        msg: footer,
        styles: collectHighlightStyles(footer, [
            { text: "Tổng lệnh", style: TextStyle.Bold },
            { text: "Quyền của bạn", style: TextStyle.Bold },
            { text: "help", style: TextStyle.Italic },
            { text: "all", style: TextStyle.Italic }
        ])
    });

    return sendMenuParts(api, threadId, type, menuParts);
}