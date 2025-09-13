const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Permit = require('./Permit');

const Photo = sequelize.define('Photo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    permitId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Permit,
            key: 'id'
        }
    },
    type: {
        type: DataTypes.ENUM('waybill_1', 'waybill_2', 'car_exterior', 'car_interior'),
        allowNull: false
    },
    filename: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    originalName: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    mimeType: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    size: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    url: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    backblazeFileId: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    tableName: 'photos',
    indexes: [
        {
            fields: ['permitId']
        },
        {
            fields: ['type']
        }
    ]
});

// Define associations
Photo.belongsTo(Permit, { foreignKey: 'permitId', as: 'permit' });
Permit.hasMany(Photo, { foreignKey: 'permitId', as: 'photos' });

module.exports = Photo;