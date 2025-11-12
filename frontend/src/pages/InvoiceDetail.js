import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { subscription } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [verifactu, setVerifactu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [sendingVerifactu, setSendingVerifactu] = useState(false);
  const [verifactuMessage, setVerifactuMessage] = useState(null);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    try {
      const response = await api.get(`/invoices/${id}`);
      setInvoice(response.data.invoice);
      setVerifactu(response.data.invoice.verifactu || null);
    } catch (error) {
      console.error('Error cargando factura:', error);
      alert('Error cargando factura');
      navigate('/app/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerifactu = async () => {
    if (!window.confirm('¿Enviar esta factura a Verifactu/AEAT?')) return;

    setSendingVerifactu(true);
    setVerifactuMessage(null);

    try {
      const response = await api.post(`/verifactu/invoices/${id}/send`);
      setVerifactuMessage({
        success: response.data.success,
        message: response.data.message,
        csv: response.data.csv
      });
      
      // Recargar factura
      setTimeout(() => loadInvoice(), 1000);
    } catch (error) {
      setVerifactuMessage({
        success: false,
        message: error.response?.data?.error || 'Error enviando'
      });
    } finally {
      setSendingVerifactu(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/invoices/${id}/pdf`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `factura-${invoice.fullNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error descargando PDF:', error);
      alert('Error generando PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!invoice) {
    return <div className="alert alert-danger">Factura no encontrada</div>;
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { variant: 'secondary', text: 'Borrador' },
      issued: { variant: 'success', text: 'Emitida' },
      paid: { variant: 'primary', text: 'Pagada' },
      cancelled: { variant: 'danger', text: 'Anulada' }
    };
    const config = statusMap[status] || statusMap.draft;
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const formatPrice = (price) => `${parseFloat(price).toFixed(2)} €`;
  const formatDate = (date) => new Date(date).toLocaleDateString('es-ES');

  const isPro = subscription?.plan === 'pro';

  return (
    <>
      {verifactuMessage && (
        <Alert 
          variant={verifactuMessage.success ? 'success' : 'danger'} 
          dismissible 
          onClose={() => setVerifactuMessage(null)}
        >
          <strong>{verifactuMessage.message}</strong>
          {verifactuMessage.csv && (
            <div className="mt-2"><small>CSV: {verifactuMessage.csv}</small></div>
          )}
        </Alert>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button variant="outline-secondary" size="sm" className="mb-2" onClick={() => navigate('/app/invoices')}>
            <i className="bi bi-arrow-left me-1"></i>Volver
          </Button>
          <h1 className="mb-0">Factura {invoice.fullNumber}</h1>
        </div>
        <div>
          {isPro && !verifactu?.status && (
            <Button
              variant="success"
              onClick={handleSendVerifactu}
              disabled={sendingVerifactu}
              className="me-2"
            >
              {sendingVerifactu ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <i className="bi bi-send me-2"></i>
                  Enviar Verifactu
                </>
              )}
            </Button>
          )}
          <Button variant="outline-primary" onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Generando...
              </>
            ) : (
              <>
                <i className="bi bi-download me-2"></i>
                Descargar PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="row">
        <div className="col-md-12">
          <Card className="mb-4">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Detalles</h5>
                {getStatusBadge(invoice.status)}
              </div>
            </Card.Header>
            <Card.Body>
              <div className="row mb-3">
                <div className="col-md-6">
                  <h6 className="text-muted">Cliente</h6>
                  <p className="mb-1"><strong>{invoice.customer?.name || invoice.customerName}</strong></p>
                  {(invoice.customer?.nif || invoice.customerNif) && (
                    <p className="mb-1">NIF: {invoice.customer?.nif || invoice.customerNif}</p>
                  )}
                  {invoice.customer?.email && <p className="mb-1">Email: {invoice.customer.email}</p>}
                  {(invoice.customer?.address || invoice.customerAddress) && (
                    <p className="mb-0">{invoice.customer?.address || invoice.customerAddress}</p>
                  )}
                  {invoice.customer?.city && (
                    <p className="mb-0">{invoice.customer.city} {invoice.customer.postalCode}</p>
                  )}
                </div>
                <div className="col-md-6 text-end">
                  <h6 className="text-muted">Información</h6>
                  <p className="mb-1">Fecha: <strong>{formatDate(invoice.date)}</strong></p>
                  <p className="mb-1">Serie: <strong>{invoice.series}</strong></p>
                  {invoice.notes && (
                    <div className="mt-3">
                      <h6 className="text-muted">Notas</h6>
                      <p className="small">{invoice.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <h6 className="mb-3">Líneas</h6>
              <Table bordered>
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th width="100" className="text-center">Cantidad</th>
                    <th width="120" className="text-end">Precio</th>
                    <th width="80" className="text-center">IVA</th>
                    <th width="120" className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines.map((line, index) => (
                    <tr key={index}>
                      <td>{line.description}</td>
                      <td className="text-center">{parseFloat(line.quantity)}</td>
                      <td className="text-end">{formatPrice(line.price)}</td>
                      <td className="text-center">{line.ivaRate}%</td>
                      <td className="text-end"><strong>{formatPrice(line.total)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className="row">
                <div className="col-md-8"></div>
                <div className="col-md-4">
                  <Table borderless size="sm">
                    <tbody>
                      <tr>
                        <td><strong>Subtotal:</strong></td>
                        <td className="text-end">{formatPrice(invoice.subtotal)}</td>
                      </tr>
                      <tr>
                        <td><strong>IVA:</strong></td>
                        <td className="text-end">{formatPrice(invoice.totalIva)}</td>
                      </tr>
                      <tr className="border-top">
                        <td><h5 className="mb-0">TOTAL:</h5></td>
                        <td className="text-end"><h5 className="mb-0">{formatPrice(invoice.total)}</h5></td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        {isPro && (
          <div className="col-md-4">
            <Card>
              <Card.Header className="bg-white">
                <h5 className="mb-0">
                  <i className="bi bi-shield-check me-2"></i>
                  Verifactu
                </h5>
              </Card.Header>
              <Card.Body>
                {verifactu?.status === 'accepted' ? (
                  <>
                    <Badge bg="success" className="mb-3 w-100 py-2">
                      <i className="bi bi-check-circle me-1"></i>
                      Aceptada por AEAT
                    </Badge>
                    
                    {verifactu.aeatCsv && (
                      <div className="mb-3">
                        <small className="text-muted">CSV Verificación:</small>
                        <div className="bg-light p-2 rounded mt-1">
                          <code className="small">{verifactu.aeatCsv}</code>
                        </div>
                      </div>
                    )}

                    {verifactu.hash && (
                      <div className="mb-3">
                        <small className="text-muted">Hash Factura:</small>
                        <div className="bg-light p-2 rounded mt-1">
                          <small style={{ wordBreak: 'break-all' }}>{verifactu.hash}</small>
                        </div>
                      </div>
                    )}

                    {verifactu.qrCode && (
                      <div className="text-center mt-3">
                        <p className="small text-muted">QR Verificación:</p>
                        <img src={verifactu.qrCode} alt="QR Verifactu" style={{ maxWidth: '200px' }} />
                      </div>
                    )}
                  </>
                ) : verifactu?.status === 'rejected' ? (
                  <>
                    <Badge bg="danger" className="mb-3 w-100 py-2">
                      <i className="bi bi-x-circle me-1"></i>
                      Rechazada por AEAT
                    </Badge>
                    <p className="small">{verifactu.errorMessage}</p>
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={handleSendVerifactu}
                      disabled={sendingVerifactu}
                      className="w-100"
                    >
                      Reintentar
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge bg="warning" className="mb-3 w-100 py-2">
                      <i className="bi bi-clock me-1"></i>
                      Pendiente de Envío
                    </Badge>
                    <p className="small text-muted">
                      Esta factura aún no se ha enviado a Verifactu. Envíala para cumplir normativa.
                    </p>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={handleSendVerifactu}
                      disabled={sendingVerifactu}
                      className="w-100"
                    >
                      {sendingVerifactu ? 'Enviando...' : 'Enviar Ahora'}
                    </Button>
                  </>
                )}
              </Card.Body>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default InvoiceDetail;
