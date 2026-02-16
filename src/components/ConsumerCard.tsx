import {
  Phone,
  MapPin,
  UserCheck,
  Factory,
  TrendingDown,
  Edit,
  CheckCircle,
  AlertCircle,
  Activity,
  FileText,
  Link,
  RefreshCw,
} from 'lucide-react';
import { Consumer, Generator } from '../types';
import { Badge } from './ui';

interface ConsumerCardProps {
  consumer: Consumer;
  generators: Generator[];
  representatives: any[]; // Using any[] based on usage in parent, ideally strictly typed
  onEdit: (consumer: Consumer) => void;
  onApprove: (consumer: Consumer) => void;
  onViewInvoice: (consumer: Consumer) => void;
  onGenerateCommission: (id: string) => void;
  hasCommission: (id: string) => boolean;
}

export default function ConsumerCard({
  consumer,
  generators,
  representatives,
  onEdit,
  onApprove,
  onViewInvoice,
  onGenerateCommission,
  hasCommission
}: ConsumerCardProps) {


  // Helpers copied from parent or adapted
  const getGeneratorDetails = (generatorId?: string | null) => {
    if (!generatorId) return null;
    return generators.find(g => g.id === generatorId);
  };

  const getStatusConfig = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'default'; icon: any }> = {
      'AVAILABLE': {
        label: 'Disponível',
        variant: 'success',
        icon: CheckCircle
      },
      'ALLOCATED': {
        label: 'Alocado',
        variant: 'default', // Uses accent color by default in some systems, or map to a specific one
        icon: Link
      }
    };
    // Default fallback
    return statusConfig[status] || { label: status, variant: 'warning', icon: AlertCircle };
  };

  const getTipoIcon = (tipo: string) => {
    const icons: Record<string, { icon: any; colorClass: string }> = {
      'RESIDENTIAL': { icon: '🏠', colorClass: 'bg-green-100 text-green-600' }, // Legacy mappings kept if specific colors desired, but preferred semantic
      'COMMERCIAL': { icon: '🏢', colorClass: 'bg-blue-100 text-blue-600' },
      'RURAL': { icon: '🌾', colorClass: 'bg-yellow-100 text-yellow-600' },
      'INDUSTRIAL': { icon: '🏭', colorClass: 'bg-purple-100 text-purple-600' },
      'PUBLIC_POWER': { icon: '🏛️', colorClass: 'bg-indigo-100 text-indigo-600' }
    };

    // Modern override using new tokens where possible, or keeping emoji as requested but with better containers
    return icons[tipo] || { icon: '🏢', colorClass: 'bg-muted text-muted-foreground' };
  };

  const statusInfo = getStatusConfig(consumer.status);
  const StatusIcon = statusInfo.icon;
  const tipoConfig = getTipoIcon(consumer.consumerType);
  const generator = getGeneratorDetails(consumer.generatorId);
  const representative = representatives.find(r => r.id === consumer.representativeId);

  return (
    <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-black/5 ${tipoConfig.colorClass}`}>
              {typeof tipoConfig.icon === 'string' ? tipoConfig.icon : <span className="text-xl">{tipoConfig.icon}</span>}
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 line-clamp-1 group-hover:text-accent transition-colors">
                {consumer.name}
              </h3>
              <div className="flex items-center gap-x-2 mt-1">
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  {consumer.cpfCnpj}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {consumer.documentType}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={statusInfo.variant} size="sm" showDot pulseDot={statusInfo.variant === 'success'}>
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-5 flex-1 p-1">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 group-hover:border-accent/10 transition-colors">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 block">Consumo</span>
              <div className="flex items-center text-slate-900 font-bold font-display text-lg">
                <Activity className="h-4 w-4 mr-1.5 text-orange-500" />
                {consumer.averageMonthlyConsumption.toLocaleString()}
                <span className="text-xs text-slate-400 font-normal ml-1">kW</span>
              </div>
            </div>
            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 group-hover:border-accent/10 transition-colors">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 block">Desconto</span>
              <div className="flex items-center text-slate-900 font-bold font-display text-lg">
                <TrendingDown className="h-4 w-4 mr-1.5 text-emerald-500" />
                {consumer.discountOffered}%
              </div>
            </div>
          </div>

          {/* Info List */}
          <div className="space-y-3">
            <div className="flex items-center text-sm text-slate-600">
              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3 border border-slate-100 text-slate-400">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="truncate flex-1 font-medium">{consumer.city}, {consumer.state}</span>
            </div>

            <div className="flex items-center text-sm text-slate-600">
              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3 border border-slate-100 text-slate-400">
                <Phone className="h-4 w-4" />
              </div>
              <span className="font-medium">{consumer.phone}</span>
            </div>

            {/* Generator Info */}
            {generator ? (
              <div className="flex items-center bg-orange-50/50 p-2.5 rounded-xl border border-orange-100/50">
                <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center mr-3 text-orange-500 shadow-sm">
                  <Factory className="h-4 w-4" />
                </div>
                <div className="truncate flex-1">
                  <span className="text-[10px] text-orange-600/70 font-bold uppercase tracking-wider block">Gerador</span>
                  <span className="text-sm text-slate-900 font-bold font-display truncate">{generator.ownerName}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center p-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center mr-3 text-slate-400">
                  <Factory className="h-4 w-4" />
                </div>
                <span className="text-xs text-slate-400 italic">Sem gerador vinculado</span>
              </div>
            )}

            {/* Representative Info */}
            {representative && (
              <div className="flex items-center bg-accent/5 p-2.5 rounded-xl border border-accent/10">
                <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center mr-3 text-accent shadow-sm">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div className="truncate flex-1">
                  <span className="text-[10px] text-accent/70 font-bold uppercase tracking-wider block">Representante</span>
                  <span className="text-sm text-slate-900 font-bold font-display truncate">{representative.name}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-5 mt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
          <button
            onClick={() => onEdit(consumer)}
            className="flex items-center justify-center px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold transition-colors w-full"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </button>

          {(consumer.invoiceUrl && consumer.invoiceUrl.trim() !== '') ? (
            <button
              onClick={() => onViewInvoice(consumer)}
              className="flex items-center justify-center px-4 py-2 bg-accent/5 hover:bg-accent/10 text-accent rounded-xl text-sm font-semibold transition-colors border border-accent/10 w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              Fatura
            </button>
          ) : (
            <div />
          )}

          {consumer.representativeId && !hasCommission(consumer.id) && (
            <button
              onClick={() => onGenerateCommission(consumer.id)}
              className="col-span-2 flex items-center justify-center px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl text-sm font-semibold transition-colors border border-emerald-200/50 w-full mt-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Gerar Comissão
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
