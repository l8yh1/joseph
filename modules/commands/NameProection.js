module.exports.config = {
  name: "نيم",
  version: "1.0.2",
  hasPermssion: 2,
  credits: "SAI",
  description: "تغيير اسم المجموعة باستمرار",
  commandCategory: "نظام",
  usages: "[تشغيل/ايقاف] [الاسم]",
  cooldowns: 5
};

let nameIntervals = {};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const action = args[0];
  const botName = args.slice(1).join(" ");

  if (action === "تشغيل") {
    if (!botName) return api.sendMessage("الرجاء إدخال الاسم المطلوب بعد كلمة تشغيل.", threadID, messageID);
    if (nameIntervals[threadID]) return api.sendMessage("النظام مفعل بالفعل.", threadID, messageID);

    api.sendMessage(تم البدء! سيتم تغيير الاسم إلى: ${botName} باستمرار., threadID);
    
    const protectName = async () => {
      try {
        await api.setTitle(botName, threadID);
      } catch (e) {}
    };

    await protectName(); 
    nameIntervals[threadID] = setInterval(protectName, 5000);
  } 
  else if (action === "ايقاف") {
    if (!nameIntervals[threadID]) return api.sendMessage("النظام غير مفعل.", threadID, messageID);
    clearInterval(nameIntervals[threadID]);
    delete nameIntervals[threadID];
    api.sendMessage("تم الإيقاف بنجاح.", threadID, messageID);
  } 
  else {
    api.sendMessage("نيم [تشغيل/ايقاف] [الاسم]", threadID, messageID);
  }
};
