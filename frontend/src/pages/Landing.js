import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button, Badge, Card } from 'react-bootstrap';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const Landing = () => {
  return (
    <>
      <PublicHeader />
      
      {/* Hero Section */}
      <div className="hero-section" style={{ marginTop: '70px' }}>
        {/* Elementos decorativos flotantes */}
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        
        <Container>
          <Row className="align-items-center" style={{ minHeight: '85vh' }}>
            <Col lg={6} className="fade-in">
              <div className="mb-3">
                <Badge bg="light" text="dark" className="px-3 py-2 me-2">
                  <i className="bi bi-star-fill text-warning me-1"></i>
                  Nuevo
                </Badge>
                <Badge bg="success" className="px-3 py-2">
                  Verifactu incluido (PRO)
                </Badge>
              </div>
              <h1 className="hero-title text-shadow">
                Facturación Simple y Profesional
              </h1>
              <p className="hero-subtitle text-shadow">
                Deja Excel atrás. Crea facturas en segundos, con numeración automática, cálculo de IVA y PDF profesional.
              </p>
              <div className="d-flex flex-wrap gap-3 mb-4">
                <Button 
                  as={Link} 
                  to="/register" 
                  variant="light" 
                  size="lg"
                  className="px-5 py-3"
                  style={{ fontSize: '1.1rem' }}
                >
                  <i className="bi bi-rocket-takeoff me-2"></i>
                  Empezar Ahora - 19 €/mes
                </Button>
                <Button 
                  as={Link} 
                  to="/pricing" 
                  variant="outline-light" 
                  size="lg"
                  className="px-4 py-3"
                >
                  Ver Precios
                </Button>
              </div>
              <div className="d-flex gap-4 text-white flex-wrap">
                <div>
                  <i className="bi bi-check-circle-fill me-2"></i>
                  3 facturas gratis
                </div>
                <div>
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Sin permanencia
                </div>
                <div>
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Cancela cuando quieras
                </div>
              </div>
            </Col>
            <Col lg={6} className="text-center slide-in-right">
              <div className="p-5">
                <div className="bg-white rounded-4 shadow-lg p-5 position-relative">
                  <div className="position-absolute top-0 start-50 translate-middle">
                    <Badge bg="success" className="px-3 py-2">
                      <i className="bi bi-lightning-charge-fill me-1"></i>
                      En la nube
                    </Badge>
                  </div>
                  <i className="bi bi-receipt gradient-text" style={{ fontSize: '10rem' }}></i>
                  <div className="mt-3">
                    <h5 className="gradient-text mb-2">Facturas Profesionales</h5>
                    <p className="text-muted small mb-0">
                      PDF automático · Numeración · IVA · Verifactu
                    </p>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Estadísticas de Confianza */}
      <div className="bg-light py-5">
        <Container>
          <Row className="text-center g-4">
            <Col md={3}>
              <div className="stat-item">
                <div className="stat-number gradient-text">1000+</div>
                <div className="stat-label">Facturas Generadas</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-item">
                <div className="stat-number gradient-text">100+</div>
                <div className="stat-label">Empresas Confían</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-item">
                <div className="stat-number gradient-text">99.9%</div>
                <div className="stat-label">Tiempo Activo</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-item">
                <div className="stat-number gradient-text">24h</div>
                <div className="stat-label">Soporte Respuesta</div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Características Principales */}
      <Container className="py-5">
        <div className="text-center mb-5">
          <Badge bg="primary" className="px-3 py-2 mb-3">
            <i className="bi bi-star-fill me-2"></i>
            Características Principales
          </Badge>
          <h2 className="display-5 fw-bold mb-3">
            Todo lo que Necesitas para <span className="gradient-text">Facturar Profesionalmente</span>
          </h2>
          <p className="lead text-muted mb-4" style={{ maxWidth: '700px', margin: '0 auto' }}>
            Un sistema completo diseñado para autónomos y pequeñas empresas. Simple de usar, potente en funcionalidades.
          </p>
        </div>

        <Row className="g-4 text-center">
          <Col md={3}>
            <Link to="/features" className="text-decoration-none">
              <Card className="h-100 border-0 shadow-sm hover-card">
                <Card.Body className="p-4">
                  <i className="bi bi-lightning-charge-fill text-warning" style={{ fontSize: '3rem' }}></i>
                  <h5 className="mt-3 mb-2">Ultra Rápido</h5>
                  <p className="text-muted small mb-0">Crea facturas en segundos</p>
                </Card.Body>
              </Card>
            </Link>
          </Col>
          <Col md={3}>
            <Link to="/features" className="text-decoration-none">
              <Card className="h-100 border-0 shadow-sm hover-card">
                <Card.Body className="p-4">
                  <i className="bi bi-shield-check-fill text-success" style={{ fontSize: '3rem' }}></i>
                  <h5 className="mt-3 mb-2">Seguro y Legal</h5>
                  <p className="text-muted small mb-0">Cumple normativa española</p>
                </Card.Body>
              </Card>
            </Link>
          </Col>
          <Col md={3}>
            <Link to="/features" className="text-decoration-none">
              <Card className="h-100 border-0 shadow-sm hover-card">
                <Card.Body className="p-4">
                  <i className="bi bi-file-pdf-fill text-danger" style={{ fontSize: '3rem' }}></i>
                  <h5 className="mt-3 mb-2">PDF Profesional</h5>
                  <p className="text-muted small mb-0">Diseño limpio y moderno</p>
                </Card.Body>
              </Card>
            </Link>
          </Col>
          <Col md={3}>
            <Link to="/features" className="text-decoration-none">
              <Card className="h-100 border-0 shadow-sm hover-card">
                <Card.Body className="p-4">
                  <i className="bi bi-patch-check-fill text-primary" style={{ fontSize: '3rem' }}></i>
                  <h5 className="mt-3 mb-2">Verifactu</h5>
                  <p className="text-muted small mb-0">Integrado con AEAT</p>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        </Row>

        <div className="text-center mt-4">
          <Button as={Link} to="/features" variant="outline-primary">
            Ver todas las características
            <i className="bi bi-arrow-right ms-2"></i>
          </Button>
        </div>
      </Container>

      {/* Cómo Funciona */}
      <div className="bg-light py-5">
        <Container>
          <div className="text-center mb-5">
            <Badge bg="success" className="px-3 py-2 mb-3">
              <i className="bi bi-gear-fill me-2"></i>
              Cómo Funciona
            </Badge>
            <h2 className="display-5 fw-bold mb-3">
              <span className="gradient-text">3 Pasos Simples</span> para Facturar
            </h2>
            <p className="lead text-muted mb-4">
              Desde la configuración hasta el envío de tu primera factura en menos de 5 minutos
            </p>
          </div>

          <Row className="g-4">
            <Col md={4}>
              <div className="text-center">
                <div className="step-number">1</div>
                <div className="step-icon mb-3">
                  <i className="bi bi-person-plus-fill"></i>
                </div>
                <h4 className="mb-3">Configura tu Empresa</h4>
                <p className="text-muted">
                  Añade tus datos fiscales, logo y configuración. Solo una vez y listo para siempre.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center">
                <div className="step-number">2</div>
                <div className="step-icon mb-3">
                  <i className="bi bi-file-earmark-plus-fill"></i>
                </div>
                <h4 className="mb-3">Crea tu Factura</h4>
                <p className="text-muted">
                  Selecciona cliente, añade productos y el sistema calcula automáticamente IVA y totales.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center">
                <div className="step-number">3</div>
                <div className="step-icon mb-3">
                  <i className="bi bi-send-fill"></i>
                </div>
                <h4 className="mb-3">Envía y Cobra</h4>
                <p className="text-muted">
                  Descarga el PDF profesional y envíalo por email o WhatsApp. Con Verifactu se registra automáticamente.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Testimonios */}
      <Container className="py-5">
        <div className="text-center mb-5">
          <Badge bg="info" className="px-3 py-2 mb-3">
            <i className="bi bi-quote me-2"></i>
            Testimonios
          </Badge>
          <h2 className="display-5 fw-bold mb-3">
            Lo que Dicen Nuestros <span className="gradient-text">Clientes</span>
          </h2>
        </div>

        <Row className="g-4">
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="mb-3">
                  <i className="bi bi-star-fill text-warning"></i>
                  <i className="bi bi-star-fill text-warning"></i>
                  <i className="bi bi-star-fill text-warning"></i>
                  <i className="bi bi-star-fill text-warning"></i>
                  <i className="bi bi-star-fill text-warning"></i>
                </div>
                <p className="mb-3">
                  "Finalmente dejé Excel atrás. Crear facturas ahora es súper rápido y los PDFs se ven profesionales."
                </p>
                <div className="d-flex align-items-center">
                  <div className="avatar me-3">
                    <i className="bi bi-person-circle text-primary" style={{ fontSize: '2rem' }}></i>
                  </div>
                  <div>
                    <strong>María González</strong>
                    <div className="text-muted small">Diseñadora Freelance</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="mb-3">
                  <i className="bi bi-star-fill text-warning"></i>
                  <i className="bi bi-star-fill text-warning"></i>
                  <i className="bi bi-star-fill text-warning"></i>
                  <i className="bi bi-star-fill text-warning"></i>
                  <i className="bi bi-star-fill text-warning"></i>
                </div>
                <p className="mb-3">
                  "El Verifactu integrado me ahorra horas cada mes. Todo se registra automáticamente en AEAT."
                </p>
                <div className="d-flex align-items-center">
                  <div className="avatar me-3">
                    <i className="bi bi-person-circle text-primary" style={{ fontSize: '2rem' }}></i>
                  </div>
                  <div>
                    <strong>Carlos Ruiz</strong>
                    <div className="text-muted small">Consultor IT</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="mb-3">
                  <i className="bi bi-star-fill text-warning"></i>
                  <i className="bi bi-star-fill text-warning"></i>
                  <i className="bi bi-star-fill text-warning"></i>
                  <i className="bi bi-star-fill text-warning"></i>
                  <i className="bi bi-star-fill text-warning"></i>
                </div>
                <p className="mb-3">
                  "Súper fácil de usar. En 10 minutos ya tenía mi primera factura lista. El soporte es excelente."
                </p>
                <div className="d-flex align-items-center">
                  <div className="avatar me-3">
                    <i className="bi bi-person-circle text-primary" style={{ fontSize: '2rem' }}></i>
                  </div>
                  <div>
                    <strong>Ana Martín</strong>
                    <div className="text-muted small">Coach Personal</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Comparación con Excel */}
      <div className="bg-light py-5">
        <Container>
          <div className="text-center mb-5">
            <Badge bg="warning" className="px-3 py-2 mb-3">
              <i className="bi bi-bar-chart me-2"></i>
              Comparación
            </Badge>
            <h2 className="display-5 fw-bold mb-3">
              <span className="gradient-text">Facturando Zen</span> vs Excel
            </h2>
            <p className="lead text-muted mb-4">
              Descubre por qué miles de autónomos han cambiado de Excel a nuestro sistema
            </p>
          </div>

          <Row className="g-4">
            <Col md={6}>
              <Card className="h-100 border-danger border-2">
                <Card.Header className="bg-danger text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-file-excel me-2"></i>
                    Excel (Problemas)
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <ul className="list-unstyled">
                    <li className="mb-3">
                      <i className="bi bi-x-circle-fill text-danger me-2"></i>
                      <strong>Numeración manual:</strong> Fácil de cometer errores
                    </li>
                    <li className="mb-3">
                      <i className="bi bi-x-circle-fill text-danger me-2"></i>
                      <strong>Fórmulas rotas:</strong> Cálculos incorrectos sin avisar
                    </li>
                    <li className="mb-3">
                      <i className="bi bi-x-circle-fill text-danger me-2"></i>
                      <strong>PDFs básicos:</strong> Diseño poco profesional
                    </li>
                    <li className="mb-3">
                      <i className="bi bi-x-circle-fill text-danger me-2"></i>
                      <strong>Sin backup:</strong> Riesgo de perder datos
                    </li>
                    <li className="mb-3">
                      <i className="bi bi-x-circle-fill text-danger me-2"></i>
                      <strong>Sin Verifactu:</strong> Registro manual en AEAT
                    </li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="h-100 border-success border-2">
                <Card.Header className="bg-success text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Facturando Zen (Soluciones)
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <ul className="list-unstyled">
                    <li className="mb-3">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      <strong>Numeración automática:</strong> Sin errores, secuencial
                    </li>
                    <li className="mb-3">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      <strong>Cálculos automáticos:</strong> IVA y totales perfectos
                    </li>
                    <li className="mb-3">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      <strong>PDFs profesionales:</strong> Diseño moderno y limpio
                    </li>
                    <li className="mb-3">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      <strong>Backup automático:</strong> Tus datos siempre seguros
                    </li>
                    <li className="mb-3">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      <strong>Verifactu integrado:</strong> Registro automático en AEAT
                    </li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Precios Destacados */}
      <Container className="py-5">
        <div className="text-center mb-5">
          <Badge bg="primary" className="px-3 py-2 mb-3">
            <i className="bi bi-currency-euro me-2"></i>
            Precios
          </Badge>
          <h2 className="display-5 fw-bold mb-3">
            Precios <span className="gradient-text">Simples y Transparentes</span>
          </h2>
          <p className="lead text-muted mb-4">
            3 facturas gratis para probar. Sin tarjeta. Sin permanencia.
          </p>
        </div>

        <Row className="g-4 justify-content-center">
          <Col md={5} lg={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4 text-center">
                <h3 className="fw-bold mb-3">BASIC</h3>
                <div className="mb-4">
                  <div className="price">19</div>
                  <div className="text-muted">€/mes</div>
                </div>
                <ul className="list-unstyled text-start mb-4">
                  <li className="mb-2">
                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                    Facturas ilimitadas
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                    PDF profesional
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                    Numeración automática
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                    Soporte email
                  </li>
                </ul>
                <Button as={Link} to="/register" variant="outline-primary" className="w-100">
                  Probar Gratis
                </Button>
              </Card.Body>
            </Card>
          </Col>
          <Col md={5} lg={4}>
            <Card className="h-100 border-success border-3 shadow-lg">
              <div className="position-absolute top-0 start-50 translate-middle">
                <Badge bg="success" className="px-3 py-2">
                  <i className="bi bi-star-fill me-1"></i>
                  Más Popular
                </Badge>
              </div>
              <Card.Body className="p-4 text-center">
                <h3 className="fw-bold mb-3">PRO</h3>
                <div className="mb-4">
                  <div className="price">49</div>
                  <div className="text-muted">€/mes</div>
                </div>
                <ul className="list-unstyled text-start mb-4">
                  <li className="mb-2">
                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                    Todo de BASIC +
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                    Verifactu integrado
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                    Firma digital automática
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                    Soporte prioritario
                  </li>
                </ul>
                <Button as={Link} to="/register" variant="success" className="w-100">
                  Probar Gratis
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <div className="text-center mt-4">
          <Button as={Link} to="/pricing" variant="outline-primary">
            Ver todos los precios
            <i className="bi bi-arrow-right ms-2"></i>
          </Button>
        </div>
      </Container>

      {/* CTA Final */}
      <div className="bg-light py-5">
        <Container className="text-center">
          <h2 className="display-6 fw-bold mb-3">
            Empieza a Facturar Hoy
          </h2>
          <p className="lead mb-4 text-muted">
            3 facturas gratis. Desde 19 €/mes. Cancela cuando quieras.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Button 
              as={Link} 
              to="/register" 
              variant="primary" 
              size="lg"
              className="px-5"
            >
              <i className="bi bi-rocket-takeoff me-2"></i>
              Probar Gratis
            </Button>
            <Button 
              as={Link} 
              to="/contact" 
              variant="outline-primary" 
              size="lg"
              className="px-5"
            >
              <i className="bi bi-chat-dots me-2"></i>
              Contactar
            </Button>
          </div>
          <p className="mt-4 text-muted small">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
          </p>
        </Container>
      </div>

      <PublicFooter />
    </>
  );
};

export default Landing;

