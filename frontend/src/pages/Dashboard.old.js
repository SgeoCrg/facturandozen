import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { subscription } = useAuth();
  const [stats, setStats] = useState({ invoices: 0, customers: 0, products: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [invoicesRes, customersRes, productsRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/customers'),
        api.get('/products')
      ]);

      setStats({
        invoices: invoicesRes.data.invoices?.length || 0,
        customers: customersRes.data.customers?.length || 0,
        products: productsRes.data.products?.length || 0
      });
    } catch (error) {
      console.error('Error cargando stats:', error);
    }
  };

  // Calcular días restantes trial
  const getDaysLeftTrial = () => {
    if (!subscription || subscription.status !== 'trial' || !subscription.trialEndsAt) return null;
    const days = Math.ceil((new Date(subscription.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const daysLeftTrial = getDaysLeftTrial();

  return (
    <>
      {subscription && subscription.status === 'trial' && daysLeftTrial !== null && (
        <Alert variant={daysLeftTrial <= 7 ? 'warning' : 'info'} className="mb-4">
          <strong>Trial:</strong> Te quedan {daysLeftTrial} días de prueba gratis.{' '}
          {daysLeftTrial <= 7 && 'Contacta para activar tu cuenta.'}
        </Alert>
      )}

      <Row className="mb-4">
        <Col>
          <h1>Dashboard</h1>
          <p className="text-muted">
            Resumen de tu negocio
            {subscription && (
              <Badge bg="info" className="ms-2">Plan {subscription.plan.toUpperCase()}</Badge>
            )}
          </p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="card-hover">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted text-uppercase mb-2">Facturas</h6>
                  <h2 className="mb-0">{stats.invoices}</h2>
                </div>
                <i className="bi bi-file-earmark-text text-primary" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <Link to="/app/invoices" className="btn btn-sm btn-outline-primary mt-3">
                Ver todas
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="card-hover">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted text-uppercase mb-2">Clientes</h6>
                  <h2 className="mb-0">{stats.customers}</h2>
                </div>
                <i className="bi bi-people text-success" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <Link to="/app/customers" className="btn btn-sm btn-outline-success mt-3">
                Gestionar
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="card-hover">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted text-uppercase mb-2">Productos</h6>
                  <h2 className="mb-0">{stats.products}</h2>
                  <small className="text-muted">Opcional</small>
                </div>
                <i className="bi bi-box-seam text-info" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <Link to="/app/products" className="btn btn-sm btn-outline-info mt-3">
                Gestionar
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card>
            <Card.Header className="bg-white">
              <h5 className="mb-0">Acciones Rápidas</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button 
                  as={Link} 
                  to="/app/invoices/new" 
                  variant="primary" 
                  size="lg"
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Nueva Factura
                </Button>
                <Button 
                  as={Link} 
                  to="/app/customers" 
                  variant="outline-secondary"
                >
                  <i className="bi bi-person-plus me-2"></i>
                  Gestionar Clientes
                </Button>
                <Button 
                  as={Link} 
                  to="/app/products" 
                  variant="outline-secondary"
                >
                  <i className="bi bi-box-seam me-2"></i>
                  Productos (Opcional)
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="bg-light">
            <Card.Body>
              <h5 className="mb-3">
                <i className="bi bi-lightbulb text-warning me-2"></i>
                Simple como Excel
              </h5>
              <p className="small">
                <strong>Modo flexible:</strong> Puedes guardar clientes y productos para reutilizarlos, O escribir todo a mano en cada factura (como en Excel).
              </p>
              <p className="small mb-2">
                <strong>Al crear facturas:</strong>
              </p>
              <ul className="small mb-2">
                <li>Clientes: Selecciona guardado O escribe manual</li>
                <li>Líneas: Selecciona producto O escribe manual</li>
              </ul>
              {subscription?.status === 'trial' && (
                <Alert variant="warning" className="mt-3 mb-0 small">
                  <strong>Trial:</strong> Estás en prueba. Al finalizar: {subscription.priceMonthly}€/mes (plan {subscription.plan.toUpperCase()}).
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Dashboard;
