const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
    user_id: String,
    name: String,
    date: Date,
    jobId: {type: Number, default: null}
});

module.exports = mongoose.model('Reminder', reminderSchema);