const { Pool } = require('pg');

// Local database
const localPool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'stonebridgetrust',
  password: 'Paschal1997',
  port: 5432,
});

// Render database
const renderPool = new Pool({
  connectionString: 'postgresql://stonebridgetrust_db_user:xLO8SyfZhUTkjTIVo9GjxHv6PHAFN7wM@dpg-d7l8m677f7vs73attfo0-a.oregon-postgres.render.com:5432/stonebridgetrust_db',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('📦 Starting migration...');

    // Create table
    await renderPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(20),
        account_type VARCHAR(50),
        password VARCHAR(100),
        account_number VARCHAR(20) UNIQUE,
        balance DECIMAL(10,2) DEFAULT 0,
        transactions JSONB DEFAULT '[]'::jsonb
      )
    `);
    console.log('✅ Table ready');

    // Get users from local
    const users = await localPool.query('SELECT * FROM users');
    console.log(`✅ Found ${users.rows.length} users`);

    // Migrate each user
    for (const user of users.rows) {
      try {
        // Ensure transactions is valid JSON
        let transactions = user.transactions;
        if (typeof transactions === 'string') {
          transactions = JSON.parse(transactions);
        }
        if (!transactions) {
          transactions = [];
        }

        await renderPool.query(
          `INSERT INTO users (name, email, phone, account_type, password, account_number, balance, transactions)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
           ON CONFLICT (email) DO UPDATE SET
             name = EXCLUDED.name,
             phone = EXCLUDED.phone,
             account_type = EXCLUDED.account_type,
             password = EXCLUDED.password,
             account_number = EXCLUDED.account_number,
             balance = EXCLUDED.balance,
             transactions = EXCLUDED.transactions`,
          [user.name, user.email, user.phone, user.account_type, user.password, user.account_number, user.balance, JSON.stringify(transactions)]
        );
        console.log(`✅ Migrated: ${user.name} (${user.email})`);
      } catch (err) {
        console.log(`❌ Failed: ${user.email} - ${err.message}`);
      }
    }

    console.log('🎉 Migration complete!');
    console.log('Try logging in: https://stonebridgetrust.onrender.com');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await localPool.end();
    await renderPool.end();
  }
}

migrate();