import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Button, Alert, ProgressBar, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const WIZARD_STORAGE_KEY = 'customerWizardDraft_v1';

const stepsConfig = [
  { key: 'identificacion', title: 'Identificación', fields: ['name', 'nif'] },
  { key: 'contacto', title: 'Contacto', fields: ['email', 'phone'] },
  { key: 'direccion', title: 'Dirección', fields: ['address', 'city', 'postalCode'] }
];

const initialFormState = {
  name: '',
  nif: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postalCode: ''
};

const CustomerWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const currentStep = useMemo(() => stepsConfig[stepIndex], [stepIndex]);
  const progress = useMemo(() => Math.round(((stepIndex + 1) / stepsConfig.length) * 100), [stepIndex]);

  // Bloquear acceso a superadmin
  useEffect(() => {
    if (user?.role === 'superadmin') {
      navigate('/app/superadmin');
      toast.info('Los superadministradores no pueden crear clientes. Crea empresas (tenants) y que ellas creen sus propios clientes.');
    }
  }, [user, navigate]);

  // Cargar borrador
  useEffect(() => {
    try {
      const draftRaw = localStorage.getItem(WIZARD_STORAGE_KEY);
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        if (draft && typeof draft === 'object') {
          setFormData({ ...initialFormState, ...draft });
        }
      }
    } catch (_) {
      // ignorar errores de lectura
    }
  }, []);


  // Guardado automático del borrador
  useEffect(() => {
    try {
      localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(formData));
    } catch (_) {
      // ignorar errores de escritura
    }
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep = () => {
    // Validación mínima en cliente; el backend hará la validación real (NIF, etc.)
    if (currentStep.key === 'identificacion') {
      if (!formData.name?.trim()) return 'El nombre es obligatorio';
      if (!formData.nif?.trim()) return 'El NIF/CIF es obligatorio';
    }
    if (currentStep.key === 'direccion') {
      if (formData.postalCode && !/^\d{4,6}$/.test(formData.postalCode)) return 'Código postal inválido';
    }
    return '';
  };

  const goNext = () => {
    const stepError = validateStep();
    if (stepError) {
      setError(stepError);
      return;
    }
    setError('');
    if (stepIndex < stepsConfig.length - 1) {
      setStepIndex((i) => i + 1);
    }
  };

  const goPrev = () => {
    setError('');
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const stepError = validateStep();
    if (stepError) {
      setError(stepError);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/customers', formData);
      toast.success('Cliente creado correctamente');
      try { localStorage.removeItem(WIZARD_STORAGE_KEY); } catch (_) {}
      navigate('/app/customers');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Error creando cliente';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const discardDraft = () => {
    setFormData(initialFormState);
    try { localStorage.removeItem(WIZARD_STORAGE_KEY); } catch (_) {}
    toast.info('Borrador descartado');
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-2"><span className="gradient-text">Nuevo Cliente</span></h1>
          <p className="text-muted mb-0"><i className="bi bi-person-plus me-2"></i>Wizard de creación</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/app/customers" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>Volver
          </Link>
          <Button variant="outline-danger" onClick={discardDraft}>
            <i className="bi bi-trash me-2"></i>Descartar borrador
          </Button>
        </div>
      </div>

      <Card className="mb-3">
        <Card.Body>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <strong>Paso {stepIndex + 1} de {stepsConfig.length}: {currentStep.title}</strong>
            <span className="text-muted small">{progress}%</span>
          </div>
          <ProgressBar now={progress} animated variant="primary" />
        </Card.Body>
      </Card>

      <Card className="fade-in">
        <Card.Body>
          {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

          {currentStep.key === 'identificacion' && (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre *</Form.Label>
                <Form.Control name="name" value={formData.name} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>NIF/CIF *</Form.Label>
                <Form.Control name="nif" value={formData.nif} onChange={handleChange} required />
              </Form.Group>
            </Form>
          )}

          {currentStep.key === 'contacto' && (
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Teléfono</Form.Label>
                    <Form.Control name="phone" value={formData.phone} onChange={handleChange} />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          )}

          {currentStep.key === 'direccion' && (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Dirección</Form.Label>
                <Form.Control as="textarea" rows={2} name="address" value={formData.address} onChange={handleChange} />
              </Form.Group>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ciudad</Form.Label>
                    <Form.Control name="city" value={formData.city} onChange={handleChange} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Código Postal</Form.Label>
                    <Form.Control name="postalCode" value={formData.postalCode} onChange={handleChange} />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          )}

          <div className="d-flex justify-content-between mt-2">
            <Button variant="outline-secondary" onClick={goPrev} disabled={stepIndex === 0}>
              <i className="bi bi-arrow-left me-2"></i>Anterior
            </Button>
            {stepIndex < stepsConfig.length - 1 ? (
              <Button variant="primary" onClick={goNext}>
                Siguiente<i className="bi bi-arrow-right ms-2"></i>
              </Button>
            ) : (
              <Button variant="success" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creando...' : 'Crear Cliente'}
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
    </>
  );
};

export default CustomerWizard;





