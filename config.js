
var config = {};

// Администраторы бота:
config.admin_list = [497229452,] // ID админов бота
config.admin_username = '497229452'; // Юзернейм админа (рекламного менеджера)

// Системные параметры бота:
config.proxy = null; // Прокси для соединения с серверами Telegram http://HohrVp:6H8BY2@81.4.108.157:35357
config.qiwi = ''; // API ключ QIWI кошелька (первые 3 галочки доступа)
config.mongodb = "mongodb://localhost:27017/as"; // URL MongoDB базы 
config.token = "5072924105:AAG90oazDx61FmPiTSUIfh7DHMa53nwvu58"; // API ключ бота
config.bot_id = 5072924105; // ID бота (первая часть API ключа)
config.qiwi_update = 5000; // Частота проверки на новые транзакции QIWI
config.antispam_interval = 0.5; // Интервал антиспама (с)
config.stats_update = 60; // Частота обновления статистики (с)
config.voucher_res = 8; // Количество символов в чеке
config.mm_interval = 75; // Интервал между сообщениями при рассылке
config.ref_msg_cost = 100

module.exports = config;

