import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Role } from '../types';
import { 
  LayoutDashboard, 
  Wrench, 
  SprayCan, 
  ConciergeBell, 
  LogOut, 
  Menu, 
  X, 
  Search, 
  Bell,
  Settings,
  User,
  ChevronDown,
  ClipboardCheck,
  Package
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode; onGoHome: () => void }> = ({ children, onGoHome }) => {
  const { role, setRole, resetDemoData, currentView, setView } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Mapeo de Roles a items del menú visual
  const menuItems = [
    { role: Role.MANAGEMENT, label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { role: Role.MAINTENANCE, label: 'Mantenimiento', icon: <Wrench size={20} /> },
    { role: Role.CLEANING, label: 'Limpieza', icon: <SprayCan size={20} /> },
    { role: Role.RECEPTION, label: 'Recepción', icon: <ConciergeBell size={20} /> },
    { role: Role.SUPERVISOR, label: 'Supervisor', icon: <ClipboardCheck size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex font-sans text-slate-900">
      
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* SIDEBAR NAVIGATION (Reference Style 1) */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1e293b] text-white transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-700">
          <div className="font-bold text-xl tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white font-black">
              E
            </div>
            <span>ELS<span className="text-slate-400 font-normal">App</span></span>
          </div>
          <button className="ml-auto lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        {/* Create New Button Area */}
        <div className="p-4">
          <button 
            onClick={resetDemoData}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2 transition-all"
          >
            <span className="text-lg leading-none">+</span> Reset Demo
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 mt-2">
            Módulos
          </div>
          
          {menuItems.map((item) => {
            const isActive = role === item.role && currentView === 'DASHBOARD';
            return (
              <button
                key={item.role}
                onClick={() => {
                  setRole(item.role);
                  setView('DASHBOARD');
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 mt-6">
            Gestión
          </div>
          
          <button
            onClick={() => {
                setView('STOCK');
                if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'STOCK'
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Package size={20} />
            Inventario & Compras
          </button>

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 mt-6">
            Sistema
          </div>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <Settings size={20} /> Configuración
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header (Reference Style 2) */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8 shadow-sm z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md"
            >
              <Menu size={24} />
            </button>
            
            {/* Search Bar */}
            <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-1.5 w-64 border border-transparent focus-within:border-blue-300 focus-within:bg-white transition-all">
              <Search size={16} className="text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Buscar ticket, activo..." 
                className="bg-transparent border-none focus:ring-0 text-sm w-full text-slate-700 placeholder-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">Demo User</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                <User size={20} className="text-slate-400" />
              </div>
            </div>

            {/* Logout Button (Moved to Top Right) */}
            <div className="border-l border-slate-200 pl-4 ml-2">
              <button 
                onClick={onGoHome} 
                className="flex items-center gap-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all group"
                title="Cerrar Sesión / Volver al inicio"
              >
                <LogOut size={18} />
                <span className="hidden lg:inline text-sm font-bold">Salir</span>
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};