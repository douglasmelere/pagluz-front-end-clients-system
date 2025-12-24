import { useState, useEffect } from 'react';
import {
  Settings,
  DollarSign,
  History,
  BarChart3,
  Users,
  Zap,
  TrendingUp,
  Calendar,
  User,
  Save,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';
import { KwhPriceHistory } from '../types';

export default function ConfiguracoesSistema() {
  const { kwhPrice, kwhPriceHistory, systemStats, loading, error, setKwhPriceValue, fetchKwhPriceHistory } = useSettings();
  const toast = useToast();
  const [newPrice, setNewPrice] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (kwhPrice !== null) {
      setNewPrice(kwhPrice.toString());
    }
  }, [kwhPrice]);

  const handleUpdatePrice = async () => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      toast.showError('Por favor, insira um valor válido para o kWh');
      return;
    }

    try {
      setUpdating(true);
      await setKwhPriceValue(price);
      toast.showSuccess('Preço do kWh atualizado com sucesso!');
    } catch (error) {
      toast.showError('Erro ao atualizar preço do kWh');
    } finally {
      setUpdating(false);
    }
  };

  const loadHistory = async () => {
    setShowHistory(true);
    // Fetch the latest history data when user clicks to view history
    try {
      await fetchKwhPriceHistory();
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.showError('Erro ao carregar histórico de alterações');
    }
  };

  if (loading && kwhPrice === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-slate-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-emerald-600 shadow-2xl rounded-b-3xl overflow-hidden">
        <div className="w-full px-4 md:px-6 py-6 md:py-8">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                  <Settings className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">Configurações do Sistema</h1>
                  <p className="text-slate-200 text-lg mt-1">Gerencie configurações e valores do sistema</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Valor Atual do kWh */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <DollarSign className="h-6 w-6 mr-3 text-green-600" />
            Valor Atual do kWh
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-green-800">Valor Atual</h4>
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-700 mb-2">
                  R$ {kwhPrice?.toFixed(2) || '0,00'}
                </div>
                <div className="text-sm text-green-600">
                  Última atualização: {systemStats?.lastUpdated ? new Date(systemStats.lastUpdated).toLocaleDateString('pt-BR') : 'N/A'}
                </div>
                <div className="text-sm text-green-600">
                  Atualizado por: Sistema
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Novo Valor do kWh
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="0.90"
                  />
                  <button
                    onClick={handleUpdatePrice}
                    disabled={updating || !newPrice}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    {updating ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>{updating ? 'Salvando...' : 'Salvar'}</span>
                  </button>
                </div>
              </div>

              <button
                onClick={loadHistory}
                className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <History className="h-4 w-4" />
                <span>Ver Histórico de Alterações</span>
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas do Sistema */}
        {systemStats && (
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              <BarChart3 className="h-6 w-6 mr-3 text-blue-600" />
              Estatísticas do Sistema
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-blue-800">Consumidores</h4>
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-700 mb-2">
                  {systemStats?.totalConsumers?.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-blue-600">Total cadastrados</div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-purple-800">Representantes</h4>
                  <User className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-purple-700 mb-2">
                  {systemStats?.totalRepresentatives?.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-purple-600">Ativos no sistema</div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-orange-800">Comissões</h4>
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-orange-700 mb-2">
                  {systemStats?.totalCommissions?.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-orange-600">
                  Comissões geradas no sistema
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-green-800">Valor Total</h4>
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-700 mb-2">
                  R$ {systemStats?.totalCommissionsValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                </div>
                <div className="text-sm text-green-600">
                  Valor total de comissões
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Histórico de Alterações */}
        {showHistory && (
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              <History className="h-6 w-6 mr-3 text-slate-600" />
              Histórico de Alterações do kWh
            </h3>
            
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-100 to-slate-200 border-b border-slate-300">
                    <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Valor</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Alterado Por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {kwhPriceHistory && kwhPriceHistory.length > 0 ? kwhPriceHistory.filter(entry => entry && entry.id).map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-all duration-200">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                          <span className="text-sm text-slate-900">
                            {entry.createdAt && !isNaN(new Date(entry.createdAt).getTime()) 
                              ? new Date(entry.createdAt).toLocaleDateString('pt-BR')
                              : 'Data inválida'
                            }
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-bold text-green-600">
                          {entry.value !== null && entry.value !== undefined 
                            ? `R$ ${entry.value.toFixed(2).replace('.', ',')}`
                            : 'N/A'
                          }
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                          entry.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {entry.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-slate-400" />
                          <span className="text-sm text-slate-900">
                            {entry.updatedBy || entry.createdBy || 'Sistema'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        <div className="flex flex-col items-center space-y-2">
                          <div>Nenhum histórico de alterações encontrado</div>
                          <div className="text-xs text-slate-400">
                            O sistema está mostrando apenas a configuração atual.
                            Para ver o histórico completo, verifique se o backend está implementado corretamente.
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
