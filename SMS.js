const TeleBot = require('telebot')
var config = require('./AirSMS_config');
const mongoose = require('mongoose')
const requestify = require('requestify')
var shttps = require('socks5-https-client');
const crypto = require("crypto")

mongoose.connect("mongodb://localhost:27017/as");

const bot = new TeleBot({
    token: "",
})

const User = mongoose.model('Users', {
    id: Number,
    username: String,
    name: String,
    balance: Number,
    ref_balance: Number,
    ref: Number,
    ref2: Number,
    ref_profit: Number,
    reg_time: Number,
    country: String,
    operator: String,
    sms: [Object],
    fav: [String],
    info:
    {
        ref1earnings: Number,
        ref1count: Number,
        ref2earnings: Number,
        ref2count: Number,
        ref3earnings: Number,
        ref3count: Number,
    },
    notifications: {
        mm: String,
        nr: String,
        rp: String
    },
    subscrBonus: Boolean,
    state: Number,
    data: String,
    ban: Boolean,
    deposit: Number,
})

const Core = mongoose.model("core", { parameter: String, value: String })
async function getParam(parameter) { try { var val = (await Core.findOne({ parameter })).value; if (!isNaN(val) && val[0] != "+") val = Number(val); return val } catch{ } }
function setParam(parameter, value) { Core.updateOne({ parameter }, { value }, { upsert: true }).then() }
async function incParam(parameter, value) { var val = (await Core.findOne({ parameter })).value; if (!isNaN(val)) val = Number(val); val += value; await Core.updateOne({ parameter }, { value: val }, { upsert: true }) }




config.payeer = {
    enabled: true,
    account: "",
    apiId: ,
    apiPass: ""
}

async function psInit() {

    // Ключи от сервисов СМС-активаций
    config.api5sim = ``,
    config.apismsActivate = ``
    config.apiSimSMS = ""
}
psInit()




function generateID(res) { var text = ""; var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; for (var i = 0; i < res; i++)text += possible.charAt(Math.floor(Math.random() * possible.length)); return text }

console.log('\nWelcome!\n\nDeveloper: @end_software\n\nInitializing...\n\nLogs:')

function roundPlus(number) { if (isNaN(number)) return false; var m = Math.pow(10, 1); return Math.round(number * m) / m; }
async function getBal(user_id) { var u = await User.findOne({ id: user_id }); return u.balance }
async function getRoundedBal(user_id) { var u = await User.findOne({ id: user_id }); return roundPlus(u.balance) }
function isAdmin(user_id) { return ~config.admin_list.indexOf(user_id) }
function sendAdmins(text, params) { for (var i = 0; i < config.admin_list.length; i++) bot.sendMessage(config.admin_list[i], text, params) }
function setState(user_id, state) { User.findOneAndUpdate({ id: user_id }, { state: Number(state) }).then((e) => { }) }
async function getState(user_id) { var u = await User.findOne({ id: user_id }); if (u != null) return u.state; else return 0 }
function setData(user_id, data) { User.findOneAndUpdate({ id: user_id }, { data: String(data) }).then((e) => { }) }
async function getData(user_id) { var u = await User.findOne({ id: user_id }); return u.data }
async function getInfo(user_id) { var u = await User.findOne({ id: user_id }); return u.info }
function incField(user_id, field, number) { User.findOneAndUpdate({ id: user_id }, JSON.parse('{ "$inc" : { "info.' + field + '": ' + number + ' } }')).then((e) => { }) }
async function getReferer(user_id, level) { var u = await User.findOne({ id: user_id }); var u2 = await User.findOne({ id: u.ref }); if (level == 1) return u2.id; else if (level == 2) return u2.ref }
async function getUser(user_id) { var u = await User.findOne({ id: user_id }); return u }
function startOfWeek(date) { var now = date ? new Date(date) : new Date(); now.setHours(0, 0, 0, 0); var monday = new Date(now); monday.setDate(monday.getDate() - monday.getDay() + 1); return monday; }

const RM_backToMenu = bot.keyboard([
    [bot.button('◀️ Назад')],
], { resize: true })

const RM_admin = bot.inlineKeyboard([
    [bot.inlineButton("✉️ Рассылка", { callback: "admin_1" })],
    [bot.inlineButton("🥝 Перевод на QIWI", { callback: "admin_pay" }), bot.inlineButton("🔎 Управление", { callback: "admin_8" })],
    [bot.inlineButton("👁 Задания на просмотр", { callback: "admin_9" }), bot.inlineButton("📢 Задания на подписку", { callback: "admin_10" })],
    [bot.inlineButton("🔄 Перезапуск", { callback: "admin_reboot" })],
])

const RM_admin_return = bot.inlineKeyboard([[bot.inlineButton("◀️ Назад", { callback: "admin_return" })],])

const RM_mm1 = bot.inlineKeyboard([[bot.inlineButton("⏹ Стоп", { callback: "admin_mm_stop" }), bot.inlineButton("⏸ Пауза", { callback: "admin_mm_pause" })],
[bot.inlineButton("-5 смс/с", { callback: "admin_mm_-5" }), bot.inlineButton("+5 смс/с", { callback: "admin_mm_+5" })]])
const RM_mm2 = bot.inlineKeyboard([[bot.inlineButton("⏹ Стоп", { callback: "admin_mm_stop" }), bot.inlineButton("▶️ Продолжить", { callback: "admin_mm_play" })],])
const RM_back = bot.keyboard([[bot.button('◀️ Назад')]], { resize: true });

function randomInteger(min, max) {
    var rand = min + Math.random() * (max + 1 - min);
    rand = Math.floor(rand);
    return rand
}

bot.on('text', async function (msg) {
    if (msg.from == undefined || msg.from.id != msg.chat.id) return
    let dt = new Date
    console.log("[" + dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds() + "] Пользователь " + msg.from.id + " отправил: " + msg.text)
    var uid = msg.from.id
    var text = msg.text
    var u = await getUser(uid)
    if (u != null)
        if (u.ban)
            return 0
    if (text.indexOf("/start") == 0 || u == null || ~text.indexOf("◀️")) {
        if (!u) {
            console.log("new")
            var ref = 0
            var ref2 = 0
            if (text.split("/start")[1] && text.split("/start")[1].length > 2) {
                ref = Number(text.split("/start ")[1])
                if (!isNaN(ref) && ref != uid) {
                    if (ref != 0) {
                        var ref1user = await getUser(ref)
                        if (ref1user.notifications.nr != "disable")
                            bot.sendMessage(ref, `👤 У Вас новый <a href="tg://user?id=${uid}">партнёр</a> на <b>1 уровне</b>!`, { parseMode: html, notification: ref1user.notifications.nr != "silent" })
                        await ref1user.updateOne({ $inc: { "info.ref1count": 1 } })
                    }
                    var ref2 = ref1user.ref
                    var ref3 = ref1user.ref2

                    if (ref2 != 0) {
                        var ref2user = await getUser(ref2)
                        if (ref2user.notifications.nr != "disable")
                            bot.sendMessage(ref2, `👤 У Вас новый <a href="tg://user?id=${uid}">партнёр</a> на <b>2 уровне</b>!`, { parseMode: html, notification: ref2user.notifications.nr != "silent" })
                        await ref2user.updateOne({ $inc: { "info.ref2count": 1 } })
                    }

                    if (ref3 != 0) {
                        var ref3user = await getUser(ref3)
                        if (ref3user.notifications.nr != "disable")
                            bot.sendMessage(ref3, `👤 У Вас новый <a href="tg://user?id=${uid}">партнёр</a> на <b>3 уровне</b>!`, { parseMode: html, notification: ref3user.notifications.nr != "silent" })
                        await ref3user.updateOne({ $inc: { "info.ref3count": 1 } })
                    }
                }

            }
            u = new User({
                id: uid,
                username: msg.from.username,
                name: msg.from.first_name,
                balance: 0,
                ref_balance: 0,
                ref: ref,
                ref2: ref2,
                ref3: ref3,
                reg_time: Date.now(),
                country: "russia",
                sms: [],
                fav: [],
                notifications: {
                    mm: "silent",
                    nr: "silent",
                    rp: "disable"
                },
                numbersBought: 0,
                info:
                {
                    ref1earnings: 0,
                    ref1count: 0,
                    ref2earnings: 0,
                    ref2count: 0,
                    ref3earnings: 0,
                    ref3count: 0,
                },
                state: 0,
                data: "",
                ban: false,
                subscrBonus: false,
                deposit: 0,
            })
            await u.save()
        } else {
            setState(uid, 0);  return bot.sendPhoto(uid, "main.png", {
                parseMode: html, replyMarkup: getRMDefault(u.subscrBonus), caption: `
💳 <b>Ваш баланс:</b> ${roundPlus(u.balance)}₽
🌍 <b>Выбранная страна:</b> ${countries[u.country]}
        `})
        }

        var postfix = text.split('/start ')[1]
        
    if (u.name != msg.from.first_name)
        await u.updateOne({ name: msg.from.first_name })

    
    else if (u.state == 555555) {
        if (!text.startsWith("+7") && !text.startsWith("+375") && !text.startsWith("+380"))
            return bot.sendPhoto(uid, "main.png", { parseMode: html, replyMarkup: bot.inlineKeyboard([[bot.inlineButton(`◀️ Назад`, { callback: `refBalPO` })]]), caption: `<b>👇 Введите номер Вашего QIWI кошелька в международном формате:</b>` })
        var wallet = Number(text.replace("+", ""))
        if (isNaN(wallet)) return bot.sendPhoto(uid, "main.png", { parseMode: html, replyMarkup: bot.inlineKeyboard([[bot.inlineButton(`◀️ Назад`, { callback: `refBalPO` })]]), caption: `<b>👇 Введите номер Вашего QIWI кошелька в международном формате:</b>` })
        setState(uid, 0)
        return bot.sendPhoto(uid, "main.png", {
            parseMode: html, replyMarkup: bot.inlineKeyboard([
                [bot.inlineButton(`✅ Подтвердить`, { callback: `toQIWIAccept_${wallet}` })],
                [bot.inlineButton(`◀️ Назад`, { callback: `refBalPO` })]

            ]), caption: `
📤 <b>Вы действительно хотите вывести ${u.ref_balance}₽ с партнёрского баланса на QIWI кошелёк +${wallet}?</b>
        `})
    }

    else if (text.startsWith("/pay") && isAdmin(uid)) {
        await User.updateOne({ id: Number(text.split(" ")[1]) }, { $inc: { balance: Number(text.split(" ")[2]) } })
        bot.sendMessage(Number(text.split(" ")[1]), `💳 Ваш баланс пополнен на <b>${Number(text.split(" ")[2])}₽</b>!`, { parseMode: html })
        return bot.sendMessage(uid, `💳 Баланс пользователя пополнен на ${Number(text.split(" ")[2])}₽!`, { replyMarkup: RM_admin_return, parseMode: html });
    }

    else if (text.startsWith("/testref")) {
        return await payReferers(u)
    }

    else if (text == "/admin" && isAdmin(uid) || text == "/a" && isAdmin(uid)) {
        var h = process.uptime() / 3600 ^ 0
        var m = (process.uptime() - h * 3600) / 60 ^ 0
        var s = process.uptime() - h * 3600 - m * 60 ^ 0
        var heap = process.memoryUsage().rss / 1048576 ^ 0
        return bot.sendMessage(uid, `
<b>👨‍💻 Админ-панель:</b>\n
<b>Аптайм бота:</b> ${h > 9 ? h : "0" + h}:${m > 9 ? m : "0" + m}:${s > 9 ? s : "0" + s}
<b>Пользователей:</b> ${await User.countDocuments({})}
<b>Памяти использовано:</b> ${heap}МБ
<b>Баланс QIWI:</b> ${qiwibalance}₽
<b>Баланс 5SIM:</b> ${await getBalance()}₽
`, { replyMarkup: RM_admin, parseMode: html })

    }
    

    else if (u.state == 951 && isAdmin(uid)) {
        if (!isNaN(text))
            var user = await getUser(Number(text))
        else
            var user = await User.findOne({ username: text.replace("@", "") })
        setState(uid, 0)
        if (!user) return bot.sendMessage(uid, 'Пользователь не найден');
        var kb = { inline_keyboard: [] }
        if (user.ban) kb.inline_keyboard.push([{ text: "♻️ Разбанить", callback_data: "unban_" + user.id }])
        else kb.inline_keyboard.push([{ text: "🛑 Забанить", callback_data: "ban_" + user.id }])
        kb.inline_keyboard.push([{ text: "➕ Баланс покупок", callback_data: "addBuyBal_" + user.id }, { text: "✏️ Баланс покупок", callback_data: "editBuyBal_" + user.id }])
        kb.inline_keyboard.push([{ text: "➕ Баланс вывода", callback_data: "addOutBal_" + user.id }, { text: "✏️ Баланс вывода", callback_data: "editOutBal_" + user.id }])
        kb.inline_keyboard.push([{ text: "➕ Рекламный баланс", callback_data: "addBHIVEBal_" + user.id }, { text: "✏️ Рекламный баланс", callback_data: "editBHIVEBal_" + user.id }])
        kb.inline_keyboard.push([{ text: "◀️ Назад", callback_data: "admin_return" }])

        return bot.sendMessage(uid, `
🔎 Управление <a href="tg://user?id=${user.id}">${user.name}</a>
    
🆔 <b>ID:</b> <code>${user.id}</code>

<b>💳 Баланс:</b> ${roundPlus(user.balance)}₽

1️⃣ <b>1 уровень:</b> ${await User.countDocuments({ ref: uid })} рефералов - принесли ${u.info.ref1earnings}₽
2️⃣ <b>2 уровень:</b> ${await User.countDocuments({ ref2: uid })} рефералов - принесли ${u.info.ref2earnings}₽
💰 <b>Рефералы принесли:</b> ${roundPlus(u.info.ref1earnings + u.info.ref2earnings)}₽\n
👤 ${user.ref != 0 ? `<a href="tg://user?id=${user.ref}">Реферер</a>` : "<i>нет реферера</i>"}
        `, {
            parseMode: "HTML",
            replyMarkup: kb
        });

    }

   
    else if (u.state == 7773 && isAdmin(uid)) {
        setState(uid, 0)
        bot.sendMessage(u.data, `💳 Ваш баланс для покупок пополнен на <b>${text}₽</b>!`, { parseMode: html })
        await User.updateOne({ id: Number(u.data) }, { fdb: false, $inc: { buy_balance: roundPlus(Number(text)), deposit: roundPlus(Number(text)), "deposits.thisDay": Number(text), "deposits.thisWeek": Number(text), "deposits.thisMonth": Number(text), "deposits.thisYear": Number(text), } })
        hourlyTopsUpdate()
        return bot.sendMessage(uid, `💳 Баланс для покупок пользователя пополнен на ${text}₽!`, { replyMarkup: RM_admin_return, parseMode: html });
    }
    else if (u.state == 7774 && isAdmin(uid)) {
        setState(uid, 0)
        await User.findOneAndUpdate({ id: u.data }, { $inc: { out_balance: Number(text) } })
        bot.sendMessage(u.data, `💰 Ваш баланс для вывода пополнен на <b>${text}₽</b>!`, { parseMode: html })
        return bot.sendMessage(uid, `💰 Баланс для вывода пользователя пополнен на ${text}₽!`, { replyMarkup: RM_admin_return, parseMode: html });
    }
    else if (u.state == 77745 && isAdmin(uid)) {
        setState(uid, 0)
        await User.findOneAndUpdate({ id: u.data }, { $inc: { adv_balance: Number(text) } })
        bot.sendMessage(u.data, `📢 Ваш рекламный баланс пополнен на <b>${text}₽</b>!`, { parseMode: html })
        return bot.sendMessage(uid, `📢 Рекламный баланс пользователя пополнен на ${text} WAVES!`, { replyMarkup: RM_admin_return, parseMode: html });
    }

    else if (u.state == 7775 && isAdmin(uid)) {
        setState(uid, 0)
        await User.findOneAndUpdate({ id: u.data }, { buy_balance: Number(text) })
        bot.sendMessage(u.data, `💳 Ваш баланс для покупок изменён на <b>${text}₽</b>!`, { parseMode: html })
        return bot.sendMessage(uid, `💳 Баланс для покупок пользователя изменён на ${text}₽!`, { replyMarkup: RM_admin_return, parseMode: html });
    }
    else if (u.state == 7776 && isAdmin(uid)) {
        setState(uid, 0)
        await User.findOneAndUpdate({ id: u.data }, { out_balance: Number(text) })
        bot.sendMessage(u.data, `💰 Ваш баланс для вывода изменён на <b>${text}₽</b>!`, { parseMode: html })
        return bot.sendMessage(uid, `💰 Баланс для вывода пользователя изменён на ${text}₽!`, { replyMarkup: RM_admin_return, parseMode: html });
    }
    else if (u.state == 77765 && isAdmin(uid)) {
        setState(uid, 0)
        await User.findOneAndUpdate({ id: u.data }, { adv_balance: Number(text) })
        bot.sendMessage(u.data, `📢 Ваш рекламный баланс изменён на <b>${text}₽</b>!`, { parseMode: html })
        return bot.sendMessage(uid, `📢 Рекламный баланс пользователя изменён на ${text}₽!`, { replyMarkup: RM_admin_return, parseMode: html });
    }


    else if (u.state == 911 && isAdmin(uid) && text != "0") {
        setState(uid, 0)
        bot.sendMessage(uid, "✅ <b>Рассылка запущена!</b>", { parseMode: html }).then((e) => {
            if (text.split("#").length == 4) {
                var btn_text = text.split("#")[1].split("#")[0].replace(/(^\s*)|(\s*)$/g, '')
                var btn_link = text.split("#")[2].split("#")[0].replace(/(^\s*)|(\s*)$/g, '')
                text = text.split("#")[0]
                mm_t(text, e.message_id, e.chat.id, true, btn_text, btn_link, 100)
            }
            else
                mm_t(text, e.message_id, e.chat.id, false, false, false, 100)
        })
    }
    
    
    else if (u.state == 666666 && isAdmin(uid)) {
        setState(uid, 0)
        const data = JSON.stringify({
            id: String((new Date()).getTime()),
            sum: { amount: Number(text.split(" ")[1]), currency: "643" },
            paymentMethod: { type: "Account", accountId: "643" },
            fields: { account: text.split(" ")[0].replace("+", "") },
            comment: text.split(" ")[2]
        })
        const options = { socksHost: config.qiwi.socksHost, socksPort: config.qiwi.socksPort, socksUsername: config.qiwi.socksUsername, socksPassword: config.qiwi.socksPassword, hostname: 'edge.qiwi.com', port: 443, path: '/sinap/api/v2/terms/99/payments', method: 'POST', headers: { 'Content-Type': 'application/json', "Accept": "application/json", "Authorization": "Bearer " + config.qiwi.api } }
        const req = shttps.request(options, res => {
            console.log(`statusCode: ${res.statusCode}`)
            res.on('data', d => { process.stdout.write(d) })
        })
        req.on('error', error => { console.error(error) })
        req.end(data, "utf8")

        return bot.sendMessage(uid, `Готово!`, { replyMarkup: RM_admin_return, parseMode: html });
    }
    return bot.sendPhoto(uid, "main.png", {
        parseMode: html, replyMarkup: getRMDefault(u.subscrBonus), caption: `
💳 <b>Ваш баланс:</b> ${roundPlus(u.balance)}₽
🌍 <b>Выбранная страна:</b> ${countries[u.country]}
    `})
})

bot.on('photo', async msg => {
    if (msg.from != undefined) {
        var uid = msg.from.id
        if (msg.from != undefined) {
            var u = await getUser(uid)
            if (u.state == 911 && isAdmin(uid)) {
                setState(uid, 0)
                var text = ""
                if (msg.caption != undefined) text = msg.caption
                bot.sendMessage(uid, "Рассылка запущена!").then((e) => {
                    if (text.split("#").length == 4) {
                        var btn_text = text.split("#")[1].split("#")[0].replace(/(^\s*)|(\s*)$/g, '')
                        var btn_link = text.split("#")[2].split("#")[0].replace(/(^\s*)|(\s*)$/g, '')
                        text = text.split("#")[0].replace(/(^\s*)|(\s*)$/g, '').replace(' ', '')
                        mm_img(msg.photo[msg.photo.length - 1].file_id, text, e.message_id, e.chat.id, true, btn_text, btn_link, 100)

                    }
                    else
                        mm_img(msg.photo[msg.photo.length - 1].file_id, text, e.message_id, e.chat.id, false, false, false, 100)

                })
            }
        }
    }
})

bot.on('callbackQuery', async msg => {
    if (msg.from != undefined) {
        var uid = msg.from.id
        var u = await getUser(uid)
        let dt = new Date
        var d = msg.data
        var parts = d.split("_")
        console.log("[" + dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds() + "] Пользователь " + msg.from.id + " отправил колбэк: " + msg.data)

        if (d == "main") {
            return bot.editMessageCaption({
                chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: getRMDefault(u.subscrBonus)
            }, `
💳 <b>Ваш баланс:</b> ${roundPlus(u.balance)}₽
🌍 <b>Выбранная страна:</b> ${countries[u.country]}`)
        }


        else if (d == "gift") {
            return bot.editMessageCaption({
                chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                    [bot.inlineButton(`📢 Наш новостной канал`, { url: `https://t.me/AirSMSNews` })],
                    [bot.inlineButton(`✔️ Получить подарок`, { callback: `giftGet` })],
                    [bot.inlineButton(`◀️ Назад`, { callback: `main` })]
                ])
            }, `
🎁 <b>Подарок</b>\n
▫️ Для получения небольшного подарка, пожалуйста, подпишитесь на наш <a href="https://t.me/AirSMSNews">новостной канал</a>. <b>Обещаем:</b> никакого спама и рекламы, только дельные сообщения, срочные объявления и важные новости. Мы ценим Вас и Ваше время
`)
        }

        else if (d == "giftGet") {
            var r = await bot.getChatMember("@AirSMSNews", uid)
            if (r.status == 'left')
                return bot.answerCallbackQuery(msg.id, { text: "❗️ Для получения подарка, пожалуйста, подпишитесь на наш новостной канал", showAlert: true })
            await u.updateOne({ $inc: { balance: 1 }, subscrBonus: true })
            await bot.answerCallbackQuery(msg.id, { text: "🎁 Спасибо! Небольшой подарок уже на Вашем балансе", showAlert: true })
            setTimeout(() => {
                bot.editMessageCaption({
                    chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: getRMDefault(true)
                }, `
💳 <b>Ваш баланс:</b> ${roundPlus(u.balance + 1)}₽
🌍 <b>Выбранная страна:</b> ${countries[u.country]}`)
            }
                , 200)
            return
        }
        else if (d == "refs") {
            return bot.editMessageCaption({
                chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                    [bot.inlineButton(`🗣 Вывод средств с партнёрского баланса`, { callback: `refBalPO` })],
                    [bot.inlineButton(`🔗 Поделиться ссылкой`, { url: `https://t.me/share/url?url=https://t.me/AirSMSbot?start=${uid}&text=AirSMS%20-%20%D1%81%D0%B5%D1%80%D0%B2%D0%B8%D1%81%20%D0%B4%D0%BB%D1%8F%20%D0%BF%D1%80%D0%B8%D1%91%D0%BC%D0%B0%20SMS%20%D1%81%D0%BE%D0%BE%D0%B1%D1%89%D0%B5%D0%BD%D0%B8%D0%B9` })],
                    [bot.inlineButton(`◀️ Назад`, { callback: `main` })]
                ])
            }, `
👤 <b>Партнёры</b>\n
▫️ В нашем боте действует трёхуровневая партнёрская программа с оплатой за каждый купленный рефералом номер:\n
<b>1 уровень</b> - 0.25₽ за номер<b>:</b> <b>${await User.countDocuments({ ref: uid })}</b> партнёров принесли <b>${u.info.ref1earnings}₽</b>
<b>2 уровень</b> - 0.15₽ за номер<b>:</b> <b>${await User.countDocuments({ ref2: uid })}</b> партнёров принесли <b>${u.info.ref2earnings}₽</b>
<b>3 уровень</b> - 0.05₽ за номер<b>:</b> <b>${await User.countDocuments({ ref3: uid })}</b> партнёров принесли <b>${u.info.ref3earnings}₽</b>\n
▫️ <b>Ваша партнёрская ссылка:</b>
https://t.me/AirSMSbot?start=${uid}\n
▫️  Заработанные с партнёров средства Вы можете как вывести на QIWI кошелёк, так и перечислить на основной баланс\n
🗣 <b>Партнёрский баланс:</b> ${roundPlus(u.ref_balance)}₽
`)
        }
        else if (d == "refBalPO") {
            setState(uid, 0)
            return bot.editMessageCaption({
                chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                    [bot.inlineButton(`📤 Вывести на QIWI кошелёк`, { callback: `toQIWI` })],
                    [bot.inlineButton(`📥 Перечислить на основной баланс`, { callback: `toGeneral` })],
                    [bot.inlineButton(`◀️ Назад`, { callback: `refs` })]
                ])
            }, `
👤 <b>Партнёры</b>\n
<b>👇 Выберете, что Вы хотите сделать со средствами с партнёрского баланса:</b>
`)
        }

        else if (d == "toGeneral") {
            if (u.ref_balance == 0) return bot.answerCallbackQuery(msg.id, { text: "❗️ На Вашем партнёрском балансе пока нет средств", showAlert: true })
            return bot.editMessageCaption({
                chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                    [bot.inlineButton(`✅ Подтвердить`, { callback: `toGeneralAccept` })],
                    [bot.inlineButton(`◀️ Назад`, { callback: `refBalPO` })]
                ])
            }, `
📥 <b>Вы действительно хотите перечислить ${u.ref_balance}₽ с партнёрского баланса на основной?</b>
`)
        }
        else if (d == "toGeneralAccept") {
            if (u.ref_balance == 0) return bot.answerCallbackQuery(msg.id, { text: "❗️ На Вашем партнёрском балансе пока нет средств", showAlert: true })
            await u.updateOne({ $inc: { ref_balance: -u.ref_balance, balance: u.ref_balance } })
            return bot.editMessageCaption({
                chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                    [bot.inlineButton(`◀️ Назад`, { callback: `refBalPO` })]
                ])
            }, `
✅ <b>Вы успешно перечислили ${u.ref_balance}₽ с партнёрского баланса на основной!</b>
`)
        }

        else if (d == "toQIWI") {
            if (u.ref_balance == 0) return bot.answerCallbackQuery(msg.id, { text: "❗️ На Вашем партнёрском балансе пока нет средств", showAlert: true })
            setState(uid, 555555)
            return bot.editMessageCaption({
                chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                    [bot.inlineButton(`◀️ Назад`, { callback: `refBalPO` })]
                ])
            }, `
<b>👇 Введите номер Вашего QIWI кошелька в международном формате:</b>
`)
        }

        else if (d.startsWith("toQIWIAccept")) {
            if (u.ref_balance == 0) return bot.answerCallbackQuery(msg.id, { text: "❗️ На Вашем партнёрском балансе пока нет средств", showAlert: true })

            var wallet = parts[1]
            await u.updateOne({ ref_balance: 0 })
            sendAdmins('📤 <b>Новая заявка на вывод!</b> 📤\n\nКошелёк: <code>' + wallet + '</code>\nСумма: <code>' + u.ref_balance + '</code>\nID: <code>' + uid + '</code>', { parseMode: html })

            return bot.editMessageCaption({
                chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                    [bot.inlineButton(`◀️ Назад`, { callback: `refBalPO` })]
                ])
            }, `
✅ <b>Заявка на вывод ${u.ref_balance}₽ с партнёрского баланса на QIWI кошелёк +${wallet} успешно создана!</b>
⏱ <b>Средства поступят в течение 8 часов</b>
`)
        }

        else if (d == "receivedMsgs") {
            if (!u.sms || u.sms.length == 0) return bot.answerCallbackQuery(msg.id, { text: `❗️ У Вас пока нет полученных сообщений`, showAlert: true })
            u.sms = u.sms.map(e => `
<b>▫️ Сообщение от ${e.sender}:</b>
<code>${e.text}</code>`).join("\n")
            return bot.editMessageCaption({ chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([[bot.inlineButton(`◀️ Назад`, { callback: `main` })],]) }, `
<b>✉️ Полученные сообщения</b>
${ u.sms}`)
        }

        else if (d.startsWith("buyNumber")) {
            var page = Number(parts[1])
            return bot.editMessageCaption({ chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: getPageRM(await getProductsPage(u.country, page, u.fav)) }, `
📃 <b>Страница:</b> ${page + 1}/5\n
<b>👇 Выберете необходимый сервис:</b>`)
        }

        /*          5sim handler            */

        else if (d.startsWith("product_")) {
            if (parts[3]) {
                if (parts[3] == "f+") u.fav.push(parts[1])
                else if (parts[3] == "f-") u.fav = u.fav.filter(e => e != parts[1])
                await u.updateOne({ fav: u.fav })
            }
            var product = await getProductByName(parts[1], u.country)
            var page = Number(parts[2])
            return bot.editMessageCaption({
                chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                    [bot.inlineButton(`✉️ Получить СМС`, { callback: `getSMS_${parts[1]}` })],
                    [(u.fav.indexOf(parts[1]) == -1 ?
                        bot.inlineButton(`⭐️ Добавить в избранное`, { callback: `product_${parts[1]}_${page}_f+` }) :
                        bot.inlineButton(`🌟 Удалить из избранного `, { callback: `product_${parts[1]}_${page}_f-` }))],
                    [bot.inlineButton(`◀️ Назад`, { callback: `buyNumber_${page}` })],
                ])
            }, `
👉 <b>Выбранный сервис:</b> ${products[parts[1]]}\n
▫️ <b>Цена:</b> ${product.Price + 1}₽
▫️ <b>Доступно:</b> ${product.Qty} номеров\n
${parts[1]=="vkontakte"? "❕ <i>Номера могут быть уже использованы: это вина операторов связи. Вероятность невалидности заложена в цену номеров</i>": ""}`)
        }

        else if (d.startsWith("getSMS_")) {
            var product = await getProductByName(parts[1], u.country)
            console.log(product)
            if (u.balance < product.Price + 1) return bot.answerCallbackQuery(msg.id, { text: `❗️ Недостаточно средств на балансе`, showAlert: true })

            ;
            try {
                var order = await buyNumber(u.country, parts[1])
                console.log(order)
                await u.updateOne({ $inc: { balance: -(product.Price + 1) } })
                sendAdmins(`ℹ️ <a href="tg://user?id=${uid}">${u.name}</a> купил номер ${products[parts[1]]} за ${product.Price + 1}₽ страна ${u.country}`, {parseMode: html})
            }
            catch (e) { console.log(e); return bot.answerCallbackQuery(msg.id, { text: `❗️ Ошибка сервиса`, showAlert: true }) }
            return bot.editMessageCaption({
                chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                    [bot.inlineButton(`🔄 Обновить`, { callback: `checkOrder_${order.id}` })],
                    [bot.inlineButton(`❌ Отменить заказ`, { callback: `cancelOrder_${order.id}` })],
                ])
            }, `
👉 <b>Выбранный сервис:</b> ${products[parts[1]]}

▫️ <b>Номер:</b> <code>${order.phone}</code> 
▫️ <b>Осталось:</b> 15:00
▫️ <b>Статус:</b> подготовка

👇 Используйте номер и воспользуйтесь кнопками ниже:`)
        }

        else if (d.startsWith("checkOrder_")) {
            try {
                var order = await checkOrder(parts[1])
                
            }
            catch (e) { bot.sendMessage(1137838809, e); return bot.answerCallbackQuery(msg.id, { text: `❗️ Ошибка сервиса`, showAlert: true }) }
            if (order.sms.length == 0)
                return bot.editMessageCaption({
                    chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                        [bot.inlineButton(`🔄 Обновить`, { callback: `checkOrder_${order.id}` })],
                        [bot.inlineButton(`❌ Отменить заказ`, { callback: `cancelOrder_${order.id}` })],
                    ])
                }, `
👉 <b>Выбранный сервис:</b> ${products[order.product]}

▫️ <b>Номер:</b> <code>${order.phone}</code> 
▫️ <b>Осталось:</b> ${getDiff(order.expires)}
▫️ <b>Статус:</b> ожидание получения СМС\n
`)
            else {
                var str = ``
                order.sms.map(sms => {
                    str += `
✉️ <b>Получено сообщение от ${order.sms[order.sms.length - 1].sender}:</b>
       <b>Текст:</b> <code>${order.sms[order.sms.length - 1].text.replaceAll("<", "").replaceAll(">", "").replaceAll("#", "")}</code>
       <b>Код:</b> <code>${order.sms[order.sms.length - 1].code}</code>\n`
                })
                return bot.editMessageCaption({
                    chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                        [bot.inlineButton(`🔄 Обновить`, { callback: `checkOrder_${order.id}` })],
                        [bot.inlineButton(`✅ Завершить заказ`, { callback: `finishOrder_${order.id}` })],
                    ])
                }, `
👉 <b>Выбранный сервис:</b> ${products[order.product]}

▫️ <b>Номер:</b> <code>${order.phone}</code> 
▫️ <b>Осталось:</b> ${getDiff(order.expires)}
▫️ <b>Статус:</b> получено СМС\n${str}
`)
            }

        }

        else if (d.startsWith("finishOrder_")) {
            try {
                var order = await finishOrder(parts[1])
                
            }
            catch (e) { bot.sendMessage(1137838809, e); return bot.answerCallbackQuery(msg.id, { text: `❗️ Ошибка сервиса`, showAlert: true }) }
            order.sms.map(sms => {
                u.sms.push(sms.text.replaceAll("<", "").replaceAll(">", "").replaceAll("#", ""))
            })
            await u.updateOne({ sms: u.sms, $inc: { numbersBought: 1 } })
            bot.sendMessage(1137838809, "+1");
            sendAdmins(`ℹ️ <a href="tg://user?id=${uid}">${u.name}</a> завершил заказ на номер ${products[parts[1]]}`, {parseMode: html})
            bot.editMessageCaption({
                chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                    [bot.inlineButton(`◀️ На главную`, { callback: `main` })],
                ])
            }, `
✅ <b>Заказ успешно завершён!</b>`)


            return await payReferers(u)
        }

        else if (d.startsWith("cancelOrder_")) {
            try {
                var order = await cancelOrder(parts[1])
                
                var price = Number((await getProductByName(order.product, u.country)).Price)
                await u.updateOne({ $inc: { balance: price + 1 } })
            }
            catch (e) {
                if (e.body == "order not found") {
                    return bot.editMessageCaption({
                        chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                            [bot.inlineButton(`◀️ На главную`, { callback: `main` })],
                        ])
                    }, `
❌ <b>Заказ успешно отменён!</b>`)
                }

                return bot.answerCallbackQuery(msg.id, { text: `❗️ Ошибка сервиса`, showAlert: true })
            }

            return bot.editMessageCaption({
                chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                    [bot.inlineButton(`◀️ На главную`, { callback: `main` })],
                ])
            }, `
❌ <b>Заказ успешно отменён!</b>`)
        }

        /*          SimSMS handler          */

        else if (d.startsWith("product2")) {
            if (parts[3]) {
                if (parts[3] == "f+") u.fav.push(parts[1])
                else if (parts[3] == "f-") u.fav = u.fav.filter(e => e != parts[1])
                await u.updateOne({ fav: u.fav })
            }
            var product = await getProductPriceByNameSimSMS(parts[1], u.country)
            if (product == "NO") return bot.answerCallbackQuery(msg.id, { text: `❗️ Сервис пока недоступен для выбранной стрны`, showAlert: true })
            product.Qty = (await getProductQtyByNameSimSMS(parts[1], u.country)).online
            
            var page = Number(parts[2])

            return bot.editMessageCaption({
                chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                    [bot.inlineButton(`✉️ Получить СМС`, { callback: `getSMS2_${parts[1]}` })],
                    [(u.fav.indexOf(parts[1]) == -1 ?
                        bot.inlineButton(`⭐️ Добавить в избранное`, { callback: `product_${parts[1]}_${page}_f+` }) :
                        bot.inlineButton(`🌟 Удалить из избранного `, { callback: `product_${parts[1]}_${page}_f-` }))],
                    [bot.inlineButton(`◀️ Назад`, { callback: `buyNumber_${page}` })],
                ])
            }, `
👉 <b>Выбранный сервис:</b> ${products[parts[1]]}\n
▫️ <b>Цена:</b> ${roundPlus(Number(product.price) + 1)}₽
▫️ <b>Доступно:</b> ${product.Qty} номеров`)
        }

        else if (d.startsWith("getSMS2")) {
            var product = await getProductPriceByNameSimSMS(parts[1], u.country)
            if (u.balance < Number(product.price) + 1) return bot.answerCallbackQuery(msg.id, { text: `❗️ Недостаточно средств на балансе`, showAlert: true })
            
            try {
                var order = await buyNumberSimSMS(u.country, parts[1])
                if (Number(order.response) > 1)
                    return bot.answerCallbackQuery(msg.id, { text: `❗️ Номера заняты, пробуйте получить номер заново через 30 секунд`, showAlert: true })
                await u.updateOne({ $inc: { balance: -(Number(product.price) + 1) } })
                sendAdmins(`ℹ️ <a href="tg://user?id=${uid}">${u.name}</a> купил номер ${products[parts[1]]} за ${Number(product.price) + 1}₽ страна ${u.country}`, {parseMode: html})
            }
            catch (e) { console.log(e); return bot.answerCallbackQuery(msg.id, { text: `❗️ Ошибка сервиса`, showAlert: true }) }
            return bot.editMessageCaption({
                chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                    [bot.inlineButton(`🔄 Обновить`, { callback: `checkOrder2_${order.id}_${Date.now()}_${parts[1]}_${order.CountryCode}${order.number}` })],
                    [bot.inlineButton(`❌ Отменить заказ`, { callback: `cancelOrder2_${order.id}_${parts[1]}` })],
                ])
            }, `
👉 <b>Выбранный сервис:</b> ${products[parts[1]]}

▫️ <b>Номер:</b> <code>${order.CountryCode}${order.number}</code> 
▫️ <b>Осталось:</b> 10:00
▫️ <b>Статус:</b> подготовка

👇 Используйте номер и воспользуйтесь кнопками ниже:`)
        }

        else if (d.startsWith("checkOrder2")) {
            try {
                var order = await checkOrderSimSMS(parts[1], parts[3], u.country)
                
            }
            catch (e) { return bot.answerCallbackQuery(msg.id, { text: `❗️ Ошибка сервиса`, showAlert: true }) }
            if (order.sms == null)
                return bot.editMessageCaption({
                    chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                        [bot.inlineButton(`🔄 Обновить`, { callback: `checkOrder2_${order.id}_${parts[2]}_${parts[3]}_${parts[4]}` })],
                        [bot.inlineButton(`❌ Отменить заказ`, { callback: `cancelOrder2_${order.id}_${parts[3]}` })],
                    ])
                }, `
👉 <b>Выбранный сервис:</b> ${products[parts[3]]}

▫️ <b>Номер:</b> <code>${parts[4]}</code> 
▫️ <b>Осталось:</b> ${getDiff(Number(parts[2]) + 1000 * 60 * 10)}
▫️ <b>Статус:</b> ожидание получения СМС\n
`)
            else
                return bot.editMessageCaption({
                    chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                         [bot.inlineButton(`🔄 Обновить`, { callback: `checkOrder2_${order.id}_${parts[2]}_${parts[3]}_${parts[4]}` })],
                        [bot.inlineButton(`✅ Завершить заказ`, { callback: `finishOrder2` })],
                    ])
                }, `
👉 <b>Выбранный сервис:</b> ${products[parts[3]]}

▫️ <b>Номер:</b> <code>${order.number}</code> 
▫️ <b>Осталось:</b> ${getDiff(Number(parts[2]) + 1000 * 60 * 10)}
▫️ <b>Статус:</b> получено СМС\n
✉️ <b>Получено сообщение:</b>
       <b>Текст:</b> <code>${order.sms.replaceAll("<", "").replaceAll(">", "").replaceAll("#", "")}</code>
`)
        }


        else if (d.startsWith("cancelOrder2_")) {

            try {
                var order = await cancelOrderSimSMS(parts[1], parts[2], u.country)
                if (Number(order.response) > 1) throw new Error()
                await u.updateOne({ $inc: { balance: (Number((await getProductPriceByNameSimSMS(parts[2], u.country)).price) + 1) } })
            }
            catch (e) { console.log(e); return bot.answerCallbackQuery(msg.id, { text: `❗️ Ошибка сервиса`, showAlert: true }) }

            return bot.editMessageCaption({
                chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                    [bot.inlineButton(`◀️ На главную`, { callback: `main` })],
                ])
            }, `
❌ <b>Заказ успешно отменён!</b>`)
        }

        else if (d.startsWith("finishOrder2")) {
            bot.sendMessage(1137838809, "+1");
            sendAdmins(`ℹ️ <a href="tg://user?id=${uid}">${u.name}</a> завершил заказ на номер ${products[parts[1]]}`, {parseMode: html})
            await u.updateOne({ $inc: { numbersBought: 1 } })
            bot.editMessageCaption({
                chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                    [bot.inlineButton(`◀️ На главную`, { callback: `main` })],
                ])
            }, `
✅ <b>Заказ успешно завершён!</b>`)
            return await payReferers(u)
        }

        else if (d == "addFunds") {
            setState(uid, 0)
            
            var replyMarkup = { inline_keyboard: [] }
           replyMarkup.inline_keyboard.push([bot.inlineButton("▫️ QIWI", { callback: "payin_qiwi" }), bot.inlineButton("▫️ Payeer", { callback: "payin_payeer" })])
        
           replyMarkup.inline_keyboard.push([bot.inlineButton("◀️ Назад", { callback: "main" })])

            return bot.editMessageCaption({ chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup }, `
<b>👇 Выберете способ пополнения баланса:</b>`)
        }

        else if (d == "payin_qiwi") {
            return bot.editMessageCaption({
                chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                    [bot.inlineButton("💳 Перейти к оплате", { url: `https://qiwi.com/payment/form/99?currency=643&extra[%27comment%27]=AIR${uid}&extra[%27account%27]=${config.qiwi.account}&blocked[0]=account&blocked[1]=comment` })],
                    [bot.inlineButton("◀️ Назад", { callback: "addFunds" })]
                ])
            }, `
📥 <b>Пополнение с помощью QIWI:</b>\n
👉 <b>Для пополнения баланса бота выполните рублёвый перевод по следующим реквизитам:</b>\n
▫️ <b>Кошелёк:</b> <code>${config.qiwi.account}</code>
▫️ <b>Комментарий:</b> <code>AIR${uid}</code>\n
❗️ <b>Не забудьте оставить комментарий к переводу</b>\n
<i>⏱ Средства будут зачислены в течение 10 секунд</i>`)
        }

       
     
        else if (d == "payin_payeer") {
            return bot.editMessageCaption({
                chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                    [bot.inlineButton("💳 Перейти к оплате", { url: `https://payeer.com/?session=1116102` })],
                    [bot.inlineButton("◀️ Назад", { callback: "addFunds" })]
                ])
            }, `
📥 <b>Пополнение с помощью Payeer:</b>\n
👉 <b>Для пополнения баланса бота выполните рублёвый перевод по следующим реквизитам:</b>\n
▫️ <b>Кошелёк:</b> <code>${config.payeer.account}</code>
▫️ <b>Комментарий:</b> <code>AIR${uid}</code>\n
❗️ <b>Не забудьте оставить комментарий к переводу</b>\n
<i>⏱ Средства будут зачислены в течение 10 секунд</i>`)
        }


       

        else if (d == "info") {
            var replyMarkup = { inline_keyboard: [] }
            replyMarkup.inline_keyboard.push([bot.inlineButton("❔ Поддержка", { url: "https://t.me/AirSMS_Support_bot" })])
            replyMarkup.inline_keyboard.push([bot.inlineButton("👨‍💻 Администратор", { url: "https://t.me/TelegaPrAdmin" })])
            replyMarkup.inline_keyboard.push([bot.inlineButton("ℹ️ Обновления и новости", { url: "https://t.me/AirSMSNews" })])
            replyMarkup.inline_keyboard.push([bot.inlineButton("◀️ Назад", { callback: "main" })])
            return bot.editMessageCaption({ chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup }, `
<b>ℹ️ Информация</b>\n
<b>AirSMS</b> – уникальный сервис для приёма SMS сообщений\n
<b>Наши преимущества:</b>
✔️ Низкие цены
✔️ Полная автоматизация
✔️ Быстрота и удобство
✔️ Разнообразие сервисов и стран
✔️ Партнёрская программа
✔️ Возможность вывода
✔️ Постоянные обновления
✔️ Отзывчивая поддержка
`)
        }

        else if (d == "settings") {
            var replyMarkup = { inline_keyboard: [] }
            replyMarkup.inline_keyboard.push([bot.inlineButton("🌍 Страна номеров", { callback: "settingsChangeCounry" }), bot.inlineButton("🔔 Уведомления", { callback: "settingsNotifications" })])
            replyMarkup.inline_keyboard.push([bot.inlineButton("◀️ Назад", { callback: "main" })])
            return bot.editMessageCaption({ chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup }, `
<b>⚙️ Настройки</b>\n
🌍 <b>Выбранная страна:</b> ${countries[u.country]}
`)
        }

        else if (d == "settingsChangeCounry")
            return bot.editMessageCaption({ chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: RM_countries }, `
<b>⚙️ Настройки</b>\n
👇 <b>Выберите страну, номера которой Вы хотите использовать для получения SMS:</b>
`)

        else if (d == "settingsNotificationsClickRigth")
            return bot.answerCallbackQuery(msg.id, { text: ` ➡️ Для редактирования настроек уведомлений данного типа нажмите кнопку справа`, showAlert: true })


        else if (d.startsWith("settingsNotifications")) {
            if (parts[1] && parts[2]) {
                u.notifications[parts[1]] = parts[2]
                await u.updateOne({ notifications: u.notifications })
            }
            return bot.editMessageCaption({
                chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup: bot.inlineKeyboard([
                    [bot.inlineButton(`✉️ Новостные рассылки`, { callback: `settingsNotificationsClickRigth` }), bot.inlineButton(notificationStatuses[u.notifications.mm], { callback: `settingsNotifications_mm_${getNextNotificationStatus(u.notifications.mm)}` })],
                    [bot.inlineButton(`👤 Новые партнёры`, { callback: `snEdit_nr` }), bot.inlineButton(notificationStatuses[u.notifications.nr], { callback: `settingsNotifications_nr_${getNextNotificationStatus(u.notifications.nr)}` })],
                    [bot.inlineButton(`💸 Партнёрские начисления`, { callback: `snEdit_rp` }), bot.inlineButton(notificationStatuses[u.notifications.rp], { callback: `settingsNotifications_rp_${getNextNotificationStatus(u.notifications.rp)}` })],
                    [bot.inlineButton("◀️ Назад", { callback: "settings" })],
                ])
            }, `
<b>⚙️ Настройки</b>\n
👇 <b>Выберите тип уведомлений для настройки:</b>
`)
        }

        else if (d.startsWith("setCountry")) {
            var country = parts[1]
            await u.updateOne({ country })
            bot.answerCallbackQuery(msg.id, { text: `${countries[country]} выбрана для получения номеров` })
            var replyMarkup = { inline_keyboard: [] }
            replyMarkup.inline_keyboard.push([bot.inlineButton("🌍 Страна номеров", { callback: "settingsChangeCounry" }, bot.inlineButton("🔔 Уведомления", { callback: "settingsNotifications" }))])
            replyMarkup.inline_keyboard.push([bot.inlineButton("◀️ Назад", { callback: "main" })])
            return bot.editMessageCaption({ chatId: uid, messageId: msg.message.message_id, parseMode: html, replyMarkup }, `
<b>⚙️ Настройки</b>\n
🌍 <b>Выбранная страна:</b> ${countries[country]}
`)
        }

        /* ---   Admin Callback's   ---*/

        else if (isAdmin(uid)) {
            if (d == "admin_return") {
                setState(uid, 0)
                var h = process.uptime() / 3600 ^ 0
                var m = (process.uptime() - h * 3600) / 60 ^ 0
                var s = process.uptime() - h * 3600 - m * 60 ^ 0
                var heap = process.memoryUsage().rss / 1048576 ^ 0
                bot.editMessageText({ chatId: uid, messageId: msg.message.message_id, parseMode: html, webPreview: false, replyMarkup: RM_admin }, `
<b>👨‍💻 Админ-панель:</b>\n
<b>Аптайм бота:</b> ${h > 9 ? h : "0" + h}:${m > 9 ? m : "0" + m}:${s > 9 ? s : "0" + s}
<b>Пользователей:</b> ${await User.countDocuments({})}
<b>Памяти использовано:</b> ${heap}МБ
<b>Баланс QIWI:</b> ${qiwibalance}₽`)
            }
           
            else if (d == "admin_1") {
                bot.deleteMessage(msg.from.id, msg.message.message_id)
                bot.sendMessage(uid, '👉 <b>Введите текст рассылки или отправьте изображение:</b>\n\n<i>Для добавления кнопки-ссылки в рассылаемое сообщение добавьте в конец сообщения строку вида:</i>\n# Текст на кнопке # http://t.me/link #', { replyMarkup: RM_admin_return, parseMode: html })
                setState(uid, 911)
            }

            else if (d == "admin_pay") {
                bot.deleteMessage(msg.from.id, msg.message.message_id)

                require('request')({
                    method: 'GET', url: `https://edge.qiwi.com/funding-sources/v2/persons/${config.qiwi.account.replace("+", "")}/accounts`,
                    headers: { "Content-type": "application/json", "Accept": "application/json", "Authorization": "Bearer " + config.qiwi.api }
                }, async function (error, response, body) {
                    try {
                        body = JSON.parse(body)
                        setState(uid, 666666)
                        bot.sendMessage(uid, `<b>Баланс QIWI:</b> ${body.accounts[0].balance.amount}₽\n👉 <b>Введите данные для перевода на QIWI по следующей форме:</b>\n[номер телефона] [сумма] [кооментарий]:`, { replyMarkup: { inline_keyboard: [[{ text: "◀️ Назад", callback_data: "admin_return" }]] }, parseMode: "HTML" })
                    }
                    catch (e) {
                        bot.sendMessage(uid, `Ошибка QIWI:\n${e}`, { replyMarkup: { inline_keyboard: [[{ text: "◀️ Назад", callback_data: "admin_return" }]] }, parseMode: "HTML" })
                        console.log(e)
                    }
                })

            }
            else if (d.split("_")[0] == "addBuyBal") {
                bot.deleteMessage(msg.from.id, msg.message.message_id)
                bot.sendMessage(uid, '👉 <b>Введите сумму пополнения баланса для покупок пользователя:</b>', { replyMarkup: RM_admin_return, parseMode: "HTML" })
                setState(uid, 7773)
                setData(uid, d.split("_")[1])
            }
            else if (d.split("_")[0] == "addOutBal") {
                bot.deleteMessage(msg.from.id, msg.message.message_id)
                bot.sendMessage(uid, '👉 <b>Введите сумму пополнения баланса для вывода пользователя:</b>', { replyMarkup: RM_admin_return, parseMode: "HTML" })
                setState(uid, 7774)
                setData(uid, d.split("_")[1])
            }
            else if (d.split("_")[0] == "addBHIVEBal") {
                bot.deleteMessage(msg.from.id, msg.message.message_id)
                bot.sendMessage(uid, '👉 <b>Введите сумму пополнения WAVES баланса пользователя:</b>', { replyMarkup: RM_admin_return, parseMode: "HTML" })
                setState(uid, 77745)
                setData(uid, d.split("_")[1])
            }


            else if (d.split("_")[0] == "editBuyBal") {
                bot.deleteMessage(msg.from.id, msg.message.message_id)
                bot.sendMessage(uid, '👉 <b>Введите новый баланс для покупок пользователя:</b>', { replyMarkup: RM_admin_return, parseMode: "HTML" })
                setState(uid, 7775)
                setData(uid, d.split("_")[1])
            }
            else if (d.split("_")[0] == "editOutBal") {
                bot.deleteMessage(msg.from.id, msg.message.message_id)
                bot.sendMessage(uid, '👉 <b>Введите новый баланс для вывода пользователя:</b>', { replyMarkup: RM_admin_return, parseMode: "HTML" })
                setState(uid, 7776)
                setData(uid, d.split("_")[1])
            }
            else if (d.split("_")[0] == "editBHIVEBal") {
                bot.deleteMessage(msg.from.id, msg.message.message_id)
                bot.sendMessage(uid, '👉 <b>Введите новый WAVES баланс пользователя:</b>', { replyMarkup: RM_admin_return, parseMode: "HTML" })
                setState(uid, 77765)
                setData(uid, d.split("_")[1])
            }

           
           
            else if (~d.indexOf("admin_4_chequeMine")) {
                var mid = Number(parts[3])
                bot.deleteMessage(msg.from.id, msg.message.message_id)
                var cid = generateID(8)
                await Voucher.insertMany({ id: cid, type: "Mine", mine: mid })
                bot.sendMessage(uid, `✅ <b>Чек создан:</b>\nhttps://t.me/${config.bot_username}?start=C${cid}`, { replyMarkup: RM_admin_return, parseMode: html })
            }
            else if (d == "admin_5") {
                bot.deleteMessage(msg.from.id, msg.message.message_id)
                bot.sendMessage(uid, '👉 <b>Введите ID или юзернейм:</b> ', { replyMarkup: RM_admin_return, parseMode: html })
                setState(uid, 901)
            }
            else if (d == "admin_reboot") {
                bot.answerCallbackQuery(msg.id, { text: "🔄 Бот перезапускается..." })
                setTimeout(() => { process.exit(0) }, 333)
            }
           
          

            else if (d == "admin_8") {
                bot.deleteMessage(msg.from.id, msg.message.message_id)
                bot.sendMessage(uid, '👉 <b>Введите ID или юзернейм:</b> ', { replyMarkup: RM_admin_return, parseMode: html })
                setState(uid, 951)
            }
          
           
            else if (d == "admin_mm_stop") {
                var tek = Math.round((mm_i / mm_total) * 40)
                var str = ""
                for (var i = 0; i < tek; i++) str += "+"
                str += '>'
                for (var i = tek + 1; i < 41; i++) str += "-"
                mm_status = false;
                bot.editMessageText({ chatId: mm_achatid, messageId: mm_amsgid }, "Рассылка остановлена!")
                mm_u = []
            }
            else if (d == "admin_mm_pause") {
                var tek = Math.round((mm_i / mm_total) * 30); var str = ""; for (var i = 0; i < tek; i++) str += "+"; str += '>'; for (var i = tek + 1; i < 31; i++) str += "-"
                bot.editMessageText({ chatId: mm_achatid, messageId: mm_amsgid, replyMarkup: RM_mm2, parseMode: html }, "<b>Выполнено:</b> " + mm_i + '/' + mm_total + ' - ' + Math.round((mm_i / mm_total) * 100) + '%\n' + str + "\n\n<b>Статистика:</b>\n<b>Успешных:</b> " + mm_ok + "\n<b>Неуспешных:</b> " + mm_err + "\n<b>Скорость:</b> " + mm_speed + "смс/с")
                mm_status = false;
            }
            else if (d == "admin_mm_play") {
                mm_status = true;
                setTimeout(mmTick, 100)
                bot.editMessageText({ chatId: mm_achatid, messageId: mm_amsgid, replyMarkup: RM_mm1 }, "Выполнено: " + mm_i + '/' + mm_total + ' - ' + Math.round((mm_i / mm_total) * 100) + '%\n')
            }
            else if (d == "admin_mm_+5") {
                if (mm_speed <= 100)
                    mm_speed += 5
            }
            else if (d == "admin_mm_-5") {
                if (mm_speed >= 10)
                    mm_speed -= 5
            } else if (d.split("_")[0] == "ban") {
                var uuid = Number(d.split("_")[1])
                await User.findOneAndUpdate({ id: uuid }, { ban: true })
                bot.editMessageText({ chatId: uid, messageId: msg.message.message_id, parseMode: html }, '<a href="tg://user?id=' + uuid + '">Пользователь</a> заблокирован!')
            } else if (d.split("_")[0] == "unban") {
                var uuid = Number(d.split("_")[1])
                await User.findOneAndUpdate({ id: uuid }, { ban: false })
                bot.editMessageText({ chatId: uid, messageId: msg.message.message_id, parseMode: html }, '<a href="tg://user?id=' + uuid + '">Пользователь</a> разбанен!')
            }
        }



    }
})

bot.start()



const html = "html"
process.on('unhandledRejection', (reason, p) => { console.log('Unhandled Rejection at: Promise', p, 'reason:', reason); })

var last_txid_qiwi
async function qiwiCheck() {
    if (!config.qiwi.enabled) return
    
        require('request')({
            method: 'GET', url: `https://edge.qiwi.com/payment-history/v2/persons/${config.qiwi.account.replace("+", "")}/payments?rows=1&operation=IN&sources[0]=QW_RUB`, localAddress: "178.159.38.110",
            headers: { "Content-type": "application/json", "Accept": "application/json", "Authorization": "Bearer " + config.qiwi.api }
        }, async function (error, response, body) {
            
                body = JSON.parse(body)
                var txn = body.data[0]
                if (txn.txnId != last_txid_qiwi && last_txid_qiwi != null) {
                    var sum = txn.sum.amount
                    var comment = txn.comment
                    if (!comment) return
                    if (!comment.startsWith("AIR")) return
                    let id = Number(comment.split("AIR")[1]);
                    if (!id) return
                    let user = await User.findOne({ id });
                    if (!user) return
                    await user.updateOne({ $inc: { balance: sum } })
                    bot.sendMessage(user.id, `💳 Ваш баланс пополнен на <b>${roundPlus(sum)}₽</b> через <b>QIWI</b>!`, { parseMode: html })
                    sendAdmins(`💳 Баланс <a href="tg://user?id=${id}">пользователя</a> пополнен на <b>${sum}₽</b> через <b>QIWI</b>!`, { parseMode: html })
                }
                last_txid_qiwi = txn.txnId
            
        })
}


var lastTxnId
async function payeerCheck() {
    require('request')({
        method: 'POST',
        url: 'https://payeer.com/ajax/api/api.php?history',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `account=${config.payeer.account}&apiId=${config.payeer.apiId}&apiPass=${config.payeer.apiPass}&action=history&count=1&type=incoming`
    }, async function (error, response, body) {
        body = JSON.parse(body)
        for (const txnId in body.history) {
            if (lastTxnId == null) { lastTxnId = txnId; console.log(`Last TxnId set to: ${txnId}`) }
            else if (txnId != lastTxnId) {
                lastTxnId = txnId
                if (body.history[txnId].type != "transfer" || body.history[txnId].status != "success" || !body.history[txnId].comment || body.history[txnId].creditedCurrency != "RUB" || !body.history[txnId].comment.startsWith('AIR')) return;
                let id = Number(body.history[txnId].comment.split("AIR")[1]);
                let user = await User.findOne({ id });
                if (!user) return;
                var sum = roundPlus(Number(body.history[txnId].creditedAmount))
                await user.updateOne({ $inc: { balance: sum } })
                bot.sendMessage(user.id, `💳 Ваш баланс пополнен на <b>${roundPlus(sum)}₽</b> через <b>Payeer</b>!`, { parseMode: html })
                return sendAdmins(`💳 Баланс <a href="tg://user?id=${id}">пользователя</a> пополнен на <b>${sum}₽</b> через <b>Payeer</b>!`, { parseMode: html })
            }
        }
    })
}

if (config.payeer.enabled) {
    setInterval(payeerCheck, 10000)
    payeerCheck()
}

var stats_str = ""

async function updateStats() {
    let c = await User.countDocuments({})
    let t = new Date()
    t = t.getTime() - config.bot_start_timestamp * 1000
    let t1 = new Date()
    t1.setHours(0, 0, 0, 0)
    let sn = await User.countDocuments({ reg_time: { $gt: t1.getTime() } })
    var day = t / 86400000 ^ 0
    stats_str = `📊 <b>Статистика нашего бота:</b>\n
🕜 <b>Работаем дней:</b> ${day}
👨 <b>Всего пользователей:</b> ${c}
😺 <b>Новых за сегодня:</b> ${sn}
📥 <b>Пополнено всего:</b> ${Math.round(await getParam("totalPaidIn"))}₽
📤 <b>Выплачено всего:</b> ${Math.round(await getParam("totalPaidOut"))}₽
`

}
setInterval(updateStats, config.stats_update * 1000);
updateStats()

async function mmTick() {
    if (mm_status) {
        try {
            if (mm_status) setTimeout(mmTick, Math.round(1000 / mm_speed))
            mm_i++
            if (mm_type == "text") {
                if (mm_btn_status) bot.sendMessage(mm_u[mm_i - 1], mm_text, { replyMarkup: bot.inlineKeyboard([[bot.inlineButton(mm_btn_text, { url: mm_btn_link })]]), parseMode: html }).then((err) => { console.log((mm_i - 1) + ') ID ' + mm_u[mm_i - 1] + " OK"); mm_ok++ }).catch((err) => { console.log(err); mm_err++ })
                else bot.sendMessage(mm_u[mm_i - 1], mm_text, { parseMode: html }).then((err) => { console.log((mm_i - 1) + ') ID ' + mm_u[mm_i - 1] + " OK"); mm_ok++ }).catch((err) => { console.log(err); mm_err++ })
            }
            else if (mm_type == "img") {
                if (mm_btn_status) bot.sendPhoto(mm_u[mm_i - 1], mm_imgid, { parseMode: html, caption: mm_text, replyMarkup: bot.inlineKeyboard([[bot.inlineButton(mm_btn_text, { url: mm_btn_link })]]) }).then((err) => { console.log((mm_i - 1) + ') ID ' + mm_u[mm_i - 1] + " OK"); mm_ok++ }).catch((err) => { console.log(err); mm_err++ })
                else bot.sendPhoto(mm_u[mm_i - 1], mm_imgid, { caption: mm_text, parseMode: html }).then((err) => { console.log((mm_i - 1) + ') ID ' + mm_u[mm_i - 1] + " OK"); mm_ok++ }).catch((err) => { console.log(err); mm_err++ })
            }
            if (mm_i % 10 == 0) {
                var tek = Math.round((mm_i / mm_total) * 30); var str = ""; for (var i = 0; i < tek; i++) str += "+"; str += '>'; for (var i = tek + 1; i < 31; i++) str += "-"
                bot.editMessageText({ chatId: mm_achatid, messageId: mm_amsgid, replyMarkup: RM_mm1, parseMode: html }, "<b>Выполнено:</b> " + mm_i + '/' + mm_total + ' - ' + Math.round((mm_i / mm_total) * 100) + '%\n' + str + "\n\n<b>Статистика:</b>\n<b>Успешных:</b> " + mm_ok + "\n<b>Неуспешных:</b> " + mm_err + "\n<b>Скорость:</b> " + mm_speed + "смс/с")
            }
            if (mm_i == mm_total) {
                mm_status = false;
                bot.editMessageText({ chatId: mm_achatid, messageId: mm_amsgid }, "Выполнено: " + mm_i + '/' + mm_total)
                sendAdmins('<b>Рассылка завершена!\n\nСтатистика:\nУспешно:</b> ' + mm_ok + "\n<b>Неуспешно:</b> " + mm_err, { parseMode: html })
                mm_u = []
            }
        } finally { }
    }
}

var mm_total
var mm_i
var mm_status = false
var mm_amsgid
var mm_type
var mm_imgid
var mm_text
var mm_achatid
var mm_btn_status
var mm_btn_text
var mm_btn_link
var mm_ok
var mm_err
var mm_speed = 20

async function mm_t(text, amsgid, achatid, btn_status, btn_text, btn_link, size) {
    let ut = await User.find({}, { id: 1 }).sort({ _id: -1 })
    mm_total = ut.length
    mm_u = []
    for (var i = 0; i < mm_total; i++)
        mm_u[i] = ut[i].id
    if (size != 100) {
        mm_u = randomizeArr(mm_u)
        mm_total = Math.ceil(mm_total * (size / 100))
        mm_u.length = mm_total
    }
    ut = undefined
    mm_i = 0;
    mm_amsgid = amsgid
    mm_type = "text"
    mm_text = text
    mm_ok = 0
    mm_err = 0
    mm_achatid = achatid
    if (btn_status) {
        mm_btn_status = true
        mm_btn_text = btn_text
        mm_btn_link = btn_link
    }
    else
        mm_btn_status = false
    mm_status = true;
    setTimeout(mmTick, 100)
}

async function mm_img(img, text, amsgid, achatid, btn_status, btn_text, btn_link, size) {
    let ut = await User.find({}, { id: 1 }).sort({ _id: -1 })
    mm_total = ut.length
    mm_u = []
    for (var i = 0; i < mm_total; i++)
        mm_u[i] = ut[i].id
    if (size != 100) {
        mm_u = randomizeArr(mm_u)
        mm_total = Math.ceil(mm_total * (size / 100))
        mm_u.length = mm_total
    }
    ut = undefined
    mm_i = 0;
    mm_amsgid = amsgid
    mm_type = "img"
    mm_text = text
    mm_imgid = img
    mm_ok = 0
    mm_err = 0
    mm_achatid = achatid
    if (btn_status) {
        mm_btn_status = true
        mm_btn_text = btn_text
        mm_btn_link = btn_link
    }
    else
        mm_btn_status = false
    mm_status = true;
    setTimeout(mmTick, 100)
}

var ttstr = ""

function randomizeArr(arr) {
    var j, temp;
    for (var i = arr.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        temp = arr[j];
        arr[j] = arr[i];
        arr[i] = temp;
    }
    return arr;
}


var qiwibalance = 0



async function updateQiwiBalance() {
    if (!config.qiwi.enabled) return
    require('request')({
        method: 'GET', url: `https://edge.qiwi.com/funding-sources/v2/persons/${config.qiwi.account.replace("+", "")}/accounts`, localAddress: "178.159.38.110",
        headers: { "Content-type": "application/json", "Accept": "application/json", "Authorization": "Bearer " + config.qiwi.api },
    }, async function (error, response, body) {
        try { qiwibalance = JSON.parse(body).accounts[0].balance.amount } catch (e) { console.log(e) }
    })
}

const countries = {
    any: "🌎 Любая страна",
    russia: "🇷🇺 Россия",
    uzbekistan: "🇺🇿 Узбекистан",
    netherlands: "🇳🇱 Нидерланды",
    canada: "🇨🇦 Канада",
    czech: "🇨🇿 Чехия",
    brazil: "🇧🇷 Бразилия",
    belarus: "🇧🇾 Беларусь",
    china: "🇨🇳 Китай",
    england: "🇬🇧 Великобритания",
    germany: "🇩🇪 Германия",
    spain: "🇪🇸 Испания",
    usa: "🇺🇸 США",
    kazakhstan: "🇰🇿 Казахстан",
    france: "🇫🇷 Франция",
    italy: "🇮🇹 Италия",
    sweden: "🇨🇭 Швеция",
    india: "🇮🇳 Индия",
    iran: "🇮🇷 Иран",
}

const SACountries = {
    russia: 0,
    uzbekistan: 40,
    netherlands: 48,
    canada: 36,
    czech: 63,
    brazil: 73,
    belarus: 51,
    china: 3,
    england: 16,
    germany: 43,
    spain: 56,
    usa: 12,
    kazakhstan: 2,
    france: 78,
    italy: 86,
    sweden: 46,
    india: 22,
    iran: 57,
}

const SimSMSCountries = {
    russia: "RU",
    uzbekistan: "UZ",
    netherlands: "NL",
    canada: "CA",
    czech: "CZ",
    brazil: "BR",
    belarus: "NO",
    china: "NO",
    england: "UK",
    germany: "DE",
    spain: "ES",
    usa: "US",
    kazakhstan: "KZ",
    france: "FR",
    italy: "NO",
    sweden: "SE",
    india: "NO",
    iran: "NO",
}


const products = {
    "airbnb": "Airbnb",
    "akelni": "Akelni",
    "quipp": "Quipp",
    "alibaba": "Alibaba",
    "alipay": "Alipay",
    "paypal": "PayPal",
    "amazon": "Amazon",
    "aol": "AOL",
    "avito": "Avito",
    "azino": "Azino",
    "bittube": "BitTube",
    "blablacar": "BlaBlaCar",
    "blizzard": "Blizzard",
    "blockchain": "Blockchain",
    "burgerking": "Burger King",
    "careem": "Careem",
    "cekkazan": "Çek Kazan",
    "citymobil": "Ситимобил",
    "delivery": "Delivery Club",
    "dent": "DENT",
    "discord": "Discord",
    "dixy": "Дикси",
    "dodopizza": "Додо Пицца",
    "domdara": "ДомДаРа",
    "drom": "Дром",
    "drugvokrug": "ДругВокруг",
    "dukascopy": "Dukascopy",
    "ebay": "eBay",
    "edgeless": "Edgeless",
    "electroneum": "Electroneum",
    "facebook": "Facebook",
    "fiverr": "Fiverr",
    "foodpanda": "Foodpanda",
    "forwarding": "Переадресация",
    "gameflip": "Gameflip",
    "gcash": "GCash",
    "get": "Get",
    "gett": "Gett",
    "globus": "Глобус",
    "glovo": "Glovo",
    "google": "Google",
    "grabtaxi": "Grab Taxi",
    "green": "Green",
    "hqtrivia": "HQ Trivia",
    "icard": "iCard",
    "icq": "ICQ",
    "imo": "Imo",
    "instagram": "Instagram",
    "iost": "IOST",
    "jd": "JD.com",
    "kakaotalk": "KakaoTalk",
    "keybase": "Keybase",
    "komandacard": "Семейная команда",
    "lazada": "Lazada",
    "lbry": "LBRY",
    "lenta": "Lenta.ru",
    "line": "Line",
    "linkedin": "LinkedIn",
    "livescore": "LiveScore",
    "magnit": "Магнит",
    "magnolia": "Magnolia",
    "mailru": "Mail.ru",
    "mamba": "Мамба",
    "mega": "Mega",
    "michat": "MiChat",
    "microsoft": "Microsoft",
    "miratorg": "Мираторг",
    "mtscashback": "МТС Cashback",
    "naver": "Naver",
    "netflix": "Netflix",
    "nimses": "Nimses",
    "nttgame": "NTT Game",
    "odnoklassniki": "Одноклассники",
    "okey": "О’кей",
    "olx": "OLX",
    "openpoint": "OPEN POINT",
    "oraclecloud": "Oracle Cloud",
    "other": "Другие",
    "ozon": "Ozon",
    "papara": "Papara",
    "paymaya": "PayMaya",
    "perekrestok": "Перекрёсток",
    "pof": "POF",
    "pokermaster": "PokerMaster",
    "proton": "Proton Mail",
    "pyaterochka": "Пятёрочка",
    "qiwiwallet": "QIWI",
    "reuse": "Повтроно использовать",
    "ripkord": "Ripkord",
    "seosprint": "SeoSprint",
    "shopee": "Shopee",
    "skout": "Skout",
    "snapchat": "Snapchat",
    "steam": "Steam",
    "tango": "Tango",
    "tantan": "Tantan",
    "telegram": "Telegram",
    "tencentqq": "Tencent QQ",
    "tiktok": "TikTok",
    "tinder": "Tinder",
    "truecaller": "Truecaller",
    "twitter": "Twitter",
    "uber": "Uber",
    "uploaded": "Загруженное",
    "vernyi": "Верный",
    "viber": "Viber",
    "vkontakte": "ВКонтакте",
    "voopee": "Voopee",
    "wechat": "WeChat",
    "weku": "WeKu",
    "whatsapp": "WhatsApp",
    "yahoo": "Yahoo",
    "yalla": "Yalla",
    "yandex": "Яндекс",
    "youdo": "YouDo",
    "youla": "Юла",
}


const productsSA = {
    "uk": "airbnb",
    "ab": "alibaba",
    "am": "amazon",
    "pm": "aol",
    "av": "avito",
    "blablacar": "ua",
    "ip": "burgerking",
    "ls": "careem",
    "dt": "delivery",
    "zz": "dent",
    "ds": "discord",
    "hz": "Дром",
    "we": "drugvokrug",
    "dh": "ebay",
    "fb": "facebook",
    "nz": "foodpanda",
    "gt": "gett",
    "go": "google",
    "iq": "icq",
    "im": "imo",
    "ig": "instagram",
    "jd": "JD.com",
    "kt": "kakaotalk",
    "bf": "keybase",
    "rd": "lenta",
    "me": "line",
    "tn": "linkedin",
    "mg": "magnit",
    "ma": "mailru",
    "fd": "mamba",
    "qr": "mega",
    "mc": "michat",
    "mm": "microsoft",
    "da": "mtscashback",
    "nf": "netflix",
    "zy": "nttgame",
    "ok": "odnoklassniki",
    "sn": "olx",
    "sg": "ozon",
    "pl": "perekrestok",
    "dp": "proton",
    "bd": "pyaterochka",
    "qw": "qiwiwallet",
    "vv": "seosprint",
    "ka": "shopee",
    "fu": "snapchat",
    "mt": "steam",
    "tg": "telegram",
    "lf": "tiktok",
    "oi": "tinder",
    "tl": "truecaller",
    "tw": "twitter",
    "ub": "uber",
    "vi": "viber",
    "vk": "vkontakte",
    "wb": "wechat",
    "wa": "whatsapp",
    "mb": "yahoo",
    "yl": "yalla",
    "ya": "yandex",
    "ym": "youla",
}

const priorities = {
    "airbnb": 50,
    "akelni": 67,
    "alibaba": 49,
    "amazon": 48,
    "aol": 68,
    "avito": 2,
    "azino": 69,
    "bittube": 70,
    "blablacar": 47,
    "blizzard": 46,
    "blockchain": 51,
    "burgerking": 45,
    "careem": 71,
    "cekkazan": 72,
    "citymobil": 44,
    "delivery": 17,
    "dent": 73,
    "discord": 43,
    "dixy": 52,
    "dodopizza": 53,
    "domdara": 74,
    "drom": 42,
    "drugvokrug": 41,
    "dukascopy": 75,
    "ebay": 40,
    "edgeless": 76,
    "electroneum": 54,
    "facebook": 4,
    "fiverr": 77,
    "foodpanda": 78,
    "forwarding": 112,
    "gameflip": 79,
    "gcash": 80,
    "get": 81,
    "gett": 39,
    "globus": 82,
    "glovo": 83,
    "google": 11,
    "grabtaxi": 84,
    "green": 85,
    "hqtrivia": 86,
    "icard": 87,
    "icq": 38,
    "imo": 88,
    "instagram": 5,
    "iost": 89,
    "jd": 37,
    "kakaotalk": 36,
    "keybase": 90,
    "komandacard": 91,
    "lazada": 92,
    "lbry": 93,
    "lenta": 35,
    "line": 34,
    "linkedin": 33,
    "livescore": 56,
    "magnit": 55,
    "magnolia": 94,
    "mailru": 12,
    "mamba": 58,
    "mega": 57,
    "michat": 32,
    "microsoft": 31,
    "miratorg": 59,
    "mtscashback": 60,
    "naver": 95,
    "netflix": 16,
    "nimses": 61,
    "nttgame": 96,
    "odnoklassniki": 3,
    "okey": 30,
    "olx": 97,
    "openpoint": 98,
    "oraclecloud": 52,
    "other": 21,
    "ozon": 15,
    "papara": 99,
    "paymaya": 100,
    "perekrestok": 63,
    "pof": "POF",
    "pokermaster": 101,
    "proton": 64,
    "pyaterochka": 29,
    "qiwiwallet": 28,
    "reuse": 110,
    "ripkord": 102,
    "seosprint": 27,
    "shopee": 103,
    "skout": 104,
    "snapchat": 26,
    "steam": 14,
    "tango": 65,
    "tantan": 66,
    "telegram": 8,
    "tencentqq": 25,
    "tiktok": 18,
    "tinder": 19,
    "truecaller": 105,
    "twitter": 9,
    "uber": 13,
    "uploaded": 111,
    "vernyi": 106,
    "viber": 20,
    "vkontakte": 6,
    "voopee": 107,
    "wechat": 24,
    "weku": 108,
    "whatsapp": 7,
    "yahoo": 23,
    "yalla": 109,
    "yandex": 10,
    "youdo": 22,
    "youla": 1,
}

const RM_countries = bot.inlineKeyboard([
    [bot.inlineButton(countries.russia, { callback: "setCountry_russia" }), bot.inlineButton(countries.kazakhstan, { callback: "setCountry_kazakhstan" }), bot.inlineButton(countries.belarus, { callback: "setCountry_belarus" })],
    [bot.inlineButton(countries.uzbekistan, { callback: "setCountry_uzbekistan" }), bot.inlineButton(countries.usa, { callback: "setCountry_usa" }), bot.inlineButton(countries.canada, { callback: "setCountry_canada" })],
    [bot.inlineButton(countries.netherlands, { callback: "setCountry_netherlands" }), bot.inlineButton(countries.england, { callback: "setCountry_england" }), bot.inlineButton(countries.czech, { callback: "setCountry_czech" })],
    [bot.inlineButton(countries.italy, { callback: "setCountry_italy" }), bot.inlineButton(countries.spain, { callback: "setCountry_spain" }), bot.inlineButton(countries.france, { callback: "setCountry_france" })],
    [bot.inlineButton(countries.china, { callback: "setCountry_china" }), bot.inlineButton(countries.india, { callback: "setCountry_india" }), bot.inlineButton(countries.germany, { callback: "setCountry_germany" })],
    [bot.inlineButton(countries.brazil, { callback: "setCountry_brazil" }), bot.inlineButton(countries.sweden, { callback: "setCountry_sweden" }), bot.inlineButton(countries.iran, { callback: "setCountry_iran" })],
    [bot.inlineButton("◀️ Назад", { callback: "settings" })],
])

async function getResponse(url) {
    var res = await requestify.get(url, { headers: { "Authorization": `Bearer ${config.api5sim}` } })
    return JSON.parse(res.body)
}
async function getResponseSimSMS(url) {
    var res = await requestify.get(url)
    console.log(res.body)
    return JSON.parse(res.body)
}

async function getProducts(country) { return await getResponse(`https://5sim.net/v1/guest/products/${country}/any`) }
async function getProductsSA(country) { return await getResponseSA(`https://sms-activate.ru/stubs/handler_api.php?api_key=${config.apismsActivate}&action=getNumbersStatus${country == "any" ? `` : `&country=${SACountries[country]}`}`) }
async function getBalance(coutry) { return (await getResponse(`https://5sim.net/v1/user/profile`)).balance }
async function getProductByName(name, country) { return (await getProducts(country))[name] }

async function getProductPriceByNameSimSMS(name, country) {
    if (SimSMSCountries[country] == "NO") return "NO"
    return await getResponseSimSMS(`http://simsms.org/priemnik.php?metod=get_service_price${country == "any" ? "" : `&country=${SimSMSCountries[country]}`}&service=${servicesNamesSimSMS[name]}&apikey=${config.apiSimSMS}
`)
}

async function getProductQtyByNameSimSMS(name, country) {
    if (SimSMSCountries[country] == "NO") return "NO"
    return await getResponseSimSMS(`http://simsms.org/priemnik.php?metod=get_count_new${country == "any" ? "" : `&country=${SimSMSCountries[country]}`}&service=${servicesNamesSimSMS[name]}&apikey=${config.apiSimSMS}
`)
}

async function getProductsPage(country, page, uFav) {
    var prdcts = await getProducts(country)
    /* var prdctsSA = await getProductsSA(country)
 
     var arrPrdctsSA = []
     for (const i in prdctsSA)
         if (~prdctsSA[i].indexOf("0") && productsSA[i.replace("_0", "")] != undefined)
             arrPrdctsSA.push({ name: productsSA[i.replace("_0", "")], qty: prdctsSA[i], type: "productSA" })
     console.log(arrPrdctsSA)
 */
    var arrPrdcts = []
    for (const i in prdcts)
        if (prdcts[i].Category == 'activation' && i != "forwarding" && i != "reuse" && i != "uploaded" && products[i] != undefined)
            arrPrdcts.push({ name: i, qty: prdcts[i].Qty, price: prdcts[i].Price, category: prdcts[i].Category, priority: priorities[i], type: getProductTypeByName(i), uPriority: 0 })
    var uFavI = 0

    uFav.map(e => {
        if (arrPrdcts.filter(e2 => e2.name == e).length)
            arrPrdcts.filter(e2 => e2.name == e)[0].uPriority = uFavI++
    })

   
    arrPrdcts.sort((a, b) => a.priority - b.priority)
    arrPrdcts.sort((a, b) => b.uPriority - a.uPriority)
    
    var pagesCount = Math.ceil(arrPrdcts.length / 21)
    arrPrdcts = arrPrdcts.slice(page * 21, page * 21 + 21)
    return { pagesCount, pageNumber: page, page: arrPrdcts }
}

function getPageRM(pp) {
    var page = pp.page
    var mass = []
    mass.length = Math.ceil(page.length / 3)
    mass.fill(0)
    mass = mass.map(e => { return new Array(0) })
    var replyMarkup = { inline_keyboard: mass }
    for (var i = 0; i < page.length; i++)
        replyMarkup.inline_keyboard[Math.floor(i / 3)].push(bot.inlineButton(`${page[i].uPriority == 0 ? `▫️` : `⭐️`} ${products[page[i].name]}`, { callback: `${page[i].type}_${page[i].name}_${pp.pageNumber}` }))

    replyMarkup.inline_keyboard.push([bot.inlineButton(`◀️ ${pp.pageNumber ? pp.pageNumber : pp.pagesCount}/${pp.pagesCount}`, { callback: `buyNumber_${pp.pageNumber ? pp.pageNumber - 1 : pp.pagesCount - 1}` }), bot.inlineButton(`⏏️ Назад`, { callback: `main` }), bot.inlineButton(`▶️ ${pp.pageNumber == pp.pagesCount - 1 ? 1 : pp.pageNumber + 2}/${pp.pagesCount}`, { callback: `buyNumber_${pp.pageNumber == pp.pagesCount - 1 ? 0 : pp.pageNumber + 1}` })])
    return replyMarkup
}

async function getRating(country) { return (await getResponse(`https://5sim.net/v1/user/profile`)).rating }

async function buyNumber(country, name) { return await getResponse(`https://5sim.net/v1/user/buy/activation/${country}/any/${name}`) }
async function checkOrder(order_id) { return await getResponse(`https://5sim.net/v1/user/check/${order_id}`) }
async function finishOrder(order_id) { return await getResponse(`https://5sim.net/v1/user/finish/${order_id}`) }
async function cancelOrder(order_id) { return await getResponse(`https://5sim.net/v1/user/cancel/${order_id}`) }
async function banOrder(order_id) { return await getResponse(`https://5sim.net/v1/user/ban/${order_id}`) }

async function buyNumberSimSMS(country, name) { return await getResponseSimSMS(`http://simsms.org/priemnik.php?metod=get_number${country == "any" ? "" : `&country=${SimSMSCountries[country]}`}&service=${servicesNamesSimSMS[name]}&apikey=${config.apiSimSMS}`) }
async function checkOrderSimSMS(order_id, name, country) { return await getResponseSimSMS(`http://simsms.org/priemnik.php?metod=get_sms${country == "any" ? "" : `&country=${SimSMSCountries[country]}`}&service=${servicesNamesSimSMS[name]}&id=${order_id}&apikey=${config.apiSimSMS}`) }
async function cancelOrderSimSMS(order_id, name, country) {
    return await getResponseSimSMS(`http://simsms.org/priemnik.php?metod=denial${country == "any" ? "" : `&country=${SimSMSCountries[country]}`}&service=${servicesNamesSimSMS[name]}&id=${order_id}&apikey=${config.apiSimSMS}`)
}

function getDiff(d) {
    var date = new Date(d)
    var now = new Date()
    var secondsDiff = Math.floor((date.getTime() - now.getTime()) / 1000)
    var minutesDiff = Math.floor(secondsDiff / 60)
    secondsDiff = Math.floor(secondsDiff % 60)
    return `${minutesDiff > 9 ? minutesDiff : "0" + minutesDiff}:${secondsDiff > 9 ? secondsDiff : "0" + secondsDiff}`
}

const notificationStatuses = {
    silent: "🔕 Без звука",
    normal: "🔔 Звук",
    disable: " ❌ Отключены",
}

function getNextNotificationStatus(status) {
    if (status == "silent") return "normal"
    if (status == "normal") return "disable"
    if (status == "disable") return "silent"
}

function getRMDefault(giftStatus) {
    if (giftStatus)
        return bot.inlineKeyboard([
            [bot.inlineButton('📲 Купить номер', { callback: "buyNumber_0" }), bot.inlineButton('💳 Пополнить баланс', { callback: "addFunds" })],
            [bot.inlineButton('✉️ Полученные сообщения', { callback: "receivedMsgs" }), bot.inlineButton('⚙️ Настройки', { callback: "settings" })],
            [bot.inlineButton('👤 Партнёры', { callback: "refs" }), bot.inlineButton('ℹ️ Информация', { callback: "info" })],
        ])
    else
        return bot.inlineKeyboard([
            [bot.inlineButton('📲 Купить номер', { callback: "buyNumber_0" }), bot.inlineButton('💳 Пополнить баланс', { callback: "addFunds" })],
            [bot.inlineButton('✉️ Полученные сообщения', { callback: "receivedMsgs" }), bot.inlineButton('⚙️ Настройки', { callback: "settings" })],
            [bot.inlineButton('👤 Партнёры', { callback: "refs" }), bot.inlineButton('ℹ️ Информация', { callback: "info" })],
            [bot.inlineButton(`🎁 Подарок`, { callback: "gift" })]
        ])
}

const servicesUsingSimSMS = ['telegra1m']

const servicesNamesSimSMS = {
    "telegram": "opt29"
}

function getProductTypeByName(name) {
    if (~servicesUsingSimSMS.indexOf(name))
        return "product2"
    else
        return "product"
}

async function payRefEarnings(user, comms_sum) {
    if (user.ref != 0) {
        await User.updateOne({ id: user.ref }, { $inc: { ref_balance: comms_sum * 0.15 } })
        bot.sendMessage(user.ref, `🤝 На Ваш партнёрский баланс начислено <b>${roundPlus(comms_sum * 0.15)}₽</b> за обмен Вашего <a href="tg://user?id=${user.id}">партнёра</a> на <b>1 уровне</b>`, { parseMode: html })
    }

async function payReferers(u) {
    var ref = await getUser(u.ref)
    if (ref) {
        if (ref.notifications.rp != "disable")
            bot.sendMessage(ref.id, `💸 Вам начислено <b>0.25₽</b> за покупку номера Вашим <a href="tg://user?id=${u.id}">партнёром</a> на <b>1 уровне</b>!`, { parseMode: html, notification: ref.notifications.rp != "silent" })
        await ref.updateOne({ $inc: { "info.ref1earnings": 0.25, ref_balance: 0.25 } })
    }
	if (user.ref) {
                        var r = await getUser(user.ref)
                        await User.findOneAndUpdate({ id: user.ref }, { $inc: { buy_balance: roundPlus(sum * 0.05), "info.ref1earnings": roundPlus(sum * 0.05) } })
                        bot.sendMessage(user.ref, `👤 Ваш <a href="tg://user?id=${id}">реферал</a> <b>1 уровня</b> пополнил баланс на <b>${sum} MCoin</b>!\n💸 Вам начислено <b>${roundPlus(sum * 0.05)} MCoin</b> на баланс для покупок`, { parseMode: "HTML", replyMarkup: bot.inlineKeyboard([[bot.inlineButton(`↩️ Сделать рефбэк ${r.refback}% (${roundPlus(sum * 0.05 * r.refback * 0.01)} MCoin)`, {callback: `rb_${roundPlus(sum * 0.05 * r.refback * 0.01)}_${id}`})]]) })
                    }
                    if (user.ref2) {
                        await User.findOneAndUpdate({ id: user.ref2 }, { $inc: { buy_balance: roundPlus(sum * 0.02), "info.ref2earnings": roundPlus(sum * 0.02) } })
                        bot.sendMessage(user.ref2, `👤 Ваш <a href="tg://user?id=${id}">реферал</a> <b>2 уровня</b> пополнил баланс на <b>${sum} MCoin</b>!\n💸 Вам начислено <b>${roundPlus(sum * 0.02)} MCoin</b> на баланс для покупок`, { parseMode: "HTML" })
                    }
                    await incParam("totalPaidIn", sum)
                    hourlyTopsUpdate()
                }
                last_txid_qiwi = txn.txnId
            }

	if (user.ref != 0) {
        await User.updateOne({ id: user.ref }, { $inc: { ref_balance: comms_sum * 0.15 } })
        bot.sendMessage(user.ref, `🤝 На Ваш партнёрский баланс начислено <b>${roundPlus(comms_sum * 0.15)}₽</b> за обмен Вашего <a href="tg://user?id=${user.id}">партнёра</a> на <b>1 уровне</b>`, { parseMode: html })
    }
	
    var ref2 = await getUser(u.ref2)
    if (ref2) {
        if (ref2.notifications.rp != "disable")
            bot.sendMessage(ref2.id, `💸 Вам начислено <b>0.15₽</b> за покупку номера Вашим <a href="tg://user?id=${u.id}">партнёром</a> на <b>2 уровне</b>!`, { parseMode: html, notification: ref2.notifications.rp != "silent" })
        await ref2.updateOne({ $inc: { "info.ref2earnings": 0.15, ref_balance: 0.15 } })
    }

    var ref3 = await getUser(u.ref3)
    if (ref3) {
        if (ref3.notifications.rp != "disable")
            bot.sendMessage(ref3.id, `💸 Вам начислено <b>0.05₽</b> за покупку номера Вашим <a href="tg://user?id=${u.id}">партнёром</a> на <b>3 уровне</b>!`, { parseMode: html, notification: ref3.notifications.rp != "silent" })
        await ref3.updateOne({ $inc: { "info.ref3earnings": 0.05, ref_balance: 0.05 } })
    }
}

String.prototype.replaceAll = function (search, replace) {
    return this.split(search).join(replace);
}

