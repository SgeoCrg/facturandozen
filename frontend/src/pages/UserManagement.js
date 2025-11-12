import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Badge, Table } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
        setSuccess('Usuario actualizado correctamente');
      } else {
        await api.post('/users', formData);
        setSuccess('Usuario creado correctamente');
      }
      
      loadUsers();
      setShowModal(false);
      setFormData({ name: '', email: '', role: 'user' });
      setEditingUser(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Error procesando solicitud');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      await api.delete(`/users/${userId}`);
      setSuccess('Usuario eliminado correctamente');
      loadUsers();
    } catch (error) {
      setError(error.response?.data?.error || 'Error eliminando usuario');
    }
  };

  const handleInvite = async (userId) => {
    try {
      await api.post(`/users/${userId}/invite`);
      setSuccess('Invitación enviada correctamente');
    } catch (error) {
      setError(error.response?.data?.error || 'Error enviando invitación');
    }
  };

  const getRoleBadge = (role) => {
    const variants = {
      admin: 'primary',
      user: 'secondary',
      superadmin: 'danger'
    };
    return <Badge bg={variants[role]}>{role.toUpperCase()}</Badge>;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES');
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Gestión de Usuarios</h2>
            {user.role === 'admin' && (
              <Button 
                variant="primary" 
                onClick={() => {
                  setEditingUser(null);
                  setFormData({ name: '', email: '', role: 'user' });
                  setShowModal(true);
                }}
              >
                <i className="bi bi-person-plus"></i> Nuevo Usuario
              </Button>
            )}
          </div>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Card>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Creado</th>
                    <th>Último Login</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userItem) => (
                    <tr key={userItem.id}>
                      <td>{userItem.name}</td>
                      <td>{userItem.email}</td>
                      <td>{getRoleBadge(userItem.role)}</td>
                      <td>{formatDate(userItem.createdAt)}</td>
                      <td>
                        {userItem.lastLoginAt 
                          ? formatDate(userItem.lastLoginAt)
                          : 'Nunca'
                        }
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          {user.role === 'admin' && userItem.id !== user.id && (
                            <>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEdit(userItem)}
                              >
                                <i className="bi bi-pencil"></i>
                              </Button>
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => handleInvite(userItem.id)}
                              >
                                <i className="bi bi-envelope"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(userItem.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal Crear/Editar Usuario */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={editingUser}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Rol</Form.Label>
              <Form.Select
                name="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingUser ? 'Actualizar' : 'Crear'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default UserManagement;
