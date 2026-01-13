import React, { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { ASSETS, ISSUE_TYPES, ROOMS } from '../constants';
import { Impact, Role, Urgency, TicketStatus, InventoryPart } from '../types';
import { Button } from '../components/Button';
import { 
  CheckCircle, 
  ChevronLeft, 
  ClipboardCheck, 
  AlertTriangle, 
  ArrowRight,
  Package
} from 'lucide-react';

interface SupervisorViewProps {
  onBack: () => void;
  isEmbedded?: boolean;
}

export const SupervisorView: React.FC<SupervisorViewProps> = ({ onBack, isEmbedded = false }) => {
  const { addTicket, parts } = useApp();
  
  // Steps: 'SELECT_ROOM' | 'FORM' | 'SUCCESS'
  const [step, setStep] = useState<'SELECT_ROOM' | 'FORM' | 'SUCCESS'>('SELECT_ROOM');
  
  // Selection State
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [roomType, setRoomType] = useState<string>('');

  // Form State
  const [asset, setAsset] = useState(ASSETS[0]);
  const [issue, setIssue] = useState(ISSUE_TYPES[0]);
  const [urgency, setUrgency] = useState<Urgency>(Urgency.MEDIUM);
  const [desc, setDesc] = useState('');
  
  // Part Selection State
  const [needsPart, setNeedsPart] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  
  const handleRoomSelect = (roomNum: string, rType: string) => {
    setSelectedRoom(roomNum);
    setRoomType(rType);
    setStep('FORM');
    // Reset form defaults
    setAsset(ASSETS[0]);
    setIssue(ISSUE_TYPES[0]);
    setUrgency(Urgency.MEDIUM);
    setDesc('');
    setNeedsPart(false);
    setSelectedPartId('');
  };

  // Filter parts based on selected asset (simple category matching logic)
  const filteredParts = useMemo(() => {
    return parts.filter(p => {
        // Map Asset Name to Part Category roughly
        if (asset.includes('Aire') || asset.includes('HVAC')) return p.category === 'HVAC';
        if (asset.includes('Plomería')) return p.category === 'Plomería';
        if (asset.includes('Eléctrico')) return p.category === 'Eléctrico';
        if (asset.includes('Cerrajería')) return p.category === 'Cerrajería';
        if (asset.includes('TV') || asset.includes('WiFi')) return p.category === 'TV/WiFi';
        if (asset.includes('Mobiliario')) return p.category === 'Mobiliario';
        return true; // Show all if 'Otros' or no match
    });
  }, [parts, asset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const part = parts.find(p => p.id === selectedPartId);
    const hasPart = needsPart && !!selectedPartId;

    addTicket({
      roomNumber: selectedRoom,
      isOccupied: false, 
      asset,
      issueType: issue,
      urgency,
      impact: Impact.ANNOYING, 
      description: desc || `Reporte de inspección: ${issue} en ${asset}`,
      createdBy: Role.SUPERVISOR,
      notes: hasPart ? [`Requiere refacción: ${part?.name}`] : ['Generado desde App Supervisor'],
      
      // Inventory Link
      needsPart: hasPart,
      partId: hasPart ? selectedPartId : undefined,
      partName: hasPart ? part?.name : undefined,
      partQty: hasPart ? 1 : undefined,
      needsVendor: false,
      
      // Status Logic: If part is needed, set as WAITING_PART immediately to trigger stock alerts
      status: hasPart ? TicketStatus.WAITING_PART : TicketStatus.OPEN
    });

    setStep('SUCCESS');
  };

  const handleNext = () => {
    setStep('SELECT_ROOM');
    setSelectedRoom('');
  };

  return (
    <div className={`${isEmbedded ? 'h-full' : 'min-h-screen'} bg-slate-100 flex flex-col`}>
      {/* Header (Only show if NOT embedded) */}
      {!isEmbedded && (
        <div className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-1 hover:bg-slate-800 rounded">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="font-bold text-lg leading-tight">Supervisor</h1>
                <p className="text-xs text-slate-400">Inspección de Habitaciones</p>
              </div>
            </div>
            <ClipboardCheck className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      )}

      <div className={`flex-1 w-full p-4 ${isEmbedded ? '' : 'max-w-2xl mx-auto'}`}>
        
        {/* Title for Embedded Mode */}
        {isEmbedded && step === 'SELECT_ROOM' && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Inspección de Pisos</h2>
            <p className="text-slate-500">Seleccione una habitación para iniciar el reporte de incidencias.</p>
          </div>
        )}

        {/* STEP 1: SELECT ROOM */}
        {step === 'SELECT_ROOM' && (
          <div className="space-y-4">
            {!isEmbedded && <h2 className="font-bold text-slate-800 text-lg mb-4">Selecciona Habitación</h2>}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {ROOMS.map(r => (
                <button
                  key={r.number}
                  onClick={() => handleRoomSelect(r.number, r.type)}
                  className="bg-white border border-slate-200 rounded-xl p-2 flex flex-col items-center justify-center shadow-sm hover:border-slate-900 hover:shadow-md transition-all h-20"
                >
                  <span className="text-lg font-bold text-slate-900">{r.number}</span>
                  <span className="text-[10px] text-slate-500 uppercase">{r.type.substring(0,3)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: FORM */}
        {step === 'FORM' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-2xl mx-auto">
            <div className="bg-slate-50 border-b border-slate-200 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Habitación {selectedRoom}</h2>
                  <p className="text-sm text-slate-500">{roomType}</p>
                </div>
                <div className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                  EN INSPECCIÓN
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-6">
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">¿Dónde está el problema?</label>
                <div className="grid grid-cols-2 gap-2">
                  {ASSETS.slice(0, 6).map(a => (
                    <button
                      type="button"
                      key={a}
                      onClick={() => {
                          setAsset(a);
                          // Clear selection if category changes to avoid mismatch, or keep it? 
                          // Better to clear to force re-selection from correct list.
                          setSelectedPartId('');
                      }}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all text-left ${
                        asset === a 
                          ? 'bg-slate-900 text-white border-slate-900' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">¿Qué sucede?</label>
                <select 
                  value={issue} 
                  onChange={(e) => setIssue(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
                >
                  {ISSUE_TYPES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              {/* INVENTORY SECTION */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-800 cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="rounded text-slate-900 focus:ring-slate-900 w-4 h-4"
                            checked={needsPart}
                            onChange={(e) => setNeedsPart(e.target.checked)}
                          />
                          Requiere insumo / refacción
                      </label>
                      <Package size={18} className="text-amber-500" />
                  </div>
                  
                  {needsPart && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                          <select 
                              value={selectedPartId}
                              onChange={(e) => setSelectedPartId(e.target.value)}
                              className="w-full p-3 bg-white border border-amber-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                              required={needsPart}
                          >
                              <option value="">-- Seleccionar Artículo --</option>
                              {filteredParts.map(p => (
                                  <option key={p.id} value={p.id}>
                                      {p.name} (Disp: {p.stockOnHand - p.stockReserved})
                                  </option>
                              ))}
                          </select>
                          <p className="text-xs text-amber-700 mt-2 ml-1">
                              * Al seleccionar, se generará una alerta de stock/compra automáticamente.
                          </p>
                      </div>
                  )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nivel de Urgencia</label>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                  {[Urgency.LOW, Urgency.MEDIUM, Urgency.HIGH].map((u) => (
                     <button
                     key={u}
                     type="button"
                     onClick={() => setUrgency(u)}
                     className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                       urgency === u
                         ? u === Urgency.HIGH ? 'bg-rose-600 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                         : 'text-slate-500 hover:text-slate-700'
                     }`}
                   >
                     {u}
                   </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Notas Adicionales</label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Detalles específicos..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none min-h-[80px]"
                />
              </div>

              <Button type="submit" size="lg" className="w-full h-14 text-lg shadow-lg shadow-slate-900/20">
                <AlertTriangle className="w-5 h-5 mr-2" /> Reportar Incidencia
              </Button>

              <button 
                type="button" 
                onClick={() => setStep('SELECT_ROOM')}
                className="w-full text-center text-slate-400 text-sm py-2 hover:text-slate-600"
              >
                Cancelar
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 'SUCCESS' && (
          <div className="flex flex-col items-center justify-center pt-10 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">¡Ticket Generado!</h2>
              <p className="text-slate-500 mt-2">La incidencia en Habitación {selectedRoom} ha sido enviada al dashboard.</p>
              {needsPart && (
                  <p className="text-amber-600 font-medium text-sm mt-1 bg-amber-50 inline-block px-3 py-1 rounded-full border border-amber-100">
                      Solicitud de material registrada
                  </p>
              )}
            </div>
            
            <div className="w-full max-w-sm space-y-3 pt-8">
              <Button onClick={handleNext} size="lg" className="w-full h-14">
                Inspeccionar Siguiente <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              {!isEmbedded && (
                <Button variant="secondary" onClick={onBack} size="lg" className="w-full h-14">
                  Volver al Inicio
                </Button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};