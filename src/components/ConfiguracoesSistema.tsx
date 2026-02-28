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
  Loader,
  Percent
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';
import Button from './ui/Button';
import Input from './ui/Input';
import LoadingSpinner from './common/LoadingSpinner';

export default function ConfiguracoesSistema() {
  const { kwhPrice, kwhPriceHistory, systemStats, loading, error, setKwhPriceValue, fetchKwhPriceHistory,
    fioBPercentage, fioBHistory, fioBError, setFioBPercentageValue, fetchFioBHistory
  } = useSettings();
  const toast = useToast();
  const [newPrice, setNewPrice] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Fio B states
  const [newFioB, setNewFioB] = useState('');
  const [showFioBHistory, setShowFioBHistory] = useState(false);
  const [updatingFioB, setUpdatingFioB] = useState(false);

  useEffect(() => {
    if (kwhPrice != null) {
      setNewPrice(kwhPrice.toString());
    }
  }, [kwhPrice]);

  useEffect(() => {
    if (fioBPercentage != null) {
      setNewFioB(fioBPercentage.toString());
    }
  }, [fioBPercentage]);

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

  const handleUpdateFioB = async () => {
    const percentage = parseFloat(newFioB);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast.showError('Por favor, insira um valor entre 0 e 100 para o Fio B');
      return;
    }
    try {
      setUpdatingFioB(true);
      await setFioBPercentageValue(percentage);
      toast.showSuccess('Porcentagem do Fio B atualizada com sucesso!');
    } catch (error) {
      toast.showError('Erro ao atualizar porcentagem do Fio B');
    } finally {
      setUpdatingFioB(false);
    }
  };

  const loadFioBHistory = async () => {
    setShowFioBHistory(true);
    try {
      await fetchFioBHistory();
    } catch (error) {
      toast.showError('Erro ao carregar histórico do Fio B');
    }
  };

  const loadHistory = async () => {
    setShowHistory(true);
    try {
      await fetchKwhPriceHistory();
    } catch (error) {
      toast.showError('Erro ao carregar histórico de alterações');
    }
  };

  if (loading && kwhPrice === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center shadow-lg shadow-slate-500/20 text-white">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-slate-900">
                  Configurações do Sistema
                </h1>
                <p className="text-slate-500 font-medium text-sm font-display">
                  Gerencie configurações e valores do sistema
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Valor Atual do kWh */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center font-display">
            <DollarSign className="h-6 w-6 mr-3 text-emerald-600" />
            Valor Atual do kWh
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Valor Atual */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-emerald-800 font-display">Valor Atual</h4>
                <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="text-4xl font-bold text-emerald-700 mb-3 font-display">
                R$ {kwhPrice?.toFixed(2) || '0,00'}
              </div>
              <div className="space-y-1">
                <div className="text-sm text-emerald-600 font-display">
                  Última atualização: {systemStats?.lastUpdated ? new Date(systemStats.lastUpdated).toLocaleDateString('pt-BR') : 'N/A'}
                </div>
                <div className="text-sm text-emerald-600 font-display">
                  Atualizado por: Sistema
                </div>
              </div>
            </div>

            {/* Atualizar Valor */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 font-display">
                  Novo Valor do kWh
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="0.90"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleUpdatePrice}
                    disabled={updating || !newPrice}
                    showArrow
                  >
                    {updating ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Button
                onClick={loadHistory}
                variant="secondary"
                className="w-full"
              >
                <History className="h-4 w-4 mr-2" />
                Ver Histórico de Alterações
              </Button>
            </div>
          </div>
        </div>

        {/* Porcentagem do Fio B */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center font-display">
            <Percent className="h-6 w-6 mr-3 text-amber-600" />
            Porcentagem do Fio B
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Valor Atual */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-amber-800 font-display">Valor Atual</h4>
                <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center">
                  <Percent className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="text-4xl font-bold text-amber-700 mb-3 font-display">
                {fioBPercentage !== null ? `${fioBPercentage}%` : '—'}
              </div>
              <div className="space-y-1">
                <div className="text-sm text-amber-600 font-display">
                  Utilizado no cálculo de propostas comerciais
                </div>
                {fioBHistory.length > 0 && (
                  <div className="text-sm text-amber-600 font-display">
                    Última atualização: {new Date(fioBHistory[0]?.updatedAt).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            </div>

            {/* Atualizar Valor */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 font-display">
                  Nova Porcentagem do Fio B (0–100)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={newFioB}
                    onChange={(e) => setNewFioB(e.target.value)}
                    placeholder="Ex: 33.5"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleUpdateFioB}
                    disabled={updatingFioB || !newFioB}
                    showArrow
                  >
                    {updatingFioB ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
                {fioBError && (
                  <p className="text-red-600 text-xs mt-2 font-display">{fioBError}</p>
                )}
              </div>

              <Button
                onClick={loadFioBHistory}
                variant="secondary"
                className="w-full"
              >
                <History className="h-4 w-4 mr-2" />
                Ver Histórico de Alterações
              </Button>
            </div>
          </div>
        </div>

        {/* Histórico do Fio B */}
        {showFioBHistory && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center font-display">
              <History className="h-6 w-6 mr-3 text-amber-600" />
              Histórico de Alterações do Fio B
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium font-display border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap">Data</th>
                    <th className="px-6 py-4 whitespace-nowrap">Porcentagem</th>
                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fioBHistory && fioBHistory.length > 0 ? fioBHistory.filter(entry => entry && entry.id).map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-900">
                            {entry.createdAt && !isNaN(new Date(entry.createdAt).getTime())
                              ? new Date(entry.createdAt).toLocaleDateString('pt-BR')
                              : 'Data inválida'
                            }
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-amber-600">
                          {entry.value !== null && entry.value !== undefined
                            ? `${entry.value}%`
                            : 'N/A'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${entry.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                          {entry.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Ativo
                            </>
                          ) : (
                            'Inativo'
                          )}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center">
                            <History className="h-6 w-6 text-slate-400" />
                          </div>
                          <p className="text-slate-500 font-display">Nenhum histórico de alterações encontrado</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Estatísticas do Sistema */}
        {systemStats && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center font-display">
              <BarChart3 className="h-6 w-6 mr-3 text-blue-600" />
              Estatísticas do Sistema
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 font-display">Consumidores</p>
                  <p className="text-3xl font-bold text-blue-600 font-display mt-1">
                    {systemStats?.totalConsumers?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-display">Total cadastrados</p>
                </div>
                <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 font-display">Representantes</p>
                  <p className="text-3xl font-bold text-purple-600 font-display mt-1">
                    {systemStats?.totalRepresentatives?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-display">Ativos no sistema</p>
                </div>
                <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                  <User className="h-6 w-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 font-display">Comissões</p>
                  <p className="text-3xl font-bold text-orange-600 font-display mt-1">
                    {systemStats?.totalCommissions?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-display">Geradas no sistema</p>
                </div>
                <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 font-display">Valor Total</p>
                  <p className="text-2xl font-bold text-emerald-600 font-display mt-1">
                    R$ {systemStats?.totalCommissionsValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-display">Total de comissões</p>
                </div>
                <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <Zap className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Histórico de Alterações */}
        {showHistory && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center font-display">
              <History className="h-6 w-6 mr-3 text-slate-600" />
              Histórico de Alterações do kWh
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium font-display border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap">Data</th>
                    <th className="px-6 py-4 whitespace-nowrap">Valor</th>
                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 whitespace-nowrap">Alterado Por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kwhPriceHistory && kwhPriceHistory.length > 0 ? kwhPriceHistory.filter(entry => entry && entry.id).map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-900">
                            {entry.createdAt && !isNaN(new Date(entry.createdAt).getTime())
                              ? new Date(entry.createdAt).toLocaleDateString('pt-BR')
                              : 'Data inválida'
                            }
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-emerald-600">
                          {entry.value !== null && entry.value !== undefined
                            ? `R$ ${entry.value.toFixed(2).replace('.', ',')}`
                            : 'N/A'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${entry.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                          {entry.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Ativo
                            </>
                          ) : (
                            'Inativo'
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-900">
                            {entry.updatedBy || entry.createdBy || 'Sistema'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center">
                            <History className="h-6 w-6 text-slate-400" />
                          </div>
                          <p className="text-slate-500 font-display">Nenhum histórico de alterações encontrado</p>
                          <p className="text-xs text-slate-400 max-w-md font-display">
                            O sistema está mostrando apenas a configuração atual.
                            Para ver o histórico completo, verifique se o backend está implementado corretamente.
                          </p>
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
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span className="text-red-700 font-display">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
