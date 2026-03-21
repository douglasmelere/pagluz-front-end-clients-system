import { useState, useEffect } from 'react';
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
import SimulacaoEconomia from './components/SimulacaoEconomia';
import PendingChanges from './components/admin/PendingChanges';
import ProposalRequestsAdmin from './components/admin/ProposalRequestsAdmin';
import RejectedConsumers from './components/admin/RejectedConsumers';
import MateriaisComerciais from './components/MateriaisComerciais';
import Comunicados from './components/Comunicados';
import Feedbacks from './components/Feedbacks';
import Relatorios from './components/Relatorios';
import RankingMetas from './components/RankingMetas';
import TimelineAtividades from './components/TimelineAtividades';
import PushNotifications from './components/PushNotifications';
import DashboardAvancado from './components/DashboardAvancado';
import TarifasKwh from './components/TarifasKwh';
import { startVersionMonitoring, reloadWithoutCache } from './utils/versionChecker';


function AppContent() {
  const { user, loading: authLoading, isAuthenticated } = useApp();
  const [currentView, setCurrentView] = useState<'dashboard' | 'geradores' | 'consumidores' | 'pendentes' | 'mudancas' | 'representantes' | 'contratos' | 'usuarios' | 'logs' | 'configuracoes' | 'comissoes' | 'simulacao' | 'solicitacoes' | 'materiais' | 'comunicados' | 'feedbacks' | 'relatorios' | 'ranking' | 'timeline' | 'push' | 'dashboard-avancado' | 'tarifas' | 'recusados'>('dashboard');
  const [sidebarWidth, setSidebarWidth] = useState(272);

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

  // Monitoramento de versão - verifica se há atualizações
  useEffect(() => {
    if (isAuthenticated) {
      startVersionMonitoring(() => {
        // Callback customizado quando nova versão é detectada
        const shouldReload = confirm(
          '🔄 Nova versão do sistema disponível!\n\n' +
          'Uma atualização está pronta para ser instalada.\n' +
          'Clique em OK para atualizar agora.\n\n' +
          '⚠️ Recomendamos salvar qualquer trabalho em andamento antes de continuar.'
        );

        if (shouldReload) {
          reloadWithoutCache();
        }
      });
    }
  }, [isAuthenticated]);

  // Aguardar o carregamento da autenticação
  // Start Push Notifications flow logic when logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      import('./lib/firebase').then(({ requestFirebaseNotificationPermission, onMessageListener }) => {
        requestFirebaseNotificationPermission()
          .then((token) => {
            if (token) {
              console.log('Firebase Token obtained successfully', token);
              // Save token to backend API if needed:
              // api.post('/auth/push-token', { token, userId: user.id }).catch(console.error);
            }
          })
          .catch(console.error);

        onMessageListener()?.then((payload: any) => {
          console.log('Received foreground message: ', payload);
          // Podemos exibir um Toast aqui caso chegue no foreground
          // toast.showSuccess(payload?.notification?.title || 'Novo comunicado');
        });
      });
    }
  }, [isAuthenticated, user]);

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
      case 'simulacao':
        return <SimulacaoEconomia />;
      case 'solicitacoes':
        return <ProposalRequestsAdmin />;
      case 'recusados':
        return <RejectedConsumers />;
      case 'materiais':
        return <MateriaisComerciais />;
      case 'comunicados':
        return <Comunicados />;
      case 'feedbacks':
        return <Feedbacks />;
      case 'relatorios':
        return <Relatorios />;
      case 'ranking':
        return <RankingMetas />;
      case 'timeline':
        return <TimelineAtividades />;
      case 'push':
        return <PushNotifications />;
      case 'dashboard-avancado':
        return <DashboardAvancado />;
      case 'tarifas':
        return <TarifasKwh />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen relative bg-slate-50 overflow-hidden">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onWidthChange={(w) => setSidebarWidth(w)}
      />

      {/* Main Content Area — margin sincronizada com a sidebar */}
      <main
        className="flex-1 w-full relative z-0 flex flex-col h-full overflow-hidden"
        style={{
          marginLeft: sidebarWidth,
          transition: 'margin-left 280ms cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none">
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