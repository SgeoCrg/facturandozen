import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Button, Badge, Alert, Spinner, Table } from 'react-bootstrap';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { subscription, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/stats/dashboard');
      setStats(response.data);
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
          <div className="dashboard-header">
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
          </div>
        </Col>
      </Row>

      {/* Stat Cards */}
      <Row className="mb-4 g-3" style={{ alignItems: 'stretch' }}>
        <Col md={3}>
          <div className="stat-card slide-in-right" style={{ animationDelay: '0.1s' }}>
            <div className="icon primary">
              <i className="bi bi-file-earmark-text"></i>
            </div>
            <div className="value">{stats?.overview?.totalInvoices || 0}</div>
            <div className="label">Facturas Totales</div>
            <div className="small text-muted mt-2">
              Este mes: {stats?.overview?.monthInvoices || 0}
            </div>
            <Link to="/app/invoices" className="btn btn-sm btn-primary mt-3 w-100">
              Ver todas <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>
        </Col>

        <Col md={3}>
          <div className="stat-card slide-in-right" style={{ animationDelay: '0.2s' }}>
            <div className="icon success">
              <i className="bi bi-people"></i>
            </div>
            <div className="value">{stats?.overview?.totalCustomers || 0}</div>
            <div className="label">{user?.role === 'superadmin' ? 'Empresas' : 'Clientes'}</div>
            <div className="small text-muted mt-2" style={{ minHeight: '1.5rem' }}>
              &nbsp;
            </div>
            <Link to={user?.role === 'superadmin' ? '/app/superadmin' : '/app/customers'} className="btn btn-sm btn-success mt-3 w-100">
              Gestionar <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>
        </Col>

        <Col md={3}>
          <div className="stat-card slide-in-right" style={{ animationDelay: '0.3s' }}>
            <div className="icon warning">
              <i className="bi bi-box-seam"></i>
            </div>
            <div className="value">{stats?.overview?.totalProducts || 0}</div>
            <div className="label">Productos</div>
            <div className="small text-muted mt-2" style={{ minHeight: '1.5rem' }}>
              &nbsp;
            </div>
            <Link to="/app/products" className="btn btn-sm btn-warning mt-3 w-100">
              Gestionar <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>
        </Col>

        <Col md={3}>
          <div className="stat-card slide-in-right" style={{ animationDelay: '0.4s' }}>
            <div className="icon danger">
              <i className="bi bi-currency-euro"></i>
            </div>
            <div className="value">{parseFloat(stats?.overview?.totalRevenue || 0).toFixed(0)} €</div>
            <div className="label">Total Facturado</div>
            <div className="small text-muted mt-2">
              Este mes: {parseFloat(stats?.overview?.monthRevenue || 0).toFixed(0)} €
            </div>
            <Link to="/app/invoices" className="btn btn-sm btn-danger mt-3 w-100">
              Ver facturas <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Acciones Rápidas */}
        <Col md={6}>
          <Card className="h-100 scale-in">
            <Card.Header>
              <h5 className="mb-0 text-white">
                <i className="bi bi-lightning-charge-fill me-2"></i>
                Acciones Rápidas
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-3">
                <Button 
                  as={Link} 
                  to="/app/invoices/new" 
                  variant="primary" 
                  size="lg"
                  className="d-flex align-items-center justify-content-between"
                >
                  <span>
                    <i className="bi bi-plus-circle me-2"></i>
                    Nueva Factura
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
                    Gestionar Clientes
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
                    Productos (Opcional)
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
                    Configuración
                  </span>
                  <i className="bi bi-arrow-right"></i>
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Últimas Facturas */}
        <Col md={6}>
          <Card className="h-100 scale-in" style={{ animationDelay: '0.1s' }}>
            <Card.Header>
              <h5 className="mb-0 text-white">
                <i className="bi bi-clock-history me-2"></i>
                Últimas Facturas
              </h5>
            </Card.Header>
            <Card.Body>
              {!stats?.recentInvoices || stats.recentInvoices.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ddd' }}></i>
                  <p className="text-muted mt-2">No hay facturas todavía</p>
                  <Button as={Link} to="/app/invoices/new" variant="primary" size="sm">
                    Crear primera factura
                  </Button>
                </div>
              ) : (
                <div className="d-grid gap-2">
                  {stats.recentInvoices.map((invoice, idx) => (
                    <div 
                      key={invoice.id} 
                      className="p-3 border rounded hover-lift"
                      style={{ 
                        transition: 'all 0.3s',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.location.href = `/app/invoices/${invoice.id}`}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{invoice.number}</strong>
                          <div className="small text-muted">
                            {invoice.customer?.name || 'Sin cliente'}
                          </div>
                        </div>
                        <div className="text-end">
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
                    Ver todas las facturas <i className="bi bi-arrow-right ms-1"></i>
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Top Clientes */}
      {stats?.topCustomers && stats.topCustomers.length > 0 && (
        <Row className="mt-4">
          <Col md={6}>
            <Card className="scale-in" style={{ animationDelay: '0.2s' }}>
              <Card.Header>
                <h5 className="mb-0 text-white">
                  <i className="bi bi-trophy-fill me-2"></i>
                  Top Clientes
                </h5>
              </Card.Header>
              <Card.Body>
                <Table hover responsive className="mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Cliente</th>
                      <th className="text-center">Facturas</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topCustomers.map((customer, idx) => (
                      <tr key={customer.id}>
                        <td>
                          {idx === 0 && <i className="bi bi-trophy-fill text-warning"></i>}
                          {idx === 1 && <i className="bi bi-trophy-fill text-secondary"></i>}
                          {idx === 2 && <i className="bi bi-trophy-fill text-danger"></i>}
                          {idx > 2 && `${idx + 1}.`}
                        </td>
                        <td>
                          <strong>{customer.name}</strong>
                        </td>
                        <td className="text-center">
                          <Badge bg="primary">{customer.invoice_count}</Badge>
                        </td>
                        <td className="text-end">
                          <span className="gradient-text fw-bold">
                            {parseFloat(customer.total_revenue).toFixed(2)} €
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

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

