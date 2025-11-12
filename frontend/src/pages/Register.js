import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    companyName: '',
    companyNif: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Container>
        <Row className="justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
          <Col md={6} lg={5}>
            <Card className="shadow-lg border-0 login-card">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <div className="login-logo mb-3">
                    <i className="bi bi-receipt"></i>
                  </div>
                  <h2 className="gradient-text mb-2">Crear Cuenta</h2>
                  <p className="text-muted">Desde 9€/mes · Sin permanencia</p>
                </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <h5 className="mb-3">Datos de la Empresa</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>Nombre Empresa *</Form.Label>
                  <Form.Control
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>NIF/CIF *</Form.Label>
                  <Form.Control
                    name="companyNif"
                    value={formData.companyNif}
                    onChange={handleChange}
                    placeholder="B12345678"
                    required
                  />
                </Form.Group>

                <hr className="my-4" />

                <h5 className="mb-3">Usuario Administrador</h5>

                <Form.Group className="mb-3">
                  <Form.Label>Nombre</Form.Label>
                  <Form.Control
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Contraseña *</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={6}
                    required
                  />
                  <Form.Text className="text-muted">
                    Mínimo 6 caracteres. Plan STARTER desde 9€/mes.
                  </Form.Text>
                </Form.Group>

                <Alert variant="info" className="mb-4">
                  <small>
                    <strong>Sin permanencia:</strong> Cancela cuando quieras. 
                    Plan STARTER desde 9€/mes.
                  </small>
                </Alert>

                <Form.Group className="mb-4" style={{display: 'none'}}>
                  <Form.Control value="" />
                </Form.Group>

                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? 'Creando...' : 'Crear Cuenta'}
                </Button>
              </Form>

              <div className="text-center">
                <small className="text-muted">
                  ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
                  {' · '}
                  <Link to="/">Volver a inicio</Link>
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </div>
  );
};

export default Register;
