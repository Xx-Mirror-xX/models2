const PaymentsModel = require('../models/PaymentsModel');
const path = require('path');

class PaymentsController {
    constructor() {
        this.model = new PaymentsModel();
    }
async index(req, res) {
    if (!req.session.userId) {
        return res.status(403).send('Acceso denegado');
    }
    res.sendFile(path.join(__dirname, '../public/admin/payments.html'));
}

    async addPayment(req, res) {
        try {
            const {
                email,
                cardName,
                cardNumber,
                expiryMonth,
                expiryYear,
                cvv,
                amount,
                currency,
                service
            } = req.body;


            if (!email || !cardName || !cardNumber || !expiryMonth || 
                !expiryYear || !cvv || !amount || !currency || !service) {
                return res.status(400).json({ error: "Todos los campos son requeridos" });
            }

            await this.model.addPayment({
                email,
                cardName,
                cardNumber,
                expiryMonth,
                expiryYear,
                cvv,
                amount,
                currency,
                service
            });

            res.status(201).json({ success: true });
        } catch (error) {
            console.error('Error al procesar pago:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    async index(req, res) {
        if (!req.session.userId) {
            return res.status(403).send('Acceso denegado');
        }
        res.sendFile(path.join(__dirname, '../public/admin/payments.html'));
    }

    async getPayments(req, res) {
        try {
            if (!req.session.userId) {
                return res.status(403).json({ error: 'No autorizado' });
            }
            
            const payments = await this.model.getAllPayments();
            res.json(payments);
        } catch (error) {
            res.status(500).json({ error: 'Error del servidor' });
        }
    }
}

module.exports = PaymentsController;