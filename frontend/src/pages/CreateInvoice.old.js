import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert, Table } from 'react-bootstrap';
import api from '../services/api';

const CreateInvoice = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    series: 'A',
    notes: ''
  });
  const [useManualCustomer, setUseManualCustomer] = useState(false);
  const [manualCustomer, setManualCustomer] = useState({
    name: '',
    nif: '',
    address: ''
  });
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState({
    description: '',
    quantity: 1,
    price: 0,
    ivaRate: 21
  });
  const [useProducts, setUseProducts] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [customersRes, productsRes] = await Promise.all([
        api.get('/customers'),
        api.get('/products')
      ]);
      setCustomers(customersRes.data.customers || []);
      setProducts(productsRes.data.products || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLineChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'productSelect' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        setCurrentLine({
          description: product.name,
          quantity: 1,
          price: product.price,
          ivaRate: product.ivaRate
        });
      }
    } else {
      setCurrentLine({ ...currentLine, [name]: value });
    }
  };

  const addLine = () => {
    if (!currentLine.description || currentLine.quantity <= 0 || currentLine.price <= 0) {
      alert('Completa todos los campos');
      return;
    }
    setLines([...lines, { ...currentLine }]);
    setCurrentLine({ description: '', quantity: 1, price: 0, ivaRate: 21 });
  };

  const removeLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalIVA = 0;

    lines.forEach(line => {
      const lineTotal = line.quantity * line.price;
      const lineIVA = lineTotal * (line.ivaRate / 100);
      subtotal += lineTotal;
      totalIVA += lineIVA;
    });

    return {
      subtotal: subtotal.toFixed(2),
      totalIVA: totalIVA.toFixed(2),
      total: (subtotal + totalIVA).toFixed(2)
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!useManualCustomer && !formData.customerId) {
      setError('Selecciona un cliente o activa modo manual');
      return;
    }

    if (useManualCustomer && (!manualCustomer.name || !manualCustomer.nif)) {
      setError('Completa nombre y NIF del cliente');
      return;
    }

    if (lines.length === 0) {
      setError('Añade al menos una línea');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const payload = {
        date: formData.date,
        series: formData.series,
        notes: formData.notes,
        lines: lines.map(line => ({
          description: line.description,
          quantity: parseFloat(line.quantity),
          price: parseFloat(line.price),
          ivaRate: parseFloat(line.ivaRate)
        }))
      };

      // Agregar cliente según modo
      if (useManualCustomer) {
        payload.customerManual = manualCustomer;
      } else {
        payload.customerId = formData.customerId;
      }

      const response = await api.post('/invoices', payload);
      navigate(`/app/invoices/${response.data.invoice.id}`);
    } catch (error) {
      setError(error.response?.data?.error || 'Error creando factura');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <>
      <div className="mb-4">
        <h1>Nueva Factura</h1>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Card className="mb-4">
          <Card.Header className="bg-white">
            <h5 className="mb-0">Datos Generales</h5>
          </Card.Header>
          <Card.Body>
            <div className="mb-3">
              <Form.Check 
                type="switch"
                label="Escribir cliente manualmente (sin guardar)"
                checked={useManualCustomer}
                onChange={(e) => setUseManualCustomer(e.target.checked)}
              />
            </div>

            {useManualCustomer ? (
              <div className="border rounded p-3 bg-light mb-3">
                <h6 className="mb-3">Datos del Cliente</h6>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Nombre Cliente *</Form.Label>
                      <Form.Control
                        value={manualCustomer.name}
                        onChange={(e) => setManualCustomer({...manualCustomer, name: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>NIF/CIF *</Form.Label>
                      <Form.Control
                        value={manualCustomer.nif}
                        onChange={(e) => setManualCustomer({...manualCustomer, nif: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </div>
                </div>
                <Form.Group className="mb-0">
                  <Form.Label>Dirección</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={manualCustomer.address}
                    onChange={(e) => setManualCustomer({...manualCustomer, address: e.target.value})}
                  />
                </Form.Group>
              </div>
            ) : (
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Cliente *</Form.Label>
                    <Form.Select name="customerId" value={formData.customerId} onChange={handleChange} required>
                      <option value="">Seleccionar...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.nif})</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-md-3">
                  <Form.Group className="mb-3">
                    <Form.Label>Fecha *</Form.Label>
                    <Form.Control type="date" name="date" value={formData.date} onChange={handleChange} required />
                  </Form.Group>
                </div>
                <div className="col-md-3">
                  <Form.Group className="mb-3">
                    <Form.Label>Serie</Form.Label>
                    <Form.Control name="series" value={formData.series} onChange={handleChange} maxLength={10} />
                  </Form.Group>
                </div>
              </div>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Notas</Form.Label>
              <Form.Control as="textarea" rows={2} name="notes" value={formData.notes} onChange={handleChange} />
            </Form.Group>
          </Card.Body>
        </Card>

        <Card className="mb-4">
          <Card.Header className="bg-white">
            <h5 className="mb-0">Líneas</h5>
          </Card.Header>
          <Card.Body>
            {lines.length > 0 && (
              <Table size="sm" bordered className="mb-3">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th width="100">Cantidad</th>
                    <th width="120">Precio</th>
                    <th width="80">IVA</th>
                    <th width="120" className="text-end">Total</th>
                    <th width="60"></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index}>
                      <td>{line.description}</td>
                      <td className="text-center">{line.quantity}</td>
                      <td className="text-end">{parseFloat(line.price).toFixed(2)} €</td>
                      <td className="text-center">{line.ivaRate}%</td>
                      <td className="text-end">
                        <strong>{(line.quantity * line.price * (1 + line.ivaRate / 100)).toFixed(2)} €</strong>
                      </td>
                      <td className="text-center">
                        <Button variant="outline-danger" size="sm" onClick={() => removeLine(index)}>
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}

            <div className="border rounded p-3 bg-light">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Añadir Línea</h6>
                <Form.Check 
                  type="switch"
                  label="Usar productos guardados"
                  checked={useProducts}
                  onChange={(e) => setUseProducts(e.target.checked)}
                />
              </div>

              {useProducts && products.length > 0 && (
                <Form.Group className="mb-2">
                  <Form.Select name="productSelect" onChange={handleLineChange} size="sm">
                    <option value="">Seleccionar producto (autocompleta)</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {parseFloat(p.price).toFixed(2)} €</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}

              <div className="row g-2">
                <div className="col-md-4">
                  <Form.Control size="sm" name="description" placeholder="Descripción *" value={currentLine.description} onChange={handleLineChange} />
                </div>
                <div className="col-md-2">
                  <Form.Control size="sm" type="number" step="0.01" name="quantity" placeholder="Cantidad" value={currentLine.quantity} onChange={handleLineChange} />
                </div>
                <div className="col-md-2">
                  <Form.Control size="sm" type="number" step="0.01" name="price" placeholder="Precio" value={currentLine.price} onChange={handleLineChange} />
                </div>
                <div className="col-md-2">
                  <Form.Select size="sm" name="ivaRate" value={currentLine.ivaRate} onChange={handleLineChange}>
                    <option value="0">0%</option>
                    <option value="4">4%</option>
                    <option value="10">10%</option>
                    <option value="21">21%</option>
                  </Form.Select>
                </div>
                <div className="col-md-2">
                  <Button variant="success" size="sm" onClick={addLine} className="w-100">
                    <i className="bi bi-plus"></i> Añadir
                  </Button>
                </div>
              </div>
              <Form.Text className="text-muted">
                💡 Escribe todo manual o selecciona un producto para autocompletar
              </Form.Text>
            </div>
          </Card.Body>
        </Card>

        <Card className="mb-4">
          <Card.Body>
            <div className="row">
              <div className="col-md-8"></div>
              <div className="col-md-4">
                <Table borderless size="sm">
                  <tbody>
                    <tr>
                      <td><strong>Subtotal:</strong></td>
                      <td className="text-end">{totals.subtotal} €</td>
                    </tr>
                    <tr>
                      <td><strong>IVA:</strong></td>
                      <td className="text-end">{totals.totalIVA} €</td>
                    </tr>
                    <tr className="border-top">
                      <td><h5 className="mb-0">TOTAL:</h5></td>
                      <td className="text-end"><h5 className="mb-0">{totals.total} €</h5></td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            </div>

            <div className="text-end mt-3">
              <Button variant="secondary" className="me-2" onClick={() => navigate('/app/invoices')}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={loading || lines.length === 0}>
                {loading ? 'Creando...' : 'Crear Factura'}
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Form>
    </>
  );
};

export default CreateInvoice;
