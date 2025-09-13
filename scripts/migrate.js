require('dotenv').config();
const db = require('../config/database');

async function migrate() {
    console.log('=== DATABASE MIGRATION ===\n');
    
    try {
        await db.authenticate();
        console.log('✓ Database connection established\n');
        
        // Add missing columns to drivers table
        console.log('Adding missing columns to drivers table...');
        
        try {
            // Add ordersEnabled column
            await db.query(`
                ALTER TABLE drivers 
                ADD COLUMN ordersEnabled BOOLEAN DEFAULT FALSE
                COMMENT 'Whether the driver is enabled for receiving orders'
            `);
            console.log('✓ Added ordersEnabled column');
        } catch (error) {
            if (error.message.includes('Duplicate column')) {
                console.log('- ordersEnabled column already exists');
            } else {
                console.error('✗ Failed to add ordersEnabled:', error.message);
            }
        }
        
        try {
            // Add lastStatusCheck column
            await db.query(`
                ALTER TABLE drivers 
                ADD COLUMN lastStatusCheck DATETIME NULL
                COMMENT 'Last time the order status was checked'
            `);
            console.log('✓ Added lastStatusCheck column');
        } catch (error) {
            if (error.message.includes('Duplicate column')) {
                console.log('- lastStatusCheck column already exists');
            } else {
                console.error('✗ Failed to add lastStatusCheck:', error.message);
            }
        }
        
        // Check and create test driver
        console.log('\nChecking test driver...');
        const [testDrivers] = await db.query(
            "SELECT * FROM drivers WHERE phone = '+79991234567'"
        );
        
        if (testDrivers.length === 0) {
            await db.query(`
                INSERT INTO drivers (phone, name, carModel, carNumber, isActive, ordersEnabled, createdAt, updatedAt)
                VALUES ('+79991234567', 'Демо Водитель', 'Hyundai Solaris', 'А123БВ77', true, false, NOW(), NOW())
            `);
            console.log('✓ Test driver created');
        } else {
            console.log('✓ Test driver already exists');
            // Update to ensure it's active
            await db.query(`
                UPDATE drivers 
                SET isActive = true, 
                    name = 'Демо Водитель',
                    carModel = 'Hyundai Solaris',
                    carNumber = 'А123БВ77'
                WHERE phone = '+79991234567'
            `);
            console.log('✓ Test driver updated');
        }
        
        // Show current table structure
        console.log('\nCurrent drivers table structure:');
        const [columns] = await db.query("SHOW COLUMNS FROM drivers");
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
        });
        
        console.log('\n=== MIGRATION COMPLETE ===');
        process.exit(0);
        
    } catch (error) {
        console.error('\n✗ Migration failed:', error);
        process.exit(1);
    }
}

migrate();