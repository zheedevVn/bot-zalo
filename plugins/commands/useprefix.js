const moment = require("moment-timezone");

module.exports.config = {
  name: 'prefix',
  version: '1.0.1',
  role: 0,
  author: 'DucMinh',
  description: 'Hiện tin nhắn khi sử dụng prefix',
  category: 'Không xài lệnh',
  usage: 'prefix',
  cooldowns: 2,
  dependencies: {}
};

module.exports.run = async ({ event, api }) => {
    const { threadId, type } = event;

    const timeDate = moment.tz("Asia/Ho_Chi_minh");
    const timeHours = timeDate.format("HH");
    const timeMinutes = timeDate.format("mm");
    const timeSeconds = timeDate.format("ss");

    const name_bot = global.config.name_bot;

    const uptime = process.uptime(); // thời gian hoạt động tính bằng giây
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const parts = [];
    if (hours > 0) parts.push(`${hours} giờ`);
    if (minutes > 0) parts.push(`${minutes} phút`);
    parts.push(`${seconds} giây`);

    const msg = 
`╔══════════════════════════════╗
║   ${name_bot.toUpperCase().padEnd(24, ' ')}║
╚══════════════════════════════╝
⏱️ Hoạt động: ${parts.join(' ')}
🕒 Bây giờ: ${timeHours} giờ ${timeMinutes} phút ${timeSeconds} giây
📚 Dùng help hoặc menu để xem chi tiết!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    await api.sendMessage({ msg, ttl: 20000 }, threadId, type);
}

