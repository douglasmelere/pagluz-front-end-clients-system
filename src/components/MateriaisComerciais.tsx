import { useState, useEffect, useRef } from 'react';
import {
  FolderOpen,
  Upload,
  Trash2,
  Download,
  ToggleLeft,
  ToggleRight,
  FileText,
  Film,
  Image,
  Table,
  Presentation,
  File,
  Search,
  X,
  AlertCircle,
  Loader2,
  Plus,
} from 'lucide-react';
import { api } from '../types/services/api';
import { useToast } from '../hooks/useToast';
import Toast from './common/Toast';
import DocumentPreviewModal from './ui/DocumentPreviewModal';
import { Eye } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Material {
  id: string;
  title: string;
  description?: string;
  category?: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  isActive: boolean;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Apresentações',
  'Scripts de Vendas',
  'Tabelas de Preço',
  'Material de Treinamento',
  'Contratos Modelo',
  'Outros',
];

function getFileIcon(fileType: string) {
  if (fileType.includes('pdf')) return FileText;
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return Presentation;
  if (fileType.includes('sheet') || fileType.includes('excel')) return Table;
  if (fileType.includes('word')) return FileText;
  if (fileType.includes('image')) return Image;
  if (fileType.includes('video')) return Film;
  return File;
}

function formatSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Upload Modal ────────────────────────────────────────────────────────────

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function UploadModal({ open, onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null); setTitle(''); setDescription(''); setCategory(''); setError('');
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    if (description) formData.append('description', description.trim());
    if (category) formData.append('category', category);
    try {
      setLoading(true);
      setError('');
      await api.post('/commercial-materials', formData);
      onSuccess();
      onClose();
      reset();
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar arquivo');
    } finally {
      setLoading(false);
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/10 rounded-xl">
              <Upload className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900 leading-tight">Novo Material</h2>
              <p className="text-xs text-slate-500 font-medium">Preencha os dados do arquivo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Dropzone */}
            <div
              className={`group border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${dragOver
                  ? 'border-accent bg-accent/5 ring-4 ring-accent/10'
                  : 'border-slate-200 hover:border-accent/40 hover:bg-slate-50'
                }`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".pdf,.ppt,.pptx,.xls,.xlsx,.doc,.docx,.jpg,.jpeg,.png,.webp,.mp4"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="flex flex-col items-center gap-3 animate-scale-up">
                  <div className="p-4 bg-accent/10 rounded-2xl shadow-inner">
                    <FileText className="h-10 w-10 text-accent" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-sm truncate max-w-[300px]">{file.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{formatSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline"
                  >
                    Remover e escolher outro
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <Upload className="h-10 w-10 text-slate-300 group-hover:text-accent/50" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-700">Escolha um arquivo</p>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">Arraste aqui ou clique para buscar<br />PDF, PPT, XLS, DOC, fotos ou vídeos</p>
                  </div>
                </div>
              )}
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-display">Título do Material *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Apresentação Comercial Q1 2025"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent text-slate-900 placeholder:text-slate-400 transition-all outline-none text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-display">Categoria</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent text-slate-900 transition-all outline-none text-sm font-medium bg-white appearance-none cursor-pointer"
                >
                  <option value="">Selecione uma categoria...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-display">Descrição (opcional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Descreva para que serve este material..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent text-slate-900 placeholder:text-slate-400 transition-all outline-none text-sm font-medium resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm animate-shake">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-all text-sm active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={loading || !file || !title.trim()}
            className="inline-flex items-center gap-2.5 px-6 py-2.5 bg-accent text-white font-bold rounded-xl hover:bg-accent-secondary shadow-lg shadow-accent/20 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {loading ? 'Enviando arquivo...' : 'Salvar e Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MateriaisComerciais() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterActive, setFilterActive] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [search, setSearch] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const data = await api.get('/commercial-materials');
      setMateriais(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.showError(err.message || 'Erro ao carregar materiais');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleToggleActive(material: Material) {
    try {
      await api.patch(`/commercial-materials/${material.id}`, { isActive: !material.isActive });
      toast.showSuccess(material.isActive ? 'Material desativado.' : 'Material ativado!');
      load();
    } catch (err: any) {
      toast.showError(err.message || 'Erro ao atualizar material');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Excluir este material? O arquivo será removido permanentemente.')) return;
    try {
      await api.delete(`/commercial-materials/${id}`);
      toast.showSuccess('Material excluído com sucesso.');
      load();
    } catch (err: any) {
      toast.showError(err.message || 'Erro ao excluir material');
    }
  }

  async function handleDownload(id: string, fileName: string) {
    try {
      setLoadingAction(`download-${id}`);
      const data: any = await api.get(`/commercial-materials/${id}/download-url`);
      const url = data?.url || data?.downloadUrl;
      if (!url) throw new Error('URL de download não encontrada');
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.target = '_blank';
      a.click();
    } catch (err: any) {
      toast.showError(err.message || 'Erro ao gerar URL de download');
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleView(material: Material) {
    try {
      setLoadingAction(`view-${material.id}`);
      const data: any = await api.get(`/commercial-materials/${material.id}/download-url`);
      const url = data?.url || data?.downloadUrl;
      if (!url) throw new Error('URL de visualização não encontrada');
      setPreviewUrl(url);
      setPreviewTitle(material.title);
    } catch (err: any) {
      toast.showError(err.message || 'Erro ao abrir material');
    } finally {
      setLoadingAction(null);
    }
  }

  const categories = [...new Set(materiais.map(m => m.category).filter(Boolean))] as string[];

  const filtered = materiais.filter(m => {
    const catOk = !filterCategory || m.category === filterCategory;
    const activeOk =
      filterActive === 'todos' ? true :
        filterActive === 'ativos' ? m.isActive : !m.isActive;
    const searchOk = !search ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.category || '').toLowerCase().includes(search.toLowerCase());
    return catOk && activeOk && searchOk;
  });

  const stats = {
    total: materiais.length,
    ativos: materiais.filter(m => m.isActive).length,
    inativos: materiais.filter(m => !m.isActive).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-2xl">
            <FolderOpen className="h-7 w-7 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">Materiais Comerciais</h1>
            <p className="text-slate-500 text-sm mt-0.5">{stats.total} materiais cadastrados · {stats.ativos} ativos</p>
          </div>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-secondary transition-colors shadow-sm shadow-accent/20 text-sm"
        >
          <Plus className="h-4 w-4" />
          Novo Material
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-700', bg: 'bg-slate-100' },
          { label: 'Ativos', value: stats.ativos, color: 'text-emerald-700', bg: 'bg-emerald-100' },
          { label: 'Inativos', value: stats.inativos, color: 'text-rose-700', bg: 'bg-rose-100' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
            <p className={`text-xs font-medium ${s.color} opacity-70 mt-0.5`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar materiais..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all"
          />
        </div>

        {/* Category */}
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all"
        >
          <option value="">Todas as categorias</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Active/Inactive tab */}
        <div className="flex rounded-xl overflow-hidden border border-slate-200">
          {(['todos', 'ativos', 'inativos'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterActive(f)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${filterActive === f ? 'bg-accent text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-display font-semibold text-slate-900 mb-1">Nenhum material encontrado</h3>
          <p className="text-slate-500 text-sm mb-4">
            {materiais.length === 0 ? 'Comece enviando o primeiro material comercial.' : 'Tente ajustar os filtros.'}
          </p>
          {materiais.length === 0 && (
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent-secondary transition-colors"
            >
              <Upload className="h-4 w-4" />
              Enviar primeiro material
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(material => {
            const Icon = getFileIcon(material.fileType);
            return (
              <div
                key={material.id}
                className={`bg-white rounded-2xl border shadow-sm transition-all hover:shadow-md flex flex-col ${!material.isActive ? 'border-slate-200 opacity-70' : 'border-slate-200 hover:border-accent/30'}`}
              >
                {/* Card Header */}
                <div className="p-5 flex-1">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${material.isActive ? 'bg-accent/10 text-accent' : 'bg-slate-100 text-slate-400'}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-slate-900 text-sm leading-tight truncate">{material.title}</h3>
                      {material.category && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                          {material.category}
                        </span>
                      )}
                    </div>
                    {/* Status indicator */}
                    <span className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${material.isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  </div>

                  {material.description && (
                    <p className="text-slate-500 text-xs mt-3 leading-relaxed line-clamp-2">{material.description}</p>
                  )}

                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-slate-400 truncate">{material.fileName}{material.fileSize ? ` · ${formatSize(material.fileSize)}` : ''}</p>
                    <p className="text-xs text-slate-400">
                      Enviado em {new Date(material.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggleActive(material)}
                    title={material.isActive ? 'Desativar' : 'Ativar'}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${material.isActive ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}`}
                  >
                    {material.isActive
                      ? <><ToggleRight className="h-3.5 w-3.5" /> Desativar</>
                      : <><ToggleLeft className="h-3.5 w-3.5" /> Ativar</>
                    }
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* View */}
                    <button
                      onClick={() => handleView(material)}
                      title="Visualizar"
                      disabled={loadingAction === `view-${material.id}`}
                      className="p-1.5 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loadingAction === `view-${material.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                    </button>

                    {/* Download */}
                    <button
                      onClick={() => handleDownload(material.id, material.fileName)}
                      title="Download"
                      disabled={loadingAction === `download-${material.id}`}
                      className="p-1.5 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loadingAction === `download-${material.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(material.id)}
                      title="Excluir"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} onSuccess={load} />

      <DocumentPreviewModal
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        documentUrl={previewUrl || ''}
        documentTitle={previewTitle}
      />

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toast.toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <Toast type={t.type} message={t.message} onClose={() => toast.removeToast(t.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}
