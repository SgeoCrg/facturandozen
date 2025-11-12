import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <Container>
        <Row className="justify-content-center text-center">
          <Col md={8} lg={6}>
            <div className="mb-4">
              <h1 className="display-1 text-primary fw-bold">404</h1>
              <h2 className="h3 mb-3">Página no encontrada</h2>
              <p className="text-muted mb-4">
                La página que buscas no existe o ha sido movida.
              </p>
            </div>
            
            <div className="d-grid gap-2 d-md-flex justify-content-md-center">
              <Button 
                variant="primary" 
                onClick={() => navigate('/')}
                className="me-md-2"
              >
                <i className="bi bi-house me-2"></i>
                Ir al inicio
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate(-1)}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Volver atrás
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default NotFound;
