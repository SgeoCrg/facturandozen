import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Button, Badge, Form, InputGroup, Row, Col, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/api';
import Pagination from '../components/Pagination';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadInvoices();
  }, [search, statusFilter, dateFrom, dateTo, currentPage]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit: 50 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const response = await api.get('/invoices', { params });
      
      // Soporte retrocompatible
      if (response.data.invoices) {
        setInvoices(response.data.invoices);
        setPagination(response.data.pagination || null);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error cargando facturas:', error);
      toast.error('Error cargando facturas');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await api.get('/invoices/export/csv', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facturas_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('CSV exportado correctamente');
    } catch (error) {
      console.error('Error exportando CSV:', error);
      toast.error('Error exportando CSV');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-ES');

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-2">
            <span className="gradient-text">Facturas</span>
          </h1>
          <p className="text-muted mb-0">
            <i className="bi bi-file-earmark-text me-2"></i>
            {invoices.length} factura{invoices.length !== 1 && 's'}
          </p>
        </div>
        <div>
          <Button 
            variant="outline-success" 
            className="me-2"
            onClick={handleExportCSV}
            disabled={exporting || invoices.length === 0}
          >
            {exporting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Exportando...
              </>
            ) : (
              <>
                <i className="bi bi-file-earmark-spreadsheet me-2"></i>
                Export CSV
              </>
            )}
          </Button>
          <Button as={Link} to="/app/invoices/new" variant="primary">
            <i className="bi bi-plus-circle me-2"></i>Nueva Factura
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-4 scale-in">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Label className="small fw-bold">Buscar</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Número de factura o cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Label className="small fw-bold">Estado</Form.Label>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="draft">Borrador</option>
                <option value="issued">Emitida</option>
                <option value="paid">Pagada</option>
                <option value="cancelled">Anulada</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label className="small fw-bold">Desde</Form.Label>
              <Form.Control
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </Col>
            <Col md={2}>
              <Form.Label className="small fw-bold">Hasta</Form.Label>
              <Form.Control
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Button 
                variant="outline-secondary" 
                className="w-100"
                onClick={clearFilters}
                disabled={!search && !statusFilter && !dateFrom && !dateTo}
              >
                <i className="bi bi-x-circle me-2"></i>
                Limpiar
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabla */}
      <Card className="fade-in">
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-3">Cargando facturas...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox" style={{ fontSize: '4rem', color: '#dee2e6' }}></i>
              <p className="text-muted mt-3 mb-3">
                {search || statusFilter || dateFrom || dateTo 
                  ? 'No se encontraron facturas con los filtros aplicados' 
                  : 'No hay facturas todavía'}
              </p>
              {!(search || statusFilter || dateFrom || dateTo) && (
                <Button as={Link} to="/app/invoices/new" variant="primary">
                  <i className="bi bi-plus-circle me-2"></i>
                  Crear Primera Factura
                </Button>
              )}
            </div>
          ) : (
            <Table hover responsive>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th className="text-end">Importe</th>
                  <th className="text-center">Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td>
                      <Link to={`/app/invoices/${invoice.id}`} className="text-decoration-none">
                        <strong className="gradient-text">{invoice.fullNumber}</strong>
                      </Link>
                    </td>
                    <td>{formatDate(invoice.date)}</td>
                    <td>
                      <div>{invoice.customer?.name || invoice.customerName}</div>
                      <small className="text-muted">{invoice.customer?.nif || invoice.customerNif}</small>
                    </td>
                    <td className="text-end">
                      <strong className="gradient-text">{formatPrice(invoice.total)}</strong>
                    </td>
                    <td className="text-center">{getStatusBadge(invoice.status)}</td>
                    <td className="text-end">
                      <Button 
                        as={Link} 
                        to={`/app/invoices/${invoice.id}`} 
                        variant="outline-primary" 
                        size="sm"
                        title="Ver factura"
                      >
                        <i className="bi bi-eye"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          
          {pagination && pagination.totalPages > 1 && (
            <Pagination 
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              onPageChange={handlePageChange}
            />
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default Invoices;
