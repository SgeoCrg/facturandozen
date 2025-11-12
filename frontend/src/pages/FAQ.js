import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Accordion, Card, Button, Badge, Form, InputGroup } from 'react-bootstrap';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const faqs = [
    {
      category: 'General',
      questions: [
        {
          q: '¿Qué es FacturaPro?',
          a: 'FacturaPro es un sistema de facturación en la nube diseñado para autónomos y pequeñas empresas. Te permite crear facturas profesionales en segundos, con numeración automática, cálculo de IVA y generación de PDF.'
        },
        {
          q: '¿Necesito instalar algo?',
          a: 'No. FacturaPro funciona 100% en la nube. Solo necesitas un navegador web y conexión a internet. Accede desde cualquier dispositivo: ordenador, tablet o móvil.'
        },
        {
          q: '¿Mis datos están seguros?',
          a: 'Sí. Usamos encriptación SSL, backups automáticos diarios y servidores seguros en Europa. Cumplimos con RGPD y normativa española de protección de datos.'
        },
        {
          q: '¿Puedo usar FacturaPro desde el móvil?',
          a: 'Sí. FacturaPro tiene diseño responsive y funciona perfectamente en móviles y tablets. No necesitas descargar ninguna app, funciona desde el navegador.'
        }
      ]
    },
    {
      category: 'Precios y Planes',
      questions: [
        {
          q: '¿Cuánto cuesta FacturaPro?',
          a: 'Ofrecemos dos planes: BASIC a 19 €/mes y PRO a 39 €/mes. Puedes probar con 3 facturas gratis sin tarjeta de crédito. Sin permanencia, cancela cuando quieras.'
        },
        {
          q: '¿La prueba gratuita es realmente gratis?',
          a: 'Sí, 100% gratis. Puedes crear 3 facturas sin tarjeta de crédito. Después necesitas plan de pago. Si no te convence, simplemente no contratas.'
        },
        {
          q: '¿Qué diferencia hay entre BASIC y PRO?',
          a: 'BASIC incluye facturación completa con PDF y todas las funciones básicas. PRO añade Verifactu para envío automático a AEAT con firma digital, ideal si necesitas cumplir con normativa especial.'
        },
        {
          q: '¿Puedo cambiar de plan?',
          a: 'Sí, puedes cambiar de BASIC a PRO (o viceversa) en cualquier momento desde tu panel de configuración. El cambio es inmediato y se ajusta el precio proporcionalmente.'
        },
        {
          q: '¿Hay límite de facturas?',
          a: 'No. Puedes crear facturas ilimitadas en cualquier plan. Tampoco hay límite de clientes o productos.'
        }
      ]
    },
    {
      category: 'Facturación',
      questions: [
        {
          q: '¿Cómo creo una factura?',
          a: 'Es muy simple: 1) Añade datos del cliente (o selecciona uno guardado), 2) Añade líneas de productos/servicios, 3) El sistema calcula automáticamente IVA y totales, 4) Genera el PDF. Todo en menos de 1 minuto.'
        },
        {
          q: '¿Puedo personalizar las facturas?',
          a: 'Sí. Puedes añadir tu logo, tus datos fiscales, pie de página personalizado y elegir el formato de numeración. El diseño del PDF es profesional y limpio.'
        },
        {
          q: '¿La numeración es automática?',
          a: 'Sí, completamente. La numeración es secuencial y automática, cumpliendo con normativa española. Puedes elegir el prefijo (ej: 2025-, FAC-, etc) y el número inicial.'
        },
        {
          q: '¿Puedo crear facturas con retención IRPF?',
          a: 'Sí. Puedes añadir retención IRPF (normalmente 15% para profesionales). El sistema calcula automáticamente la base, retención y total a cobrar.'
        },
        {
          q: '¿Qué tipos de IVA puedo usar?',
          a: 'Puedes usar los tipos oficiales españoles: 21% (general), 10% (reducido), 4% (superreducido) y 0% (exento). Cada línea puede tener su propio tipo de IVA.'
        }
      ]
    },
    {
      category: 'Verifactu',
      questions: [
        {
          q: '¿Qué es Verifactu?',
          a: 'Verifactu es el sistema de la AEAT para registrar facturas con firma digital. Es obligatorio para ciertos sectores. El plan PRO incluye integración automática con Verifactu.'
        },
        {
          q: '¿Necesito Verifactu?',
          a: 'Depende de tu actividad. Si eres autónomo estándar, probablemente no. Si trabajas en hostelería, retail o sectores específicos, puede ser obligatorio. Consulta con tu asesor.'
        },
        {
          q: '¿Cómo funciona Verifactu en FacturaPro?',
          a: 'Con el plan PRO, al crear una factura se firma digitalmente y envía automáticamente a AEAT. Recibes confirmación del registro. Todo transparente y sin pasos extra.'
        },
        {
          q: '¿El certificado está incluido?',
          a: 'Sí. El plan PRO incluye el certificado digital necesario para Verifactu. No necesitas gestionar certificados por tu cuenta.'
        }
      ]
    },
    {
      category: 'Soporte y Ayuda',
      questions: [
        {
          q: '¿Ofrecen soporte técnico?',
          a: 'Sí. Puedes contactarnos por email en info@facturandozen.com. Respondemos normalmente en menos de 24 horas (días laborables).'
        },
        {
          q: '¿Hay documentación o tutoriales?',
          a: 'Sí. Tenemos guías paso a paso en la sección de ayuda dentro de la aplicación. También vídeos tutoriales para las funciones principales.'
        },
        {
          q: '¿Puedo importar datos de otro sistema?',
          a: 'Sí. Puedes importar clientes y productos desde CSV. Si vienes de otro sistema de facturación, contacta con soporte y te ayudamos con la migración.'
        },
        {
          q: '¿Qué pasa si cancelo mi cuenta?',
          a: 'Puedes cancelar en cualquier momento sin penalización. Antes de cerrar tu cuenta, te permitimos descargar todas tus facturas y datos en PDF/CSV.'
        }
      ]
    }
  ];

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(faq => 
      faq.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <>
      <PublicHeader />
      
      {/* Hero Section */}
      <div className="faq-hero-section" style={{ marginTop: '70px' }}>
        <Container className="py-5">
          <div className="text-center mb-5">
            <Badge bg="light" text="dark" className="px-3 py-2 mb-3">
              <i className="bi bi-question-circle-fill text-primary me-1"></i>
              Preguntas Frecuentes
            </Badge>
            <h1 className="display-4 fw-bold text-white mb-3">
              ¿Tienes <span className="text-warning">Dudas?</span>
            </h1>
            <p className="lead text-white-50 mb-4" style={{ maxWidth: '700px', margin: '0 auto' }}>
              Aquí encontrarás respuestas a las preguntas más comunes sobre FacturaPro
            </p>
          </div>
        </Container>
      </div>

      <div style={{ paddingBottom: '60px' }}>
        <Container>

          {/* Search */}
          <Row className="mb-5">
            <Col lg={8} className="mx-auto">
              <InputGroup size="lg">
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar en preguntas frecuentes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
          </Row>

          {/* FAQs */}
          <Row>
            <Col lg={10} className="mx-auto">
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }}></i>
                  <p className="text-muted mt-3">No se encontraron resultados para "{searchTerm}"</p>
                </div>
              ) : (
                filteredFaqs.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="mb-5">
                    <h3 className="mb-4">
                      <i className="bi bi-folder-fill text-primary me-2"></i>
                      {category.category}
                    </h3>
                    <Accordion defaultActiveKey="0">
                      {category.questions.map((faq, index) => (
                        <Accordion.Item 
                          eventKey={index.toString()} 
                          key={index}
                          className="mb-3 border-0 shadow-sm"
                        >
                          <Accordion.Header>
                            <strong>{faq.q}</strong>
                          </Accordion.Header>
                          <Accordion.Body className="bg-light">
                            {faq.a}
                          </Accordion.Body>
                        </Accordion.Item>
                      ))}
                    </Accordion>
                  </div>
                ))
              )}
            </Col>
          </Row>

          {/* CTA */}
          <div className="text-center mt-5 pt-5">
            <Card className="border-0 shadow-lg bg-gradient text-white">
              <Card.Body className="p-5">
                <h2 className="display-6 fw-bold mb-3">¿No Encuentras lo que Buscas?</h2>
                <p className="lead mb-4">
                  Contacta con nosotros y te ayudaremos personalmente
                </p>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <Button 
                    as={Link} 
                    to="/contact" 
                    variant="light" 
                    size="lg"
                    className="px-5"
                  >
                    <i className="bi bi-chat-dots-fill me-2"></i>
                    Contactar
                  </Button>
                  <Button 
                    as={Link} 
                    to="/register" 
                    variant="outline-light" 
                    size="lg"
                    className="px-5"
                  >
                    <i className="bi bi-rocket-takeoff me-2"></i>
                    Probar Gratis
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Container>
      </div>

      <PublicFooter />
    </>
  );
};

export default FAQ;

