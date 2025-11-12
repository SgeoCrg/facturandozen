import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';

const PublicFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-white pt-5 pb-3">
      <Container>
        <Row className="mb-4">
          {/* Columna 1: Marca y descripción */}
          <Col lg={4} md={6} className="mb-4">
            <div className="d-flex align-items-center mb-3">
              <i className="bi bi-receipt-cutoff me-2" style={{ fontSize: '2rem' }}></i>
              <h5 className="mb-0 fw-bold">FacturaPro</h5>
            </div>
            <p className="text-white-50 mb-3">
              Sistema de facturación profesional para autónomos y pymes. 
              Simple, seguro y cumple con la normativa española.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="text-white-50 hover-primary" title="LinkedIn">
                <i className="bi bi-linkedin fs-5"></i>
              </a>
              <a href="#" className="text-white-50 hover-primary" title="Twitter">
                <i className="bi bi-twitter-x fs-5"></i>
              </a>
              <a href="#" className="text-white-50 hover-primary" title="YouTube">
                <i className="bi bi-youtube fs-5"></i>
              </a>
              <a href="#" className="text-white-50 hover-primary" title="Email">
                <i className="bi bi-envelope-fill fs-5"></i>
              </a>
            </div>
          </Col>

          {/* Columna 2: Producto */}
          <Col lg={2} md={6} className="mb-4">
            <h6 className="text-uppercase fw-bold mb-3">Producto</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/features" className="text-white-50 text-decoration-none hover-primary">
                  <i className="bi bi-chevron-right me-1"></i>
                  Características
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/pricing" className="text-white-50 text-decoration-none hover-primary">
                  <i className="bi bi-chevron-right me-1"></i>
                  Precios
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/about" className="text-white-50 text-decoration-none hover-primary">
                  <i className="bi bi-chevron-right me-1"></i>
                  Sobre Nosotros
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/register" className="text-white-50 text-decoration-none hover-primary">
                  <i className="bi bi-chevron-right me-1"></i>
                  Prueba Gratis
                </Link>
              </li>
            </ul>
          </Col>

          {/* Columna 3: Recursos */}
          <Col lg={2} md={6} className="mb-4">
            <h6 className="text-uppercase fw-bold mb-3">Recursos</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/faq" className="text-white-50 text-decoration-none hover-primary">
                  <i className="bi bi-chevron-right me-1"></i>
                  FAQ
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/contact" className="text-white-50 text-decoration-none hover-primary">
                  <i className="bi bi-chevron-right me-1"></i>
                  Contacto
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/about" className="text-white-50 text-decoration-none hover-primary">
                  <i className="bi bi-chevron-right me-1"></i>
                  Nuestra Historia
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/login" className="text-white-50 text-decoration-none hover-primary">
                  <i className="bi bi-chevron-right me-1"></i>
                  Acceso Clientes
                </Link>
              </li>
            </ul>
          </Col>

          {/* Columna 4: Soporte */}
          <Col lg={2} md={6} className="mb-4">
            <h6 className="text-uppercase fw-bold mb-3">Soporte</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/contact" className="text-white-50 text-decoration-none hover-primary">
                  <i className="bi bi-chevron-right me-1"></i>
                  Contacto
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/faq" className="text-white-50 text-decoration-none hover-primary">
                  <i className="bi bi-chevron-right me-1"></i>
                  Preguntas Frecuentes
                </Link>
              </li>
              <li className="mb-2">
                <a href="mailto:info@facturandozen.com" className="text-white-50 text-decoration-none hover-primary">
                  <i className="bi bi-chevron-right me-1"></i>
                  Email Soporte
                </a>
              </li>
              <li className="mb-2">
                <Link to="/login" className="text-white-50 text-decoration-none hover-primary">
                  <i className="bi bi-chevron-right me-1"></i>
                  Portal Cliente
                </Link>
              </li>
            </ul>
          </Col>

          {/* Columna 5: Legal */}
          <Col lg={2} md={6} className="mb-4">
            <h6 className="text-uppercase fw-bold mb-3">Legal</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="#privacy" className="text-white-50 text-decoration-none hover-primary">
                  <i className="bi bi-chevron-right me-1"></i>
                  Privacidad
                </a>
              </li>
              <li className="mb-2">
                <a href="#terms" className="text-white-50 text-decoration-none hover-primary">
                  <i className="bi bi-chevron-right me-1"></i>
                  Términos
                </a>
              </li>
              <li className="mb-2">
                <a href="#cookies" className="text-white-50 text-decoration-none hover-primary">
                  <i className="bi bi-chevron-right me-1"></i>
                  Cookies
                </a>
              </li>
              <li className="mb-2">
                <a href="#legal" className="text-white-50 text-decoration-none hover-primary">
                  <i className="bi bi-chevron-right me-1"></i>
                  Aviso Legal
                </a>
              </li>
            </ul>
          </Col>
        </Row>

        {/* Separador */}
        <hr className="border-secondary my-4" />

        {/* Fila inferior */}
        <Row className="align-items-center">
          <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
            <p className="mb-0 text-white-50 small">
              &copy; {currentYear} FacturaPro SaaS. Todos los derechos reservados.
            </p>
          </Col>
          <Col md={6} className="text-center text-md-end">
            <div className="d-flex justify-content-center justify-content-md-end align-items-center gap-3">
              <span className="badge bg-success">
                <i className="bi bi-shield-check me-1"></i>
                Seguro SSL
              </span>
              <span className="badge bg-primary">
                <i className="bi bi-patch-check me-1"></i>
                Verifactu
              </span>
              <span className="badge bg-info">
                <i className="bi bi-geo-alt me-1"></i>
                España
              </span>
            </div>
          </Col>
        </Row>
      </Container>

      <style jsx="true">{`
        .hover-primary {
          transition: color 0.2s ease;
        }
        .hover-primary:hover {
          color: var(--primary) !important;
        }
        .transition-all {
          transition: all 0.3s ease;
        }
      `}</style>
    </footer>
  );
};

export default PublicFooter;

