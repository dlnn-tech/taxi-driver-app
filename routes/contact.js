const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get contact information
router.get('/', authenticateToken, (req, res) => {
    const contactsData = [
        {
            id: 1,
            name: 'Техническая поддержка',
            description: 'Помощь с техническими вопросами приложения',
            phone: '+7 (495) 000-00-01',
            telegram: 'https://t.me/taxi_support',
            whatsapp: 'https://wa.me/74950000001',
            workingHours: '24/7',
            type: 'technical'
        },
        {
            id: 2,
            name: 'Менеджер водителей',
            description: 'Вопросы по работе, допускам и документам',
            phone: '+7 (495) 000-00-02',
            telegram: 'https://t.me/taxi_manager',
            whatsapp: 'https://wa.me/74950000002',
            workingHours: '9:00 - 21:00',
            type: 'manager'
        },
        {
            id: 3,
            name: 'Отдел кадров',
            description: 'Устройство на работу, документы',
            phone: '+7 (495) 000-00-03',
            email: 'hr@taxicompany.ru',
            workingHours: '9:00 - 18:00 (Пн-Пт)',
            type: 'hr'
        },
        {
            id: 4,
            name: 'Бухгалтерия',
            description: 'Вопросы по выплатам и финансам',
            phone: '+7 (495) 000-00-04',
            email: 'finance@taxicompany.ru',
            workingHours: '9:00 - 18:00 (Пн-Пт)',
            type: 'finance'
        },
        {
            id: 5,
            name: 'Аварийная служба',
            description: 'Экстренная помощь на дороге',
            phone: '+7 (495) 000-00-05',
            telegram: 'https://t.me/taxi_emergency',
            workingHours: '24/7',
            type: 'emergency',
            priority: true
        }
    ];

    res.json({
        success: true,
        contacts: contactsData
    });
});

// Get specific contact by type
router.get('/:type', authenticateToken, (req, res) => {
    const { type } = req.params;
    
    const contactsData = [
        {
            id: 1,
            name: 'Техническая поддержка',
            description: 'Помощь с техническими вопросами приложения',
            phone: '+7 (495) 000-00-01',
            telegram: 'https://t.me/taxi_support',
            whatsapp: 'https://wa.me/74950000001',
            workingHours: '24/7',
            type: 'technical'
        },
        {
            id: 2,
            name: 'Менеджер водителей',
            description: 'Вопросы по работе, допускам и документам',
            phone: '+7 (495) 000-00-02',
            telegram: 'https://t.me/taxi_manager',
            whatsapp: 'https://wa.me/74950000002',
            workingHours: '9:00 - 21:00',
            type: 'manager'
        },
        {
            id: 3,
            name: 'Отдел кадров',
            description: 'Устройство на работу, документы',
            phone: '+7 (495) 000-00-03',
            email: 'hr@taxicompany.ru',
            workingHours: '9:00 - 18:00 (Пн-Пт)',
            type: 'hr'
        },
        {
            id: 4,
            name: 'Бухгалтерия',
            description: 'Вопросы по выплатам и финансам',
            phone: '+7 (495) 000-00-04',
            email: 'finance@taxicompany.ru',
            workingHours: '9:00 - 18:00 (Пн-Пт)',
            type: 'finance'
        },
        {
            id: 5,
            name: 'Аварийная служба',
            description: 'Экстренная помощь на дороге',
            phone: '+7 (495) 000-00-05',
            telegram: 'https://t.me/taxi_emergency',
            workingHours: '24/7',
            type: 'emergency',
            priority: true
        }
    ];

    const contact = contactsData.find(c => c.type === type);
    
    if (!contact) {
        return res.status(404).json({
            success: false,
            message: 'Контакт не найден'
        });
    }

    res.json({
        success: true,
        contact
    });
});

module.exports = router;