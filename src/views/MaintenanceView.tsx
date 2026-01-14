import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { Role, Ticket, TicketStatus, Urgency, MaintenanceType, LogbookEntry, Impact } from '../types';
import { LOGBOOK_FIELDS } from '../constants';
import { Button } from '../components/Button';
import { getStatusColor, getUrgencyColor } from '../utils';
import {
  Check, PenTool, Box, UserPlus, AlertOctagon,
  ClipboardList, Package, Search, X, ArrowDownCircle,
  AlertTriangle, Zap, Droplet, Fan, Hammer, Monitor,
  Key, Briefcase, Camera, Clock, Repeat, BookOpen,
  BarChart2, Flame
} from 'lucide-react';

// ============================
// INVENTARIO (DEMO) — LOCAL ONLY
// ============================
// (Keeping previous inventory logic for simplicity in this view)
type InventoryItem = { id: string; sku: string; name: string; location: string; unit: string; stock: number; minStock: number; };

const TicketCard: React.FC<{ ticket: Ticket; onEdit: (t: Ticket) => void }> = ({ ticket, onEdit }) => {
  return (
    <div
      className={`bg-white rounded-lg border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col h-full group
        ${ticket.urgency === Urgency.HIGH ? 'border-rose-300 ring-1 ring-rose-100 shadow-rose-100' : 'border-slate-200'}
      `}
      onClick={() => onEdit(ticket)}
    >
      {ticket.origin === 'GUEST' && (
        <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-bl-lg font-bold z-10">
          HUÉSPED
        </div>
      )}
      {ticket.cannibalizedFromRoom && (
         <div className="absolute top-0 left-0 bg-purple-100 text-purple-700 text-[9px] px-2 py-0.5 rounded-br-lg font-bold border-b border-r border-purple-200 z-10">
           PIEZA TOMADA
         </div>
      )}

      <div className="flex justify-between items-start mb-2 mt-2">
        <div>
          <span className="text-xs font-mono text-slate-400 block mb-1">{ticket.id}</span>
          <h4 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            Hab {ticket.roomNumber}
            {ticket.urgency === Urgency.HIGH && <AlertTriangle size={16} className="text-rose-500 fill-rose-100" />}
          </h4>
        </div>
        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(ticket.status)}`}>
          {ticket.status}
        </div>
      </div>

      <div className="mb-3">
        {/* IMPROVED CLASSIFICATION DISPLAY */}
        <div className="flex flex-col gap-1">
             <span className="text-xs font-bold text-slate-800">{ticket.asset}</span>
             <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                {ticket.issueType}
             </span>
        </div>
      </div>

      <p className="text-sm text-slate-600 mb-4 line-clamp-2 flex-grow border-t border-slate-50 pt-2 mt-1">
          {ticket.description}
      </p>

      {/* METRICS & DATA VISUALIZATION (Backend Data) */}
      <div className="bg-slate-50 rounded p-2 mb-3 grid grid-cols-2 gap-2 border border-slate-100">
          <div>
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Urgencia</span>
              <span className={`text-xs font-bold ${getUrgencyColor(ticket.urgency)}`}>{ticket.urgency}</span>
          </div>
          <div>
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Impacto</span>
              <span className={`text-xs font-bold ${ticket.impact === Impact.BLOCKING ? 'text-rose-700' : 'text-slate-700'}`}>
                  {ticket.impact}
              </span>
          </div>
          <div className="col-span-2 border-t border-slate-200 pt-1 mt-1 flex justify-between items-center">
               <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1">
                   <BarChart2 size={10}/> Priority Score
               </span>
               <div className="flex items-center gap-1">
                   {ticket.priorityScore > 80 && <Flame size={12} className="text-orange-500 fill-orange-500" />}
                   <span className="text-xs font-mono font-black text-slate-800">{ticket.priorityScore} pts</span>
               </div>
          </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
        <span className="text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
        <span className="text-slate-300 group-hover:text-slate-500 transition-colors flex items-center gap-1 text-xs font-medium">
            <PenTool size={12}/> Editar
        </span>
      </div>
    </div>
  );
};

const LogbookTab: React.FC = () => {
    const { logbook, addLogbookEntry, role } = useApp();
    const [selectedType, setSelectedType] = useState<'ALBERCA' | 'CALDERAS' | 'ENERGIA'>('ALBERCA');
    const [readings, setReadings] = useState<Record<string, string>>({});
    const [notes, setNotes] = useState('');
    const [success, setSuccess] = useState('');

    const fields = LOGBOOK_FIELDS[selectedType];

    const handleChange = (key: string, val: string) => {
        setReadings(prev => ({...prev, [key]: val}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Convert string readings to numbers
        const finalReadings: Record<string, number> = {};
        let status: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';

        fields.forEach(f => {
            const val = parseFloat(readings[f.key] || '0');
            finalReadings[f.key] = val;
            
            // Check Critical Limits (Si existe un límite crítico y se pasa)
            const isCritical = (f.critMin !== undefined && val < f.critMin) || 
                               (f.critMax !== undefined && val > f.critMax);
            
            // Check Warning Limits
            const isWarning = (f.min !== undefined && val < f.min) || 
                              (f.max !== undefined && val > f.max);

            if (isCritical) {
                status = 'CRITICAL';
            } else if (isWarning && status !== 'CRITICAL') {
                status = 'WARNING';
            }
        });

        addLogbookEntry({
            date: new Date().toISOString(),
            type: selectedType,
            readings: finalReadings,
            user: role,
            status,
            notes
        });
        
        setSuccess('Lectura registrada correctamente');
        setTimeout(() => setSuccess(''), 2500);
        setReadings({});
        setNotes('');
    };

    const recentLogs = logbook.filter(l => l.type === selectedType).slice(0, 10); // Show more logs

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        // FORCE FULL DATE DISPLAY FOR AUDITS (DD/MM/YYYY hh:mm am/pm)
        return date.toLocaleString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getStatusStyle = (s: string) => {
        if (s === 'CRITICAL') return 'bg-rose-100 text-rose-800 border-rose-200';
        if (s === 'WARNING') return 'bg-amber-100 text-amber-800 border-amber-200';
        return 'bg-green-100 text-green-800 border-green-200';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Nueva Entrada de Bitácora</h3>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                             {(['ALBERCA', 'CALDERAS', 'ENERGIA'] as const).map(t => (
                                 <button
                                    key={t}
                                    onClick={() => setSelectedType(t)}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${selectedType === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                 >
                                     {t}
                                 </button>
                             ))}
                        </div>
                    </div>

                    {success && <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2"><Check className="w-4 h-4"/> {success}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {fields.map(f => (
                                <div key={f.key}>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{f.label}</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            required
                                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 text-lg font-bold focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                                            value={readings[f.key] || ''}
                                            onChange={e => handleChange(f.key, e.target.value)}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">{f.unit}</span>
                                    </div>
                                    <div className="flex flex-col mt-1 text-[9px] text-slate-400 gap-0.5">
                                        <div className="flex justify-between">
                                            <span>OK: {f.min}-{f.max}</span>
                                        </div>
                                        {(f.critMin !== undefined || f.critMax !== undefined) && (
                                            <div className="flex justify-between text-rose-400 font-semibold">
                                                <span>Crit: {f.critMin ? `<${f.critMin}` : ''} {f.critMax ? `>${f.critMax}` : ''}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observaciones</label>
                            <textarea 
                                className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900"
                                rows={2}
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Algo fuera de lo normal..."
                            />
                        </div>
                        <Button type="submit" size="lg" className="w-full">Registrar Lectura</Button>
                    </form>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase">Historial Reciente ({selectedType})</h4>
                {recentLogs.length === 0 && <p className="text-sm text-slate-400 italic">No hay registros hoy.</p>}
                {recentLogs.map(log => (
                    <div key={log.id} className={`p-3 rounded-lg border ${log.status === 'WARNING' ? 'bg-amber-50 border-amber-200' : log.status === 'CRITICAL' ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                             <div className="flex flex-col">
                                 <span className="text-xs font-bold text-slate-700">{formatDate(log.date)}</span>
                                 <span className="text-[10px] text-slate-400">{log.user}</span>
                             </div>
                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${getStatusStyle(log.status)}`}>
                                 {log.status === 'CRITICAL' && <AlertOctagon size={10} />}
                                 {log.status}
                             </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs border-t border-black/5 pt-2 mt-1">
                             {Object.entries(log.readings).map(([k, v]) => (
                                 <div key={k} className="flex justify-between">
                                     <span className="text-slate-500 capitalize">{k}:</span>
                                     <span className="font-mono font-bold">{v as React.ReactNode}</span>
                                 </div>
                             ))}
                        </div>
                        {log.notes && <div className="mt-2 text-[10px] text-slate-500 italic bg-white/50 p-1 rounded">"{log.notes}"</div>}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ... (Rest of TicketEditModal but enhanced with Time Spent and Cannibalization)

const TicketEditModal: React.FC<{
  ticket: Ticket | null;
  onClose: () => void;
  // ... props shortened for clarity, reusing same logic
}> = ({ ticket, onClose }) => {
  const { updateTicket, cannibalizePart, role } = useApp();
  const [timeSpent, setTimeSpent] = useState<number | ''>('');
  const [pendingAction, setPendingAction] = useState<null | 'PART' | 'CANNIBAL'>(null);
  const [cannibalRoom, setCannibalRoom] = useState('');
  const [cannibalPart, setCannibalPart] = useState('');
  
  // Fake states for UI
  const [hasPhoto, setHasPhoto] = useState(false);

  if (!ticket) return null;

  const handleResolve = () => {
     if(!timeSpent) {
         alert('Por favor indica el tiempo invertido');
         return;
     }
     updateTicket(ticket.id, { 
         status: TicketStatus.RESOLVED, 
         timeSpentMinutes: Number(timeSpent),
         evidencePhotoUrl: hasPhoto ? 'simulated_url.jpg' : undefined
     }, `Resuelto en ${timeSpent} min.`);
     onClose();
  };

  const handleCannibalize = () => {
      if(!cannibalRoom || !cannibalPart) return;
      cannibalizePart(ticket.id, cannibalRoom, cannibalPart);
      setPendingAction(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-start">
          <div>
            <span className="text-xs font-mono text-slate-400">{ticket.id}</span>
            <h2 className="text-2xl font-bold text-slate-900">Habitación {ticket.roomNumber}</h2>
            <div className="flex flex-col gap-1 mt-1">
                <div className="flex gap-2">
                    {ticket.origin === 'GUEST' && <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded">QUEJA HUÉSPED</span>}
                </div>
                <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    {ticket.asset} <span className="text-slate-400">/</span> {ticket.issueType}
                </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="p-6 space-y-6 flex-1">
            {/* Resolution Area */}
            {ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.VERIFIED && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm">Cierre de Ticket</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tiempo Invertido</label>
                            <div className="flex gap-2">
                                {[15, 30, 45, 60].map(m => (
                                    <button 
                                        key={m}
                                        onClick={() => setTimeSpent(m)}
                                        className={`px-3 py-2 text-xs font-bold rounded border ${timeSpent === m ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-300 text-slate-600'}`}
                                    >
                                        {m}m
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Evidencia</label>
                            <button 
                                onClick={() => setHasPhoto(!hasPhoto)}
                                className={`w-full flex items-center justify-center gap-2 py-2 border rounded text-sm ${hasPhoto ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-300 text-slate-500'}`}
                            >
                                <Camera size={16} /> {hasPhoto ? 'Foto Adjuntada' : 'Tomar Foto'}
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button onClick={handleResolve} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                             <Check className="w-4 h-4 mr-2" /> Marcar Resuelto
                        </Button>
                         <Button onClick={() => setPendingAction('PART')} variant="secondary" className="flex-1">
                             <Package className="w-4 h-4 mr-2" /> Falta Pieza
                        </Button>
                    </div>
                </div>
            )}
            
            {/* Cannibalization UI */}
            {pendingAction === 'PART' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                    <h4 className="font-bold text-amber-800 mb-2 text-sm">Gestión de Refacción</h4>
                    <p className="text-xs text-amber-700 mb-3">Si no hay stock en almacén, puedes tomar la pieza de una habitación vacía. El sistema creará un ticket para reponerla.</p>
                    
                    <button 
                        onClick={() => setPendingAction('CANNIBAL')}
                        className="w-full bg-white border border-amber-300 text-amber-800 font-bold text-sm py-2 rounded-lg hover:bg-amber-100 flex items-center justify-center gap-2"
                    >
                        <Repeat size={16}/> Tomar de otra habitación (Canibalizar)
                    </button>
                    <div className="text-center text-xs text-amber-600 my-2">- O -</div>
                     <button className="w-full bg-slate-800 text-white text-sm py-2 rounded-lg font-bold">
                        Solicitar a Compras
                    </button>
                </div>
            )}

            {pendingAction === 'CANNIBAL' && (
                 <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl animate-in slide-in-from-top-2">
                     <h4 className="font-bold text-purple-800 mb-2 text-sm">Registro de Canibalización</h4>
                     <div className="space-y-3">
                         <div>
                             <label className="text-xs font-bold text-purple-700">Habitación Donante (Vacía)</label>
                             <input 
                                value={cannibalRoom} 
                                onChange={e => setCannibalRoom(e.target.value)} 
                                className="w-full bg-white text-slate-900 border border-purple-300 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" 
                                placeholder="Ej. 204" 
                             />
                         </div>
                         <div>
                             <label className="text-xs font-bold text-purple-700">Pieza Retirada</label>
                             <input 
                                value={cannibalPart} 
                                onChange={e => setCannibalPart(e.target.value)} 
                                className="w-full bg-white text-slate-900 border border-purple-300 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" 
                                placeholder="Ej. Control Remoto" 
                             />
                         </div>
                         <div className="flex gap-2">
                             <Button onClick={handleCannibalize} className="w-full bg-purple-700 hover:bg-purple-800 text-white">Confirmar Movimiento</Button>
                             <Button onClick={() => setPendingAction(null)} variant="ghost" className="w-full">Cancelar</Button>
                         </div>
                     </div>
                 </div>
            )}

            {/* Basic Info */}
            <div className="text-sm text-slate-600">
                <p className="mb-2"><span className="font-bold">Descripción:</span> {ticket.description}</p>
                {ticket.notes.map((n, i) => <div key={i} className="bg-slate-50 p-2 text-xs border border-slate-100 rounded mb-1">{n}</div>)}
            </div>
        </div>
      </div>
    </div>
  );
};


export const MaintenanceView: React.FC = () => {
    const { tickets } = useApp();
    const [tab, setTab] = useState<'TICKETS' | 'LOGBOOK'>('TICKETS');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    // Calculate critical tickets for Banner
    const criticalTickets = useMemo(() => {
        return tickets.filter(t => t.urgency === Urgency.HIGH && t.status !== TicketStatus.RESOLVED && t.status !== TicketStatus.VERIFIED);
    }, [tickets]);

    // SORT TICKETS: High Score First
    const sortedTickets = useMemo(() => {
        return [...tickets].sort((a, b) => b.priorityScore - a.priorityScore);
    }, [tickets]);

    return (
        <div>
            {/* ALERT BANNER */}
            {criticalTickets.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-start gap-3 animate-pulse">
                    <AlertOctagon className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-rose-800 font-bold text-sm">¡Atención Requerida!</h3>
                        <p className="text-rose-700 text-sm">
                            Hay <strong>{criticalTickets.length} ticket(s) de URGENCIA ALTA</strong> que requieren atención inmediata. 
                            Revisa las tarjetas con borde rojo y score de prioridad elevado.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Operaciones</h2>
                <div className="flex bg-white p-1 rounded-lg border border-slate-200">
                    <button 
                        onClick={() => setTab('TICKETS')}
                        className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${tab === 'TICKETS' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Tickets
                    </button>
                    <button 
                        onClick={() => setTab('LOGBOOK')}
                        className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${tab === 'LOGBOOK' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Bitácora Digital
                    </button>
                </div>
            </div>

            {tab === 'TICKETS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                     {sortedTickets.filter(t => t.status !== TicketStatus.VERIFIED).map(t => (
                         <TicketCard key={t.id} ticket={t} onEdit={setSelectedTicket} />
                     ))}
                     {sortedTickets.filter(t => t.status !== TicketStatus.VERIFIED).length === 0 && (
                         <div className="col-span-full py-12 text-center text-slate-400">No hay tickets pendientes. ¡Buen trabajo!</div>
                     )}
                </div>
            )}

            {tab === 'LOGBOOK' && <LogbookTab />}
            
            {selectedTicket && <TicketEditModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
        </div>
    );
};