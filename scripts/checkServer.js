require('dotenv').config();
const db = require('../config/database');
const { Driver, SmsCode, Permit, Photo } = require('../models');

async function checkServer() {
    console.log('=== SERVER DIAGNOSTICS ===\n');
    
    // Check environment
    console.log('1. Environment Variables:');
    console.log('   NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
    console.log('   PORT:', process.env.PORT || 'NOT SET');
    console.log('   JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
    console.log('   DB_HOST:', process.env.DB_HOST || 'NOT SET');
    console.log('   DB_NAME:', process.env.DB_NAME || 'NOT SET');
    console.log('   DB_USER:', process.env.DB_USER || 'NOT SET');
    console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET' : 'NOT SET');
    console.log('');
    
    // Check database connection
    console.log('2. Database Connection:');
    try {
        await db.authenticate();
        console.log('   ✓ Database connection successful');
        
        // Check tables
        console.log('');
        console.log('3. Database Tables:');
        
        const driverCount = await Driver.count();
        console.log(`   ✓ Drivers table: ${driverCount} records`);
        
        const smsCount = await SmsCode.count();
        console.log(`   ✓ SMS Codes table: ${smsCount} records`);
        
        const permitCount = await Permit.count();
        console.log(`   ✓ Permits table: ${permitCount} records`);
        
        const photoCount = await Photo.count();
        console.log(`   ✓ Photos table: ${photoCount} records`);
        
        // Check for test driver
        console.log('');
        console.log('4. Test Driver Check:');
        const testDriver = await Driver.findOne({
            where: { phone: '+79991234567' }
        });
        
        if (testDriver) {
            console.log('   ✓ Test driver exists:');
            console.log(`     ID: ${testDriver.id}`);
            console.log(`     Name: ${testDriver.name}`);
            console.log(`     Phone: ${testDriver.phone}`);
            console.log(`     Active: ${testDriver.isActive}`);
        } else {
            console.log('   ✗ Test driver NOT found');
            console.log('   Creating test driver...');
            
            const newDriver = await Driver.create({
                phone: '+79991234567',
                name: 'Демо Водитель',
                carModel: 'Hyundai Solaris',
                carNumber: 'А123БВ77',
                isActive: true,
                ordersEnabled: false
            });
            
            console.log('   ✓ Test driver created with ID:', newDriver.id);
        }
        
    } catch (error) {
        console.log('   ✗ Database connection FAILED');
        console.log('   Error:', error.message);
        console.log('');
        console.log('   Full error:');
        console.error(error);
    }
    
    // Check required modules
    console.log('');
    console.log('5. Required Modules:');
    const modules = [
        'express',
        'sequelize',
        'jsonwebtoken',
        'bcryptjs',
        'cors',
        'helmet',
        'dotenv',
        'express-rate-limit'
    ];
    
    for (const module of modules) {
        try {
            require.resolve(module);
            console.log(`   ✓ ${module}`);
        } catch (e) {
            console.log(`   ✗ ${module} - NOT INSTALLED`);
        }
    }
    
    console.log('');
    console.log('=== DIAGNOSTICS COMPLETE ===');
    process.exit(0);
}

checkServer().catch(error => {
    console.error('Diagnostics failed:', error);
    process.exit(1);
});