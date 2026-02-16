import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClientesGeradores from './components/ClientesGeradores';
import ClientesConsumidores from './components/ClientesConsumidores';
import PendingConsumers from './components/PendingConsumers';
import RepresentantesComerciais from './components/RepresentantesComerciais';
import UsuariosSistema from './components/UsuariosSistema';
import LogsAtividade from './components/LogsAtividade';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import Contratos from './components/Contratos';
import ConfiguracoesSistema from './components/ConfiguracoesSistema';
import GestaoComissoes from './components/GestaoComissoes';
import PendingChanges from './components/admin/PendingChanges';


function AppContent() {
  const { user, loading: authLoading, isAuthenticated } = useApp();
  const [currentView, setCurrentView] = useState<'dashboard' | 'geradores' | 'consumidores' | 'pendentes' | 'mudancas' | 'representantes' | 'contratos' | 'usuarios' | 'logs' | 'configuracoes' | 'comissoes'>('dashboard');

  // Listener para eventos de navegação
  useEffect(() => {
    const handleNavigate = (event: CustomEvent<{ view: typeof currentView }>) => {
      setCurrentView(event.detail.view);
    };

    window.addEventListener('navigate', handleNavigate as EventListener);
    return () => {
      window.removeEventListener('navigate', handleNavigate as EventListener);
    };
  }, []);

  // Aguardar o carregamento da autenticação
  if (authLoading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Login />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'geradores':
        return <ClientesGeradores />;
      case 'consumidores':
        return <ClientesConsumidores />;
      case 'pendentes':
        return <PendingConsumers />;
      case 'representantes':
        return <RepresentantesComerciais />;
      case 'contratos':
        return <Contratos />;
      case 'usuarios':
        return <UsuariosSistema />;
      case 'logs':
        return <LogsAtividade />;
      case 'configuracoes':
        return <ConfiguracoesSistema />;
      case 'comissoes':
        return <GestaoComissoes />;
      case 'mudancas':
        return <PendingChanges />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen relative bg-slate-50 overflow-hidden">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      {/* Main Content Area */}
      <main className="flex-1 w-full relative z-0 lg:ml-72 flex flex-col h-full overflow-hidden">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 pb-24">
            <div className="animate-fade-in relative">
              {renderCurrentView()}
            </div>
          </div>
        </div>
      </main>
      
      <PWAInstallPrompt />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;