// postgrees subscribes in DB
enum notifications {
    'insertTradeNotification'= 'insertTradeNotification',
    'updateTradesGlobalCountNotification'= 'updateTradesGlobalCountNotification'
}

// subscribe groups
// one group can contains one or few notifications
const subscribes = {
    tradeStat: [notifications.updateTradesGlobalCountNotification],
    tradeInsert: [notifications.insertTradeNotification]
};

export { notifications, subscribes }
