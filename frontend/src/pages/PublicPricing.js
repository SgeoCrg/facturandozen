import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const PublicPricing = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'BASIC',
      price: 19,
      popular: true,
      features: [
        'Facturas ILIMITADAS',
        'Clientes ilimitados',
        'Productos ilimitados',
        'PDF profesional',
        'Numeración automática',
        'Cálculo IVA automático',
        'Validación NIF/CIF',
        'Modo manual + guardado',
        'Múltiples usuarios',
        'Backup diario',
        'Soporte email'
      ]
    },
    {
      name: 'PRO',
      price: 49,
      badge: 'Completo',
      badgeVariant: 'primary',
      features: [
        'TODO de BASIC +',
        'Verifactu INTEGRADO',
        'Firma digital automática',
        'Envío automático AEAT',
        'QR Verifactu',
        'API REST access',
        'Webhooks',
        'Reportes avanzados',
        'Soporte prioritario',
        'Gestor cuenta dedicado'
      ]
    }
  ];

  return (
    <>
      <PublicHeader />

      {/* Hero Section */}
      <div className="pricing-hero-section" style={{ marginTop: '70px' }}>
        <Container className="py-5">
          <div className="text-center mb-5">
            <Badge bg="light" text="dark" className="px-3 py-2 mb-3">
              <i className="bi bi-star-fill text-warning me-1"></i>
              Precios Transparentes
            </Badge>
            <h1 className="display-4 fw-bold text-white mb-3">
              Elige tu <span className="text-warning">Plan Perfecto</span>
            </h1>
            <p className="lead text-white-50 mb-4" style={{ maxWidth: '600px', margin: '0 auto' }}>
              Precios transparentes. Sin permanencia. Cancela cuando quieras.
            </p>
          </div>
        </Container>
      </div>

      <Container className="py-5">

        <Row className="g-4 justify-content-center">
          {plans.map((plan, index) => (
            <Col key={index} md={6} lg={5} xl={4}>
              <Card className={`h-100 pricing-card ${plan.popular ? 'featured' : ''}`}>
                {plan.popular && (
                  <div className="position-absolute top-0 start-50 translate-middle">
                    <Badge bg="success" className="px-3 py-2">
                      <i className="bi bi-star-fill me-1"></i>
                      Más Popular
                    </Badge>
                  </div>
                )}
                
                <Card.Body className="p-5 text-center">
                  <div className="mb-4">
                    <div className={`pricing-icon ${plan.popular ? 'success' : 'primary'}`}>
                      <i className={`bi ${plan.popular ? 'bi-lightning-charge-fill' : 'bi-check-circle-fill'}`}></i>
                    </div>
                  </div>
                  
                  <h3 className="fw-bold mb-3">{plan.name}</h3>
                  
                  <div className="mb-4">
                    <div className="price">{plan.price}</div>
                    <div className="text-muted">€/mes</div>
                  </div>

                  <div className="d-grid mb-4">
                    <Button
                      variant={plan.popular ? 'success' : 'primary'}
                      size="lg"
                      onClick={() => navigate('/register')}
                      className="px-4 py-3"
                    >
                      <i className="bi bi-rocket-takeoff me-2"></i>
                      Contratar
                    </Button>
                  </div>

                  <ul className="list-unstyled text-start">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="mb-3 d-flex align-items-start">
                        <i className={`bi bi-check-circle-fill text-success me-3 mt-1`}></i>
                        <span className="text-muted">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="text-center mt-5">
          <p className="lead">¿Necesitas algo específico?</p>
          <p className="text-muted">Contáctanos para un plan enterprise personalizado</p>
        </div>
      </Container>

      <div className="bg-light py-5">
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <h3 className="fw-bold mb-3">Sin Permanencia</h3>
              <p className="text-muted">
                Cancela cuando quieras. Sin compromisos. Sin preguntas.
              </p>
            </Col>
            <Col md={6} className="text-center">
              <Button 
                as={Link} 
                to="/register" 
                variant="primary" 
                size="lg"
                className="px-5"
              >
                Contratar
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      <PublicFooter />
    </>
  );
};

export default PublicPricing;

