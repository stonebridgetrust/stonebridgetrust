// server.js - Fixed for Render
require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

// Email transporter using environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Store verification codes temporarily
const verificationCodes = {};

const app = express();

// ========== DATABASE CONNECTION - FIXED FOR RENDER ==========
// Use DATABASE_URL if available (Render), otherwise use individual variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

// Middleware
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Home route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ========== EMAIL VERIFICATION ==========
app.post('/send-code', async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[email] = code;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Stonebridge Trust - Email Verification',
      text: `Your verification code is: ${code}. This code expires in 10 minutes.`
    });
    res.json({ success: true, message: 'Verification code sent!' });
  } catch (error) {
    console.error('Email error:', error);
    res.json({ success: false, message: 'Failed to send email.' });
  }
});

// ========== REGISTER ==========
app.post('/register', async (req, res) => {
  const { name, email, phone, account_type, password, code } = req.body;

  if (verificationCodes[email] !== code) {
    return res.json({ success: false, message: 'Invalid verification code.' });
  }

  const accountNumber = '30' + Math.floor(10000000 + Math.random() * 90000000).toString();

  try {
    const result = await pool.query(
      'INSERT INTO users (name, email, phone, account_type, password, account_number, balance, transactions) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [name, email, phone, account_type, password, accountNumber, 0.00, JSON.stringify([])]
    );
    delete verificationCodes[email];
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Register error:', error);
    res.json({ success: false, message: 'Email already exists.' });
  }
});

// ========== LOGIN ==========
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );
    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.json({ success: false, message: 'Invalid email or password.' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.json({ success: false, message: 'Something went wrong.' });
  }
});

// ========== GET USER DATA ==========
app.get('/api/user/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, account_type, account_number, balance, transactions FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length > 0) {
      let user = result.rows[0];
      if (typeof user.transactions === 'string') {
        user.transactions = JSON.parse(user.transactions);
      }
      if (!user.transactions) user.transactions = [];
      res.json({ success: true, user: user });
    } else {
      res.json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Get user error:', error);
    res.json({ success: false, message: error.message });
  }
});

// ========== GET USER BY ACCOUNT NUMBER ==========
app.get('/api/user-by-account/:accountNumber', async (req, res) => {
  const { accountNumber } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, name, email, account_number FROM users WHERE account_number = $1',
      [accountNumber]
    );
    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.json({ success: false, message: 'Account number not found' });
    }
  } catch (error) {
    console.error('Get by account error:', error);
    res.json({ success: false, message: error.message });
  }
});

// ========== DEPOSIT ==========
app.post('/api/deposit', async (req, res) => {
  const { email, amount, description } = req.body;
  
  if (!amount || amount <= 0) {
    return res.json({ success: false, message: 'Please enter a valid amount.' });
  }
  
  try {
    const userResult = await pool.query('SELECT balance, transactions FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.json({ success: false, message: 'User not found' });
    }
    
    let currentBalance = parseFloat(userResult.rows[0].balance);
    let transactions = userResult.rows[0].transactions;
    
    if (typeof transactions === 'string') {
      transactions = JSON.parse(transactions);
    }
    if (!transactions) transactions = [];
    
    const newBalance = currentBalance + amount;
    
    const newTransaction = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      type: 'deposit',
      description: description || 'Cash deposit',
      amount: amount,
      amountSigned: +amount,
      balanceAfter: newBalance,
      status: 'completed'
    };
    
    transactions.unshift(newTransaction);
    
    await pool.query(
      'UPDATE users SET balance = $1, transactions = $2::jsonb WHERE email = $3',
      [newBalance, JSON.stringify(transactions), email]
    );
    
    res.json({ 
      success: true, 
      message: `$${amount.toFixed(2)} deposited successfully.`,
      newBalance: newBalance,
      transaction: newTransaction 
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ========== WITHDRAW ==========
app.post('/api/withdraw', async (req, res) => {
  const { email, amount, description } = req.body;
  
  if (!amount || amount <= 0) {
    return res.json({ success: false, message: 'Please enter a valid amount.' });
  }
  
  try {
    const userResult = await pool.query('SELECT balance, transactions FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.json({ success: false, message: 'User not found' });
    }
    
    let currentBalance = parseFloat(userResult.rows[0].balance);
    
    if (currentBalance < amount) {
      return res.json({ success: false, message: `Insufficient funds. Your balance is $${currentBalance.toFixed(2)}.` });
    }
    
    let transactions = userResult.rows[0].transactions;
    if (typeof transactions === 'string') {
      transactions = JSON.parse(transactions);
    }
    if (!transactions) transactions = [];
    
    const newBalance = currentBalance - amount;
    
    const newTransaction = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      type: 'withdraw',
      description: description || 'ATM withdrawal',
      amount: amount,
      amountSigned: -amount,
      balanceAfter: newBalance,
      status: 'completed'
    };
    
    transactions.unshift(newTransaction);
    
    await pool.query(
      'UPDATE users SET balance = $1, transactions = $2::jsonb WHERE email = $3',
      [newBalance, JSON.stringify(transactions), email]
    );
    
    res.json({ 
      success: true, 
      message: `$${amount.toFixed(2)} withdrawn successfully.`,
      newBalance: newBalance,
      transaction: newTransaction 
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ========== TRANSFER ==========
app.post('/api/transfer', async (req, res) => {
  const { email, amount, recipientAccountNumber, description, transferType } = req.body;
  
  if (!amount || amount <= 0) {
    return res.json({ success: false, message: 'Please enter a valid amount.' });
  }
  
  if (!recipientAccountNumber || recipientAccountNumber.trim() === '') {
    return res.json({ success: false, message: 'Please enter a recipient account number.' });
  }
  
  const transferFee = transferType === 'international' ? 25.00 : 0.00;
  const totalDeduction = amount + transferFee;
  
  try {
    const senderResult = await pool.query('SELECT id, name, balance, transactions, account_number FROM users WHERE email = $1', [email]);
    if (senderResult.rows.length === 0) {
      return res.json({ success: false, message: 'Sender not found' });
    }
    
    let currentBalance = parseFloat(senderResult.rows[0].balance);
    const senderAccountNumber = senderResult.rows[0].account_number;
    const senderName = senderResult.rows[0].name;
    
    if (currentBalance < totalDeduction) {
      return res.json({ success: false, message: `Insufficient funds. Need $${totalDeduction.toFixed(2)} ($${amount} + $${transferFee} fee). Your balance: $${currentBalance.toFixed(2)}` });
    }
    
    const recipientResult = await pool.query('SELECT id, name, email, account_number, balance, transactions FROM users WHERE account_number = $1', [recipientAccountNumber]);
    
    if (recipientResult.rows.length === 0) {
      return res.json({ success: false, message: 'Recipient account number not found.' });
    }
    
    const recipient = recipientResult.rows[0];
    
    if (recipient.account_number === senderAccountNumber) {
      return res.json({ success: false, message: 'You cannot transfer to your own account.' });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const senderFresh = await client.query('SELECT balance, transactions FROM users WHERE email = $1 FOR UPDATE', [email]);
      let senderBalance = parseFloat(senderFresh.rows[0].balance);
      let senderTransactions = senderFresh.rows[0].transactions;
      
      if (typeof senderTransactions === 'string') {
        senderTransactions = JSON.parse(senderTransactions);
      }
      if (!senderTransactions) senderTransactions = [];
      
      if (senderBalance < totalDeduction) {
        await client.query('ROLLBACK');
        client.release();
        return res.json({ success: false, message: `Insufficient funds. Your balance: $${senderBalance.toFixed(2)}` });
      }
      
      const recipientFresh = await client.query('SELECT balance, transactions FROM users WHERE account_number = $1 FOR UPDATE', [recipientAccountNumber]);
      let recipientBalance = parseFloat(recipientFresh.rows[0].balance);
      let recipientTransactions = recipientFresh.rows[0].transactions;
      
      if (typeof recipientTransactions === 'string') {
        recipientTransactions = JSON.parse(recipientTransactions);
      }
      if (!recipientTransactions) recipientTransactions = [];
      
      const newSenderBalance = senderBalance - totalDeduction;
      const newRecipientBalance = recipientBalance + amount;
      
      const transactionId = Date.now();
      const currentDate = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toLocaleTimeString();
      
      const senderTransaction = {
        id: transactionId,
        date: currentDate,
        time: currentTime,
        type: 'transfer_out',
        transferType: transferType || 'local',
        description: description || `Transfer to ${recipient.name} (${recipient.account_number})`,
        amount: amount,
        transferFee: transferFee,
        totalDeduction: totalDeduction,
        amountSigned: -amount,
        recipientAccountNumber: recipient.account_number,
        recipientName: recipient.name,
        balanceAfter: newSenderBalance,
        status: 'completed'
      };
      
      const recipientTransaction = {
        id: transactionId + 1,
        date: currentDate,
        time: currentTime,
        type: 'transfer_in',
        transferType: transferType || 'local',
        description: description || `Transfer from ${senderName} (${senderAccountNumber})`,
        amount: amount,
        amountSigned: +amount,
        senderAccountNumber: senderAccountNumber,
        senderName: senderName,
        balanceAfter: newRecipientBalance,
        status: 'completed'
      };
      
      senderTransactions.unshift(senderTransaction);
      await client.query(
        'UPDATE users SET balance = $1, transactions = $2::jsonb WHERE email = $3',
        [newSenderBalance, JSON.stringify(senderTransactions), email]
      );
      
      recipientTransactions.unshift(recipientTransaction);
      await client.query(
        'UPDATE users SET balance = $1, transactions = $2::jsonb WHERE account_number = $3',
        [newRecipientBalance, JSON.stringify(recipientTransactions), recipientAccountNumber]
      );
      
      await client.query('COMMIT');
      client.release();
      
      res.json({ 
        success: true, 
        message: `Successfully transferred $${amount.toFixed(2)} to account ${recipientAccountNumber} (${recipient.name}). Fee: $${transferFee.toFixed(2)}.`,
        newBalance: newSenderBalance,
        transaction: senderTransaction 
      });
      
    } catch (err) {
      await client.query('ROLLBACK');
      client.release();
      throw err;
    }
    
  } catch (error) {
    console.error('Transfer error:', error);
    res.json({ success: false, message: 'Server error. Please try again.' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Stonebridge Trust server running on port ${PORT}`);
});