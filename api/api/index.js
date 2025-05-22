const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Transaction = require('./models/Transaction.js');
const mongoose = require('mongoose');
const app = express();

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/api/test', (req, res) => {
  res.json({ body: 'test ok3' });
});

app.post('/api/transaction', async (req, res) => {
  console.log(req.body);
  try {
    const {price, name, description, datetime } = req.body;
    const transaction = await Transaction.create({ price,name, description, datetime });
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save transaction', details: err });
  }
});
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find();
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions', details: err });
  }
});
app.listen(4040);