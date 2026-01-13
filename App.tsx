import React, { useState } from 'react';
import { AppProvider, useApp } from './AppContext';
import { Layout } from './components/Layout';
import { LandingScreen } from './components/LandingScreen';
import { Role } from './types';
import { ManagementView } from './views/ManagementView';
import { ReportingView } from './views/ReportingView';
import { MaintenanceView } from './views/MaintenanceView';
import { ReceptionView } from './views/ReceptionView';
import { SupervisorView } from './views/SupervisorView';
import { StockView } from './views/StockView';

// Subcomponente para el contenido del Dashboard según Rol y Vista Actual
const DashboardContent: React.FC = () => {
  const { role, currentView } = useApp();

  // Si la vista seleccionada es Stock, mostramos ese módulo independientemente del rol (si tiene permiso visual)
  if (currentView === 'STOCK') {
      return <StockView />;
  }

  // Si es Dashboard normal, mostramos según Rol
  switch (role) {
    case Role.MANAGEMENT:
      return <ManagementView />;
    case Role.MAINTENANCE:
      return <MaintenanceView />;
    case Role.CLEANING:
      return <ReportingView />;
    case Role.RECEPTION:
      return <ReceptionView />;
    case Role.SUPERVISOR:
      // Renderiza SupervisorView en modo "embebido" (sin header propio, adaptado al layout)
      return <SupervisorView onBack={() => {}} isEmbedded={true} />;
    default:
      return <ManagementView />;
  }
};

// Componente principal con lógica de navegación
const Main: React.FC = () => {
  const [viewMode, setViewMode] = useState<'LANDING' | 'DASHBOARD' | 'SUPERVISOR'>('LANDING');

  // Si estamos en Landing
  if (viewMode === 'LANDING') {
    return <LandingScreen onSelectMode={setViewMode} />;
  }

  // Si estamos en modo Supervisor (App independiente/móvil desde Landing)
  if (viewMode === 'SUPERVISOR') {
    return <SupervisorView onBack={() => setViewMode('LANDING')} />;
  }

  // Si estamos en modo Dashboard (Layout completo con selector de roles)
  return (
    <Layout onGoHome={() => setViewMode('LANDING')}>
      <DashboardContent />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Main />
    </AppProvider>
  );
};

export default App;