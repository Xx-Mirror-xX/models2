const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const app = express();


const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite');

        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firstName TEXT,
                lastName TEXT,
                email TEXT UNIQUE,
                password TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firstName TEXT NOT NULL,
                lastName TEXT NOT NULL,
                email TEXT NOT NULL,
                message TEXT NOT NULL,
                ipAddress TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT,
                cardName TEXT,
                cardNumber TEXT,
                expiryMonth INTEGER,
                expiryYear INTEGER,
                cvv TEXT,
                amount REAL,
                currency TEXT,
                service TEXT,
                paymentDate DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
        });
    }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'secreto',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(403).send('Acceso denegado');
    }
    next();
};


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.post('/register', async (req, res) => {
    try {
        const { fName, lName, email, password } = req.body;
        
        if (!fName || !lName || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run(
            'INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)',
            [fName, lName, email, hashedPassword],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(400).json({ error: 'Email ya registrado' });
                    }
                    return res.status(500).json({ error: 'Error al registrar usuario' });
                }
                res.json({ success: true, message: 'Usuario registrado con éxito' });
            }
        );
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});


app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Error en el servidor' });
            }
            
            if (!user) {
                return res.status(401).json({ error: 'Credenciales incorrectas' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Credenciales incorrectas' });
            }

            req.session.userId = user.id;
            res.json({ 
                success: true, 
                redirect: '/admin/contacts.html'  
            });
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});


app.get('/admin/contacts.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contacts.html'));
});


app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Error al cerrar sesión' });
        }
        res.redirect('/');
    });
});


app.post('/api/contact', async (req, res) => {
    try {
        const { firstName, lastName, email, message } = req.body;
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        if (!firstName || !lastName || !email || !message) {
            return res.status(400).json({ error: "Todos los campos son requeridos" });
        }

        db.run(
            `INSERT INTO contacts (firstName, lastName, email, message, ipAddress) 
             VALUES (?, ?, ?, ?, ?)`,
            [firstName, lastName, email, message, ipAddress],
            function(err) {
                if (err) {
                    console.error('Error al guardar contacto:', err);
                    return res.status(500).json({ error: "Error al guardar contacto" });
                }
                res.json({ 
                    success: true, 
                    message: "Contacto guardado exitosamente",
                    id: this.lastID
                });
            }
        );
    } catch (error) {
        console.error('Error en /api/contact:', error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});


app.get('/api/contacts', requireAuth, (req, res) => {
    db.all(
        "SELECT * FROM contacts ORDER BY createdAt DESC",
        (err, rows) => {
            if (err) {
                console.error('Error al obtener contactos:', err);
                return res.status(500).json({ error: 'Error al obtener contactos' });
            }
            res.json(rows);
        }
    );
});


app.get('/admin/contacts', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contacts.html'));
});


app.post('/api/payment', requireAuth, async (req, res) => {
    try {
        const { email, cardName, cardNumber, expiryMonth, expiryYear, cvv, amount, currency } = req.body;

        if (!email || !cardName || !cardNumber || !expiryMonth || !expiryYear || !cvv || !amount || !currency) {
            return res.status(400).json({ error: "Todos los campos son requeridos" });
        }

        db.run(
            `INSERT INTO payments (email, cardName, cardNumber, expiryMonth, expiryYear, cvv, amount, currency)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [email, cardName, cardNumber, expiryMonth, expiryYear, cvv, amount, currency],
            function(err) {
                if (err) {
                    console.error('Error al procesar pago:', err);
                    return res.status(500).json({ error: "Error al procesar pago" });
                }
                res.json({ 
                    success: true, 
                    message: "Pago procesado exitosamente",
                    id: this.lastID
                });
            }
        );
    } catch (error) {
        console.error('Error en /api/payment:', error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});


app.get('/api/payments', requireAuth, (req, res) => {
    db.all(
        "SELECT * FROM payments ORDER BY paymentDate DESC",
        (err, rows) => {
            if (err) {
                console.error('Error al obtener pagos:', err);
                return res.status(500).json({ error: 'Error al obtener pagos' });
            }
            res.json(rows);
        }
    );
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});



app.get('/contacts.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contacts.html'));
});


