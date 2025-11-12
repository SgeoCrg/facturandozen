import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';

const Pricing = () => {
  const plans = [
    {
      name: 'STARTER',
      price: '9',
      period: '/ mes',
      badge: 'Básico',
      badgeVariant: 'secondary',
      features: [
        'Hasta 100 facturas/mes',
        'Clientes ilimitados',
        'Productos ilimitados',
        'PDF profesional',
        'Numeración automática',
        'Cálculo IVA automático',
        'Validación NIF/CIF',
        'Soporte por email'
      ],
      cta: 'Contratar',
      ctaVariant: 'outline-primary'
    },
    {
      name: 'BASIC',
      price: '19',
      period: '/ mes',
      badge: 'Más Popular',
      badgeVariant: 'success',
      features: [
        'TODO de STARTER +',
        'Facturas ILIMITADAS',
        'Soporte prioritario',
        'Sin marca de agua',
        'Personalización PDF',
        'Múltiples usuarios',
        'Reportes avanzados',
        'Backup diario'
      ],
      cta: 'Contratar',
      ctaVariant: 'success',
      highlighted: true
    },
    {
      name: 'PRO',
      price: '49',
      period: '/ mes',
      badge: 'Completo',
      badgeVariant: 'primary',
      features: [
        'TODO de BASIC +',
        'Verifactu INTEGRADO',
        'Firma digital automática',
        'Envío automático AEAT',
        'API REST access',
        'Webhooks',
        'Soporte telefónico',
        'Gestor cuenta dedicado'
      ],
      cta: 'Contratar',
      ctaVariant: 'primary'
    }
  ];

  return (
    <>
      <div className="bg-light py-5">
        <Container>
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold">Precios Simples y Transparentes</h1>
            <p className="lead text-muted">
              Precios transparentes. Sin permanencia. Cancela cuando quieras.
            </p>
          </div>

          <Row className="g-4 justify-content-center">
            {plans.map((plan, index) => (
              <Col key={index} md={4}>
                <Card className={`h-100 ${plan.highlighted ? 'border-success border-3 shadow-lg' : 'shadow-sm'}`}>
                  {plan.highlighted && (
                    <div className="position-absolute top-0 start-50 translate-middle">
                      <Badge bg={plan.badgeVariant} className="px-3 py-2">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}
                  
                  <Card.Body className="text-center p-4">
                    {!plan.highlighted && (
                      <Badge bg={plan.badgeVariant} className="mb-3">
                        {plan.badge}
                      </Badge>
                    )}
                    
                    <h3 className="fw-bold mt-3">{plan.name}</h3>
                    
                    <div className="my-4">
                      <span className="display-4 fw-bold">{plan.price}</span>
                      <span className="h5 text-muted"> €</span>
                      <div className="text-muted">{plan.period}</div>
                    </div>

                    <div className="d-grid mb-4">
                      <Button 
                        as={Link} 
                        to="/register" 
                        variant={plan.ctaVariant}
                        size="lg"
                      >
                        {plan.cta}
                      </Button>
                    </div>

                    <ul className="list-unstyled text-start">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="mb-2">
                          <i className="bi bi-check-circle-fill text-success me-2"></i>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <div className="text-center mt-5">
            <p className="text-muted">
              Sin permanencia. Cancela cuando quieras.
            </p>
          </div>
        </Container>
      </div>

      {/* FAQ */}
      <Container className="py-5">
        <div className="text-center mb-5">
          <h2 className="display-6 fw-bold">Preguntas Frecuentes</h2>
        </div>

        <Row>
          <Col md={6}>
            <Card className="mb-3 border-0">
              <Card.Body>
                <h5 className="fw-bold">
                  <i className="bi bi-question-circle text-primary me-2"></i>
                  ¿Cómo funciona el pago?
                </h5>
                <p className="text-muted mb-0">
                  Pago mensual por tarjeta. Sin permanencia. Cancela cuando quieras.
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="mb-3 border-0">
              <Card.Body>
                <h5 className="fw-bold">
                  <i className="bi bi-question-circle text-primary me-2"></i>
                  ¿Puedo cambiar de plan?
                </h5>
                <p className="text-muted mb-0">
                  Sí, puedes cambiar de plan en cualquier momento desde tu cuenta.
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="mb-3 border-0">
              <Card.Body>
                <h5 className="fw-bold">
                  <i className="bi bi-question-circle text-primary me-2"></i>
                  ¿Qué es Verifactu?
                </h5>
                <p className="text-muted mb-0">
                  Sistema obligatorio de la AEAT para firmar y enviar facturas. Incluido en plan PRO.
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="mb-3 border-0">
              <Card.Body>
                <h5 className="fw-bold">
                  <i className="bi bi-question-circle text-primary me-2"></i>
                  ¿Puedo exportar mis datos?
                </h5>
                <p className="text-muted mb-0">
                  Sí, tus datos son tuyos. Puedes exportarlos en cualquier momento.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Final CTA */}
      <div className="bg-primary text-white py-5">
        <Container className="text-center">
          <h2 className="display-6 fw-bold mb-4">
            Únete a Empresas que Facturan Mejor
          </h2>
          <Button 
            as={Link} 
            to="/register" 
            variant="light" 
            size="lg"
            className="px-5"
          >
            Contratar Ahora
          </Button>
        </Container>
      </div>

      {/* Footer */}
      <footer className="bg-dark text-white py-4">
        <Container>
          <div className="text-center">
            <p className="mb-0">Sistema Facturación SaaS &copy; 2025</p>
            <div className="mt-2">
              <Link to="/pricing" className="text-white-50 me-3 text-decoration-none">Precios</Link>
              <Link to="/login" className="text-white-50 me-3 text-decoration-none">Login</Link>
              <Link to="/register" className="text-white-50 text-decoration-none">Registro</Link>
            </div>
          </div>
        </Container>
      </footer>
    </>
  );
};

export default Landing;



