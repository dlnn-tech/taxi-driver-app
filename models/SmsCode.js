const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SmsCode = sequelize.define('SmsCode', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    code: {
        type: DataTypes.STRING(6),
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    isUsed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'sms_codes',
    indexes: [
        {
            fields: ['phone', 'code']
        },
        {
            fields: ['expiresAt']
        }
    ]
});

module.exports = SmsCode;