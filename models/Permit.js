const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Driver = require('./Driver');

const Permit = sequelize.define('Permit', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    driverId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Driver,
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'active', 'expired', 'rejected'),
        defaultValue: 'pending'
    },
    checklist: {
        type: DataTypes.JSON,
        defaultValue: {
            plafon: false,
            carWrapped: false,
            businessCard: false,
            dashcam: false,
            firstAidKit: false,
            tireCondition: false,
            lights: false,
            taximeter: false,
            medicalCheck: false
        }
    },
    issuedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    yandexTaxiEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'permits',
    indexes: [
        {
            fields: ['driverId']
        },
        {
            fields: ['status']
        },
        {
            fields: ['expiresAt']
        }
    ]
});

// Define associations
Permit.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });
Driver.hasMany(Permit, { foreignKey: 'driverId', as: 'permits' });

module.exports = Permit;