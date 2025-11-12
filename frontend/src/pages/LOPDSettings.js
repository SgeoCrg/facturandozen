import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const LOPDSettings = () => {
  const [consents, setConsents] = useState([]);
  const [privacyPolicy, setPrivacyPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [consentsRes, policyRes] = await Promise.all([
        api.get('/lopd/consents'),
        api.get('/lopd/privacy-policies/active')
      ]);

      setConsents(consentsRes.data.consents || []);
      setPrivacyPolicy(policyRes.data.policy);
    } catch (err) {
      setError('Error cargando datos LOPD');
    } finally {
      setLoading(false);
    }
  };

  const handleConsentToggle = async (consentType, granted) => {
    try {
      if (granted) {
        await api.post('/lopd/consents', { consentType });
      } else {
        await api.delete('/lopd/consents', { 
          data: { consentType } 
        });
      }
      loadData();
    } catch (err) {
      setError('Error actualizando consentimiento');
    }
  };

  const getConsentStatus = (consentType) => {
    const consent = consents.find(c => c.consentType === consentType);
    return consent ? consent.granted && !consent.revokedAt : false;
  };

  if (loading) return <div className="loading">Cargando configuración LOPD...</div>;

  return (
    <div className="lopd-settings">
      <div className="page-header">
        <h1>Configuración LOPD</h1>
        <p>Gestiona tus consentimientos y configuración de privacidad</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="lopd-sections">
        {/* Consentimientos */}
        <div className="section">
          <h2>Consentimientos</h2>
          <div className="consent-list">
            <div className="consent-item">
              <div className="consent-info">
                <h3>Procesamiento de datos</h3>
                <p>Consentimiento para el procesamiento de datos personales necesarios para el funcionamiento del servicio</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={getConsentStatus('data_processing')}
                  onChange={(e) => handleConsentToggle('data_processing', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="consent-item">
              <div className="consent-info">
                <h3>Marketing</h3>
                <p>Consentimiento para recibir comunicaciones comerciales y promocionales</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={getConsentStatus('marketing')}
                  onChange={(e) => handleConsentToggle('marketing', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="consent-item">
              <div className="consent-info">
                <h3>Newsletter</h3>
                <p>Consentimiento para recibir boletines informativos y actualizaciones del producto</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={getConsentStatus('newsletter')}
                  onChange={(e) => handleConsentToggle('newsletter', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="consent-item">
              <div className="consent-info">
                <h3>Compartir con terceros</h3>
                <p>Consentimiento para compartir datos con terceros para servicios adicionales</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={getConsentStatus('third_party')}
                  onChange={(e) => handleConsentToggle('third_party', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Política de Privacidad */}
        <div className="section">
          <h2>Política de Privacidad</h2>
          {privacyPolicy ? (
            <div className="privacy-policy">
              <div className="policy-header">
                <h3>{privacyPolicy.title}</h3>
                <p className="policy-meta">
                  Versión {privacyPolicy.version} - 
                  Vigente desde {new Date(privacyPolicy.effectiveDate).toLocaleDateString()}
                </p>
              </div>
              <div className="policy-content">
                <pre>{privacyPolicy.content}</pre>
              </div>
            </div>
          ) : (
            <p>No hay política de privacidad activa</p>
          )}
        </div>

        {/* Historial de Consentimientos */}
        <div className="section">
          <h2>Historial de Consentimientos</h2>
          <div className="consent-history">
            {consents.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Otorgado</th>
                    <th>Revocado</th>
                    <th>Versión</th>
                  </tr>
                </thead>
                <tbody>
                  {consents.map(consent => (
                    <tr key={consent.id}>
                      <td>{consent.consentType}</td>
                      <td>
                        <span className={`status ${consent.granted && !consent.revokedAt ? 'active' : 'revoked'}`}>
                          {consent.granted && !consent.revokedAt ? 'Activo' : 'Revocado'}
                        </span>
                      </td>
                      <td>{consent.grantedAt ? new Date(consent.grantedAt).toLocaleString() : '-'}</td>
                      <td>{consent.revokedAt ? new Date(consent.revokedAt).toLocaleString() : '-'}</td>
                      <td>{consent.version}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No hay historial de consentimientos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LOPDSettings;
