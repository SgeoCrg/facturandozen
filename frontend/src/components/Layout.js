import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import MobileMenuFix from './MobileMenuFix';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    setExpanded(false);
  };

  return (
    <>
      <MobileMenuFix />
      <Navbar 
        expand="lg" 
        fixed="top"
        className="bg-white shadow-sm transition-all duration-300 mb-4" 
        variant="light"
        expanded={expanded} 
        onToggle={() => setExpanded(!expanded)}
      >
        <Container fluid>
          <Navbar.Brand as={Link} to={user?.role === 'superadmin' ? '/app/superadmin' : '/app/dashboard'} className="fw-bold d-flex align-items-center">
            <img src="/logo-optimized.png" alt="Facturando Zen" height="32" className="me-2" style={{ objectFit: 'contain' }} />
            Facturando Zen
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="navbar-nav" />
          
          <Navbar.Collapse id="navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/app/dashboard" onClick={handleNavClick} className="text-dark">
                <i className="bi bi-speedometer2 me-1"></i>
                <span className="d-none d-md-inline">Dashboard</span>
                <span className="d-md-none">Dash</span>
              </Nav.Link>
              {user?.role === 'superadmin' ? (
                <>
                  <Nav.Link as={Link} to="/app/superadmin" onClick={handleNavClick} className="text-dark">
                    <i className="bi bi-shield-lock me-1"></i>
                    <span className="d-none d-md-inline">Superadmin</span>
                    <span className="d-md-none">Admin</span>
                  </Nav.Link>
                  <Nav.Link as={Link} to="/app/affiliates" onClick={handleNavClick} className="text-dark">
                    <i className="bi bi-people-fill me-1"></i>
                    <span className="d-none d-md-inline">Afiliados</span>
                    <span className="d-md-none">Afiliados</span>
                  </Nav.Link>
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to="/app/invoices" onClick={handleNavClick} className="text-dark">
                    <i className="bi bi-file-earmark-text me-1"></i>
                    <span className="d-none d-md-inline">Facturas</span>
                    <span className="d-md-none">Fact</span>
                  </Nav.Link>
                  <NavDropdown title={<><i className="bi bi-folder me-1"></i><span className="d-none d-md-inline">Datos</span><span className="d-md-none">Data</span></>} id="data-dropdown">
                    <NavDropdown.Item as={Link} to="/app/customers" onClick={handleNavClick}>
                      <i className="bi bi-people me-2"></i>
                      Clientes
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/app/products" onClick={handleNavClick}>
                      <i className="bi bi-box-seam me-2"></i>
                      <span className="d-none d-md-inline">Productos (opcional)</span>
                      <span className="d-md-none">Productos</span>
                    </NavDropdown.Item>
                  </NavDropdown>
                  {user?.role === 'admin' && (
                    <Nav.Link as={Link} to="/app/users" onClick={handleNavClick} className="text-dark">
                      <i className="bi bi-people me-1"></i>
                      <span className="d-none d-md-inline">Usuarios</span>
                      <span className="d-md-none">Users</span>
                    </Nav.Link>
                  )}
                  <Nav.Link as={Link} to="/app/my-affiliates" onClick={handleNavClick} className="text-dark">
                    <i className="bi bi-graph-up me-1"></i>
                    <span className="d-none d-md-inline">Mis Afiliados</span>
                    <span className="d-md-none">Afiliados</span>
                  </Nav.Link>
                  <NavDropdown title={<><i className="bi bi-shield-check me-1"></i><span className="d-none d-md-inline">LOPD</span><span className="d-md-none">LOPD</span></>} id="lopd-dropdown">
                    <NavDropdown.Item as={Link} to="/app/lopd" onClick={handleNavClick}>
                      <i className="bi bi-gear me-2"></i>
                      <span className="d-none d-md-inline">Configuración</span>
                      <span className="d-md-none">Config</span>
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/app/lopd/requests" onClick={handleNavClick}>
                      <i className="bi bi-clipboard-data me-2"></i>
                      <span className="d-none d-md-inline">Solicitudes</span>
                      <span className="d-md-none">Solicitudes</span>
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/app/lopd/audit" onClick={handleNavClick}>
                      <i className="bi bi-journal-text me-2"></i>
                      <span className="d-none d-md-inline">Auditoría</span>
                      <span className="d-md-none">Audit</span>
                    </NavDropdown.Item>
                  </NavDropdown>
                </>
              )}
            </Nav>

            <Nav>
              <NavDropdown 
                title={
                  <>
                    <i className="bi bi-person-circle me-1"></i>
                    <span className="d-none d-md-inline text-dark">{user?.name || user?.email}</span>
                    <span className="d-md-none text-dark">User</span>
                  </>
                } 
                align="end"
              >
                <NavDropdown.Item as={Link} to="/app/settings" onClick={handleNavClick}>
                  <i className="bi bi-gear me-2"></i>
                  <span className="d-none d-md-inline">Configuración</span>
                  <span className="d-md-none">Config</span>
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/app/change-password" onClick={handleNavClick}>
                  <i className="bi bi-key me-2"></i>
                  <span className="d-none d-md-inline">Cambiar Contraseña</span>
                  <span className="d-md-none">Password</span>
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/app/billing" onClick={handleNavClick}>
                  <i className="bi bi-credit-card me-2"></i>
                  <span className="d-none d-md-inline">Facturación</span>
                  <span className="d-md-none">Billing</span>
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={() => { handleLogout(); handleNavClick(); }}>
                  <i className="bi bi-box-arrow-right me-2"></i>
                  <span className="d-none d-md-inline">Cerrar Sesión</span>
                  <span className="d-md-none">Salir</span>
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="pt-5">
        <Outlet />
      </Container>

      <footer className="mt-5 py-3 bg-light text-center">
        <Container>
          <small className="text-muted">
            Facturando Zen © 2025
          </small>
        </Container>
      </footer>
    </>
  );
};

export default Layout;
