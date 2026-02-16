import React from 'react';
import { Generator } from '../types';
import {
  Edit,
  Trash2,
  Users,
  Sun,
  Wind,
  Droplet,
  Leaf,
  Factory,
  Activity,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { GeneratorWithStats } from './GeneratorCard';

interface GeneratorTableProps {
  generators: GeneratorWithStats[];
  onEdit: (generator: Generator) => void;
  onDelete: (id: string) => void;
}

export default function GeneratorTable({ generators, onEdit, onDelete }: GeneratorTableProps) {
  const renderSourceTypeIcon = (sourceType: string, className: string) => {
    const normalizedType = (sourceType || '').toUpperCase().trim();
    switch (normalizedType) {
      case 'SOLAR':
        return <Sun className={className} />;
      case 'WIND':
        return <Wind className={className} />;
      case 'HYDRO':
      case 'HIDRO':
        return <Droplet className={className} />;
      case 'BIOMASS':
      case 'BIOMASSA':
        return <Leaf className={className} />;
      default:
        return <Factory className={className} />;
    }
  };

  const getStatusBadge = (status: string, alocacao: number) => {
    const config: any = {
      'UNDER_ANALYSIS': { label: 'Em Análise', color: 'bg-yellow-100 text-yellow-700', icon: <Activity className="h-3 w-3" /> },
      'AWAITING_ALLOCATION': { label: `Alocando (${isNaN(alocacao) ? '0.0' : alocacao.toFixed(1)}%)`, color: 'bg-blue-100 text-blue-700', icon: <BarChart3 className="h-3 w-3" /> },
      'FULLY_ALLOCATED': { label: '100% Alocada', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" /> }
    };

    // Default fallback
    const statusConfig = config[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: null };

    return (
      <span className={`inline-flex items-center gap-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
        {statusConfig.icon}
        {statusConfig.label}
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-white/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/50">
            <tr className="text-left text-xs font-semibold font-display text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4">Gerador</th>
              <th className="px-6 py-4">Tipo/Potência</th>
              <th className="px-6 py-4">Localização</th>
              <th className="px-6 py-4">Consumidores</th>
              <th className="px-6 py-4">Alocação</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-8 py-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {generators.map(c => (
              <tr key={c.id} className="hover:bg-accent/5 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-x-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center shadow-sm">
                      {renderSourceTypeIcon(c.sourceType, 'h-5 w-5 text-orange-500')}
                    </div>
                    <div>
                      <div className="text-sm font-semibold font-display text-slate-900">{c.ownerName}</div>
                      <div className="text-xs text-slate-500 font-medium">{c.cpfCnpj}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="font-semibold text-slate-700 capitalize">{c.sourceType.toLowerCase()}</div>
                  <div className="text-slate-500">{c.installedPower?.toLocaleString()} kW</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="font-semibold text-slate-700">{c.city}, {c.state}</div>
                  <div className="text-slate-500">{c.concessionaire}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-x-1.5">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold">{c.consumersCount}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-40">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">{isNaN(c.porcentagemAlocada) ? '0.0' : c.porcentagemAlocada.toFixed(1)}%</span>
                      <span className="text-slate-500">100%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${c.porcentagemAlocada >= 100 ? 'bg-emerald-500' : 'bg-accent'}`}
                        style={{ width: `${Math.min(c.porcentagemAlocada || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(c.statusReal, c.porcentagemAlocada)}
                </td>
                <td className="px-8 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-x-1">
                    <button
                      onClick={() => onEdit(c)}
                      className="p-2 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-xl transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(c.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {generators.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            Nenhum gerador encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
