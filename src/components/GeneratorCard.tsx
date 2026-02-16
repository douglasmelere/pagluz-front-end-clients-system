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
  BarChart3,
  MapPin,
  Zap,
  MoreVertical
} from 'lucide-react';

export interface GeneratorWithStats extends Generator {
  porcentagemAlocada: number;
  statusReal: string;
  consumersCount: number;
}

interface GeneratorCardProps {
  generator: GeneratorWithStats;
  onEdit: (generator: Generator) => void;
  onDelete: (id: string) => void;
}

export default function GeneratorCard({ generator, onEdit, onDelete }: GeneratorCardProps) {
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
    <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center shadow-sm">
            {renderSourceTypeIcon(generator.sourceType, 'h-6 w-6 text-orange-500')}
          </div>
          <div>
            <h3 className="font-semibold font-display text-slate-900 line-clamp-1">{generator.ownerName}</h3>
            <p className="text-xs text-slate-500 font-medium">{generator.cpfCnpj}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(generator)}
            className="p-2 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-xl transition-colors"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(generator.id)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 font-display">Potência</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 font-display">{generator.installedPower?.toLocaleString()} kW</p>
        </div>
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 font-display">Cidade</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 truncate font-display">{generator.city}, {generator.state}</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Status Line */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Status</span>
          {getStatusBadge(generator.statusReal, generator.porcentagemAlocada)}
        </div>

        {/* Consumers Count */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Users className="h-3.5 w-3.5" />
            <span>Consumidores</span>
          </div>
          <span className="text-sm font-bold text-slate-900">{generator.consumersCount}</span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Capacidade Alocada</span>
            <span className={`font-bold ${generator.porcentagemAlocada >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
              {isNaN(generator.porcentagemAlocada) ? '0.0' : generator.porcentagemAlocada.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${generator.porcentagemAlocada >= 100 ? 'bg-emerald-500' : 'bg-accent'}`}
              style={{ width: `${Math.min(generator.porcentagemAlocada || 0, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
