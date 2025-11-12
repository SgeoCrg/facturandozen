import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { subscription } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentInvoices, setRecentInvoices] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [invoicesRes, customersRes, productsRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/customers'),
        api.get('/products')
      ]);

      const invoices = invoicesRes.data.invoices || [];
      
      // Calcular total facturado
      const totalFacturado = invoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);

      setStats({
        invoices: invoices.length,
        customers: customersRes.data.customers?.length || 0,
        products: productsRes.data.products?.length || 0,
        totalFacturado
      });

      // Últimas 3 facturas
      setRecentInvoices(invoices.slice(0, 3));
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeftTrial = () => {
    if (!subscription || subscription.status !== 'trial' || !subscription.trialEndsAt) return null;
    const days = Math.ceil((new Date(subscription.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const daysLeftTrial = getDaysLeftTrial();

  if (loading) {
    return (
      <div className="spinner-container">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Alert Trial */}
      {subscription && subscription.status === 'trial' && daysLeftTrial !== null && (
        <Alert variant={daysLeftTrial <= 7 ? 'warning' : 'info'} className="mb-4 scale-in">
          <div className="d-flex align-items-center">
            <i className="bi bi-clock-history me-3" style={{ fontSize: '1.5rem' }}></i>
            <div>
              <strong>Período de Prueba</strong>
              <div>Te quedan <strong>{daysLeftTrial} días</strong> de prueba. {' '}
                {daysLeftTrial <= 7 && 'Contacta para activar tu plan.'}
              </div>
            </div>
          </div>
        </Alert>
      )}

      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="mb-2">
            <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-muted mb-0">
            <i className="bi bi-graph-up me-2"></i>
            Resumen de tu negocio
            {subscription && (
              <Badge bg={subscription.plan === 'pro' ? 'success' : 'info'} className="ms-2">
                Plan {subscription.plan.toUpperCase()}
              </Badge>
            )}
          </p>
        </Col>
      </Row>

      {/* Stat Cards */}
      <Row className="mb-4 g-3 dashboard-stats">
        <Col xs={6} md={3}>
          <div className="stat-card slide-in-right" style={{ animationDelay: '0.1s' }}>
            <div className="icon primary">
              <i className="bi bi-file-earmark-text"></i>
            </div>
            <div className="value">{stats?.invoices || 0}</div>
            <div className="label">Facturas</div>
            <Link to="/app/invoices" className="btn btn-sm btn-primary mt-3 w-100">
              <span className="d-none d-md-inline">Ver todas </span>
              <span className="d-md-none">Ver </span>
              <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>
        </Col>

        <Col xs={6} md={3}>
          <div className="stat-card slide-in-right" style={{ animationDelay: '0.2s' }}>
            <div className="icon success">
              <i className="bi bi-people"></i>
            </div>
            <div className="value">{stats?.customers || 0}</div>
            <div className="label">Clientes</div>
            <Link to="/app/customers" className="btn btn-sm btn-success mt-3 w-100">
              <span className="d-none d-md-inline">Gestionar </span>
              <span className="d-md-none">Ver </span>
              <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>
        </Col>

        <Col xs={6} md={3}>
          <div className="stat-card slide-in-right" style={{ animationDelay: '0.3s' }}>
            <div className="icon warning">
              <i className="bi bi-box-seam"></i>
            </div>
            <div className="value">{stats?.products || 0}</div>
            <div className="label">Productos</div>
            <Link to="/app/products" className="btn btn-sm btn-warning mt-3 w-100">
              <span className="d-none d-md-inline">Gestionar </span>
              <span className="d-md-none">Ver </span>
              <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>
        </Col>

        <Col xs={6} md={3}>
          <div className="stat-card slide-in-right" style={{ animationDelay: '0.4s' }}>
            <div className="icon danger">
              <i className="bi bi-currency-euro"></i>
            </div>
            <div className="value">{stats?.totalFacturado?.toFixed(0) || 0}</div>
            <div className="label">Total Facturado</div>
            <div className="btn btn-sm btn-outline-secondary mt-3 w-100 disabled">
              <span className="d-none d-md-inline">Este mes</span>
              <span className="d-md-none">Total</span>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="g-4 dashboard-actions">
        {/* Acciones Rápidas */}
        <Col xs={12} md={6}>
          <Card className="h-100 scale-in">
            <Card.Header>
              <h5 className="mb-0 text-white">
                <i className="bi bi-lightning-charge-fill me-2"></i>
                <span className="d-none d-md-inline">Acciones Rápidas</span>
                <span className="d-md-none">Acciones</span>
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2 gap-md-3">
                <Button 
                  as={Link} 
                  to="/app/invoices/new" 
                  variant="primary" 
                  size="lg"
                  className="d-flex align-items-center justify-content-between"
                >
                  <span>
                    <i className="bi bi-plus-circle me-2"></i>
                    <span className="d-none d-md-inline">Nueva Factura</span>
                    <span className="d-md-none">Nueva</span>
                  </span>
                  <i className="bi bi-arrow-right"></i>
                </Button>

                <Button 
                  as={Link} 
                  to="/app/customers" 
                  variant="outline-primary"
                  className="d-flex align-items-center justify-content-between"
                >
                  <span>
                    <i className="bi bi-person-plus me-2"></i>
                    <span className="d-none d-md-inline">Gestionar Clientes</span>
                    <span className="d-md-none">Clientes</span>
                  </span>
                  <i className="bi bi-arrow-right"></i>
                </Button>

                <Button 
                  as={Link} 
                  to="/app/products" 
                  variant="outline-primary"
                  className="d-flex align-items-center justify-content-between"
                >
                  <span>
                    <i className="bi bi-box-seam me-2"></i>
                    <span className="d-none d-md-inline">Productos (Opcional)</span>
                    <span className="d-md-none">Productos</span>
                  </span>
                  <i className="bi bi-arrow-right"></i>
                </Button>

                <Button 
                  as={Link} 
                  to="/app/settings" 
                  variant="outline-secondary"
                  className="d-flex align-items-center justify-content-between"
                >
                  <span>
                    <i className="bi bi-gear me-2"></i>
                    <span className="d-none d-md-inline">Configuración</span>
                    <span className="d-md-none">Config</span>
                  </span>
                  <i className="bi bi-arrow-right"></i>
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Últimas Facturas */}
        <Col xs={12} md={6}>
          <Card className="h-100 scale-in" style={{ animationDelay: '0.1s' }}>
            <Card.Header>
              <h5 className="mb-0 text-white">
                <i className="bi bi-clock-history me-2"></i>
                <span className="d-none d-md-inline">Últimas Facturas</span>
                <span className="d-md-none">Facturas</span>
              </h5>
            </Card.Header>
            <Card.Body>
              {recentInvoices.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ddd' }}></i>
                  <p className="text-muted mt-2">No hay facturas todavía</p>
                  <Button as={Link} to="/app/invoices/new" variant="primary" size="sm">
                    Crear primera factura
                  </Button>
                </div>
              ) : (
                <div className="d-grid gap-2">
                  {recentInvoices.map((invoice, idx) => (
                    <div 
                      key={invoice.id} 
                      className="p-2 p-md-3 border rounded hover-lift"
                      style={{ 
                        transition: 'all 0.3s',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.location.href = `/app/invoices/${invoice.id}`}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="flex-grow-1">
                          <strong className="d-block">{invoice.fullNumber}</strong>
                          <div className="small text-muted">
                            {new Date(invoice.date).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                        <div className="text-end ms-2">
                          <div className="gradient-text fw-bold">
                            {parseFloat(invoice.total).toFixed(2)} €
                          </div>
                          <Badge bg={
                            invoice.status === 'paid' ? 'success' :
                            invoice.status === 'issued' ? 'primary' :
                            invoice.status === 'draft' ? 'secondary' : 'danger'
                          } className="small">
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button 
                    as={Link} 
                    to="/app/invoices" 
                    variant="outline-primary" 
                    size="sm"
                  >
                    <span className="d-none d-md-inline">Ver todas las facturas </span>
                    <span className="d-md-none">Ver todas </span>
                    <i className="bi bi-arrow-right ms-1"></i>
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Info Card */}
      <Row className="mt-4">
        <Col>
          <Card className="glass border-0 scale-in" style={{ animationDelay: '0.2s' }}>
            <Card.Body>
              <Row className="align-items-center">
                <Col md={8}>
                  <h5 className="mb-3">
                    <i className="bi bi-lightbulb-fill text-warning me-2"></i>
                    <span className="gradient-text">Simple como Excel, Potente como un ERP</span>
                  </h5>
                  <p className="mb-2">
                    <strong>Modo flexible:</strong> Guarda clientes y productos para reutilizar, O escribe todo manual en cada factura.
                  </p>
                  <ul className="mb-0">
                    <li>Clientes: Selecciona guardado O escribe manual</li>
                    <li>Líneas: Selecciona producto O escribe manual</li>
                    <li>PDF profesional automático</li>
                    {subscription?.plan === 'pro' && <li className="text-success"><strong>✓ Verifactu AEAT integrado</strong></li>}
                  </ul>
                </Col>
                <Col md={4} className="text-center">
                  <i className="bi bi-award" style={{ fontSize: '5rem', color: 'var(--primary)', opacity: 0.3 }}></i>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;



