import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Alert, Badge, InputGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', ivaRate: '21', sku: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProducts();
  }, [search]);

  const loadProducts = async () => {
    try {
      const params = search ? { search } : {};
      const response = await api.get('/products', { params });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.error('Error cargando productos');
    }
  };

  const handleShowModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        ivaRate: product.ivaRate,
        sku: product.sku || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', ivaRate: '21', sku: '' });
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
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
        toast.success('Producto actualizado correctamente');
      } else {
        await api.post('/products', formData);
        toast.success('Producto creado correctamente');
      }
      setShowModal(false);
      loadProducts();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error guardando producto';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Desactivar producto ${name}?`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Producto desactivado');
      loadProducts();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error eliminando producto';
      toast.error(errorMsg);
    }
  };

  const formatPrice = (price) => `${parseFloat(price).toFixed(2)} €`;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-2">
            <span className="gradient-text">Productos y Servicios</span>
          </h1>
          <p className="text-muted mb-0">
            <i className="bi bi-box-seam me-2"></i>
            {products.length} producto{products.length !== 1 && 's'} · Opcional
          </p>
        </div>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <i className="bi bi-plus-circle me-2"></i>Nuevo Producto
        </Button>
      </div>

      {/* Búsqueda */}
      <Card className="mb-4 scale-in">
        <Card.Body>
          <Form.Label className="small fw-bold">Buscar Producto</Form.Label>
          <InputGroup>
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Nombre, descripción o SKU..."
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
          {products.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox" style={{ fontSize: '4rem', color: '#dee2e6' }}></i>
              <p className="text-muted mt-3 mb-3">
                {search ? 'No se encontraron productos' : 'No hay productos todavía'}
              </p>
              {!search && (
                <Button variant="primary" onClick={() => handleShowModal()}>
                  <i className="bi bi-plus-circle me-2"></i>
                  Crear Primer Producto
                </Button>
              )}
              <p className="small text-muted mt-3">
                <i className="bi bi-lightbulb me-1"></i>
                Los productos son opcionales, puedes escribir líneas manualmente
              </p>
            </div>
          ) : (
            <>
              {/* Tabla Desktop */}
              <Table hover responsive className="d-none d-md-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>SKU</th>
                    <th className="text-end">Precio</th>
                    <th className="text-center">IVA</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id}>
                      <td><strong>{product.name}</strong></td>
                      <td className="text-muted">{product.description || '-'}</td>
                      <td>{product.sku || '-'}</td>
                      <td className="text-end"><strong>{formatPrice(product.price)}</strong></td>
                      <td className="text-center"><Badge bg="info">{product.ivaRate}%</Badge></td>
                      <td className="text-end">
                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowModal(product)}>
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(product.id, product.name)}>
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Cards Móvil */}
              <div className="d-md-none">
                {products.map(product => (
                  <div key={product.id} className="mobile-card">
                    <div className="card-header">
                      <strong className="text-primary">{product.name}</strong>
                      <Badge bg="info">{product.ivaRate}%</Badge>
                    </div>
                    <div className="card-body">
                      <div className="field">
                        <span className="field-label">Descripción:</span>
                        <span className="field-value">{product.description || '-'}</span>
                      </div>
                      <div className="field">
                        <span className="field-label">SKU:</span>
                        <span className="field-value">{product.sku || '-'}</span>
                      </div>
                      <div className="field">
                        <span className="field-label">Precio:</span>
                        <span className="field-value"><strong className="text-success">{formatPrice(product.price)}</strong></span>
                      </div>
                      <div className="actions">
                        <Button variant="outline-primary" size="sm" onClick={() => handleShowModal(product)}>
                          <i className="bi bi-pencil me-1"></i>
                          Editar
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(product.id, product.name)}>
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

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Nombre *</Form.Label>
              <Form.Control name="name" value={formData.name} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control as="textarea" rows={2} name="description" value={formData.description} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>SKU</Form.Label>
              <Form.Control name="sku" value={formData.sku} onChange={handleChange} />
            </Form.Group>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Precio (€) *</Form.Label>
                  <Form.Control type="number" step="0.01" min="0" name="price" value={formData.price} onChange={handleChange} required />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>IVA (%) *</Form.Label>
                  <Form.Select name="ivaRate" value={formData.ivaRate} onChange={handleChange} required>
                    <option value="0">0%</option>
                    <option value="4">4%</option>
                    <option value="10">10%</option>
                    <option value="21">21%</option>
                  </Form.Select>
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

export default Products;
