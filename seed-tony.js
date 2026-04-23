// seed-tony.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'stonebridgetrust',
  password: 'Paschal1997',
  port: 5432,
});

const TARGET_EMAIL = 'liamsven481@gmail.com';
const STARTING_BALANCE = 76540.00;

function generateTransactionHistory() {
  let runningBalance = STARTING_BALANCE;
  const transactions = [];

  function addTransaction(date, type, description, amount) {
    runningBalance = parseFloat((runningBalance + amount).toFixed(2));
    transactions.push({
      id: Date.now() + transactions.length,
      date: date,
      type: type,
      description: description || '',
      amount: Math.abs(amount),
      amountSigned: amount,
      balanceAfter: runningBalance,
      status: 'completed'
    });
  }

  runningBalance = STARTING_BALANCE;
  transactions.length = 0;

  // === 2025 TRANSACTIONS (mixed high and low amounts) ===

  // January
  addTransaction('2025-01-05', 'deposit', 'Salary deposit', +5200.00);
  addTransaction('2025-01-08', 'withdraw', '', -45.99);
  addTransaction('2025-01-12', 'transfer_out', 'Rent payment', -2100.00);
  addTransaction('2025-01-15', 'withdraw', 'Grocery shopping', -158.43);
  addTransaction('2025-01-18', 'withdraw', '', -12.99);
  addTransaction('2025-01-22', 'deposit', 'Freelance project', +850.00);
  addTransaction('2025-01-25', 'withdraw', 'Dinner with friends', -87.50);
  addTransaction('2025-01-28', 'withdraw', '', -4.99);

  // February
  addTransaction('2025-02-03', 'deposit', 'Salary deposit', +5200.00);
  addTransaction('2025-02-06', 'withdraw', '', -210.00);
  addTransaction('2025-02-09', 'transfer_out', 'Mortgage payment', -1850.00);
  addTransaction('2025-02-12', 'withdraw', 'Costco run', -324.78);
  addTransaction('2025-02-15', 'deposit', 'Bonus', +1500.00);
  addTransaction('2025-02-18', 'withdraw', '', -23.45);
  addTransaction('2025-02-22', 'withdraw', 'Gas station', -52.30);
  addTransaction('2025-02-25', 'deposit', 'Tax refund', +1250.00);
  addTransaction('2025-02-27', 'withdraw', '', -89.99);

  // March
  addTransaction('2025-03-02', 'deposit', 'Salary deposit', +5300.00);
  addTransaction('2025-03-05', 'withdraw', 'Electric bill', -142.33);
  addTransaction('2025-03-08', 'withdraw', '', -15.99);
  addTransaction('2025-03-12', 'transfer_out', 'Mortgage payment', -1850.00);
  addTransaction('2025-03-15', 'deposit', 'Investment return', +3200.00);
  addTransaction('2025-03-18', 'withdraw', 'Home Depot', -187.22);
  addTransaction('2025-03-22', 'withdraw', '', -67.45);
  addTransaction('2025-03-26', 'withdraw', 'Restaurant', -156.00);
  addTransaction('2025-03-29', 'deposit', 'Side gig', +400.00);

  // April
  addTransaction('2025-04-03', 'deposit', 'Salary deposit', +5300.00);
  addTransaction('2025-04-06', 'withdraw', '', -8.99);
  addTransaction('2025-04-10', 'transfer_out', 'Mortgage payment', -1850.00);
  addTransaction('2025-04-13', 'withdraw', 'Target', -134.56);
  addTransaction('2025-04-16', 'deposit', 'Dividend', +125.00);
  addTransaction('2025-04-19', 'withdraw', '', -350.00);
  addTransaction('2025-04-23', 'withdraw', 'Oil change', -89.99);
  addTransaction('2025-04-27', 'withdraw', 'Weekend trip', -450.00);
  addTransaction('2025-04-30', 'deposit', 'Bonus', +2000.00);

  // May
  addTransaction('2025-05-04', 'deposit', 'Salary deposit', +5400.00);
  addTransaction('2025-05-07', 'withdraw', '', -34.50);
  addTransaction('2025-05-11', 'transfer_out', 'Mortgage payment', -1850.00);
  addTransaction('2025-05-14', 'withdraw', 'Amazon purchase', -210.35);
  addTransaction('2025-05-17', 'deposit', 'Sold furniture', +300.00);
  addTransaction('2025-05-20', 'withdraw', '', -120.00);
  addTransaction('2025-05-23', 'withdraw', 'Costco', -289.43);
  addTransaction('2025-05-27', 'deposit', 'Salary advance', +1000.00);
  addTransaction('2025-05-30', 'withdraw', '', -5.99);

  // June (up to today)
  addTransaction('2025-06-02', 'deposit', 'Salary deposit', +5400.00);
  addTransaction('2025-06-05', 'withdraw', 'Phone bill', -85.00);
  addTransaction('2025-06-08', 'withdraw', '', -42.97);
  addTransaction('2025-06-12', 'withdraw', 'Gym membership', -78.00);
  addTransaction('2025-06-15', 'deposit', 'Consulting', +1200.00);
  addTransaction('2025-06-18', 'withdraw', '', -210.00);
  addTransaction('2025-06-21', 'withdraw', 'Father\'s Day gift', -180.00);
  addTransaction('2025-06-23', 'withdraw', '', -14.99);

  return transactions;
}

async function seedTonyAccount() {
  try {
    console.log('🔍 Looking for account:', TARGET_EMAIL);
    
    const transactions = generateTransactionHistory();
    
    const result = await pool.query(
      `UPDATE users 
       SET balance = $1, 
           transactions = $2::jsonb 
       WHERE email = $3 
       RETURNING id, name, email, balance`,
      [STARTING_BALANCE, JSON.stringify(transactions), TARGET_EMAIL]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Account not found!');
      console.log('   First register with: liamsven481@gmail.com');
      console.log('   Name: Tony Rodriguez');
      console.log('   Password: Tony#05');
    } else {
      console.log('✅ Success! Updated Tony Rodriguez account:');
      console.log(`   Name: ${result.rows[0].name || 'Tony Rodriguez'}`);
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Balance: $${parseFloat(result.rows[0].balance).toFixed(2)}`);
      console.log(`   Transactions added: ${transactions.length}`);
      console.log('\n📊 Tony now has:');
      console.log('   - Mixed high amounts (salaries, bonuses, mortgage)');
      console.log('   - Mixed low amounts (subscriptions, small purchases)');
      console.log('   - Some transactions without descriptions');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

seedTonyAccount();