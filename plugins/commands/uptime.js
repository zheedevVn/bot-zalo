module.exports.config = {
  name: 'uptime',
  version: '1.0.0',
  role: 0,
  author: 'DucMinh',
  description: 'Hiển thị thời gian hoạt động của bot',
  category: 'Hệ thống',
  usage: 'uptime',
  cooldowns: 2,
  dependencies: {}
};

module.exports.run = async ({ event, api }) => {
  const { threadId, type } = event;
  
  const name_bot = global.config.name_bot;

  const uptime = process.uptime(); // thời gian hoạt động tính bằng giây
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  const parts = [];
  if (hours > 0) parts.push(`${hours} giờ`);
  if (minutes > 0) parts.push(`${minutes} phút`);
  parts.push(`${seconds} giây`);

  const replyMsg = `╔══════════════════════════════╗\n║  ${name_bot.toUpperCase()}  ║\n╚══════════════════════════════╝\n\n🤖 Bot đã hoạt động: ${parts.join(' ')}`;

  await api.sendMessage({msg: replyMsg, ttl: 60000}, threadId, type);
};
