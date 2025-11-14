import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Alert, Badge, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Customers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '', nif: '', email: '', phone: '', address: '', city: '', postalCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Bloquear acceso a superadmin
  useEffect(() => {
    if (user?.role === 'superadmin') {
      navigate('/app/superadmin');
      toast.info('Los superadministradores no pueden gestionar clientes. Crea empresas (tenants) y que ellas gestionen sus propios clientes.');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.role !== 'superadmin') {
      loadCustomers();
    }
  }, [search, user]);

  const loadCustomers = async () => {
    try {
      const params = search ? { search } : {};
      const response = await api.get('/customers', { params });
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      toast.error('Error cargando clientes');
    }
  };

  const handleShowModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        nif: customer.nif,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        postalCode: customer.postalCode || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({ name: '', nif: '', email: '', phone: '', address: '', city: '', postalCode: '' });
    }
    setError('');
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
        toast.success('Cliente actualizado correctamente');
      } else {
        await api.post('/customers', formData);
        toast.success('Cliente creado correctamente');
      }
      setShowModal(false);
      loadCustomers();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error guardando cliente';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar cliente ${name}?`)) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Cliente eliminado');
      loadCustomers();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error eliminando cliente';
      toast.error(errorMsg);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-2">
            <span className="gradient-text">Clientes</span>
          </h1>
          <p className="text-muted mb-0">
            <i className="bi bi-people me-2"></i>
            {customers.length} cliente{customers.length !== 1 && 's'}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="primary" onClick={() => handleShowModal()}>
            <i className="bi bi-plus-circle me-2"></i>Nuevo Cliente
          </Button>
          <Link to="/app/customers/new" className="btn btn-outline-primary">
            <i className="bi bi-magic me-2"></i>Wizard
          </Link>
        </div>
      </div>

      {/* Búsqueda */}
      <Card className="mb-4 scale-in">
        <Card.Body>
          <Form.Label className="small fw-bold">Buscar Cliente</Form.Label>
          <InputGroup>
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Nombre, NIF o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <Button variant="outline-secondary" onClick={() => setSearch('')}>
                <i className="bi bi-x"></i>
              </Button>
            )}
          </InputGroup>
        </Card.Body>
      </Card>

      <Card className="fade-in">
        <Card.Body>
          {customers.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox" style={{ fontSize: '4rem', color: '#dee2e6' }}></i>
              <p className="text-muted mt-3 mb-3">
                {search ? 'No se encontraron clientes' : 'No hay clientes todavía'}
              </p>
              {!search && (
                <Button variant="primary" onClick={() => handleShowModal()}>
                  <i className="bi bi-plus-circle me-2"></i>
                  Crear Primer Cliente
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Tabla Desktop */}
              <Table hover responsive className="d-none d-md-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>NIF/CIF</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Ciudad</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(customer => (
                    <tr key={customer.id}>
                      <td><strong>{customer.name}</strong></td>
                      <td><Badge bg="secondary">{customer.nif}</Badge></td>
                      <td>{customer.email || '-'}</td>
                      <td>{customer.phone || '-'}</td>
                      <td>{customer.city || '-'}</td>
                      <td className="text-end">
                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowModal(customer)}>
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(customer.id, customer.name)}>
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Cards Móvil */}
              <div className="d-md-none">
                {customers.map(customer => (
                  <div key={customer.id} className="mobile-card">
                    <div className="card-header">
                      <strong className="text-primary">{customer.name}</strong>
                      <Badge bg="secondary">{customer.nif}</Badge>
                    </div>
                    <div className="card-body">
                      <div className="field">
                        <span className="field-label">Email:</span>
                        <span className="field-value">{customer.email || '-'}</span>
                      </div>
                      <div className="field">
                        <span className="field-label">Teléfono:</span>
                        <span className="field-value">{customer.phone || '-'}</span>
                      </div>
                      <div className="field">
                        <span className="field-label">Ciudad:</span>
                        <span className="field-value">{customer.city || '-'}</span>
                      </div>
                      <div className="actions">
                        <Button variant="outline-primary" size="sm" onClick={() => handleShowModal(customer)}>
                          <i className="bi bi-pencil me-1"></i>
                          Editar
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(customer.id, customer.name)}>
                          <i className="bi bi-trash me-1"></i>
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Nombre *</Form.Label>
              <Form.Control name="name" value={formData.name} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>NIF/CIF *</Form.Label>
              <Form.Control name="nif" value={formData.nif} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control name="phone" value={formData.phone} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Dirección</Form.Label>
              <Form.Control as="textarea" rows={2} name="address" value={formData.address} onChange={handleChange} />
            </Form.Group>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Ciudad</Form.Label>
                  <Form.Control name="city" value={formData.city} onChange={handleChange} />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Código Postal</Form.Label>
                  <Form.Control name="postalCode" value={formData.postalCode} onChange={handleChange} />
                </Form.Group>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default Customers;
