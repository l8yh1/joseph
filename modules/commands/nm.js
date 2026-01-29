if (!global.nameLocks) global.nameLocks = new Map();

module.exports.config = {
  name: "nm",
  version: "1.3.1",
  hasPermssion: 2,
  credits: "Replit Agent",
  description: "قفل اسم المجموعة تماماً مع منع التكرار اللانهائي",
  commandCategory: "نظام",
  prefix: true,
  usages: "[الاسم]",
  cooldowns: 5
};

module.exports.onLoad = function ({ api }) {
  console.log("DEBUG: Loading 'nm' command...");
  if (global.nmInterval) clearInterval(global.nmInterval);
  
  global.nmInterval = setInterval(async () => {
    if (!global.nameLocks) return;

    for (const [threadID, lockedName] of global.nameLocks.entries()) {
      try {
        const info = await api.getThreadInfo(threadID);
        if (info.threadName !== lockedName) {
          console.log(`[NM] Correcting name for ${threadID} to ${lockedName}`);
          await api.setTitle(lockedName, threadID);
        }
      } catch (e) {
        if (e.error === 1545012 || e.error === 1357004 || e.error === 1357035) {
           global.nameLocks.delete(threadID);
        }
      }
    }
  }, 10000); // Check every 10 seconds for faster correction
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, logMessageType, logMessageData, author } = event;
  if (!global.nameLocks || !global.nameLocks.has(threadID)) return;
  if (String(author) === String(api.getCurrentUserID())) return; 

  if (logMessageType === "log:thread-name") {
    const lockedName = global.nameLocks.get(threadID);
    const newName = logMessageData.name || logMessageData.threadName;
    if (newName !== lockedName) {
      console.log(`[NM Event] Correction triggered for ${threadID}`);
      try {
        await api.setTitle(lockedName, threadID);
      } catch (e) {
        console.error(`[NM Event Error] ${e.message}`);
      }
    }
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID } = event;

  // 1. يقدر يستعمله فقط ادمن البوت
  const botAdmins = (global.config.ADMINBOT || []).map(String);
  if (!botAdmins.includes(String(senderID))) {
    return api.sendMessage("❌ هذا الأمر مخصص لأدمن البوت فقط.", threadID);
  }

  const name = args.join(" ");
  if (!name) {
    if (global.nameLocks && global.nameLocks.has(threadID)) {
       return api.sendMessage(`ℹ️ اسم المجموعة مقفل حالياً على:\n${global.nameLocks.get(threadID)}\n\nلإلغاء القفل استخدم: !unm`, threadID);
    }
    return api.sendMessage("⚠️ الاستخدام: !nm [اسم المجموعة]", threadID);
  }

  try {
    if (!global.nameLocks) global.nameLocks = new Map();
    
    // 2. محاولة تغيير الاسم وقفلـه في الذاكرة أولاً
    // ملاحظة تقنية: إذا لم يكن البوت مسؤولاً، قد تفشل محاولة تغيير الاسم برمجياً
    // لكننا سنقوم بتفعيل القفل في ذاكرة البوت على أي حال بناءً على طلبك
    global.nameLocks.set(threadID, name);
    
    await api.setTitle(name, threadID);
    return api.sendMessage(`🔒 تم البدء في محاولة فرض اسم المجموعة وقفلها على:\n${name}`, threadID);
  } catch (e) {
    // حتى لو فشل التغيير الأولي، القفل الآن مفعل في Map وسيحاول البوت إعادة الاسم عند أي حدث
    return api.sendMessage(`⚠️ لم أتمكن من تغيير الاسم فوراً (ربما لنقص الصلاحيات)، لكن تم تفعيل القفل. سأحاول تغيير الاسم بمجرد توفر الفرصة أو عند محاولة أي شخص تعديله.`, threadID);
  }
};
