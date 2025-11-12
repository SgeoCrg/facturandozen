import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/api';

const AffiliateManagement = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [stats, setStats] = useState(null);
  const [pendingCommissions, setPendingCommissions] = useState([]);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    commissionRate: 20
  });

  useEffect(() => {
    loadAffiliates();
    loadStats();
    loadPendingCommissions();
  }, []);

  const loadAffiliates = async () => {
    try {
      const response = await api.get('/affiliates');
      if (response.data.success) {
        setAffiliates(response.data.affiliates || []);
      }
    } catch (error) {
      toast.error('Error cargando afiliados');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/affiliates/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadPendingCommissions = async () => {
    try {
      const response = await api.get('/affiliates/pending-commissions');
      if (response.data.success) {
        setPendingCommissions(response.data.commissions || []);
      }
    } catch (error) {
      console.error('Error loading pending commissions:', error);
    }
  };

  const handleCreateAffiliate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/affiliates', formData);
      if (response.data.success) {
        toast.success('Afiliado creado correctamente');
        setShowCreateModal(false);
        setFormData({ name: '', email: '', phone: '', commissionRate: 20 });
        loadAffiliates();
        loadStats();
      } else {
        toast.error(response.data.message || 'Error creando afiliado');
      }
    } catch (error) {
      toast.error('Error creando afiliado');
    }
  };

  const handlePayCommission = async (commissionId) => {
    const paymentMethod = window.prompt('Método de pago (bank_transfer, paypal, stripe):');
    const paymentReference = window.prompt('Referencia de pago:');
    
    if (!paymentMethod) return;

    try {
      const response = await api.post(`/affiliates/commissions/${commissionId}/pay`, {
        paymentMethod,
        paymentReference
      });
      
      if (response.data.success) {
        toast.success('Comisión pagada correctamente');
        loadPendingCommissions();
        loadStats();
      } else {
        toast.error(response.data.message || 'Error pagando comisión');
      }
    } catch (error) {
      toast.error('Error pagando comisión');
    }
  };

  const generateAffiliateLink = async (code) => {
    try {
      const response = await api.get(`/affiliates/${code}/link`);
      if (response.data.success) {
        navigator.clipboard.writeText(response.data.link);
        toast.success('Enlace copiado al portapapeles');
      }
    } catch (error) {
      toast.error('Error generando enlace');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: { bg: 'success', text: 'Activo' },
      inactive: { bg: 'secondary', text: 'Inactivo' },
      pending: { bg: 'warning', text: 'Pendiente' }
    };
    const variant = variants[status] || { bg: 'secondary', text: status };
    return <Badge bg={variant.bg}>{variant.text}</Badge>;
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="dashboard-header">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h1 className="mb-2">
                  <span className="gradient-text">Sistema de Afiliados</span>
                </h1>
                <p className="text-muted mb-0">
                  <i className="bi bi-diagram-3 me-2"></i>
                  Gestiona afiliados y comisiones
                </p>
              </div>
              <Button 
                variant="primary" 
                onClick={() => setShowCreateModal(true)}
                className="d-flex align-items-center"
              >
                <i className="bi bi-plus-circle me-2"></i>
                Crear Afiliado
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Estadísticas */}
      {stats && (
        <Row className="mb-4 g-3">
          <Col md={3}>
            <div className="stat-card slide-in-right" style={{ animationDelay: '0.1s' }}>
              <div className="icon primary">
                <i className="bi bi-people"></i>
              </div>
              <div className="value">{stats.totalAffiliates || 0}</div>
              <div className="label">Total Afiliados</div>
            </div>
          </Col>
          <Col md={3}>
            <div className="stat-card slide-in-right" style={{ animationDelay: '0.2s' }}>
              <div className="icon success">
                <i className="bi bi-person-plus"></i>
              </div>
              <div className="value">{stats.totalReferrals || 0}</div>
              <div className="label">Referidos</div>
            </div>
          </Col>
          <Col md={3}>
            <div className="stat-card slide-in-right" style={{ animationDelay: '0.3s' }}>
              <div className="icon warning">
                <i className="bi bi-check-circle"></i>
              </div>
              <div className="value">{stats.totalConversions || 0}</div>
              <div className="label">Conversiones</div>
            </div>
          </Col>
          <Col md={3}>
            <div className="stat-card slide-in-right" style={{ animationDelay: '0.4s' }}>
              <div className="icon danger">
                <i className="bi bi-clock-history"></i>
              </div>
              <div className="value">€{parseFloat(stats.pendingCommissions || 0).toFixed(2)}</div>
              <div className="label">Comisiones Pendientes</div>
            </div>
          </Col>
        </Row>
      )}

      {/* Lista de afiliados */}
      <Row className="mb-4">
        <Col>
          <Card className="scale-in" style={{ animationDelay: '0.5s' }}>
            <Card.Header>
              <h5 className="mb-0 text-white">
                <i className="bi bi-list-ul me-2"></i>
                Afiliados
              </h5>
            </Card.Header>
            <Card.Body>
              {affiliates.length === 0 ? (
                <Alert variant="info" className="text-center">
                  <div className="mb-3">
                    <i className="bi bi-people" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                  </div>
                  <Alert.Heading>No hay afiliados</Alert.Heading>
                  <p className="mb-3">Crea tu primer afiliado para empezar a generar referidos y comisiones.</p>
                  <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    <i className="bi bi-plus-circle me-2"></i>
                    Crear Primer Afiliado
                  </Button>
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Comisión</th>
                        <th>Referidos</th>
                        <th>Ganancias</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {affiliates.map((affiliate, idx) => (
                        <tr key={affiliate.id} className="fade-in" style={{ animationDelay: `${0.6 + idx * 0.1}s` }}>
                          <td>
                            <code className="bg-light px-2 py-1 rounded">{affiliate.code}</code>
                          </td>
                          <td><strong>{affiliate.name}</strong></td>
                          <td>{affiliate.email}</td>
                          <td>
                            <Badge bg="info">{affiliate.commissionRate}%</Badge>
                          </td>
                          <td>
                            <span className="fw-semibold">{affiliate.referralCount || 0}</span>
                          </td>
                          <td>
                            <span className="fw-bold text-success">€{parseFloat(affiliate.totalEarnings || 0).toFixed(2)}</span>
                          </td>
                          <td>{getStatusBadge(affiliate.status)}</td>
                          <td>
                            <Button 
                              size="sm" 
                              variant="outline-primary" 
                              onClick={() => generateAffiliateLink(affiliate.code)}
                              className="me-2"
                              title="Copiar enlace de afiliado"
                            >
                              <i className="bi bi-link-45deg"></i>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline-info"
                              onClick={() => setSelectedAffiliate(affiliate)}
                              title="Ver detalles"
                            >
                              <i className="bi bi-eye"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Comisiones pendientes */}
      {pendingCommissions.length > 0 && (
        <Row>
          <Col>
            <Card className="scale-in" style={{ animationDelay: '0.7s' }}>
              <Card.Header>
                <h5 className="mb-0 text-white">
                  <i className="bi bi-clock-history me-2"></i>
                  Comisiones Pendientes
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Afiliado</th>
                        <th>Cliente</th>
                        <th>Monto</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingCommissions.map((commission, idx) => (
                        <tr key={commission.id} className="fade-in" style={{ animationDelay: `${0.8 + idx * 0.1}s` }}>
                          <td>
                            <strong>{commission.affiliate?.name}</strong>
                            <br />
                            <code className="text-muted small">{commission.affiliate?.code}</code>
                          </td>
                          <td>{commission.referral?.tenantName || 'N/A'}</td>
                          <td>
                            <span className="fw-bold text-success">€{parseFloat(commission.amount || 0).toFixed(2)}</span>
                          </td>
                          <td>{new Date(commission.createdAt).toLocaleDateString()}</td>
                          <td>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handlePayCommission(commission.id)}
                              title="Marcar como pagada"
                            >
                              <i className="bi bi-check-circle me-1"></i>
                              Pagar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Modal crear afiliado */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton className="border-0">
          <Modal.Title>
            <i className="bi bi-person-plus me-2"></i>
            Crear Nuevo Afiliado
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateAffiliate}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <i className="bi bi-person me-2"></i>
                    Nombre
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nombre completo del afiliado"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <i className="bi bi-envelope me-2"></i>
                    Email
                  </Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@ejemplo.com"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <i className="bi bi-telephone me-2"></i>
                    Teléfono
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Opcional"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <i className="bi bi-percent me-2"></i>
                    Comisión (%)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({...formData, commissionRate: parseFloat(e.target.value)})}
                    min="0"
                    max="100"
                    step="0.01"
                    required
                  />
                  <Form.Text className="text-muted">
                    Porcentaje de comisión que recibirá este afiliado
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              <i className="bi bi-check-circle me-2"></i>
              Crear Afiliado
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AffiliateManagement;
