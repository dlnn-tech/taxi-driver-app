const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Driver = sequelize.define('Driver', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        validate: {
            len: [10, 20],
            isNumeric: false // Allow + and other phone chars
        }
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    licenseNumber: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    carNumber: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    carModel: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'drivers',
    indexes: [
        {
            unique: true,
            fields: ['phone']
        }
    ]
});

module.exports = Driver;