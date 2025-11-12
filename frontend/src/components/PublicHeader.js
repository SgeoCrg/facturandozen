import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';

const PublicHeader = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <Navbar 
      expand="lg" 
      fixed="top"
      className="bg-white shadow-sm transition-all duration-300"
      variant="light"
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold d-flex align-items-center">
          <img src="/logo-optimized.png" alt="Facturando Zen" height="55" className="me-0" style={{ objectFit: 'contain' }} />
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="public-navbar" className="border-success" />
        
        <Navbar.Collapse id="public-navbar">
          <Nav className="mx-auto">
            <Nav.Link 
              as={Link} 
              to="/"
              className={`fw-medium px-3 py-2 rounded-pill transition-all ${isActive('/') ? 'bg-success text-white' : 'text-dark hover-bg-light'}`}
            >
              Inicio
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/features"
              className={`fw-medium px-3 py-2 rounded-pill transition-all ${isActive('/features') ? 'bg-success text-white' : 'text-dark hover-bg-light'}`}
            >
              Características
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/pricing"
              className={`fw-medium px-3 py-2 rounded-pill transition-all ${isActive('/pricing') ? 'bg-success text-white' : 'text-dark hover-bg-light'}`}
            >
              Precios
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/faq"
              className={`fw-medium px-3 py-2 rounded-pill transition-all ${isActive('/faq') ? 'bg-success text-white' : 'text-dark hover-bg-light'}`}
            >
              FAQ
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/contact"
              className={`fw-medium px-3 py-2 rounded-pill transition-all ${isActive('/contact') ? 'bg-success text-white' : 'text-dark hover-bg-light'}`}
            >
              Contacto
            </Nav.Link>
          </Nav>

          <Nav className="align-items-lg-center gap-3">
            <Button 
              as={Link} 
              to="/login" 
              variant="outline-success" 
              size="sm"
              className="px-4 py-2 rounded-pill fw-medium transition-all"
            >
              <i className="bi bi-box-arrow-in-right me-2"></i>
              <span className="d-none d-md-inline">Acceder</span>
              <span className="d-md-none">Login</span>
            </Button>
            <Button 
              as={Link} 
              to="/register" 
              variant="success" 
              size="sm"
              className="px-4 py-2 rounded-pill fw-medium transition-all shadow-sm"
            >
              <i className="bi bi-rocket-takeoff me-2"></i>
              <span className="d-none d-md-inline">Probar Gratis</span>
              <span className="d-md-none">Probar</span>
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default PublicHeader;

