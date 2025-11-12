import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const Features = () => {
  const features = [
    {
      icon: 'bi-lightning-charge-fill',
      title: 'Facturación Ultra Rápida',
      description: 'Crea facturas en segundos. Escribe datos manualmente o usa clientes/productos guardados.',
      items: [
        'Formulario intuitivo y rápido',
        'Clientes y productos frecuentes',
        'Duplicar facturas anteriores',
        'Búsqueda instantánea'
      ],
      color: 'warning'
    },
    {
      icon: 'bi-calculator-fill',
      title: 'Cálculos Automáticos',
      description: 'Olvídate de la calculadora. Todo se calcula automáticamente en tiempo real.',
      items: [
        'IVA automático (21%, 10%, 4%)',
        'Descuentos por línea',
        'Retenciones IRPF',
        'Totales y bases imponibles'
      ],
      color: 'info'
    },
    {
      icon: 'bi-file-pdf-fill',
      title: 'PDF Profesional',
      description: 'Genera PDFs con diseño profesional listos para enviar a tus clientes.',
      items: [
        'Tu logo y datos personalizados',
        'Diseño profesional y limpio',
        'Descarga instantánea',
        'Compatible con email y WhatsApp'
      ],
      color: 'danger'
    },
    {
      icon: 'bi-shield-check-fill',
      title: 'Seguridad y Cumplimiento',
      description: 'Tus datos protegidos y facturas conformes a normativa española.',
      items: [
        'Validación automática NIF/CIF',
        'Numeración secuencial legal',
        'Backup automático diario',
        'Servidor seguro en Europa'
      ],
      color: 'success'
    },
    {
      icon: 'bi-patch-check-fill',
      title: 'Verifactu AEAT',
      description: 'Envío automático a Hacienda con firma digital (Plan PRO).',
      items: [
        'Firma digital automática',
        'Envío directo a AEAT',
        'Registro de envíos',
        'Certificado incluido'
      ],
      color: 'primary'
    },
    {
      icon: 'bi-phone-fill',
      title: '100% Responsive',
      description: 'Accede desde cualquier dispositivo, en cualquier momento, en cualquier lugar.',
      items: [
        'Diseño adaptable a móvil',
        'Tablet optimizado',
        'Desktop completo',
        'Sin apps, desde navegador'
      ],
      color: 'dark'
    },
    {
      icon: 'bi-graph-up-arrow',
      title: 'Dashboard y Estadísticas',
      description: 'Visualiza tu negocio de un vistazo con gráficos y métricas clave.',
      items: [
        'Facturación mensual/anual',
        'Clientes top',
        'Productos más vendidos',
        'Tendencias temporales'
      ],
      color: 'purple'
    },
    {
      icon: 'bi-search',
      title: 'Búsqueda Avanzada',
      description: 'Encuentra cualquier factura, cliente o producto al instante.',
      items: [
        'Filtros múltiples',
        'Búsqueda por rango de fechas',
        'Ordenamiento flexible',
        'Exportación de datos'
      ],
      color: 'secondary'
    },
    {
      icon: 'bi-people-fill',
      title: 'Gestión de Clientes',
      description: 'Base de datos de clientes con toda su información y facturas.',
      items: [
        'Ficha completa del cliente',
        'Historial de facturas',
        'Notas y observaciones',
        'Importación CSV'
      ],
      color: 'info'
    },
    {
      icon: 'bi-box-seam-fill',
      title: 'Catálogo de Productos',
      description: 'Organiza tu catálogo con precios, descripciones y códigos.',
      items: [
        'Productos ilimitados',
        'Precios con/sin IVA',
        'Códigos y referencias',
        'Descripciones personalizadas'
      ],
      color: 'warning'
    },
    {
      icon: 'bi-gear-fill',
      title: 'Personalización Total',
      description: 'Configura el sistema según tu negocio y preferencias.',
      items: [
        'Tus datos fiscales',
        'Logo personalizado',
        'Prefijo de numeración',
        'Formato de fecha'
      ],
      color: 'primary'
    },
    {
      icon: 'bi-cloud-check-fill',
      title: 'En la Nube',
      description: 'Sin instalaciones ni actualizaciones. Siempre disponible.',
      items: [
        'Acceso desde cualquier lugar',
        'Sin mantenimiento',
        'Actualizaciones automáticas',
        'Escalable y rápido'
      ],
      color: 'success'
    }
  ];

  return (
    <>
      <PublicHeader />
      
      {/* Hero Section */}
      <div className="features-hero-section" style={{ marginTop: '70px' }}>
        <Container className="py-5">
          <div className="text-center mb-5">
            <Badge bg="light" text="dark" className="px-3 py-2 mb-3">
              <i className="bi bi-star-fill text-warning me-1"></i>
              Características
            </Badge>
            <h1 className="display-4 fw-bold text-white mb-3">
              Todo lo que Necesitas para <span className="text-warning">Facturar Profesionalmente</span>
            </h1>
            <p className="lead text-white-50 mb-4" style={{ maxWidth: '700px', margin: '0 auto' }}>
              Un sistema completo de facturación diseñado para autónomos y pequeñas empresas. 
              Simple de usar, potente en funcionalidades.
            </p>
          </div>
        </Container>
      </div>

      <div style={{ paddingBottom: '60px' }}>
        <Container>

          {/* Features Grid */}
          <Row className="g-4 mb-5">
            {features.map((feature, index) => (
              <Col md={6} lg={4} key={index}>
                <Card className="h-100 border-0 shadow-sm hover-card">
                  <Card.Body className="p-4">
                    <div className={`text-${feature.color} mb-3`} style={{ fontSize: '2.5rem' }}>
                      <i className={`bi ${feature.icon}`}></i>
                    </div>
                    <h5 className="fw-bold mb-2">{feature.title}</h5>
                    <p className="text-muted mb-3">{feature.description}</p>
                    <ul className="list-unstyled mb-0">
                      {feature.items.map((item, i) => (
                        <li key={i} className="mb-2">
                          <i className={`bi bi-check-circle-fill text-${feature.color} me-2`}></i>
                          <span className="text-muted">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* CTA Section */}
          <div className="text-center mt-5 pt-5">
            <div className="bg-gradient rounded-4 p-5 text-white">
              <h2 className="display-6 fw-bold mb-3">¿Listo para Empezar?</h2>
              <p className="lead mb-4">
                Prueba gratis durante 30 días. Sin tarjeta de crédito.
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
                  Probar Gratis
                </Button>
                <Button 
                  as={Link} 
                  to="/pricing" 
                  variant="outline-light" 
                  size="lg"
                  className="px-5"
                >
                  Ver Precios
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <PublicFooter />
    </>
  );
};

export default Features;

