const {
    processMessage,
    sendGetStartedMessage,
    showTodayReminders,
    deleteReminder,
    showAllReminders,
    snoozeReminder,
    acceptReminder
} = require('../controllers/messageController');

const GET_STARTED_PAYLOAD = 'GET_STARTED_PAYLOAD';
const SHOW_REMINDERS_PAYLOAD = 'SHOW_REMINDERS';
const SHOW_TODAY_REMINDERS_PAYLOAD = 'SHOW_TODAY_REMINDERS';
const SHOW_EXAMPLE_PAYLOAD = 'SHOW_EXAMPLE';
const DELETE_REMINDER_PAYLOAD = 'DELETE_REMINDER_PAYLOAD_';
const SNOOZE_REMINDER_PAYLOAD = 'SNOOZE_REMINDER_PAYLOAD_';
const ACCEPT_REMINDER_PAYLOAD = 'ACCEPT_REMINDER_PAYLOAD_';

const verifyWebhooks = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token === process.env.FB_VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
};

const processRequest = (req, res) => {
    if (req.body.object === 'page') {
        req.body.entry.forEach(entry => {
            entry.messaging.forEach(event => {
                const payload = event.postback ? event.postback.payload : null;

                if (event.message && event.message.text) {
                    processMessage(event);
                } else if (payload === GET_STARTED_PAYLOAD || payload === SHOW_EXAMPLE_PAYLOAD) {
                    const userId = event.sender.id;

                    sendGetStartedMessage(userId);
                } else if (payload === SHOW_REMINDERS_PAYLOAD) {
                    const userId = event.sender.id;

                    showAllReminders(userId);
                } else if (payload === SHOW_TODAY_REMINDERS_PAYLOAD) {
                    const userId = event.sender.id;

                    showTodayReminders(userId);
                } else if (payload.includes(DELETE_REMINDER_PAYLOAD)) {
                    const userId = event.sender.id;
                    const reminderId = payload.replace(DELETE_REMINDER_PAYLOAD, '');

                    deleteReminder(userId, reminderId);
                } else if (payload.includes(SNOOZE_REMINDER_PAYLOAD)) {
                    const userId = event.sender.id;
                    const reminderId = payload.replace(SNOOZE_REMINDER_PAYLOAD, '');

                    snoozeReminder(userId, reminderId);
                } else if (payload.includes(ACCEPT_REMINDER_PAYLOAD)) {
                    const userId = event.sender.id;
                    const reminderId = payload.replace(ACCEPT_REMINDER_PAYLOAD, '');

                    acceptReminder(userId, reminderId);
                }
            });
        });

        res.sendStatus(200);
    }
};

module.exports = {
    verifyWebhooks,
    processRequest
};