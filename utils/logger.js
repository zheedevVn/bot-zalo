const chalk = require('chalk');
const { DateTime } = require("luxon");
const axios = require("axios");

async function printBanner() {
  const newVersion = (await axios.get("https://raw.githubusercontent.com/Shinchan0911/Zeid_Bot/refs/heads/main/package.json")).data.version;
  const projectVersion = require("../package.json").version;
  console.clear();

  const banner = [
    chalk.bold.cyanBright("╔══════════════════════════════════════════════════════════════╗"),
    chalk.bold.cyanBright("║                    D U C M I N H                           ║"),
    chalk.bold.cyanBright("║                    B O T   S Y S T E M                     ║"),
    chalk.bold.cyanBright("╚══════════════════════════════════════════════════════════════╝")
  ];

  banner.forEach(line => console.log(line));

  console.log(chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log("» " + chalk.green("Version: ") + chalk.white(projectVersion));
  console.log("» " + chalk.green("Author : ") + chalk.white("DucMinh - ZheeScary"));
  console.log("» " + chalk.green("GitHub : ") + chalk.underline("https://github.com/hoducminh122"));
  console.log(chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));
  if (projectVersion != newVersion) log("New version: " + newVersion + "\n", "warn");
}

function getTimestamp() {
  const now = DateTime.now().setZone('Asia/Ho_Chi_Minh');
  return `[${now.toFormat("HH:mm:ss")}]`;
}

function log(data, option) {
    const time = getTimestamp();
    switch (option) {
        case "warn":
            console.log(chalk.bold.hex("#FFD700")(time +' » ') + data);
            break;
        case "error":
            console.log(chalk.bold.hex("#FF0000")(time +' » ') + data);
            break;
        case "info":
            console.log(chalk.bold.hex("#00BFFF")(time +' » ') + data);
            break;
        default:
          console.log(chalk.bold.hex("#00BFFF")(data));
    }
}

module.exports = {
    log,
    printBanner
};
