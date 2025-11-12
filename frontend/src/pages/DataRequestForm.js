import React, { useState } from 'react';
import { api } from '../services/api';

const DataRequestForm = () => {
  const [formData, setFormData] = useState({
    requestType: '',
    email: '',
    name: '',
    nif: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/lopd/data-requests', formData);
      setSuccess(true);
      setFormData({
        requestType: '',
        email: '',
        name: '',
        nif: '',
        description: ''
      });
    } catch (err) {
      setError('Error enviando solicitud. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getRequestTypeDescription = (type) => {
    const descriptions = {
      'access': 'Solicitar acceso a todos los datos personales que tenemos sobre usted',
      'rectification': 'Corregir datos personales inexactos o incompletos',
      'erasure': 'Solicitar la eliminación de sus datos personales',
      'portability': 'Recibir sus datos en un formato estructurado y legible',
      'restriction': 'Limitar el procesamiento de sus datos personales',
      'objection': 'Oponerse al procesamiento de sus datos personales'
    };
    return descriptions[type] || '';
  };

  if (success) {
    return (
      <div className="data-request-success">
        <div className="success-message">
          <h2>✅ Solicitud Enviada</h2>
          <p>
            Hemos recibido su solicitud de derechos LOPD. 
            Se ha enviado un email de verificación a <strong>{formData.email}</strong>.
          </p>
          <p>
            Por favor, revise su bandeja de entrada y haga clic en el enlace 
            de verificación para completar el proceso.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => setSuccess(false)}
          >
            Enviar otra solicitud
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="data-request-form">
      <div className="form-container">
        <div className="form-header">
          <h1>Ejercer Derechos LOPD</h1>
          <p>
            Como interesado, tiene derecho a solicitar información sobre 
            sus datos personales y ejercer sus derechos según la LOPD.
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Tipo de Solicitud *</label>
            <select
              value={formData.requestType}
              onChange={(e) => setFormData({...formData, requestType: e.target.value})}
              required
            >
              <option value="">Seleccionar tipo de solicitud</option>
              <option value="access">Acceso a datos</option>
              <option value="rectification">Rectificación</option>
              <option value="erasure">Supresión</option>
              <option value="portability">Portabilidad</option>
              <option value="restriction">Limitación</option>
              <option value="objection">Oposición</option>
            </select>
            {formData.requestType && (
              <p className="field-description">
                {getRequestTypeDescription(formData.requestType)}
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              placeholder="su@email.com"
            />
            <p className="field-description">
              Email donde recibirá la confirmación y respuesta
            </p>
          </div>

          <div className="form-group">
            <label>Nombre completo</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Su nombre completo"
            />
          </div>

          <div className="form-group">
            <label>NIF/DNI</label>
            <input
              type="text"
              value={formData.nif}
              onChange={(e) => setFormData({...formData, nif: e.target.value})}
              placeholder="12345678Z"
            />
            <p className="field-description">
              Opcional, pero ayuda a identificar sus datos
            </p>
          </div>

          <div className="form-group">
            <label>Descripción adicional</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="4"
              placeholder="Describa su solicitud con más detalle si es necesario..."
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" required />
              <span>
                Acepto que mis datos sean procesados para gestionar esta solicitud 
                según la política de privacidad
              </span>
            </label>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary btn-large"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
        </form>

        <div className="form-footer">
          <h3>Información importante:</h3>
          <ul>
            <li>Responderemos a su solicitud en un plazo máximo de 30 días</li>
            <li>Puede que necesitemos verificar su identidad</li>
            <li>Algunos datos pueden estar sujetos a obligaciones legales de conservación</li>
            <li>Para más información, consulte nuestra política de privacidad</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DataRequestForm;
