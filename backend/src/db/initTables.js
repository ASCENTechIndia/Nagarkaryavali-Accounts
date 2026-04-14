/**
 * Initialize database tables needed for authentication
 * This script should be run once when setting up the app
 * Usage: node src/db/initTables.js
 */

const pool = require('../db.js');

async function initTables() {
  let connected = false;
  try {
    console.log('🔧 Initializing database tables...');
    console.log('📋 DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');

    // Test connection first
    console.log('🔌 Testing database connection...');
    const result = await Promise.race([
      pool.query('SELECT NOW()'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 5s')), 5000)
      )
    ]);
    console.log('✅ Database connection successful!');
    connected = true;

    // Create refresh_tokens table
    console.log('📝 Creating refresh_tokens table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) 
          REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ refresh_tokens table created (or already exists)');

    // Create index for faster lookups
    console.log('📝 Creating indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token 
      ON refresh_tokens(token);
    `);
    console.log('✅ Index on refresh_tokens.token created');

    // Create index for user_id lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id 
      ON refresh_tokens(user_id);
    `);
    console.log('✅ Index on refresh_tokens.user_id created');

    // Optional: Create token_blacklist table for additional security
    console.log('📝 Creating token_blacklist table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        blacklisted_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP
      );
    `);
    console.log('✅ token_blacklist table created (or already exists)');

    // Create index for blacklist lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_token_blacklist_token 
      ON token_blacklist(token);
    `);
    console.log('✅ Index on token_blacklist.token created');

    console.log('\n✅ All database tables initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error initializing database tables:');
    console.error('Message:', error.message);
    if (error.code) console.error('Code:', error.code);
    
    if (!connected) {
      console.error('\n💡 Could not connect to PostgreSQL server.');
      console.error('   Please ensure:');
      console.error('   1. PostgreSQL is running at:', process.env.DATABASE_URL || 'localhost:5432');
      console.error('   2. DATABASE_URL is set in .env file');
      console.error('   3. Database and user credentials are correct');
      console.error('\n📋 Alternative: Run SQL manually');
      console.error('   Open: backend/src/db/init_tokens.sql');
      console.error('   Execute in pgAdmin or psql');
    }
    
    process.exit(1);
  }
}

// Run initialization
initTables();
