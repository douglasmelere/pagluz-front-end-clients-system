import {
  Phone,
  MapPin,
  UserCheck,
  Factory,
  TrendingDown,
  Edit,
  CheckCircle,
  MessageSquare,
  Building,
  Activity,
  FileText,
  Link,
  Eye,
  RefreshCw,
  Sun,
  Wind,
  Droplet,
  Leaf,
  Mail
} from 'lucide-react';
import { Consumer, ConsumerStatus, Generator, DocumentType } from '../types';
import { Badge } from './ui';

interface ConsumerTableProps {
  consumers: Consumer[];
  generators: Generator[];
  representatives: any[];
  onEdit: (consumer: Consumer) => void;
  onApprove: (consumer: Consumer) => void;
  onViewInvoice: (consumer: Consumer) => void;
  onGenerateCommission: (id: string) => void;
  hasCommission: (id: string) => boolean;
  onShowGeneratorDetails: (id: string) => void;
  expandedGeneratorId: string | null;
}

export default function ConsumerTable({
  consumers,
  generators,
  representatives,
  onEdit,
  onApprove,
  onViewInvoice,
  onGenerateCommission,
  hasCommission,
  onShowGeneratorDetails,
  expandedGeneratorId
}: ConsumerTableProps) {

  const getGeneratorDetails = (generatorId?: string | null) => {
    if (!generatorId) return null;
    return generators.find(g => g.id === generatorId);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'success' | 'default' | 'outline'; icon: any }> = {
      'AVAILABLE': {
        label: 'Disponível',
        variant: 'success',
        icon: CheckCircle
      },
      'ALLOCATED': {
        label: 'Alocado',
        variant: 'default',
        icon: Link
      }
    };

    const config = statusConfig[status] || { label: status, variant: 'outline', icon: null };
    return (
      <Badge variant={config.variant} size="sm" showDot pulseDot={config.variant === 'success'}>
        {config.label}
      </Badge>
    );
  };

  const getTipoIcon = (tipo: string) => {
    const icons: Record<string, { icon: any; colorClass: string }> = {
      'RESIDENTIAL': { icon: '🏠', colorClass: 'bg-green-100 text-green-600' }, // Keeping some legacy colors for distinction if desired, or map to new
      'COMMERCIAL': { icon: '🏢', colorClass: 'bg-blue-100 text-blue-600' },
      'RURAL': { icon: '🌾', colorClass: 'bg-yellow-100 text-yellow-600' },
      'INDUSTRIAL': { icon: '🏭', colorClass: 'bg-purple-100 text-purple-600' },
      'PUBLIC_POWER': { icon: '🏛️', colorClass: 'bg-indigo-100 text-indigo-600' }
    };
    return icons[tipo] || { icon: '🏢', colorClass: 'bg-muted text-muted-foreground' };
  };

  const renderGeneratorIcon = (sourceType: string, className: string) => {
    const normalizedType = (sourceType || '').toUpperCase().trim();
    switch (normalizedType) {
      case 'SOLAR': return <Sun className={className} />;
      case 'WIND': return <Wind className={className} />;
      case 'HYDRO': case 'HIDRO': return <Droplet className={className} />;
      case 'BIOMASS': case 'BIOMASSA': return <Leaf className={className} />;
      default: return <Factory className={className} />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full" style={{ minWidth: '1200px', tableLayout: 'fixed' }}>
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-left text-xs font-semibold font-display text-slate-500 uppercase tracking-wider" style={{ width: '220px' }}>Cliente</th>
              <th className="px-6 py-4 text-left text-xs font-semibold font-display text-slate-500 uppercase tracking-wider" style={{ width: '180px' }}>Contato</th>
              <th className="px-6 py-4 text-left text-xs font-semibold font-display text-slate-500 uppercase tracking-wider" style={{ width: '160px' }}>Consumo</th>
              <th className="px-6 py-4 text-left text-xs font-semibold font-display text-slate-500 uppercase tracking-wider" style={{ width: '200px' }}>Endereço</th>
              <th className="px-6 py-4 text-left text-xs font-semibold font-display text-slate-500 uppercase tracking-wider" style={{ width: '180px' }}>Representante</th>
              <th className="px-6 py-4 text-left text-xs font-semibold font-display text-slate-500 uppercase tracking-wider" style={{ width: '200px' }}>Gerador</th>
              <th className="px-6 py-4 text-left text-xs font-semibold font-display text-slate-500 uppercase tracking-wider" style={{ width: '150px' }}>Alocação</th>
              <th className="px-6 py-4 text-left text-xs font-semibold font-display text-slate-500 uppercase tracking-wider" style={{ width: '120px' }}>Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold font-display text-slate-500 uppercase tracking-wider" style={{ width: '100px' }}>Fatura</th>
              <th className="px-8 py-4 text-left text-xs font-semibold font-display text-slate-500 uppercase tracking-wider" style={{ width: '100px' }}>Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {consumers.map((cliente) => {
              const tipoConfig = getTipoIcon(cliente.consumerType);
              const geradorDetails = getGeneratorDetails(cliente.generatorId);

              return (
                <tr key={cliente.id} className="group hover:bg-accent/5 transition-all duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-xl ${tipoConfig.colorClass} flex items-center justify-center text-lg shadow-sm border border-slate-100 group-hover:scale-105 transition-transform`}>
                        {typeof tipoConfig.icon === 'string' ? tipoConfig.icon : <span className="text-xl">{tipoConfig.icon}</span>}
                      </div>
                      <div className="ml-3 overflow-hidden">
                        <div className="text-sm font-bold font-display text-slate-900 group-hover:text-accent transition-colors truncate">
                          {cliente.name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono truncate">{cliente.cpfCnpj}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-medium">
                          {cliente.documentType === DocumentType.CPF ? 'CPF' : 'CNPJ'}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="space-y-1.5">
                      <div className="text-xs text-slate-700 flex items-center truncate">
                        <Phone className="h-3.5 w-3.5 mr-2 text-slate-400 flex-shrink-0" />
                        {cliente.phone || '—'}
                      </div>
                      <div className="text-xs text-slate-600 flex items-center truncate">
                        <Mail className="h-3.5 w-3.5 mr-2 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{cliente.email || '—'}</span>
                      </div>
                      {cliente.receiveWhatsapp && (
                        <div className="text-[10px] font-medium text-success flex items-center bg-success/10 px-2 py-0.5 rounded-full w-fit">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          WhatsApp
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-slate-900 capitalize flex items-center">
                        <Building className="h-3.5 w-3.5 mr-2 text-slate-400" />
                        {cliente.consumerType.replace('_', ' ').toLowerCase()}
                      </div>
                      <div className="text-xs text-slate-600 flex items-center bg-slate-100 px-2 py-1 rounded-lg w-fit">
                        <Activity className="h-3.5 w-3.5 mr-2 text-orange-500" />
                        <span className="font-bold text-slate-900">{cliente.averageMonthlyConsumption.toLocaleString()}</span>
                        <span className="ml-1 text-[10px] text-slate-500">kW/h</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="text-xs text-slate-900 flex items-start">
                        <MapPin className="h-3.5 w-3.5 mr-2 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">
                          {cliente.city}, {cliente.state}
                          {cliente.neighborhood && <span className="text-slate-500"> - {cliente.neighborhood}</span>}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono pl-5.5">UC: {cliente.ucNumber}</div>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    {cliente.representativeId ? (
                      <div className="space-y-2">
                        <div className="space-y-0.5">
                          <div className="text-xs font-medium text-slate-900 flex items-center">
                            <UserCheck className="h-3.5 w-3.5 mr-2 text-accent" />
                            <span className="truncate max-w-[140px]">
                              {representatives.find(rep => rep.id === cliente.representativeId)?.name || 'N/A'}
                            </span>
                          </div>
                        </div>
                        {hasCommission(cliente.id) ? (
                          <div className="flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-medium bg-success/10 text-success border border-success/20 w-fit">
                            <CheckCircle className="h-3 w-3" />
                            <span>Comissão OK</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => onGenerateCommission(cliente.id)}
                            className="bg-white border border-slate-200 hover:border-accent/50 text-slate-600 hover:text-accent px-2 py-1 rounded text-[10px] font-medium flex items-center space-x-1 transition-all shadow-sm"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Gerar comissão</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic px-2 py-1 rounded bg-slate-50">Sem rep.</span>
                    )}
                  </td>

                  <td className="px-6 py-5">
                    {cliente.generatorId && geradorDetails ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          {renderGeneratorIcon(geradorDetails.sourceType, 'h-4 w-4 text-warning')}
                          <span className="text-xs font-semibold text-slate-900 truncate max-w-[120px]" title={geradorDetails.ownerName}>
                            {geradorDetails.ownerName}
                          </span>
                          <button
                            onClick={() => onShowGeneratorDetails(cliente.id)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-accent transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Expanded details */}
                        {expandedGeneratorId === cliente.id && (
                          <div className="p-2 bg-slate-50 rounded border border-slate-200 text-[10px] space-y-1 relative z-10 animate-fade-in shadow-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-600">Potência:</span>
                              <span className="font-mono font-medium">{geradorDetails.installedPower} kW</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Tipo:</span>
                              <span className="font-medium capitalize">{geradorDetails.sourceType?.toLowerCase()}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic px-2 py-1 rounded bg-slate-50">Não vinculado</span>
                    )}
                  </td>

                  <td className="px-6 py-5">
                    <div className="space-y-2">
                      <div className="flex items-center text-xs">
                        <TrendingDown className="h-3.5 w-3.5 mr-1.5 text-success" />
                        <span className="font-bold text-slate-900">{cliente.discountOffered}%</span>
                        <span className="text-slate-500 ml-1">off</span>
                      </div>

                      {cliente.status === ConsumerStatus.ALLOCATED && (
                        <div className="w-full">
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-slate-500">Alocação</span>
                            <span className="font-medium text-accent">{cliente.allocatedPercentage ? cliente.allocatedPercentage.toFixed(1) : '0.0'}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-accent h-full rounded-full"
                              style={{ width: `${Math.min(cliente.allocatedPercentage || 0, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    {getStatusBadge(cliente.status)}
                  </td>

                  <td className="px-6 py-5">
                    {(cliente.invoiceUrl && cliente.invoiceUrl.trim() !== '') ? (
                      <button
                        onClick={() => onViewInvoice(cliente)}
                        className="p-2 bg-accent/5 hover:bg-accent/10 text-accent rounded-lg transition-colors border border-accent/20"
                        title="Ver fatura"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-xs text-slate-300 italic">-</span>
                    )}
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onEdit(cliente)}
                        className="p-2 text-slate-400 hover:text-accent hover:bg-accent/5 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
