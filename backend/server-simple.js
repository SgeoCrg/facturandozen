const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Facturando Zen Backend funcionando',
        timestamp: new Date().toISOString()
    });
});

// Endpoint superadmin básico
app.get('/api/superadmin/stats', (req, res) => {
    res.json({
        totalTenants: 1,
        activeTenants: 1,
        trialTenants: 0,
        suspendedTenants: 0,
        mrr: 19.00,
        totalInvoices: 0,
        totalUsers: 2
    });
});

// Endpoint tenants
app.get('/api/superadmin/tenants', (req, res) => {
    res.json([
        {
            id: 1,
            name: 'Empresa Demo',
            email: 'admin@demo.com',
            status: 'active',
            plan: 'basic',
            priceMonthly: 19.00,
            createdAt: new Date().toISOString()
        }
    ]);
});

// Login básico
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (email === 'admin@facturandozen.com' && password === 'admin123') {
        res.json({
            success: true,
            token: 'demo-token-superadmin',
            user: {
                id: 1,
                email: 'admin@facturandozen.com',
                name: 'Super Admin',
                role: 'superadmin'
            }
        });
    } else if (email === 'admin@demo.com' && password === 'admin123') {
        res.json({
            success: true,
            token: 'demo-token-admin',
            user: {
                id: 2,
                email: 'admin@demo.com',
                name: 'Admin Demo',
                role: 'admin',
                tenantId: 1
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Credenciales incorrectas'
        });
    }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Facturando Zen Backend funcionando en puerto ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Superadmin: admin@facturandozen.com / admin123`);
    console.log(`👤 Demo: admin@demo.com / admin123`);
});
