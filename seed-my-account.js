// seed-my-account.js (FIXED VERSION)
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'stonebridgetrust',
  password: 'Paschal1997',
  port: 5432,
});

const MY_EMAIL = 'boswelljeffrey74@gmail.com';
const STARTING_BALANCE = 26740.00;

function generateTransactionHistory() {
  let runningBalance = STARTING_BALANCE;
  const transactions = [];

  function addTransaction(date, type, description, amount) {
    runningBalance = parseFloat((runningBalance + amount).toFixed(2));
    transactions.push({
      id: Date.now() + transactions.length,
      date: date,
      type: type,
      description: description,
      amount: Math.abs(amount),
      amountSigned: amount,
      balanceAfter: runningBalance,
      status: 'completed'
    });
  }

  // Reset
  runningBalance = STARTING_BALANCE;
  transactions.length = 0;

  // December 2024
  addTransaction('2024-12-01', 'deposit', 'Initial account opening deposit', +15000.00);
  addTransaction('2024-12-05', 'withdraw', 'ATM withdrawal', -200.00);
  addTransaction('2024-12-10', 'transfer_out', 'Transfer to savings account', -1000.00);
  addTransaction('2024-12-15', 'deposit', 'Salary deposit - December', +4850.00);
  addTransaction('2024-12-20', 'withdraw', 'Walmart purchase', -345.67);
  addTransaction('2024-12-22', 'withdraw', 'Netflix subscription', -15.99);
  addTransaction('2024-12-26', 'transfer_out', 'Christmas gifts', -500.00);
  addTransaction('2024-12-30', 'deposit', 'Year-end bonus', +2000.00);

  // January 2025
  addTransaction('2025-01-03', 'withdraw', 'Rent payment', -2100.00);
  addTransaction('2025-01-07', 'deposit', 'Salary deposit - January', +4850.00);
  addTransaction('2025-01-10', 'withdraw', 'Grocery shopping', -189.43);
  addTransaction('2025-01-15', 'transfer_out', 'Electric bill', -142.33);
  addTransaction('2025-01-18', 'transfer_out', 'Internet bill', -79.99);
  addTransaction('2025-01-22', 'withdraw', 'Restaurant dinner', -87.50);
  addTransaction('2025-01-25', 'deposit', 'Freelance payment', +750.00);
  addTransaction('2025-01-28', 'transfer_out', 'Phone bill', -65.00);

  // February 2025
  addTransaction('2025-02-01', 'withdraw', 'Rent payment', -2100.00);
  addTransaction('2025-02-05', 'deposit', 'Salary deposit - February', +4850.00);
  addTransaction('2025-02-08', 'withdraw', 'Costco shopping', -324.78);
  addTransaction('2025-02-12', 'transfer_out', 'Gas bill', -98.22);
  addTransaction('2025-02-14', 'withdraw', 'Valentine dinner', -156.00);
  addTransaction('2025-02-18', 'transfer_out', 'Car insurance', -445.00);
  addTransaction('2025-02-22', 'deposit', 'Tax refund', +1250.00);
  addTransaction('2025-02-25', 'withdraw', 'Amazon purchase', -210.35);

  // March 2025
  addTransaction('2025-03-01', 'withdraw', 'Rent payment', -2100.00);
  addTransaction('2025-03-05', 'deposit', 'Salary deposit - March', +4850.00);
  addTransaction('2025-03-08', 'transfer_out', 'Water bill', -67.45);
  addTransaction('2025-03-12', 'withdraw', 'Gas station', -52.30);
  addTransaction('2025-03-15', 'transfer_out', 'Credit card payment', -850.00);
  addTransaction('2025-03-20', 'deposit', 'Side hustle income', +400.00);
  addTransaction('2025-03-25', 'withdraw', 'Home Depot', -187.22);
  addTransaction('2025-03-28', 'transfer_out', 'Streaming services', -42.97);

  // April 2025
  addTransaction('2025-04-01', 'withdraw', 'Rent payment', -2100.00);
  addTransaction('2025-04-05', 'deposit', 'Salary deposit - April', +4850.00);
  addTransaction('2025-04-08', 'withdraw', 'Target shopping', -134.56);
  addTransaction('2025-04-10', 'deposit', 'Dividend payment', +125.00);
  addTransaction('2025-04-12', 'transfer_out', 'Trash service', -45.00);
  addTransaction('2025-04-15', 'withdraw', 'Oil change', -89.99);
  addTransaction('2025-04-18', 'transfer_out', 'Life insurance', -112.00);
  addTransaction('2025-04-22', 'deposit', 'Bonus', +750.00);
  addTransaction('2025-04-25', 'withdraw', 'Restaurant week', -210.00);

  // May 2025
  addTransaction('2025-05-01', 'withdraw', 'Rent payment', -2100.00);
  addTransaction('2025-05-05', 'deposit', 'Salary deposit - May', +4850.00);
  addTransaction('2025-05-07', 'withdraw', 'Mother\'s Day gift', -180.00);
  addTransaction('2025-05-10', 'transfer_out', 'Electric bill', -153.22);
  addTransaction('2025-05-14', 'withdraw', 'Dentist payment', -350.00);
  addTransaction('2025-05-18', 'deposit', 'Sold old furniture', +300.00);
  addTransaction('2025-05-20', 'withdraw', 'Groceries', -210.43);

  return transactions;
}

async function seedMyAccount() {
  try {
    console.log('🔍 Looking for account:', MY_EMAIL);
    
    const transactions = generateTransactionHistory();
    
    const result = await pool.query(
      `UPDATE users 
       SET balance = $1, 
           transactions = $2::jsonb 
       WHERE email = $3 
       RETURNING id, name, email, balance`,
      [STARTING_BALANCE, JSON.stringify(transactions), MY_EMAIL]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Account not found! First register with this email, then run this script.');
    } else {
      // FIXED: Convert balance to number if it's a string
      const balanceNum = parseFloat(result.rows[0].balance);
      console.log('✅ Success! Updated account:');
      console.log(`   Name: ${result.rows[0].name}`);
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Balance: $${balanceNum.toFixed(2)}`);
      console.log(`   Transactions added: ${transactions.length}`);
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

seedMyAccount();