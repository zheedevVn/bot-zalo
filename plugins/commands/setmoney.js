module.exports.config = {
  name: 'setmoney',
  version: '1.0.1',
  role: 2,
  author: 'DucMinh',
  description: 'Thêm hoặc đặt số tiền của bản thân hoặc người khác',
  category: 'Tiện ích',
  usage: 'setmoney [set/add/take] [@tag] [số tiền]',
  cooldowns: 2,
  dependencies: {}
};

const { TextStyle } = require("zca-js");

module.exports.run = async ({ args, event, api, Users }) => {
  const { threadId, type, data } = event;

  const subcommand = (args[0] || '').toLowerCase();
  const mentions = data.mentions;
  const hasMention = mentions && mentions.length > 0;
  const senderID = data.uidFrom;

  const targetID = hasMention ? mentions[0].uid : senderID;
  let targetName = "Bạn";

  if (hasMention) {
    try {
      const info = await api.getUserInfo(targetID);
      targetName = info?.changed_profiles?.[targetID]?.displayName || "Người được tag";
    } catch (err) {
      targetName = "Người được tag";
    }
  }

  try {
    const userDataResult = await Users.getData(targetID);
    const userData = userDataResult.data;

    switch (subcommand) {
      case 'set': {
        let amountArg = null;
        for (let i = args.length - 1; i >= 1; i--) {
          if (!isNaN(args[i]) && args[i] !== '') {
            amountArg = args[i];
            break;
          }
        }
        if (!amountArg || isNaN(amountArg)) {
          return api.sendMessage("❌ Dùng: setmoney set [@tag] [số tiền]", threadId, type);
        }
        userData.money = parseInt(amountArg);
        await Users.setData(targetID, userData);
        const text = `✅ Đã đặt lại số tiền của ${targetName} thành ${userData.money.toLocaleString('vi-VN')}₫`;
        const targetIndex = text.indexOf(targetName);
        const moneyIndex = text.lastIndexOf(userData.money.toLocaleString('vi-VN'));
        return api.sendMessage({
          msg: text,
          styles: [
            ...(targetIndex >= 0 ? [{ start: targetIndex, len: targetName.length, st: TextStyle.Bold }, { start: targetIndex, len: targetName.length, st: TextStyle.Italic }] : []),
            ...(moneyIndex >= 0 ? [{ start: moneyIndex, len: userData.money.toLocaleString('vi-VN').length, st: TextStyle.Bold }] : [])
          ]
        }, threadId, type);
      }

      case 'add': {

        let amountArg = null;
        for (let i = args.length - 1; i >= 1; i--) {
          if (!isNaN(args[i]) && args[i] !== '') {
            amountArg = args[i];
            break;
          }
        }
        if (!amountArg || isNaN(amountArg)) {
          return api.sendMessage("❌ Dùng: setmoney add [@tag] [số tiền]", threadId, type);
        }
        const amountToAdd = parseInt(amountArg);
        userData.money += amountToAdd;
        await Users.setData(targetID, userData);
        const text = `✅ Đã cộng thêm ${amountToAdd.toLocaleString('vi-VN')}₫ cho ${targetName}\n💰 Tổng cộng: ${userData.money.toLocaleString('vi-VN')}₫`;
        const targetIndex = text.indexOf(targetName);
        const totalIndex = text.lastIndexOf(userData.money.toLocaleString('vi-VN'));
        return api.sendMessage({
          msg: text,
          styles: [
            ...(targetIndex >= 0 ? [{ start: targetIndex, len: targetName.length, st: TextStyle.Bold }, { start: targetIndex, len: targetName.length, st: TextStyle.Italic }] : []),
            ...(totalIndex >= 0 ? [{ start: totalIndex, len: userData.money.toLocaleString('vi-VN').length, st: TextStyle.Bold }] : [])
          ]
        }, threadId, type);
      }

      case 'take': {

        let amountArg = null;
        for (let i = args.length - 1; i >= 1; i--) {
          if (!isNaN(args[i]) && args[i] !== '') {
            amountArg = args[i];
            break;
          }
        }
        if (!amountArg || isNaN(amountArg)) {
          return api.sendMessage("❌ Dùng: setmoney take [@tag] [số tiền]", threadId, type);
        }
        const amountToTake = parseInt(amountArg);
        userData.money -= amountToTake;
        await Users.setData(targetID, userData);
        const text = `✅ Đã lấy ${amountToTake.toLocaleString('vi-VN')}₫ của ${targetName}\n💰 Tổng cộng: ${userData.money.toLocaleString('vi-VN')}₫`;
        const targetIndex = text.indexOf(targetName);
        const totalIndex = text.lastIndexOf(userData.money.toLocaleString('vi-VN'));
        return api.sendMessage({
          msg: text,
          styles: [
            ...(targetIndex >= 0 ? [{ start: targetIndex, len: targetName.length, st: TextStyle.Bold }, { start: targetIndex, len: targetName.length, st: TextStyle.Italic }] : []),
            ...(totalIndex >= 0 ? [{ start: totalIndex, len: userData.money.toLocaleString('vi-VN').length, st: TextStyle.Bold }] : [])
          ]
        }, threadId, type);
      }

      default:
        return api.sendMessage("❌ Lệnh không hợp lệ. Dùng: setmoney set/add/take [@tag] [số tiền]", threadId, type);
    }
  } catch (err) {
    console.error(err);
    return api.sendMessage(
      "❌ Không thể xử lý yêu cầu. Vui lòng thử lại sau.",
      threadId,
      type
    );
  }
};
