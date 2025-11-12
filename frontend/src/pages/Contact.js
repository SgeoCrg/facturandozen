import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implementar envío real de email
    console.log('Formulario enviado:', formData);
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <>
      <PublicHeader />
      
      {/* Hero Section */}
      <div className="contact-hero-section" style={{ marginTop: '70px' }}>
        <Container className="py-5">
          <div className="text-center mb-5">
            <Badge bg="light" text="dark" className="px-3 py-2 mb-3">
              <i className="bi bi-chat-dots-fill text-primary me-1"></i>
              Contacto
            </Badge>
            <h1 className="display-4 fw-bold text-white mb-3">
              <span className="text-warning">Contacta con Nosotros</span>
            </h1>
            <p className="lead text-white-50 mb-4" style={{ maxWidth: '700px', margin: '0 auto' }}>
              ¿Tienes alguna pregunta? Estamos aquí para ayudarte. 
              Escríbenos y te responderemos lo antes posible.
            </p>
          </div>
        </Container>
      </div>

      <div style={{ paddingBottom: '60px' }}>
        <Container>

          <Row className="g-4">
            {/* Contact Form */}
            <Col lg={8}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h4 className="mb-4">Envíanos un Mensaje</h4>
                  
                  {submitted && (
                    <Alert variant="success" className="mb-4">
                      <i className="bi bi-check-circle-fill me-2"></i>
                      ¡Mensaje enviado correctamente! Te responderemos pronto.
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nombre completo *</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Tu nombre"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email *</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="tu@email.com"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Asunto *</Form.Label>
                      <Form.Select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Selecciona un asunto...</option>
                        <option value="general">Consulta general</option>
                        <option value="pricing">Precios y planes</option>
                        <option value="technical">Soporte técnico</option>
                        <option value="billing">Facturación</option>
                        <option value="verifactu">Verifactu</option>
                        <option value="other">Otro</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Mensaje *</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={6}
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Escribe tu mensaje aquí..."
                        required
                      />
                    </Form.Group>

                    <Button type="submit" variant="primary" size="lg" className="w-100">
                      <i className="bi bi-send-fill me-2"></i>
                      Enviar Mensaje
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {/* Contact Info */}
            <Col lg={4}>
              <Card className="border-0 shadow-sm mb-3">
                <Card.Body className="p-4">
                  <h5 className="mb-4">
                    <i className="bi bi-info-circle-fill text-primary me-2"></i>
                    Información de Contacto
                  </h5>
                  
                  <div className="mb-4">
                    <div className="d-flex align-items-start mb-3">
                      <i className="bi bi-envelope-fill text-primary me-3" style={{ fontSize: '1.5rem' }}></i>
                      <div>
                        <h6 className="mb-1">Email</h6>
                        <a href="mailto:info@facturandozen.com" className="text-decoration-none">
                          info@facturandozen.com
                        </a>
                      </div>
                    </div>

                    <div className="d-flex align-items-start mb-3">
                      <i className="bi bi-clock-fill text-primary me-3" style={{ fontSize: '1.5rem' }}></i>
                      <div>
                        <h6 className="mb-1">Horario de Atención</h6>
                        <p className="mb-0 text-muted small">
                          Lunes a Viernes<br/>
                          9:00 - 18:00 (CET)
                        </p>
                      </div>
                    </div>

                    <div className="d-flex align-items-start">
                      <i className="bi bi-chat-dots-fill text-primary me-3" style={{ fontSize: '1.5rem' }}></i>
                      <div>
                        <h6 className="mb-1">Tiempo de Respuesta</h6>
                        <p className="mb-0 text-muted small">
                          Normalmente en menos de 24 horas
                        </p>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient text-white">
                <Card.Body className="p-4">
                  <h5 className="mb-3">
                    <i className="bi bi-question-circle-fill me-2"></i>
                    ¿Necesitas ayuda rápida?
                  </h5>
                  <p className="mb-3 small">
                    Revisa nuestra sección de preguntas frecuentes. 
                    Probablemente encuentres la respuesta.
                  </p>
                  <Button 
                    href="/faq" 
                    variant="light" 
                    className="w-100"
                  >
                    Ver FAQ
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      <PublicFooter />
    </>
  );
};

export default Contact;

