const { DateTime } = require('luxon');
const Queue = require('bee-queue');
const Reminder = require('../models/reminder');
const { sendReminderMessage } = require('../helpers/messageHelper');

const queue = new Queue('reminder', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD
    },
    removeOnSuccess: true,
    activateDelayedJobs: true
});

queue.process(async (job) => {
    Reminder.findById(job.data.reminderId)
        .then(reminder => {
            sendReminderMessage(reminder.user_id, reminder);
        });
});

const createReminder = (user_id, name, date) => {
    return new Reminder({ user_id, name, date })
        .save()
        .then((reminder => {
            return queue.createJob({ reminderId: reminder.id })
                .delayUntil(new Date(date.toISO()))
                .save()
                .then(job => {
                    reminder.jobId = job.id;
                    reminder.save();

                    return reminder;
                });
        }));
}

const deleteReminderById = (id) => {
    return Reminder.findOneAndRemove({ _id: id })
        .then(reminder => {
            queue.removeJob(reminder.jobId);

            return reminder;
        });
}

const snoozeReminderById = (id) => {
    const date = DateTime.local().plus({ minute: 5 });

    return Reminder.findByIdAndUpdate(id, { date })
        .then(reminder => {
            queue.removeJob(reminder.jobId);

            return queue.createJob({ reminderId: reminder.id })
                .delayUntil(new Date(date.toISO()))
                .save()
                .then(job => {
                    reminder.jobId = job.id;
                    reminder.save();

                    return reminder;
                });
        });
}

const getRemindersByDate = (date) => {
    return Reminder.find({
        date: {
            $gte: date.startOf('day'),
            $lte: date.endOf('day')
        }
    });
}

const getActiveReminders = (date) => {
    return Reminder.find({
        date: {
            $eq: date
        }
    });
}

const getRemindersByUser = (userId) => {
    return Reminder.find({ user_id: userId }).limit(10).sort({ date: -1 });
}

const getRemindersByUserAndDate = (userId, date) => {
    return Reminder.find({
        user_id: userId,
        date: {
            $gte: date.startOf('day'),
            $lte: date.endOf('day')
        }
    });
}

module.exports = {
    createReminder,
    deleteReminderById,
    snoozeReminderById,
    getRemindersByDate,
    getActiveReminders,
    getRemindersByUser,
    getRemindersByUserAndDate
};