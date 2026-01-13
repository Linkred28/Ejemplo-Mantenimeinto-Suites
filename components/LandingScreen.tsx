import React from 'react';
import { LayoutDashboard, ClipboardCheck, Hotel } from 'lucide-react';

interface LandingScreenProps {
  onSelectMode: (mode: 'DASHBOARD' | 'SUPERVISOR') => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onSelectMode }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl mb-4 shadow-xl">
            <Hotel className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
            EUROPEAN LIFESTYLE SUITES
          </h1>
          <p className="text-slate-500 text-lg">Sistema de Gestión de Mantenimiento & Operaciones</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-3xl mx-auto">
          {/* Dashboard Option */}
          <button
            onClick={() => onSelectMode('DASHBOARD')}
            className="group relative flex flex-col items-center p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-900 hover:shadow-2xl transition-all duration-300 text-center"
          >
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <LayoutDashboard className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Dashboard General</h2>
            <p className="text-slate-500 leading-relaxed">
              Acceso completo a tableros de Gerencia, Mantenimiento, Limpieza y Recepción.
              Visualización de KPIs, gestión de inventario y estado de tickets.
            </p>
            <div className="mt-8 px-6 py-2 bg-slate-100 rounded-full text-sm font-bold text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              Ingresar al Sistema
            </div>
          </button>

          {/* Supervisor Option */}
          <button
            onClick={() => onSelectMode('SUPERVISOR')}
            className="group relative flex flex-col items-center p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-600 hover:shadow-2xl transition-all duration-300 text-center"
          >
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <ClipboardCheck className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Supervisor de Pisos</h2>
            <p className="text-slate-500 leading-relaxed">
              Modo simplificado para recorridos de inspección.
              Selección rápida de habitaciones y generación ágil de tickets de mantenimiento.
            </p>
            <div className="mt-8 px-6 py-2 bg-emerald-50 rounded-full text-sm font-bold text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              Iniciar Recorrido
            </div>
          </button>
        </div>

        <div className="mt-12 text-center text-xs text-slate-400">
          Metodiko Demo v1.2 • Operaciones ELS
        </div>
      </div>
    </div>
  );
};