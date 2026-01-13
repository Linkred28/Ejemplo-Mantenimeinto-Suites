import React from 'react';
import { LayoutDashboard, ClipboardCheck, ArrowRight } from 'lucide-react';

interface LandingScreenProps {
  onSelectMode: (mode: 'DASHBOARD' | 'SUPERVISOR') => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onSelectMode }) => {
  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="max-w-5xl w-full z-10 relative">
        
        {/* Header / Logo Section */}
        <div className="text-center mb-16 flex flex-col items-center animate-in slide-in-from-top-4 fade-in duration-700">
          <div className="w-20 h-20 bg-rose-600 rounded-2xl flex items-center justify-center text-white font-black text-4xl shadow-2xl shadow-rose-500/30 mb-6 rotate-3 hover:rotate-6 transition-transform border border-rose-400/20 backdrop-blur-sm">
            E
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4 drop-shadow-lg">
            ELS<span className="text-slate-400">App</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl font-medium max-w-xl drop-shadow-md">
            European Lifestyle Suites & Gallery <br/>
            <span className="text-slate-400 text-base font-normal">Sistema Integral de Operaciones y Mantenimiento</span>
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 max-w-4xl mx-auto">
          
          {/* Dashboard Option */}
          <button
            onClick={() => onSelectMode('DASHBOARD')}
            className="group relative flex flex-col items-start p-8 rounded-3xl border border-slate-700/50 hover:border-blue-400/50 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 text-left overflow-hidden h-80 justify-end"
          >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop" 
                    alt="Hotel Lobby" 
                    className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-blue-900/30 mix-blend-multiply transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent opacity-90" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full">
                <div className="w-14 h-14 bg-blue-500/20 backdrop-blur-md border border-blue-400/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-900/20">
                  <LayoutDashboard className="w-7 h-7 text-blue-300" />
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">Dashboard General</h2>
                <p className="text-slate-300 text-sm leading-relaxed mb-6 max-w-sm">
                  Gestión completa para Gerencia, Mantenimiento y Recepción. Control de KPIs y tickets.
                </p>
                
                <div className="flex items-center gap-2 text-sm font-bold text-blue-300 group-hover:gap-4 transition-all">
                  Ingresar al Sistema <ArrowRight size={16} className="text-blue-400"/>
                </div>
            </div>
          </button>

          {/* Supervisor Option */}
          <button
            onClick={() => onSelectMode('SUPERVISOR')}
            className="group relative flex flex-col items-start p-8 rounded-3xl border border-slate-700/50 hover:border-emerald-400/50 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 text-left overflow-hidden h-80 justify-end"
          >
             {/* Background Image */}
             <div className="absolute inset-0 z-0">
                <img 
                    src="https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop" 
                    alt="Hotel Corridor" 
                    className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-emerald-900/30 mix-blend-multiply transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent opacity-90" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full">
                <div className="w-14 h-14 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-emerald-900/20">
                  <ClipboardCheck className="w-7 h-7 text-emerald-300" />
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">Supervisor de Pisos</h2>
                <p className="text-slate-300 text-sm leading-relaxed mb-6 max-w-sm">
                  Interfaz móvil optimizada para recorridos de inspección, checklists y reportes rápidos.
                </p>
                
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-300 group-hover:gap-4 transition-all">
                  Iniciar Recorrido <ArrowRight size={16} className="text-emerald-400"/>
                </div>
            </div>
          </button>

        </div>

        <div className="mt-16 text-center">
            <p className="text-xs text-slate-500 font-medium">
                v1.3.0 Demo Build • Powered by Metodiko
            </p>
        </div>
      </div>
    </div>
  );
};