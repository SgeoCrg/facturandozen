import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Alert, Form, Tab, Tabs } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/api';

const Superadmin = () => {
  const [activeTab, setActiveTab] = useState('tenants');
  const [tenants, setTenants] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resettingPassword, setResettingPassword] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchUsers, setSearchUsers] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterTenant, setFilterTenant] = useState('');
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'user',
    tenantId: '',
    password: '',
    sendEmail: false
  });
  const [tenantForm, setTenantForm] = useState({
    name: '',
    nif: '',
    email: '',
    address: '',
    status: 'trial',
    adminName: '',
    adminPassword: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchUsers, filterRole, filterTenant]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [tenantsRes, statsRes] = await Promise.all([
        api.get('/superadmin/tenants'),
        api.get('/superadmin/stats')
      ]);
      
      setTenants(tenantsRes.data.tenants || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError(error.response?.data?.error || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const params = {};
      if (searchUsers) params.search = searchUsers;
      if (filterRole) params.role = filterRole;
      if (filterTenant) params.tenantId = filterTenant;

      const response = await api.get('/superadmin/users', { params });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      toast.error('Error cargando usuarios');
    }
  };

  const handleShowDetail = async (tenantId) => {
    try {
      const response = await api.get(`/superadmin/tenants/${tenantId}`);
      setSelectedTenant(response.data);
      setShowModal(true);
    } catch (error) {
      alert('Error cargando detalle');
    }
  };

  const handleUpdateStatus = async (tenantId, status) => {
    if (!window.confirm(`¿Cambiar estado a ${status}?`)) return;
    try {
      await api.put(`/superadmin/tenants/${tenantId}/status`, { status });
      loadData();
      setShowModal(false);
    } catch (error) {
      alert('Error actualizando estado');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      trial: 'warning',
      active: 'success',
      suspended: 'danger',
      cancelled: 'secondary'
    };
    return <Badge bg={map[status] || 'secondary'}>{status}</Badge>;
  };

  const formatDate = (date) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleDateString('es-ES');
  };

  // ========== FUNCIONES USUARIOS ==========

  const handleCreateUser = () => {
    setEditingUser(null);
    setUserForm({ name: '', email: '', role: 'user', tenantId: '', password: '', sendEmail: false });
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
      setEditingUser(user);
      setUserForm({
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        password: '',
        sendEmail: false
      });
      setShowUserModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...userForm };
      if (!payload.password) delete payload.password;

      if (editingUser) {
        await api.put(`/superadmin/users/${editingUser.id}`, payload);
        toast.success('Usuario actualizado correctamente');
      } else {
        await api.post('/superadmin/users', payload);
        toast.success('Usuario creado correctamente');
      }

      setShowUserModal(false);
      loadUsers();
      setUserForm({ name: '', email: '', role: 'user', tenantId: '', password: '', sendEmail: false });
      setEditingUser(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error guardando usuario');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario ${userName}?`)) return;

    try {
      await api.delete(`/superadmin/users/${userId}`);
      toast.success('Usuario eliminado correctamente');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error eliminando usuario');
    }
  };

  const handleResetPassword = async (user) => {
    setResettingPassword(user);
    setShowPasswordModal(true);
  };

  const handleConfirmResetPassword = async (e) => {
    e.preventDefault();
    try {
      const { password, sendEmail } = userForm;
      const response = await api.post(`/superadmin/users/${resettingPassword.id}/reset-password`, {
        password: password || undefined,
        sendEmail
      });

      let message = 'Contraseña reseteada correctamente';
      if (response.data.password) {
        message += `\nNueva contraseña: ${response.data.password}`;
      }
      if (response.data.emailSent) {
        message += '\nEmail enviado al usuario';
      }

      alert(message);
      setShowPasswordModal(false);
      setResettingPassword(null);
      setUserForm({ name: '', email: '', role: 'user', tenantId: '', password: '', sendEmail: false });
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error reseteando contraseña');
    }
  };

  // ========== FUNCIONES TENANTS ==========

  const handleCreateTenant = () => {
    setTenantForm({
      name: '',
      nif: '',
      email: '',
      address: '',
      status: 'trial',
      adminName: '',
      adminPassword: ''
    });
    setShowTenantModal(true);
  };

  const handleSaveTenant = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...tenantForm };
      if (!payload.adminName || !payload.adminPassword) {
        delete payload.adminName;
        delete payload.adminPassword;
      }

      await api.post('/superadmin/tenants', payload);
      toast.success('Empresa creada correctamente');
      setShowTenantModal(false);
      loadData();
      setTenantForm({
        name: '',
        nif: '',
        email: '',
        address: '',
        status: 'trial',
        adminName: '',
        adminPassword: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error creando empresa');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando datos del superadmin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={loadData}>
            Reintentar
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-4">Panel Superadmin</h1>

      {stats && (
        <div className="row mb-4">
          <div className="col-md-3">
            <Card>
              <Card.Body>
                <h6 className="text-muted">Total Empresas</h6>
                <h2>{stats.totalTenants}</h2>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card>
              <Card.Body>
                <h6 className="text-muted">Activos</h6>
                <h2 className="text-success">{stats.activeTenants}</h2>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card>
              <Card.Body>
                <h6 className="text-muted">Trial</h6>
                <h2 className="text-warning">{stats.trialTenants}</h2>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card>
              <Card.Body>
                <h6 className="text-muted">MRR</h6>
                <h2>{stats.mrr} €</h2>
              </Card.Body>
            </Card>
          </div>
        </div>
      )}

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        <Tab eventKey="tenants" title="📊 Empresas">
          <Card className="mt-3">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Empresas (Tenants)</h5>
              <Button size="sm" variant="primary" onClick={handleCreateTenant}>
                <i className="bi bi-plus-circle me-1"></i>Nueva Empresa
              </Button>
            </Card.Header>
            <Card.Body>
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th>NIF</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Estado</th>
                    <th>Registrado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(tenant => (
                    <tr key={tenant.id}>
                      <td><strong>{tenant.name}</strong></td>
                      <td>{tenant.nif}</td>
                      <td>{tenant.email}</td>
                      <td>
                        <Badge bg="info">{tenant.subscription?.plan || 'N/A'}</Badge>
                        {tenant.subscription?.priceMonthly > 0 && (
                          <span className="ms-2 small">{tenant.subscription.priceMonthly} €/mes</span>
                        )}
                      </td>
                      <td>{getStatusBadge(tenant.status)}</td>
                      <td>{formatDate(tenant.createdAt)}</td>
                      <td>
                        <Button size="sm" variant="outline-primary" onClick={() => handleShowDetail(tenant.id)}>
                          <i className="bi bi-eye"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="users" title="👥 Usuarios">
          <Card className="mt-3">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Usuarios de la Plataforma</h5>
              <Button size="sm" variant="primary" onClick={handleCreateUser}>
                <i className="bi bi-plus-circle me-1"></i>Nuevo Usuario
              </Button>
            </Card.Header>
            <Card.Body>
              <div className="row mb-3">
                <div className="col-md-4">
                  <Form.Control
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchUsers}
                    onChange={(e) => setSearchUsers(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <Form.Select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                    <option value="">Todos los roles</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </Form.Select>
                </div>
                <div className="col-md-3">
                  <Form.Select value={filterTenant} onChange={(e) => setFilterTenant(e.target.value)}>
                    <option value="">Todas las empresas</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </Form.Select>
                </div>
              </div>

              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Empresa</th>
                    <th>Último Acceso</th>
                    <th>Registrado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center text-muted">
                        No hay usuarios registrados
                      </td>
                    </tr>
                  ) : (
                    users.map(user => (
                      <tr key={user.id}>
                        <td><strong>{user.name}</strong></td>
                        <td>{user.email}</td>
                        <td>
                          <Badge bg={user.role === 'admin' ? 'warning' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td>{user.tenant?.name || 'Sin empresa'}</td>
                        <td>{formatDate(user.lastLoginAt)}</td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <Button 
                            size="sm" 
                            variant="outline-primary" 
                            className="me-1"
                            onClick={() => handleEditUser(user)}
                            title="Editar"
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-warning" 
                            className="me-1"
                            onClick={() => handleResetPassword(user)}
                            title="Resetear contraseña"
                          >
                            <i className="bi bi-key"></i>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-danger"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={user.role === 'superadmin'}
                            title="Eliminar"
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedTenant?.tenant?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTenant && (
            <>
              <h6>Información</h6>
              <p className="mb-1"><strong>NIF:</strong> {selectedTenant.tenant.nif}</p>
              <p className="mb-1"><strong>Email:</strong> {selectedTenant.tenant.email}</p>
              <p className="mb-3"><strong>Estado:</strong> {getStatusBadge(selectedTenant.tenant.status)}</p>

              <h6>Estadísticas</h6>
              <div className="row mb-3">
                <div className="col-md-3">
                  <div className="text-center p-2 bg-light rounded">
                    <div className="text-muted small">Facturas</div>
                    <h4>{selectedTenant.stats.invoices}</h4>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-2 bg-light rounded">
                    <div className="text-muted small">Clientes</div>
                    <h4>{selectedTenant.stats.customers}</h4>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-2 bg-light rounded">
                    <div className="text-muted small">Productos</div>
                    <h4>{selectedTenant.stats.products}</h4>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-2 bg-light rounded">
                    <div className="text-muted small">Usuarios</div>
                    <h4>{selectedTenant.stats.users}</h4>
                  </div>
                </div>
              </div>

              <h6>Subscripción</h6>
              <p className="mb-1"><strong>Plan:</strong> {selectedTenant.tenant.subscription?.plan}</p>
              <p className="mb-1"><strong>Estado:</strong> {selectedTenant.tenant.subscription?.status}</p>
              <p className="mb-3"><strong>Precio:</strong> {selectedTenant.tenant.subscription?.priceMonthly} €/mes</p>

              <h6>Acciones</h6>
              <div className="d-grid gap-2">
                <Button 
                  variant="success" 
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedTenant.tenant.id, 'active')}
                  disabled={selectedTenant.tenant.status === 'active'}
                >
                  Activar
                </Button>
                <Button 
                  variant="warning" 
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedTenant.tenant.id, 'suspended')}
                  disabled={selectedTenant.tenant.status === 'suspended'}
                >
                  Suspender
                </Button>
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedTenant.tenant.id, 'cancelled')}
                  disabled={selectedTenant.tenant.status === 'cancelled'}
                >
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Modal Crear/Editar Usuario */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSaveUser}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre *</Form.Label>
              <Form.Control
                type="text"
                required
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                required
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Rol *</Form.Label>
              <Form.Select
                required
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Empresa (Tenant) *</Form.Label>
              <Form.Select
                required
                value={userForm.tenantId}
                onChange={(e) => setUserForm({ ...userForm, tenantId: e.target.value })}
              >
                <option value="">Seleccionar empresa...</option>
                {tenants.map(tenant => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name} ({tenant.nif})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                {editingUser ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña (dejar vacío para generar automática)'}
              </Form.Label>
              <Form.Control
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder={editingUser ? 'Dejar vacío si no quieres cambiar' : 'Generada automáticamente si se deja vacío'}
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowUserModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit">
                {editingUser ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal Resetear Contraseña */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Resetear Contraseña</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {resettingPassword && (
            <Form onSubmit={handleConfirmResetPassword}>
              <p className="mb-3">
                <strong>Usuario:</strong> {resettingPassword.name} ({resettingPassword.email})
              </p>

              <Form.Group className="mb-3">
                <Form.Label>Nueva Contraseña (dejar vacío para generar automática)</Form.Label>
                <Form.Control
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Dejar vacío para generar automáticamente"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Enviar contraseña por email"
                  checked={userForm.sendEmail || false}
                  onChange={(e) => setUserForm({ ...userForm, sendEmail: e.target.checked })}
                />
              </Form.Group>

              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
                  Cancelar
                </Button>
                <Button variant="warning" type="submit">
                  Resetear Contraseña
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {/* Modal Crear Empresa (Tenant) */}
      <Modal show={showTenantModal} onHide={() => setShowTenantModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Nueva Empresa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSaveTenant}>
            <h6 className="mb-3">Información de la Empresa</h6>
            
            <Form.Group className="mb-3">
              <Form.Label>Nombre de la Empresa *</Form.Label>
              <Form.Control
                type="text"
                required
                value={tenantForm.name}
                onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                placeholder="Ej: Mi Empresa SL"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>NIF *</Form.Label>
              <Form.Control
                type="text"
                required
                maxLength={9}
                value={tenantForm.nif}
                onChange={(e) => setTenantForm({ ...tenantForm, nif: e.target.value.toUpperCase() })}
                placeholder="Ej: B12345678"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                required
                value={tenantForm.email}
                onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                placeholder="contacto@empresa.com"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Dirección</Form.Label>
              <Form.Control
                type="text"
                value={tenantForm.address}
                onChange={(e) => setTenantForm({ ...tenantForm, address: e.target.value })}
                placeholder="Calle, número, ciudad..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Estado Inicial</Form.Label>
              <Form.Select
                value={tenantForm.status}
                onChange={(e) => setTenantForm({ ...tenantForm, status: e.target.value })}
              >
                <option value="trial">Trial</option>
                <option value="active">Activo</option>
                <option value="suspended">Suspendido</option>
              </Form.Select>
            </Form.Group>

            <hr className="my-4" />
            <h6 className="mb-3">Usuario Administrador (Opcional)</h6>
            <p className="text-muted small mb-3">
              Si no creas un admin ahora, la empresa podrá registrarse normalmente más tarde.
            </p>

            <Form.Group className="mb-3">
              <Form.Label>Nombre del Administrador</Form.Label>
              <Form.Control
                type="text"
                value={tenantForm.adminName}
                onChange={(e) => setTenantForm({ ...tenantForm, adminName: e.target.value })}
                placeholder="Ej: Juan Pérez"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contraseña del Administrador</Form.Label>
              <Form.Control
                type="password"
                value={tenantForm.adminPassword}
                onChange={(e) => setTenantForm({ ...tenantForm, adminPassword: e.target.value })}
                placeholder="Mínimo 8 caracteres"
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowTenantModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit">
                Crear Empresa
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Superadmin;

