import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const About = () => {
  const values = [
    {
      icon: 'bi-heart-fill',
      title: 'Simplicidad',
      description: 'Creemos que la facturación no debería ser complicada. Diseñamos pensando en la facilidad de uso.'
    },
    {
      icon: 'bi-shield-check',
      title: 'Seguridad',
      description: 'Tus datos y los de tus clientes están protegidos con los más altos estándares de seguridad.'
    },
    {
      icon: 'bi-lightning-charge',
      title: 'Rapidez',
      description: 'Valoramos tu tiempo. Por eso optimizamos cada proceso para que factures en segundos.'
    },
    {
      icon: 'bi-people',
      title: 'Soporte',
      description: 'No estás solo. Nuestro equipo está aquí para ayudarte cuando lo necesites.'
    }
  ];

  const stats = [
    { number: '1000+', label: 'Facturas Generadas', icon: 'bi-file-earmark-text' },
    { number: '100+', label: 'Clientes Satisfechos', icon: 'bi-people' },
    { number: '99.9%', label: 'Uptime', icon: 'bi-graph-up' },
    { number: '24h', label: 'Soporte Respuesta', icon: 'bi-clock' }
  ];

  return (
    <>
      <PublicHeader />
      
      {/* Hero Section */}
      <div className="about-hero-section" style={{ marginTop: '70px' }}>
        <Container className="py-5">
          <div className="text-center mb-5">
            <Badge bg="light" text="dark" className="px-3 py-2 mb-3">
              <i className="bi bi-info-circle-fill text-primary me-1"></i>
              Sobre Nosotros
            </Badge>
            <h1 className="display-4 fw-bold text-white mb-3">
              Facturación <span className="text-warning">Simple y Profesional</span>
            </h1>
            <p className="lead text-white-50 mb-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
              Nació de la frustración de usar Excel para facturar. Creamos la herramienta 
              que nos hubiera gustado tener desde el primer día como autónomos.
            </p>
          </div>
        </Container>
      </div>

      <div style={{ paddingBottom: '60px' }}>
        <Container>

          {/* Story */}
          <Row className="mb-5 align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              <div className="bg-gradient rounded-4 p-5 text-white" style={{ minHeight: '400px' }}>
                <i className="bi bi-lightbulb-fill" style={{ fontSize: '4rem' }}></i>
                <h2 className="mt-4 mb-3">Nuestra Historia</h2>
                <p className="mb-0" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                  Como muchos autónomos, empezamos usando Excel. Fórmulas rotas, 
                  numeración manual, PDFs desorganizados... Sabíamos que tenía que haber 
                  una forma mejor.
                </p>
              </div>
            </Col>
            <Col lg={6}>
              <div className="ps-lg-4">
                <h3 className="mb-4">¿Por qué FacturaPro?</h3>
                <div className="mb-3">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  <strong>Sin curva de aprendizaje:</strong> Diseñado para usar desde el minuto uno
                </div>
                <div className="mb-3">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  <strong>Precio honesto:</strong> Sin sorpresas ni costes ocultos
                </div>
                <div className="mb-3">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  <strong>Hecho en España:</strong> Cumple normativa española y europea
                </div>
                <div className="mb-3">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  <strong>Soporte real:</strong> Personas reales que responden rápido
                </div>
                <div className="mb-3">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  <strong>Mejora continua:</strong> Escuchamos feedback y mejoramos constantemente
                </div>
              </div>
            </Col>
          </Row>

          {/* Values */}
          <div className="mb-5">
            <h2 className="text-center mb-5">Nuestros Valores</h2>
            <Row className="g-4">
              {values.map((value, index) => (
                <Col md={6} lg={3} key={index}>
                  <Card className="h-100 border-0 shadow-sm text-center hover-card">
                    <Card.Body className="p-4">
                      <div className="text-primary mb-3" style={{ fontSize: '2.5rem' }}>
                        <i className={`bi ${value.icon}`}></i>
                      </div>
                      <h5 className="fw-bold mb-2">{value.title}</h5>
                      <p className="text-muted mb-0 small">{value.description}</p>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          {/* Stats */}
          <div className="bg-light rounded-4 p-5 mb-5">
            <h2 className="text-center mb-5">FacturaPro en Números</h2>
            <Row className="text-center">
              {stats.map((stat, index) => (
                <Col md={6} lg={3} key={index} className="mb-4 mb-lg-0">
                  <div className="text-primary mb-2" style={{ fontSize: '2rem' }}>
                    <i className={`bi ${stat.icon}`}></i>
                  </div>
                  <h2 className="fw-bold gradient-text mb-1">{stat.number}</h2>
                  <p className="text-muted mb-0">{stat.label}</p>
                </Col>
              ))}
            </Row>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Card className="border-0 shadow-lg bg-gradient text-white">
              <Card.Body className="p-5">
                <h2 className="display-6 fw-bold mb-3">¿Listo para Simplificar tu Facturación?</h2>
                <p className="lead mb-4">
                  Únete a cientos de autónomos y empresas que ya facturan con FacturaPro
                </p>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <Button 
                    as={Link} 
                    to="/register" 
                    variant="light" 
                    size="lg"
                    className="px-5"
                  >
                    <i className="bi bi-rocket-takeoff me-2"></i>
                    Probar Gratis 30 Días
                  </Button>
                  <Button 
                    as={Link} 
                    to="/contact" 
                    variant="outline-light" 
                    size="lg"
                    className="px-5"
                  >
                    <i className="bi bi-chat-dots me-2"></i>
                    Contactar
                  </Button>
                </div>
                <p className="mt-3 mb-0 small">
                  Sin tarjeta de crédito · Cancela cuando quieras
                </p>
              </Card.Body>
            </Card>
          </div>
        </Container>
      </div>

      <PublicFooter />
    </>
  );
};

export default About;

