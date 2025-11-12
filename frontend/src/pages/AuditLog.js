import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const AuditLog = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    action: '',
    riskLevel: ''
  });

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.action) params.append('action', filters.action);
      if (filters.riskLevel) params.append('riskLevel', filters.riskLevel);

      const response = await api.get(`/lopd/reports/activity?${params}`);
      setActivities(response.data.activities || []);
    } catch (err) {
      setError('Error cargando actividades');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({...filters, [key]: value});
  };

  const getRiskLevelClass = (level) => {
    const classes = {
      'low': 'risk-low',
      'medium': 'risk-medium',
      'high': 'risk-high',
      'critical': 'risk-critical'
    };
    return classes[level] || '';
  };

  const getRiskLevelLabel = (level) => {
    const labels = {
      'low': 'Bajo',
      'medium': 'Medio',
      'high': 'Alto',
      'critical': 'Crítico'
    };
    return labels[level] || level;
  };

  const getActionLabel = (action) => {
    const labels = {
      'login': 'Inicio de sesión',
      'logout': 'Cierre de sesión',
      'create': 'Creación',
      'update': 'Actualización',
      'delete': 'Eliminación',
      'view': 'Consulta',
      'export': 'Exportación',
      'consent_granted': 'Consentimiento otorgado',
      'consent_revoked': 'Consentimiento revocado',
      'data_request_created': 'Solicitud creada',
      'data_request_verified': 'Solicitud verificada',
      'data_request_processed': 'Solicitud procesada',
      'data_deletion': 'Eliminación de datos'
    };
    return labels[action] || action;
  };

  if (loading) return <div className="loading">Cargando auditoría...</div>;

  return (
    <div className="audit-log">
      <div className="page-header">
        <h1>Registro de Auditoría</h1>
        <p>Monitorea todas las actividades del sistema</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="filters-section">
        <h3>Filtros</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Fecha inicio</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Fecha fin</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Usuario</label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              placeholder="ID del usuario"
            />
          </div>

          <div className="filter-group">
            <label>Acción</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
            >
              <option value="">Todas las acciones</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="create">Creación</option>
              <option value="update">Actualización</option>
              <option value="delete">Eliminación</option>
              <option value="view">Consulta</option>
              <option value="export">Exportación</option>
              <option value="consent_granted">Consentimiento otorgado</option>
              <option value="consent_revoked">Consentimiento revocado</option>
              <option value="data_request_created">Solicitud creada</option>
              <option value="data_deletion">Eliminación de datos</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Nivel de riesgo</label>
            <select
              value={filters.riskLevel}
              onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
            >
              <option value="">Todos los niveles</option>
              <option value="low">Bajo</option>
              <option value="medium">Medio</option>
              <option value="high">Alto</option>
              <option value="critical">Crítico</option>
            </select>
          </div>

          <div className="filter-actions">
            <button 
              className="btn btn-primary"
              onClick={loadActivities}
            >
              Aplicar filtros
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setFilters({
                  startDate: '',
                  endDate: '',
                  userId: '',
                  action: '',
                  riskLevel: ''
                });
                loadActivities();
              }}
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de actividades */}
      <div className="activities-list">
        <h3>Actividades ({activities.length})</h3>
        
        {activities.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>Descripción</th>
                  <th>Riesgo</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {activities.map(activity => (
                  <tr key={activity.id}>
                    <td>{new Date(activity.createdAt).toLocaleString()}</td>
                    <td>
                      {activity.user 
                        ? `${activity.user.name} (${activity.user.email})`
                        : 'Sistema'
                      }
                    </td>
                    <td>{getActionLabel(activity.action)}</td>
                    <td>
                      {activity.entityType && activity.entityId
                        ? `${activity.entityType} (${activity.entityId})`
                        : '-'
                      }
                    </td>
                    <td>{activity.description}</td>
                    <td>
                      <span className={`risk-level ${getRiskLevelClass(activity.riskLevel)}`}>
                        {getRiskLevelLabel(activity.riskLevel)}
                      </span>
                    </td>
                    <td>{activity.ipAddress || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No hay actividades que coincidan con los filtros</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
