import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const DataRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    requestType: '',
    email: '',
    name: '',
    nif: '',
    description: ''
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await api.get('/lopd/data-requests');
      setRequests(response.data.requests || []);
    } catch (err) {
      setError('Error cargando solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/lopd/data-requests', formData);
      setShowForm(false);
      setFormData({
        requestType: '',
        email: '',
        name: '',
        nif: '',
        description: ''
      });
      loadRequests();
    } catch (err) {
      setError('Error creando solicitud');
    }
  };

  const getRequestTypeLabel = (type) => {
    const labels = {
      'access': 'Acceso a datos',
      'rectification': 'Rectificación',
      'erasure': 'Supresión',
      'portability': 'Portabilidad',
      'restriction': 'Limitación',
      'objection': 'Oposición'
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Pendiente',
      'in_progress': 'En proceso',
      'completed': 'Completada',
      'rejected': 'Rechazada'
    };
    return labels[status] || status;
  };

  const getStatusClass = (status) => {
    const classes = {
      'pending': 'status-pending',
      'in_progress': 'status-progress',
      'completed': 'status-completed',
      'rejected': 'status-rejected'
    };
    return classes[status] || '';
  };

  if (loading) return <div className="loading">Cargando solicitudes...</div>;

  return (
    <div className="data-requests">
      <div className="page-header">
        <h1>Solicitudes de Derechos LOPD</h1>
        <p>Gestiona las solicitudes de derechos de los interesados</p>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          Nueva Solicitud
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Formulario de nueva solicitud */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Nueva Solicitud de Derechos</h2>
              <button 
                className="btn-close"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label>Tipo de Solicitud</label>
                <select
                  value={formData.requestType}
                  onChange={(e) => setFormData({...formData, requestType: e.target.value})}
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="access">Acceso a datos</option>
                  <option value="rectification">Rectificación</option>
                  <option value="erasure">Supresión</option>
                  <option value="portability">Portabilidad</option>
                  <option value="restriction">Limitación</option>
                  <option value="objection">Oposición</option>
                </select>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Nombre (opcional)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>NIF (opcional)</label>
                <input
                  type="text"
                  value={formData.nif}
                  onChange={(e) => setFormData({...formData, nif: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="4"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de solicitudes */}
      <div className="requests-list">
        {requests.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Email</th>
                <th>Estado</th>
                <th>Creada</th>
                <th>Verificada</th>
                <th>Completada</th>
                <th>Asignada a</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(request => (
                <tr key={request.id}>
                  <td>{getRequestTypeLabel(request.requestType)}</td>
                  <td>{request.email}</td>
                  <td>
                    <span className={`status ${getStatusClass(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </td>
                  <td>{new Date(request.createdAt).toLocaleString()}</td>
                  <td>
                    {request.verifiedAt 
                      ? new Date(request.verifiedAt).toLocaleString()
                      : '-'
                    }
                  </td>
                  <td>
                    {request.completedAt 
                      ? new Date(request.completedAt).toLocaleString()
                      : '-'
                    }
                  </td>
                  <td>
                    {request.assignedUser 
                      ? request.assignedUser.name
                      : '-'
                    }
                  </td>
                  <td>
                    <button className="btn btn-sm">
                      Ver detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>No hay solicitudes de derechos</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataRequests;
