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
    <div className="flex h-screen relative bg-gradient-to-br from-white via-pagluz-surface-50 to-white">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      {/* Empurra o conteúdo quando a sidebar fixa estiver visível - responsivo para notebooks */}
      <main className="flex-1 overflow-y-auto w-full relative z-0 ml-0 lg:ml-64 xl:ml-72">
        <div className="mx-auto w-full max-w-full lg:max-w-7xl xl:max-w-screen-2xl px-3 sm:px-4 lg:px-6">
          <div className="animate-fade-in">
            {renderCurrentView()}
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