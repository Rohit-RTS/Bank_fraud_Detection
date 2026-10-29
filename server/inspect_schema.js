require('dotenv').config();
const mysql = require('mysql2/promise');

async function inspectSchema() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'banking_fraud_db'
  });

  console.log('=== CONNECTED TO DATABASE ===\n');

  // Show all tables
  const [tables] = await conn.query('SHOW TABLES');
  console.log('TABLES:', tables.map(r => Object.values(r)[0]));
  console.log('');

  // Describe each table
  const tableNames = tables.map(r => Object.values(r)[0]);
  for (const t of tableNames) {
    const [cols] = await conn.query(`DESCRIBE \`${t}\``);
    console.log(`=== ${t} ===`);
    cols.forEach(c => console.log(`  ${c.Field} | ${c.Type} | ${c.Null} | ${c.Key} | ${c.Default}`));
    console.log('');
  }

  // Show views
  const [views] = await conn.query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA = ?`, [process.env.DB_NAME]);
  console.log('VIEWS:', views.map(r => r.TABLE_NAME));

  // Show stored procedures
  const [procs] = await conn.query(`SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'`, [process.env.DB_NAME]);
  console.log('STORED PROCEDURES:', procs.map(r => r.ROUTINE_NAME));

  // Show triggers
  const [triggers] = await conn.query(`SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA = ?`, [process.env.DB_NAME]);
  console.log('TRIGGERS:', triggers.map(r => `${r.TRIGGER_NAME} (${r.EVENT_MANIPULATION} on ${r.EVENT_OBJECT_TABLE})`));

  // Sample rows count
  for (const t of tableNames) {
    const [[{cnt}]] = await conn.query(`SELECT COUNT(*) as cnt FROM \`${t}\``);
    console.log(`${t}: ${cnt} rows`);
  }

  // Check investigation status enum
  const [[invRow]] = await conn.query(`SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='Investigations' AND COLUMN_NAME='investigation_status'`, [process.env.DB_NAME]);
  if (invRow) console.log('\nInvestigation status type:', invRow.COLUMN_TYPE);

  // Check fraud alert status enum
  const [[alertRow]] = await conn.query(`SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='Fraud_Alerts' AND COLUMN_NAME='alert_status'`, [process.env.DB_NAME]);
  if (alertRow) console.log('Alert status type:', alertRow.COLUMN_TYPE);

  await conn.end();
}

inspectSchema().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
