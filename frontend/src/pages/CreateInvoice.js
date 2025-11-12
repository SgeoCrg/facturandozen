import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert, Table, Badge, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
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
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Refs para navegación con teclado
  const descriptionRef = useRef(null);
  const quantityRef = useRef(null);
  const priceRef = useRef(null);
  const ivaRateRef = useRef(null);

  useEffect(() => {
    loadData();
    // Focus automático en primer campo
    setTimeout(() => descriptionRef.current?.focus(), 100);
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
        // Focus en cantidad después de seleccionar producto
        setTimeout(() => quantityRef.current?.focus(), 100);
      }
    } else {
      setCurrentLine({ ...currentLine, [name]: value });
    }
  };

  // Navegación con teclado estilo Excel
  const handleKeyDown = (e, currentField) => {
    // Enter → Añadir línea y volver a descripción
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentField === 'ivaRate' || currentField === 'price') {
        addLine();
      } else {
        // Navegar al siguiente campo
        moveToNextField(currentField);
      }
      return;
    }

    // Escape → Limpiar línea actual
    if (e.key === 'Escape') {
      e.preventDefault();
      setCurrentLine({ description: '', quantity: 1, price: 0, ivaRate: 21 });
      descriptionRef.current?.focus();
      return;
    }

    // Flechas para navegar entre campos
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      // Solo si el cursor está al final del input
      if (e.target.selectionStart === e.target.value.length) {
        e.preventDefault();
        moveToNextField(currentField);
      }
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      // Solo si el cursor está al inicio del input
      if (e.target.selectionStart === 0) {
        e.preventDefault();
        moveToPreviousField(currentField);
      }
    }

    // F1 → Mostrar ayuda
    if (e.key === 'F1') {
      e.preventDefault();
      setShowKeyboardHelp(!showKeyboardHelp);
    }
  };

  const moveToNextField = (currentField) => {
    switch (currentField) {
      case 'description':
        quantityRef.current?.focus();
        quantityRef.current?.select();
        break;
      case 'quantity':
        priceRef.current?.focus();
        priceRef.current?.select();
        break;
      case 'price':
        ivaRateRef.current?.focus();
        break;
      case 'ivaRate':
        addLine();
        break;
      default:
        break;
    }
  };

  const moveToPreviousField = (currentField) => {
    switch (currentField) {
      case 'quantity':
        descriptionRef.current?.focus();
        break;
      case 'price':
        quantityRef.current?.focus();
        quantityRef.current?.select();
        break;
      case 'ivaRate':
        priceRef.current?.focus();
        priceRef.current?.select();
        break;
      default:
        break;
    }
  };

  const addLine = () => {
    if (!currentLine.description || currentLine.quantity <= 0 || currentLine.price <= 0) {
      toast.warning('Completa descripción, cantidad y precio');
      descriptionRef.current?.focus();
      return;
    }
    setLines([...lines, { ...currentLine }]);
    setCurrentLine({ description: '', quantity: 1, price: 0, ivaRate: 21 });
    setError('');
    toast.success('Línea añadida');
    // Volver a descripción para siguiente línea
    setTimeout(() => descriptionRef.current?.focus(), 50);
  };

  const removeLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
    toast.info('Línea eliminada');
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
      descriptionRef.current?.focus();
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

      if (useManualCustomer) {
        payload.customerManual = manualCustomer;
      } else {
        payload.customerId = formData.customerId;
      }

      const response = await api.post('/invoices', payload);
      toast.success('Factura creada correctamente');
      navigate(`/app/invoices/${response.data.invoice.id}`);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error creando factura';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <>
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="mb-2">
            <span className="gradient-text">Nueva Factura</span>
          </h1>
          <p className="text-muted mb-0">
            <i className="bi bi-keyboard me-2"></i>
            Usa teclado para navegar
            <Button 
              variant="link" 
              size="sm" 
              className="ms-2"
              onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
            >
              <i className="bi bi-question-circle"></i> Atajos
            </Button>
          </p>
        </div>
        <Badge bg="info" className="px-3 py-2">
          <i className="bi bi-lightning-fill me-1"></i>
          Modo Excel
        </Badge>
      </div>

      {showKeyboardHelp && (
        <Alert variant="info" dismissible onClose={() => setShowKeyboardHelp(false)} className="fade-in">
          <h6 className="mb-3">
            <i className="bi bi-keyboard me-2"></i>
            Atajos de Teclado
          </h6>
          <Row>
            <Col md={6}>
              <ul className="small mb-0">
                <li><kbd>Enter</kbd> → Siguiente campo / Añadir línea</li>
                <li><kbd>Tab</kbd> → Siguiente campo</li>
                <li><kbd>Shift + Tab</kbd> → Campo anterior</li>
                <li><kbd>→</kbd> / <kbd>↓</kbd> → Siguiente campo (al final)</li>
              </ul>
            </Col>
            <Col md={6}>
              <ul className="small mb-0">
                <li><kbd>←</kbd> / <kbd>↑</kbd> → Campo anterior (al inicio)</li>
                <li><kbd>Esc</kbd> → Limpiar línea actual</li>
                <li><kbd>F1</kbd> → Mostrar/Ocultar esta ayuda</li>
                <li><kbd>Ctrl + S</kbd> → Crear factura</li>
              </ul>
            </Col>
          </Row>
        </Alert>
      )}

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Card className="mb-4 scale-in">
          <Card.Header>
            <h5 className="mb-0 text-white">
              <i className="bi bi-person me-2"></i>
              Datos Generales
            </h5>
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

            {!useManualCustomer && (
              <div className="row">
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

        <Card className="mb-4 scale-in" style={{ animationDelay: '0.1s' }}>
          <Card.Header>
            <h5 className="mb-0 text-white">
              <i className="bi bi-list-ul me-2"></i>
              Líneas de Factura
              {lines.length > 0 && (
                <Badge bg="light" text="dark" className="ms-2">
                  {lines.length} línea{lines.length !== 1 && 's'}
                </Badge>
              )}
            </h5>
          </Card.Header>
          <Card.Body>
            {lines.length > 0 && (
              <div className="table-responsive mb-3">
                <Table size="sm" bordered hover>
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
                          <strong className="gradient-text">
                            {(line.quantity * line.price * (1 + line.ivaRate / 100)).toFixed(2)} €
                          </strong>
                        </td>
                        <td className="text-center">
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => removeLine(index)}
                            title="Eliminar línea"
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            <div className="border rounded p-3 bg-light">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">
                  <i className="bi bi-plus-circle me-2"></i>
                  Añadir Línea
                </h6>
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
                  <Form.Control 
                    ref={descriptionRef}
                    size="sm" 
                    name="description" 
                    placeholder="Descripción *" 
                    value={currentLine.description} 
                    onChange={handleLineChange}
                    onKeyDown={(e) => handleKeyDown(e, 'description')}
                  />
                </div>
                <div className="col-md-2">
                  <Form.Control 
                    ref={quantityRef}
                    size="sm" 
                    type="number" 
                    step="0.01" 
                    name="quantity" 
                    placeholder="Cantidad" 
                    value={currentLine.quantity} 
                    onChange={handleLineChange}
                    onKeyDown={(e) => handleKeyDown(e, 'quantity')}
                  />
                </div>
                <div className="col-md-2">
                  <Form.Control 
                    ref={priceRef}
                    size="sm" 
                    type="number" 
                    step="0.01" 
                    name="price" 
                    placeholder="Precio" 
                    value={currentLine.price} 
                    onChange={handleLineChange}
                    onKeyDown={(e) => handleKeyDown(e, 'price')}
                  />
                </div>
                <div className="col-md-2">
                  <Form.Select 
                    ref={ivaRateRef}
                    size="sm" 
                    name="ivaRate" 
                    value={currentLine.ivaRate} 
                    onChange={handleLineChange}
                    onKeyDown={(e) => handleKeyDown(e, 'ivaRate')}
                  >
                    <option value="0">0%</option>
                    <option value="4">4%</option>
                    <option value="10">10%</option>
                    <option value="21">21%</option>
                  </Form.Select>
                </div>
                <div className="col-md-2">
                  <Button 
                    variant="success" 
                    size="sm" 
                    onClick={addLine} 
                    className="w-100"
                    title="Añadir línea (Enter)"
                  >
                    <i className="bi bi-plus"></i> Añadir
                  </Button>
                </div>
              </div>
              <div className="mt-2 d-flex justify-content-between align-items-center">
                <Form.Text className="text-muted">
                  <i className="bi bi-keyboard me-1"></i>
                  <kbd>Enter</kbd> para añadir | <kbd>Esc</kbd> para limpiar | <kbd>← → ↑ ↓</kbd> para navegar
                </Form.Text>
                <Form.Text className="text-muted">
                  <i className="bi bi-lightbulb me-1"></i>
                  Escribe manual o selecciona producto
                </Form.Text>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card className="mb-4 scale-in" style={{ animationDelay: '0.2s' }}>
          <Card.Body>
            <div className="row">
              <div className="col-md-8">
                {lines.length === 0 && (
                  <Alert variant="warning" className="mb-0">
                    <i className="bi bi-info-circle me-2"></i>
                    Añade al menos una línea para crear la factura
                  </Alert>
                )}
              </div>
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
                      <td><h5 className="mb-0 gradient-text">TOTAL:</h5></td>
                      <td className="text-end"><h5 className="mb-0 gradient-text">{totals.total} €</h5></td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            </div>

            <div className="text-end mt-3">
              <Button 
                variant="secondary" 
                className="me-2" 
                onClick={() => navigate('/app/invoices')}
              >
                <i className="bi bi-x-circle me-2"></i>
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading || lines.length === 0}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Creando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    Crear Factura
                  </>
                )}
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Form>
    </>
  );
};

export default CreateInvoice;

