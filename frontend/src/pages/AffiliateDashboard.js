import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const AffiliateDashboard = () => {
  const [affiliate, setAffiliate] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [affiliateCode, setAffiliateCode] = useState('');

  useEffect(() => {
    // En un sistema real, obtendrías el código del afiliado del usuario logueado
    // Por ahora, lo pedimos manualmente
    const code = prompt('Introduce tu código de afiliado:');
    if (code) {
      setAffiliateCode(code);
      loadAffiliateData(code);
    } else {
      setLoading(false);
    }
  }, []);

  const loadAffiliateData = async (code) => {
    try {
      // Validar código
      const validateResponse = await fetch(`/api/public/affiliate/${code}/validate`);
      const validateData = await validateResponse.json();
      
      if (!validateData.valid) {
        toast.error('Código de afiliado inválido');
        setLoading(false);
        return;
      }

      // Obtener datos del afiliado (esto requeriría autenticación en un sistema real)
      // Por ahora simulamos los datos
      setAffiliate({
        code: code,
        name: 'Afiliado Demo',
        email: 'afiliado@demo.com',
        commissionRate: 20,
        totalEarnings: 150.00,
        paidEarnings: 50.00,
        pendingEarnings: 100.00,
        referralCount: 5,
        conversionCount: 2
      });

      // Simular referidos
      setReferrals([
        {
          id: 1,
          tenantName: 'Empresa A',
          status: 'converted',
          conversionDate: '2024-01-15',
          commissionAmount: 25.00
        },
        {
          id: 2,
          tenantName: 'Empresa B',
          status: 'trial',
          conversionDate: null,
          commissionAmount: 0
        }
      ]);

      // Simular comisiones
      setCommissions([
        {
          id: 1,
          amount: 25.00,
          status: 'paid',
          paidAt: '2024-01-20',
          paymentMethod: 'bank_transfer'
        },
        {
          id: 2,
          amount: 50.00,
          status: 'pending',
          paidAt: null,
          paymentMethod: null
        }
      ]);

    } catch (error) {
      toast.error('Error cargando datos del afiliado');
    } finally {
      setLoading(false);
    }
  };

  const generateAffiliateLink = async () => {
    try {
      const response = await fetch(`/api/public/affiliate/${affiliateCode}/link`);
      const data = await response.json();
      
      if (data.success) {
        navigator.clipboard.writeText(data.link);
        toast.success('Enlace copiado al portapapeles');
      }
    } catch (error) {
      toast.error('Error generando enlace');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Panel de Afiliado</h1>
          <p className="text-gray-600">Introduce tu código de afiliado para acceder</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Afiliado</h1>
        <p className="text-gray-600">Gestiona tus referidos y comisiones</p>
      </div>

      {/* Información del afiliado */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{affiliate.name}</h2>
            <p className="text-gray-600">Código: {affiliate.code}</p>
            <p className="text-gray-600">Email: {affiliate.email}</p>
            <p className="text-gray-600">Comisión: {affiliate.commissionRate}%</p>
          </div>
          <button
            onClick={generateAffiliateLink}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Copiar Enlace
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Total Referidos</h3>
          <p className="text-3xl font-bold text-blue-600">{affiliate.referralCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Conversiones</h3>
          <p className="text-3xl font-bold text-green-600">{affiliate.conversionCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Ganancias Totales</h3>
          <p className="text-3xl font-bold text-purple-600">€{affiliate.totalEarnings}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Pendientes</h3>
          <p className="text-3xl font-bold text-orange-600">€{affiliate.pendingEarnings}</p>
        </div>
      </div>

      {/* Referidos */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Referidos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Conversión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comisión
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {referrals.map((referral) => (
                <tr key={referral.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {referral.tenantName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      referral.status === 'converted' 
                        ? 'bg-green-100 text-green-800' 
                        : referral.status === 'trial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {referral.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {referral.conversionDate ? new Date(referral.conversionDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    €{referral.commissionAmount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comisiones */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Historial de Comisiones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Pago
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {commissions.map((commission) => (
                <tr key={commission.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    €{commission.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      commission.status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : commission.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {commission.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {commission.paymentMethod || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {commission.paidAt ? new Date(commission.paidAt).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AffiliateDashboard;
