const fs = require("fs");
const path = require("path");
const YAML = require("yaml");
const login = require("./core/login");
const logger = require("./utils/logger");
const listener = require("./core/listen");
const loaderCommand = require("./core/loader/loaderCommand");
const loaderEvent = require("./core/loader/loaderEvent");
const schedule = require("node-schedule");
const { cleanOldMessages } = require("./utils/index");

global.client = new Object({
    commands: new Map(),
    events: new Map(),
    cooldowns: new Map()
});

global.users = {
  admin: [],
  support: []
};

global.config = new Object();

global.api = null;

(async () => {

try {
    const configPath = path.join(__dirname, "config.yml");
    const fileContent = fs.readFileSync(configPath, "utf8");
    const config = YAML.parse(fileContent);

    global.config = config;
    global.users = {
      admin: Array.isArray(config.admin_bot) ? config.admin_bot.map(String) : [],
      support: Array.isArray(config.support_bot) ? config.support_bot.map(String) : []
    };
    logger.log("Đã tải cấu hình từ config.yml thành công", "info");
} catch (error) {
    logger.log(`Lỗi khi đọc config.yml: ${error.message || error}`, "error");
    process.exit(1);
}

const tempFolderCommand = path.join(__dirname, "plugins", "commands", "temp");
const tempFolderEvent = path.join(__dirname, "plugins", "events", "temp");

try {
  if (fs.existsSync(tempFolderCommand)) {
    fs.rmSync(tempFolderCommand, { recursive: true, force: true });
    logger.log("Đã dọn dẹp folder temp của commands", "info");
  } 
  if (fs.existsSync(tempFolderEvent)) {
    fs.rmSync(tempFolderEvent, { recursive: true, force: true });
    logger.log("Đã dọn dẹp folder temp của events", "info");
  }
} catch (error) {
  logger.log(`Lỗi khi dọn folder temp: ${error.message || error}`, "error");
}

logger.log("\n╔══════════════════════ SYSTEM INFO ═══════════════════════╗");
logger.log(`║ Bot name         : ${global.config.name_bot}`);
logger.log(`║ Prefix           : ${global.config.prefix}`);
logger.log(`║ Login mode       : ${global.config.login_qrcode ? "QR fallback" : "Cookie"}`);
logger.log(`║ Admin count      : ${global.users.admin.length}`);
logger.log(`║ Support count    : ${global.users.support.length}`);
logger.log(`║ Bot status       : ONLINE`);
logger.log(`║ Runtime          : ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`);
logger.log("╚════════════════════════════════════════════════════════════╝\n");

if (global.users.admin.length) {
  logger.log("📋 ADMIN LIST");
  global.users.admin.forEach((id, idx) => logger.log(`${idx + 1}. ${id}`));
}
if (global.users.support.length) {
  logger.log("📋 SUPPORT LIST");
  global.users.support.forEach((id, idx) => logger.log(`${idx + 1}. ${id}`));
}

schedule.scheduleJob("0 * * * * *", () => {
    cleanOldMessages();
});

const api = await login();
global.api = api;

logger.log("✅ Đăng nhập thành công bằng Cookie", "info");

try {
  const groups = typeof api.getAllGroups === "function" ? await api.getAllGroups() : [];
  logger.log("\n╔══════════════════════ GROUP STATUS ══════════════════════╗");
  logger.log(`║ Tổng nhóm        : ${Array.isArray(groups) ? groups.length : 0}`);
  logger.log(`║ Bot status       : ONLINE`);
  logger.log(`║ Trạng thái       : Hoạt động bình thường`);
  if (Array.isArray(groups) && groups.length > 0) {
    groups.forEach((group, index) => {
      const groupName = group?.name || group?.threadName || `Nhóm ${index + 1}`;
      const groupId = group?.id || group?.threadId || "Unknown";
      const memberCount = group?.memberCount || group?.participantCount || "N/A";
      logger.log(`║ ${String(index + 1).padStart(2, "0")}. ${groupName.slice(0, 28).padEnd(28, " ")} | ${String(groupId).slice(0, 18).padEnd(18, " ")} | ${String(memberCount).padStart(3, " ")} users`);
    });
  } else {
    logger.log("║ Không lấy được danh sách nhóm hoặc không có nhóm nào.");
  }
  logger.log("╚════════════════════════════════════════════════════════════╝\n");
} catch (error) {
  logger.log(`⚠️ Không thể lấy trạng thái nhóm: ${error.message || error}`, "warn");
}

await loaderCommand();
await loaderEvent();

listener(api);

})();
