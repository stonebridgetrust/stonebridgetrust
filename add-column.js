// add-column.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'stonebridgetrust',
  password: 'Paschal1997',
  port: 5432,
});

async function addTransactionsColumn() {
  try {
    console.log('🔧 Adding transactions column to users table...');
    
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS transactions JSONB DEFAULT '[]'
    `);
    
    console.log('✅ Success! transactions column added.');
    console.log('💡 You can now run: node seed-my-account.js');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addTransactionsColumn();