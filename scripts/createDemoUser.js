require('dotenv').config();
const { Driver } = require('../models');
const db = require('../config/database');

async function createDemoUser() {
    try {
        await db.authenticate();
        console.log('Database connection established.');
        
        await db.sync();
        console.log('Database synchronized.');

        // Check if demo user exists
        const existingDriver = await Driver.findOne({
            where: { phone: '+79991234567' }
        });

        if (existingDriver) {
            console.log('Demo user already exists:', {
                id: existingDriver.id,
                phone: existingDriver.phone,
                name: existingDriver.name,
                isActive: existingDriver.isActive
            });
            
            // Update to ensure it's active
            await existingDriver.update({ 
                isActive: true,
                name: 'Демо Водитель',
                carModel: 'Hyundai Solaris',
                carNumber: 'А123БВ77'
            });
            console.log('Demo user updated successfully.');
        } else {
            // Create demo user
            const demoDriver = await Driver.create({
                phone: '+79991234567',
                name: 'Демо Водитель',
                carModel: 'Hyundai Solaris',
                carNumber: 'А123БВ77',
                isActive: true,
                ordersEnabled: false
            });
            
            console.log('Demo user created successfully:', {
                id: demoDriver.id,
                phone: demoDriver.phone,
                name: demoDriver.name,
                isActive: demoDriver.isActive
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating demo user:', error);
        process.exit(1);
    }
}

createDemoUser();