module.exports.config = {
    name: "id",
    version: "1.2.0",
    role: 0,
    author: "DucMinh",
    description: "Lấy userId của người dùng, hoặc ID của nhóm chat.",
    category: "Tiện ích",
    usage: "id | id [số điện thoại] | id box | id @user (có thể tag nhiều)",
    cooldowns: 2,
    dependencies: {}
};

const { ThreadType } = require("zca-js");

module.exports.run = async ({ args, event, api }) => {
    const { threadId, type, data } = event;

    if (args[0]?.toLowerCase() === "box") {
        if (type === ThreadType.Group) {
            try {
                const groupInfo = await api.getGroupInfo(threadId);
                const details = groupInfo.gridInfoMap?.[threadId];
                const groupName = details?.name || "Không rõ tên nhóm";
                return api.sendMessage(`🧩 Tên nhóm: ${groupName}\n🆔 ID nhóm: ${threadId}`, threadId, type);
            } catch (err) {
                console.error("Lỗi khi lấy thông tin nhóm:", err);
                return api.sendMessage("❌ Không thể lấy thông tin nhóm hiện tại.", threadId, type);
            }
        } else {
            return api.sendMessage("❌ Lệnh này chỉ sử dụng trong nhóm.", threadId, type);
        }
    }

    const mentions = data.mentions;
    if (mentions && mentions.length > 0) {
        const nameList = await Promise.all(mentions.map(async m => {
            const uid = m.uid;
            try {
                const info = await api.getUserInfo(uid);
                const name = info?.changed_profiles?.[uid]?.displayName || "Không rõ tên";
                return `👤 ${name} - ${uid}`;
            } catch {
                return `👤 (Không lấy được tên) - ${uid}`;
            }
        }));
        return api.sendMessage(`📌 Danh sách ID người được tag:\n${nameList.join("\n")}`, threadId, type);
    }

    if (args.length === 0) {
        try {
            const senderId = data.uidFrom;
            const info = await api.getUserInfo(senderId);
            const name = info?.changed_profiles?.[senderId]?.displayName || "Không rõ tên";
            return api.sendMessage(`🙋 Tên của bạn: ${name}\n🆔 ID: ${senderId}`, threadId, type);
        } catch (error) {
            console.error("Lỗi khi lấy ID người gửi:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi lấy ID của bạn.", threadId, type);
        }
    }

    const phoneNumber = args[0];
    try {
        const userInfo = await api.findUser(phoneNumber);
        if (userInfo?.uid) {
            const targetId = userInfo.uid;
            await api.sendMessage(`📞 Tìm thấy người dùng với SĐT ${phoneNumber}!\n🆔 ID: ${targetId}`, threadId, type);
            await api.sendCard({
                userId: targetId,
                phoneNumber
            }, threadId, type);
        } else {
            await api.sendMessage(`❌ Không tìm thấy người dùng với số điện thoại "${phoneNumber}".`, threadId, type);
        }
    } catch (err) {
        console.error(`Lỗi khi tìm SĐT ${phoneNumber}:`, err);
        return api.sendMessage("❌ Có lỗi xảy ra khi tìm kiếm số điện thoại.", threadId, type);
    }
};
