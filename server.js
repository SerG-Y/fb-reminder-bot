require('dotenv').config({ path: 'variables.env' });

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { verifyWebhooks, processRequest } = require('./routes/webhooks');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_DB_CONNECTION_URL, { useNewUrlParser: true, useFindAndModify: false });

app.get('/webhooks', verifyWebhooks);
app.post('/webhooks', processRequest);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`App is waiting on port ${port}`));