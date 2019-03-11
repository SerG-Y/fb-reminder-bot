const {
    createReminder,
    getRemindersByUserAndDate,
    getRemindersByDate,
    deleteReminderById,
    snoozeReminderById,
    getRemindersByUser
} = require('../helpers/reminderHelper');
const {
    sendTextMessage,
    sendListMessage
} = require('../helpers/messageHelper');
const dialogflow = require('dialogflow');
const { DateTime } = require('luxon');

const config = {
    credentials: {
        private_key: process.env.DIALOGFLOW_PRIVATE_KEY,
        client_email: process.env.DIALOGFLOW_CLIENT_EMAIL
    }
};
const LANGUAGE_CODE = 'en-US';
const { PROJECT_ID, SESSION_ID } = process.env;
const sessionClient = new dialogflow.SessionsClient(config);
const sessionPath = sessionClient.sessionPath(PROJECT_ID, SESSION_ID);

const GET_STARTED_MESSASGES = [
    'Hi. Try something like: "Remind me to return the library book on June 15" or "Get my tomorrow reminders"',
    'Hey. Try something like: "Remind me to book flight tickets to Seattle tomorrow at 6pm" or "Get my reminders on June 15"'
];

const sendGetStartedMessage = (userId) => {
    sendTextMessage(userId, GET_STARTED_MESSASGES[Math.floor(Math.random() * GET_STARTED_MESSASGES.length)]);
}

const showTodayReminders = (userId) => {
    getRemindersByUserAndDate(userId, DateTime.local())
        .then(reminders => {
            sendListMessage(userId, reminders)
        })
        .catch(err => console.log(err));
}

const showAllReminders = (userId) => {
    getRemindersByUser(userId)
        .then(reminders => {
            sendListMessage(userId, reminders)
        })
        .catch(err => console.log(err));
}

const deleteReminder = (userId, reminderId) => {
    deleteReminderById(reminderId)
        .then(reminder => {
            sendTextMessage(userId, 'Deleted');
        })
        .catch(err => console.log(err));
}

const acceptReminder = (userId) => {
    sendTextMessage(userId, 'Got it');
}

const snoozeReminder = (userId, reminderId) => {
    snoozeReminderById(reminderId)
        .then(reminder => {
            sendTextMessage(userId, 'Snoozed on 5 minutes');
        })
        .catch(err => console.log(err));
}

const processMessage = (event) => {
    const userId = event.sender.id;
    const message = event.message.text;
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: message,
                languageCode: LANGUAGE_CODE,
            },
        },
    };

    sessionClient
        .detectIntent(request)
        .then(responses => {
            const result = responses[0].queryResult;

            processDialogflowResponse(userId, result);
        })
        .catch(err => {
            console.error('ERROR:', err);
        });
}

const processDialogflowResponse = (userId, result) => {
    if (result.allRequiredParamsPresent) {
        switch (result.action) {
            case 'reminders.add': {
                const fields = result.parameters.fields;
                const date = DateTime.fromISO(fields['date-time'].stringValue);
                const name = fields['name'].stringValue;

                if (date.isValid) {
                    return createReminder(userId, name, date.toUTC())
                        .then(() => {
                            sendTextMessage(
                                userId,
                                `Okay, I'll remind you ${name} at ${date.toFormat('t')} on ${date.toFormat('LLLL d, cccc')}`
                            );
                        });
                }
            }

            case 'reminders.get': {
                const fields = result.parameters.fields;
                const date = DateTime.fromISO(fields['date-time'].stringValue);

                if (date.isValid) {
                    return getRemindersByDate(date).then((reminders) => {
                        sendListMessage(userId, reminders);
                    });
                }
            }

            default:
                return sendTextMessage(userId, result.fulfillmentText);
        }
    } else {
        return sendTextMessage(userId, result.fulfillmentText);
    }
}

module.exports = {
    sendGetStartedMessage,
    showTodayReminders,
    showAllReminders,
    deleteReminder,
    snoozeReminder,
    processMessage,
    acceptReminder
};