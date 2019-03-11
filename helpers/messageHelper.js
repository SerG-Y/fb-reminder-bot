const fetch = require('node-fetch');
const { DateTime } = require('luxon');

const { FACEBOOK_ACCESS_TOKEN } = process.env;
const FB_API_URL = 'https://graph.facebook.com/v2.6/me/messages'


const sendTextMessage = (userId, text) => {
    sendResponse(JSON.stringify({
        recipient: {
            id: userId,
        },
        message: {
            text,
        },
    }));
};

const sendListMessage = (userId, reminders) => {
    const elements = reminders.map(reminder => {
        const date = DateTime.fromISO(reminder.date.toISOString());
    
        return {
            title: reminder.name,
            subtitle: `at ${date.toFormat('t')} on ${date.toFormat('LLLL d, cccc')}`,
            buttons: [
                {
                    type: 'postback',
                    payload: `DELETE_REMINDER_PAYLOAD_${reminder._id}`,
                    title: 'Delete'
                }
            ]
        };
    });

    sendResponse(JSON.stringify({
        recipient: {
            id: userId,
        },
        message: {
            attachment: {
                type: 'template',
                payload: {
                    template_type: 'generic',
                    elements
                }
            }
        }
    }));
};

const sendReminderMessage = (userId, reminder) => {
    const date = DateTime.fromISO(reminder.date.toISOString());

    sendResponse(JSON.stringify({
        recipient: {
            id: userId,
        },
        message: {
            attachment: {
                type: 'template',
                payload: {
                    template_type: 'generic',
                    elements: [
                        {
                            title: reminder.name,
                            subtitle: `at ${date.toFormat('t')} on ${date.toFormat('LLLL d, cccc')}`,
                            image_url: 'https://cdn.shopclues.com/images/thumbnails/78745/320/320/12396047394598814114972438781500540305.jpg',
                            buttons: [
                                {
                                    type: 'postback',
                                    payload: `SNOOZE_REMINDER_PAYLOAD_${reminder._id}`,
                                    title: 'Snooze'
                                },
                                {
                                    type: 'postback',
                                    payload: `ACCEPT_REMINDER_PAYLOAD_${reminder._id}`,
                                    title: 'Accept'
                                }
                            ]
                        }
                    ]
                }
            }
        }
    }));
};

const sendResponse = (body) => {
    return fetch(`${FB_API_URL}?access_token=${FACEBOOK_ACCESS_TOKEN}`, {
        headers: {
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body
    });
};

module.exports = {
    sendTextMessage,
    sendListMessage,
    sendReminderMessage
};