import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Badge, Tabs, Tab } from 'react-bootstrap';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { subscription } = useAuth();
  const [activeTab, setActiveTab] = useState('company');
  
  const [formData, setFormData] = useState({
    companyName: '',
    companyNif: '',
    companyAddress: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Verifactu
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificatePassword, setCertificatePassword] = useState('');
  const [certificateStatus, setCertificateStatus] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [settingsRes, certRes] = await Promise.all([
        api.get('/settings'),
        api.get('/verifactu/certificate/status')
      ]);
      
      const settings = settingsRes.data.settings;
      setFormData({
        companyName: settings.companyName || '',
        companyNif: settings.companyNif || '',
        companyAddress: settings.companyAddress || ''
      });
      
      setCertificateStatus(certRes.data);
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      await api.put('/settings', formData);
      setMessage('Configuración guardada correctamente');
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.error || 'Error guardando'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCertificate = async (e) => {
    e.preventDefault();
    
    if (!certificateFile || !certificatePassword) {
      setUploadMessage('Selecciona archivo y contraseña');
      return;
    }

    setUploading(true);
    setUploadMessage('');

    try {
      const formDataCert = new FormData();
      formDataCert.append('certificate', certificateFile);
      formDataCert.append('password', certificatePassword);

      await api.post('/verifactu/certificate', formDataCert, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadMessage('✅ Certificado subido correctamente');
      setCertificateFile(null);
      setCertificatePassword('');
      loadSettings();
    } catch (error) {
      setUploadMessage(`❌ Error: ${error.response?.data?.error || 'Error subiendo'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCertificate = async () => {
    if (!window.confirm('¿Eliminar certificado? No podrás enviar a Verifactu.')) return;

    try {
      await api.delete('/verifactu/certificate');
      setUploadMessage('Certificado eliminado');
      loadSettings();
    } catch (error) {
      setUploadMessage(`Error: ${error.response?.data?.error}`);
    }
  };

  const isPro = subscription?.plan === 'pro';

  return (
    <>
      <h1 className="mb-4">Configuración</h1>

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="company" title={<><i className="bi bi-building me-2"></i>Empresa</>}>
          <Card>
            <Card.Header className="bg-white">
              <h5 className="mb-0">Datos de la Empresa</h5>
            </Card.Header>
            <Card.Body>
          {message && (
            <Alert variant={message.includes('Error') ? 'danger' : 'success'}>
              {message}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre Empresa</Form.Label>
              <Form.Control
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>NIF/CIF</Form.Label>
              <Form.Control
                name="companyNif"
                value={formData.companyNif}
                onChange={handleChange}
                maxLength={9}
              />
              <Form.Text className="text-muted">
                Aparecerá en las facturas PDF
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Dirección</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleChange}
              />
            </Form.Group>

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </Form>
            </Card.Body>
          </Card>
        </Tab>

        <Tab 
          eventKey="verifactu" 
          title={
            <>
              <i className="bi bi-shield-check me-2"></i>
              Verifactu
              {isPro && <Badge bg="success" className="ms-2">PRO</Badge>}
            </>
          }
        >
          <Card>
            <Card.Body>
              {!isPro ? (
                <Alert variant="warning">
                  <h5>
                    <i className="bi bi-lock-fill me-2"></i>
                    Verifactu solo disponible en Plan PRO
                  </h5>
                  <p className="mb-0">
                    Actualiza a PRO (49€/mes) para enviar facturas automáticamente a la AEAT con firma digital.
                  </p>
                </Alert>
              ) : (
                <>
                  <h5 className="mb-3">
                    Certificado Digital Verifactu
                    {certificateStatus && certificateStatus.hasCertificate && (
                      <Badge bg="success" className="ms-2">Configurado</Badge>
                    )}
                  </h5>

                  {uploadMessage && (
                    <Alert variant={uploadMessage.includes('❌') ? 'danger' : 'success'}>
                      {uploadMessage}
                    </Alert>
                  )}

                  {certificateStatus?.hasCertificate && (
                    <div className="mb-4 p-3 bg-light rounded">
                      <h6>Certificado Actual</h6>
                      <p className="mb-1">
                        <strong>Expira:</strong> {new Date(certificateStatus.expiresAt).toLocaleDateString('es-ES')}
                      </p>
                      <p className="mb-1">
                        <strong>Días restantes:</strong> {certificateStatus.daysUntilExpiration}
                      </p>
                      
                      {certificateStatus.isExpired && (
                        <Alert variant="danger" className="mt-3 mb-0">
                          ⚠️ Certificado expirado. Actualízalo urgentemente.
                        </Alert>
                      )}

                      {certificateStatus.isExpiringSoon && !certificateStatus.isExpired && (
                        <Alert variant="warning" className="mt-3 mb-0">
                          ⚠️ Expira en menos de 30 días. Renuévalo pronto.
                        </Alert>
                      )}

                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="mt-3"
                        onClick={handleDeleteCertificate}
                      >
                        <i className="bi bi-trash me-2"></i>
                        Eliminar Certificado
                      </Button>
                    </div>
                  )}

                  <h6 className="mt-4 mb-3">
                    {certificateStatus?.hasCertificate ? 'Actualizar' : 'Subir'} Certificado
                  </h6>

                  <Form onSubmit={handleUploadCertificate}>
                    <Form.Group className="mb-3">
                      <Form.Label>Archivo Certificado (.p12 o .pfx)</Form.Label>
                      <Form.Control
                        type="file"
                        accept=".p12,.pfx"
                        onChange={(e) => setCertificateFile(e.target.files[0])}
                        required
                      />
                      <Form.Text className="text-muted">
                        Certificado FNMT u otro proveedor autorizado
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Contraseña del Certificado</Form.Label>
                      <Form.Control
                        type="password"
                        value={certificatePassword}
                        onChange={(e) => setCertificatePassword(e.target.value)}
                        required
                      />
                      <Form.Text className="text-muted">
                        Se almacena cifrada (AES-256)
                      </Form.Text>
                    </Form.Group>

                    <Button type="submit" variant="success" disabled={uploading}>
                      {uploading ? 'Subiendo...' : 'Subir Certificado'}
                    </Button>
                  </Form>

                  <hr className="my-4" />

                  <Alert variant="info">
                    <h6>
                      <i className="bi bi-info-circle me-2"></i>
                      Información Verifactu
                    </h6>
                    <ul className="mb-0 small">
                      <li>Certificado digital obligatorio para firmar facturas</li>
                      <li>Debe ser válido y emitido por FNMT u otro autorizado</li>
                      <li>Se almacena cifrado con AES-256-GCM</li>
                      <li>Todas las facturas se envían automáticamente a AEAT</li>
                      <li>Generación QR Verifactu automática</li>
                      <li>Cadena hash para trazabilidad</li>
                    </ul>
                  </Alert>
                </>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </>
  );
};

export default Settings;
