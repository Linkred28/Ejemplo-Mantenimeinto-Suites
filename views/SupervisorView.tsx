import React, { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { ASSETS, ISSUE_TYPES, ROOMS, CHECKLIST_ROOM_EXIT } from '../constants';
import { Impact, Role, Urgency, TicketStatus } from '../types';
import { Button } from '../components/Button';
import { StockView } from './StockView';
import { 
  CheckCircle, 
  ChevronLeft, 
  AlertTriangle, 
  XCircle,
  CheckSquare,
  ClipboardList,
  Package,
  Wrench
} from 'lucide-react';

interface SupervisorViewProps {
  onBack: () => void;
  isEmbedded?: boolean;
}

export const SupervisorView: React.FC<SupervisorViewProps> = ({ onBack, isEmbedded = false }) => {
  const { addTicket, inspections, registerInspection, parts } = useApp();
  
  // Steps: 'SELECT_ROOM' | 'CHECKLIST' | 'SUCCESS' | 'STOCK'
  const [step, setStep] = useState<'SELECT_ROOM' | 'CHECKLIST' | 'SUCCESS' | 'STOCK'>('SELECT_ROOM');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  
  // Checklist Logic
  // completedItems: IDs of items marked as OK
  // failedItems: Record<ID, { comment, partId }> 
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [failedItems, setFailedItems] = useState<Record<string, { comment: string, partId?: string }>>({});
  
  // Show input box for specific item failure
  const [activeFailInput, setActiveFailInput] = useState<string | null>(null);
  const [tempFailComment, setTempFailComment] = useState('');
  const [tempFailPart, setTempFailPart] = useState(''); // Stores partId if needed

  const isInspectedToday = (roomNumber: string) => {
    const last = inspections[roomNumber];
    if (!last) return false;
    const today = new Date().toISOString().split('T')[0];
    return last.startsWith(today);
  };

  const handleRoomSelect = (roomNum: string) => {
    setSelectedRoom(roomNum);
    setStep('CHECKLIST');
    setCompletedItems([]);
    setFailedItems({});
    setActiveFailInput(null);
  };

  const markOK = (id: string) => {
    setCompletedItems(prev => [...prev.filter(i => i !== id), id]);
    // Remove from failures if it was there
    const newFailures = { ...failedItems };
    delete newFailures[id];
    setFailedItems(newFailures);
    setActiveFailInput(null);
  };

  const startFail = (id: string) => {
    setActiveFailInput(id);
    const existing = failedItems[id];
    setTempFailComment(existing?.comment || '');
    setTempFailPart(existing?.partId || '');
  };

  const confirmFail = (id: string) => {
    if (!tempFailComment.trim()) return; // Require comment
    setFailedItems(prev => ({ 
        ...prev, 
        [id]: { 
            comment: tempFailComment, 
            partId: tempFailPart || undefined 
        } 
    }));
    setCompletedItems(prev => prev.filter(i => i !== id)); // Remove from OK
    setActiveFailInput(null);
  };

  const cancelFail = (id: string) => {
    setActiveFailInput(null);
  };

  const handleFinishChecklist = () => {
    // 1. Register inspection
    registerInspection(selectedRoom);

    // 2. Generate tickets for failures
    Object.entries(failedItems).forEach(([id, data]) => {
      // Simple mapping from checklist ID to Asset Category
      let assetCat = 'General';
      if (id === 'ac') assetCat = 'Aire Acondicionado';
      if (id === 'water') assetCat = 'Plomería';
      if (id === 'lights') assetCat = 'Eléctrico';
      if (id === 'tv') assetCat = 'TV/WiFi';
      if (id === 'lock') assetCat = 'Cerrajería';

      addTicket({
        roomNumber: selectedRoom,
        isOccupied: false,
        asset: assetCat,
        issueType: 'Falla en Revisión',
        urgency: Urgency.MEDIUM,
        impact: Impact.ANNOYING,
        description: `[Checklist] ${data.comment}`,
        createdBy: Role.SUPERVISOR,
        notes: ['Generado automáticamente tras inspección de salida.'],
        
        // Lógica de Solicitud de Compra (Pool de dependientes)
        needsPart: !!data.partId,
        partId: data.partId,
        partQty: data.partId ? 1 : undefined, // Asumimos 1 por defecto en inspección rápida
        status: data.partId ? TicketStatus.WAITING_PART : TicketStatus.OPEN
      });
    });

    setStep('SUCCESS');
  };

  // Calculate progress
  const totalItems = CHECKLIST_ROOM_EXIT.length;
  const processedCount = completedItems.length + Object.keys(failedItems).length;
  const isComplete = processedCount === totalItems;

  return (
    <div className={`${isEmbedded ? 'h-full' : 'min-h-screen'} bg-slate-100 flex flex-col`}>
      
      {/* Header */}
      {!isEmbedded && (
        <div className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button onClick={onBack}><ChevronLeft /></button>
            <h1 className="font-bold">Supervisor</h1>
            <button onClick={() => setStep('STOCK')} className="flex flex-col items-center text-[10px]">
               <Package size={20} /> Stock
            </button>
          </div>
        </div>
      )}
      
      {isEmbedded && step === 'SELECT_ROOM' && (
         <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
            <h2 className="font-bold text-slate-800">Inspecciones</h2>
            <button 
                onClick={() => setStep('STOCK')} 
                className="text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2"
            >
               <Package size={16} /> Ver Inventario
            </button>
         </div>
      )}

      {/* BODY */}
      <div className={`flex-1 w-full p-4 ${isEmbedded ? '' : 'max-w-2xl mx-auto'}`}>

        {step === 'STOCK' && (
           <div className="bg-white rounded-xl shadow-sm p-4 min-h-[500px]">
              <div className="mb-4 flex items-center gap-2">
                 <button onClick={() => setStep('SELECT_ROOM')} className="text-slate-500 hover:text-slate-900"><ChevronLeft/></button>
                 <h2 className="text-xl font-bold">Consultar Stock</h2>
              </div>
              <StockView />
           </div>
        )}
        
        {step === 'SELECT_ROOM' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
               <div className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                  <span className="text-slate-500">Inspeccionada Hoy</span>
               </div>
               <div className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 bg-white border border-slate-300 rounded-sm"></div>
                  <span className="text-slate-500">Pendiente</span>
               </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {ROOMS.map(r => {
                const inspected = isInspectedToday(r.number);
                return (
                  <button
                    key={r.number}
                    onClick={() => handleRoomSelect(r.number)}
                    className={`border p-2 rounded-xl h-20 shadow-sm flex flex-col items-center justify-center transition-all ${
                        inspected 
                        ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-200' 
                        : 'bg-white hover:border-slate-900 text-slate-700'
                    }`}
                  >
                    <span className="font-bold text-lg">{r.number}</span>
                    {inspected && <CheckCircle size={14} className="mt-1 text-emerald-100"/>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 'CHECKLIST' && (
             <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 pb-24">
                 <div className="flex items-center justify-between mb-6">
                     <div>
                        <h2 className="text-2xl font-bold text-slate-900">Hab {selectedRoom}</h2>
                        <p className="text-sm text-slate-500">Checklist de Salida</p>
                     </div>
                     <div className="text-right">
                         <div className="text-2xl font-black text-slate-200">{Math.round((processedCount / totalItems) * 100)}%</div>
                     </div>
                 </div>
                 
                 <div className="space-y-4">
                     {CHECKLIST_ROOM_EXIT.map(item => {
                         const isOK = completedItems.includes(item.id);
                         const isFail = !!failedItems[item.id];
                         const failData = failedItems[item.id];
                         const isEditing = activeFailInput === item.id;

                         return (
                             <div key={item.id} className={`p-4 rounded-xl border transition-all ${
                                 isOK ? 'bg-emerald-50 border-emerald-200' : 
                                 isFail ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'
                             }`}>
                                 <div className="flex items-center justify-between mb-2">
                                     <span className={`font-bold ${isFail ? 'text-rose-700' : isOK ? 'text-emerald-700' : 'text-slate-700'}`}>
                                         {item.label}
                                     </span>
                                     <div className="flex gap-2">
                                         {/* OK BUTTON */}
                                         <button 
                                            onClick={() => markOK(item.id)}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                                                isOK ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-300 hover:border-emerald-500 hover:text-emerald-500'
                                            }`}
                                         >
                                             <CheckSquare size={20}/>
                                         </button>
                                         
                                         {/* FAIL BUTTON */}
                                         <button 
                                            onClick={() => startFail(item.id)}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                                                isFail ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-slate-200 text-slate-300 hover:border-rose-500 hover:text-rose-500'
                                            }`}
                                         >
                                             <AlertTriangle size={20}/>
                                         </button>
                                     </div>
                                 </div>

                                 {/* FAILURE INPUT MODE */}
                                 {isEditing && (
                                     <div className="mt-3 animate-in fade-in slide-in-from-top-2 space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                         <div>
                                            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Detalle del problema</label>
                                            <textarea 
                                                autoFocus
                                                className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                                                rows={2}
                                                placeholder="Describa la falla (ej. Foco fundido, Goteo...)"
                                                value={tempFailComment}
                                                onChange={e => setTempFailComment(e.target.value)}
                                            />
                                         </div>
                                         
                                         <div>
                                             <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1 mb-1">
                                                 <Wrench size={12}/> Refacción Necesaria (Solicitud)
                                             </label>
                                             <select 
                                                className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                                                value={tempFailPart}
                                                onChange={e => setTempFailPart(e.target.value)}
                                             >
                                                 <option value="">-- Ninguna / No sé --</option>
                                                 {parts.map(p => (
                                                     <option key={p.id} value={p.id}>
                                                         {p.name} (Stock: {p.stockOnHand})
                                                     </option>
                                                 ))}
                                             </select>
                                             <p className="text-[10px] text-slate-500 mt-1">
                                                 Si seleccionas una pieza, se generará una solicitud automática en el sistema.
                                             </p>
                                         </div>

                                         <div className="flex gap-2 justify-end pt-2">
                                             <button onClick={() => cancelFail(item.id)} className="text-xs font-bold text-slate-500 px-3 py-2 bg-white border border-slate-200 rounded hover:bg-slate-100">Cancelar</button>
                                             <button onClick={() => confirmFail(item.id)} className="text-xs font-bold bg-rose-600 text-white px-4 py-2 rounded shadow-md hover:bg-rose-700">Guardar Falla</button>
                                         </div>
                                     </div>
                                 )}

                                 {/* SAVED FAILURE DISPLAY */}
                                 {isFail && !isEditing && (
                                     <div className="mt-2 text-sm text-rose-800 bg-white/50 p-2 rounded border border-rose-100 flex flex-col gap-1">
                                         <div className="flex justify-between items-start">
                                            <span className="italic">"{failData.comment}"</span>
                                            <button onClick={() => startFail(item.id)} className="text-xs underline text-rose-500 shrink-0 ml-2">Editar</button>
                                         </div>
                                         {failData.partId && (
                                             <div className="flex items-center gap-1 text-xs font-bold text-rose-600 mt-1 bg-rose-50 w-fit px-2 py-0.5 rounded-full border border-rose-200">
                                                 <Package size={10} />
                                                 Solicita: {parts.find(p => p.id === failData.partId)?.name || 'Refacción'}
                                             </div>
                                         )}
                                     </div>
                                 )}
                             </div>
                         )
                     })}
                 </div>
                 
                 {/* FOOTER ACTIONS */}
                 <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-40 lg:absolute lg:rounded-b-xl">
                    <div className={`${isEmbedded ? '' : 'max-w-2xl mx-auto'}`}>
                        <Button 
                            onClick={handleFinishChecklist} 
                            disabled={!isComplete}
                            className={`w-full h-12 text-lg font-bold shadow-lg ${isComplete ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-300 text-slate-500'}`}
                        >
                            {isComplete ? (Object.keys(failedItems).length > 0 ? `Reportar ${Object.keys(failedItems).length} Fallos y Liberar` : 'Todo OK - Liberar Habitación') : 'Complete la lista para finalizar'}
                        </Button>
                    </div>
                 </div>
             </div>
        )}

        {step === 'SUCCESS' && (
             <div className="text-center pt-10 flex flex-col items-center justify-center h-full">
                 <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in">
                    <ClipboardList className="w-10 h-10 text-emerald-600"/>
                 </div>
                 <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Inspección Registrada!</h2>
                 <p className="text-slate-500 mb-8 max-w-xs mx-auto">
                    La habitación {selectedRoom} ha sido marcada como revisada hoy.
                    {Object.keys(failedItems).length > 0 && <span className="block mt-2 font-bold text-rose-600">Se generaron {Object.keys(failedItems).length} tickets y solicitudes de material.</span>}
                 </p>
                 <Button onClick={() => setStep('SELECT_ROOM')} size="lg" className="w-full max-w-xs">
                    Siguiente Habitación
                 </Button>
             </div>
        )}

      </div>
    </div>
  );
};