import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const BillingCancel = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    toast.info('Proceso de pago cancelado. Puedes intentarlo de nuevo cuando quieras.');
  }, []);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card text-center">
            <div className="card-body">
              <div className="mb-4">
                <i className="bi bi-x-circle-fill text-warning" style={{ fontSize: '4rem' }}></i>
              </div>
              <h2 className="card-title text-warning">Pago Cancelado</h2>
              <p className="card-text">
                Has cancelado el proceso de pago. No se ha realizado ningún cargo.
                Puedes volver a intentarlo cuando quieras.
              </p>
              <div className="mt-4">
                <button 
                  className="btn btn-primary me-2"
                  onClick={() => navigate('/billing')}
                >
                  Volver a Facturación
                </button>
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => navigate('/dashboard')}
                >
                  Ir al Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingCancel;
