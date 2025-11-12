import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const BillingSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      toast.success('¡Pago procesado correctamente! Tu suscripción está activa.');
    } else {
      toast.error('Error: No se encontró información de la sesión de pago.');
    }

    // Redirigir a billing después de 3 segundos
    const timer = setTimeout(() => {
      navigate('/billing');
    }, 3000);

    return () => clearTimeout(timer);
  }, [sessionId, navigate]);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card text-center">
            <div className="card-body">
              <div className="mb-4">
                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
              </div>
              <h2 className="card-title text-success">¡Pago Exitoso!</h2>
              <p className="card-text">
                Tu suscripción ha sido activada correctamente. Ya puedes disfrutar de todas las funcionalidades de tu plan.
              </p>
              <div className="mt-4">
                <button 
                  className="btn btn-primary me-2"
                  onClick={() => navigate('/billing')}
                >
                  Ver Facturación
                </button>
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => navigate('/dashboard')}
                >
                  Ir al Dashboard
                </button>
              </div>
              <div className="mt-3">
                <small className="text-muted">
                  Serás redirigido automáticamente en unos segundos...
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSuccess;
