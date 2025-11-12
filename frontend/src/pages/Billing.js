import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import api from '../services/api';
import { toast } from 'react-toastify';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy_key_for_development');

const Billing = () => {
  const [billingStatus, setBillingStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBillingStatus();
  }, []);

  const fetchBillingStatus = async () => {
    try {
      const response = await api.get('/billing/status');
      setBillingStatus(response.data);
    } catch (error) {
      console.error('Error fetching billing status:', error);
      toast.error('Error al cargar información de facturación');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan) => {
    setActionLoading(true);
    try {
      const response = await api.post('/billing/checkout', { plan });
      
      if (response.data.success) {
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({
          sessionId: response.data.sessionId
        });

        if (error) {
          toast.error('Error al procesar el pago');
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Error al procesar la solicitud');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setActionLoading(true);
    try {
      const response = await api.post('/billing/portal');
      
      if (response.data.success) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      toast.error('Error al acceder al portal de facturación');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar tu suscripción? Podrás seguir usando el servicio hasta el final del período actual.')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await api.post('/billing/cancel', { cancelAtPeriodEnd: true });
      
      if (response.data.success) {
        toast.success('Suscripción cancelada. Podrás seguir usando el servicio hasta el final del período actual.');
        fetchBillingStatus();
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Error al cancelar la suscripción');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setActionLoading(true);
    try {
      const response = await api.post('/billing/reactivate');
      
      if (response.data.success) {
        toast.success('Suscripción reactivada correctamente');
        fetchBillingStatus();
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast.error('Error al reactivar la suscripción');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getStatusBadge = (status) => {
    const badges = {
      trial: 'badge-warning',
      active: 'badge-success',
      cancelled: 'badge-danger',
      expired: 'badge-secondary'
    };
    
    const labels = {
      trial: 'Prueba',
      active: 'Activo',
      cancelled: 'Cancelado',
      expired: 'Expirado'
    };

    return (
      <span className={`badge ${badges[status] || 'badge-secondary'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPlanPrice = (plan) => {
    return plan === 'pro' ? 49 : 19;
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2">Cargando información de facturación...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!billingStatus) {
    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="alert alert-danger">
              <h4>Error</h4>
              <p>No se pudo cargar la información de facturación.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { subscription, payments } = billingStatus;

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="bi bi-credit-card me-2"></i>
                Facturación y Suscripción
              </h4>
            </div>
            <div className="card-body">
              {/* Estado actual */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <h6>Plan Actual</h6>
                  <div className="d-flex align-items-center">
                    <span className={`badge badge-lg ${subscription.plan === 'pro' ? 'bg-primary' : 'bg-success'} me-2`}>
                      {subscription.plan === 'pro' ? 'PRO' : 'BASIC'}
                    </span>
                    <span className="h5 mb-0">€{subscription.priceMonthly}/mes</span>
                  </div>
                </div>
                <div className="col-md-6">
                  <h6>Estado</h6>
                  {getStatusBadge(subscription.status)}
                </div>
              </div>

              {/* Información del período */}
              {subscription.status === 'trial' && subscription.trialEndsAt && (
                <div className="alert alert-info">
                  <h6><i className="bi bi-clock me-2"></i>Período de Prueba</h6>
                  <p className="mb-0">
                    Tu período de prueba termina el <strong>{formatDate(subscription.trialEndsAt)}</strong>.
                    {subscription.plan === 'basic' ? ' Actualiza a PRO para acceder a Verifactu.' : ''}
                  </p>
                </div>
              )}

              {subscription.status === 'active' && subscription.currentPeriodEnd && (
                <div className="alert alert-success">
                  <h6><i className="bi bi-check-circle me-2"></i>Suscripción Activa</h6>
                  <p className="mb-0">
                    Próxima facturación: <strong>{formatDate(subscription.currentPeriodEnd)}</strong>
                  </p>
                </div>
              )}

              {subscription.cancelAtPeriodEnd && (
                <div className="alert alert-warning">
                  <h6><i className="bi bi-exclamation-triangle me-2"></i>Suscripción Cancelada</h6>
                  <p className="mb-0">
                    Tu suscripción se cancelará el <strong>{formatDate(subscription.currentPeriodEnd)}</strong>.
                    Puedes reactivarla en cualquier momento.
                  </p>
                </div>
              )}

              {/* Acciones */}
              <div className="row">
                <div className="col-12">
                  <h6>Acciones</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {subscription.status === 'trial' && (
                      <>
                        {subscription.plan === 'basic' && (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleUpgrade('pro')}
                            disabled={actionLoading}
                          >
                            {actionLoading ? (
                              <span className="spinner-border spinner-border-sm me-2" role="status" />
                            ) : (
                              <i className="bi bi-arrow-up me-2"></i>
                            )}
                            Actualizar a PRO (€49/mes)
                          </button>
                        )}
                        <button
                          className="btn btn-success"
                          onClick={() => handleUpgrade('basic')}
                          disabled={actionLoading}
                        >
                          {actionLoading ? (
                            <span className="spinner-border spinner-border-sm me-2" role="status" />
                          ) : (
                            <i className="bi bi-check-circle me-2"></i>
                          )}
                          Activar BASIC (€19/mes)
                        </button>
                      </>
                    )}

                    {subscription.status === 'active' && (
                      <>
                        {subscription.plan === 'basic' && (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleUpgrade('pro')}
                            disabled={actionLoading}
                          >
                            {actionLoading ? (
                              <span className="spinner-border spinner-border-sm me-2" role="status" />
                            ) : (
                              <i className="bi bi-arrow-up me-2"></i>
                            )}
                            Actualizar a PRO
                          </button>
                        )}
                        
                        {subscription.hasStripeSubscription && (
                          <button
                            className="btn btn-outline-primary"
                            onClick={handleManageBilling}
                            disabled={actionLoading}
                          >
                            {actionLoading ? (
                              <span className="spinner-border spinner-border-sm me-2" role="status" />
                            ) : (
                              <i className="bi bi-gear me-2"></i>
                            )}
                            Gestionar Facturación
                          </button>
                        )}

                        {!subscription.cancelAtPeriodEnd && (
                          <button
                            className="btn btn-outline-danger"
                            onClick={handleCancelSubscription}
                            disabled={actionLoading}
                          >
                            {actionLoading ? (
                              <span className="spinner-border spinner-border-sm me-2" role="status" />
                            ) : (
                              <i className="bi bi-x-circle me-2"></i>
                            )}
                            Cancelar Suscripción
                          </button>
                        )}

                        {subscription.cancelAtPeriodEnd && (
                          <button
                            className="btn btn-success"
                            onClick={handleReactivateSubscription}
                            disabled={actionLoading}
                          >
                            {actionLoading ? (
                              <span className="spinner-border spinner-border-sm me-2" role="status" />
                            ) : (
                              <i className="bi bi-arrow-clockwise me-2"></i>
                            )}
                            Reactivar Suscripción
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          {/* Planes disponibles */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">Planes Disponibles</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <h6>BASIC - €19/mes</h6>
                <ul className="list-unstyled small">
                  <li><i className="bi bi-check text-success me-2"></i>Facturas ilimitadas</li>
                  <li><i className="bi bi-check text-success me-2"></i>Clientes y productos</li>
                  <li><i className="bi bi-check text-success me-2"></i>PDF profesional</li>
                  <li><i className="bi bi-check text-success me-2"></i>Soporte email</li>
                </ul>
              </div>
              
              <div>
                <h6>PRO - €49/mes</h6>
                <ul className="list-unstyled small">
                  <li><i className="bi bi-check text-success me-2"></i>Todo de BASIC</li>
                  <li><i className="bi bi-check text-success me-2"></i>Verifactu integrado</li>
                  <li><i className="bi bi-check text-success me-2"></i>Firma digital</li>
                  <li><i className="bi bi-check text-success me-2"></i>Soporte prioritario</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Historial de pagos */}
          {payments && payments.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Últimos Pagos</h6>
              </div>
              <div className="card-body">
                {payments.slice(0, 5).map((payment, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <small className="text-muted">{formatDate(payment.createdAt)}</small>
                      <div>€{payment.amount}</div>
                    </div>
                    <span className={`badge ${
                      payment.status === 'succeeded' ? 'bg-success' :
                      payment.status === 'failed' ? 'bg-danger' :
                      'bg-warning'
                    }`}>
                      {payment.status === 'succeeded' ? 'Pagado' :
                       payment.status === 'failed' ? 'Fallido' :
                       'Pendiente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Billing;
