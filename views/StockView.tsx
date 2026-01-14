import React, { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { InventoryPart, TicketStatus, Urgency } from '../types';
import { getStockBadge, shouldReorder, suggestedReorderQty, clampNonNeg } from '../utils';
import { Button } from '../components/Button';
import { 
  Package, 
  ShoppingCart, 
  Search, 
  AlertTriangle, 
  Plus, 
  History,
  CheckCircle,
  Truck,
  ArrowRight,
  MapPin,
  Tag,
  DollarSign,
  Calendar,
  X,
  Loader2
} from 'lucide-react';

export const StockView: React.FC = () => {
  const { parts, tickets, createPOForPart, pos, receivePO, reservePartForTicket } = useApp();
  const [tab, setTab] = useState<'LIST' | 'SHOPPING'>('SHOPPING');
  const [q, setQ] = useState('');

  // PO Modal State
  const [poModalItem, setPoModalItem] = useState<{part: InventoryPart, qty: number} | null>(null);
  const [confirmQty, setConfirmQty] = useState(0);

  // UI Feedback States
  const [processingPoId, setProcessingPoId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // --- Logic for Shopping List ---
  // 1. Items below min stock
  // 2. Tickets waiting for parts (unfulfilled)
  
  const activeTicketsWaiting = useMemo(() => {
    return tickets.filter(t => 
      t.status === TicketStatus.WAITING_PART || 
      (t.needsPart && !t.partId) // Needs part but not linked yet
    );
  }, [tickets]);

  const shoppingSuggestions = useMemo(() => {
    return parts.filter(p => shouldReorder(p) || activeTicketsWaiting.some(t => t.partId === p.id))
      .map(p => {
        const waitingTickets = activeTicketsWaiting.filter(t => t.partId === p.id);
        const waitingQty = waitingTickets.reduce((sum, t) => sum + (t.partQty || 1), 0);
        const suggested = suggestedReorderQty(p);
        
        // Final qty to buy: cover the deficit + minimum stock level
        const toBuy = Math.max(suggested, waitingQty);
        
        return {
          part: p,
          waitingQty,
          suggestedQty: toBuy,
          tickets: waitingTickets
        };
      });
  }, [parts, activeTicketsWaiting]);

  // --- Filtered Inventory ---
  const filteredParts = useMemo(() => {
    const term = q.toLowerCase();
    return parts.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.sku?.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
  }, [parts, q]);

  // Open Modal
  const openPOModal = (part: InventoryPart, defaultQty: number) => {
      setPoModalItem({ part, qty: defaultQty });
      setConfirmQty(defaultQty);
  };

  // Confirm Purchase
  const handleConfirmBuy = () => {
    if(!poModalItem || confirmQty <= 0) return;

    const res = createPOForPart({ 
        partId: poModalItem.part.id, 
        qty: confirmQty, 
        etaDays: poModalItem.part.leadTimeDays || 3 
    });

    if(res.ok) {
      setPoModalItem(null);
      setSuccessMsg(`Orden de Compra generada exitosamente.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      alert(`Error: ${res.message}`);
    }
  };

  // Handle Receive PO
  const handleReceivePO = (poId: string) => {
      setProcessingPoId(poId);
      
      // Simulate API delay/Processing time
      setTimeout(() => {
          const res = receivePO(poId);
          if (res.ok) {
              setSuccessMsg(`Mercancía recibida. Stock actualizado correctamente.`);
              setTimeout(() => setSuccessMsg(''), 4000);
          } else {
              alert(`Error al recibir: ${res.message}`);
          }
          setProcessingPoId(null);
      }, 1000);
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Create PO Modal */}
      {poModalItem && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                          <ShoppingCart size={18} className="text-slate-500"/> Nueva Orden de Compra
                      </h3>
                      <button onClick={() => setPoModalItem(null)} className="text-slate-400 hover:text-slate-600">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                      <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-xl shrink-0">
                              {confirmQty}
                          </div>
                          <div>
                              <h4 className="font-bold text-lg text-slate-800 leading-tight">{poModalItem.part.name}</h4>
                              <p className="text-sm text-slate-500 font-mono mt-0.5">{poModalItem.part.sku}</p>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">Cantidad</label>
                              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                                  <input 
                                    type="number" 
                                    className="w-full py-2 px-3 text-sm font-bold text-slate-900 border-none focus:ring-0 bg-transparent"
                                    value={confirmQty}
                                    onChange={e => setConfirmQty(Number(e.target.value))}
                                    min={1}
                                  />
                                  <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-2.5 border-l border-slate-200">
                                      {poModalItem.part.unit}
                                  </span>
                              </div>
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">Proveedor Sugerido</label>
                              <div className="w-full py-2.5 px-3 text-sm font-medium text-slate-700 bg-slate-50 rounded-lg border border-slate-200 truncate">
                                  {poModalItem.part.preferredVendor || 'Genérico'}
                              </div>
                          </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex items-start gap-3">
                          <Calendar className="text-amber-600 shrink-0 mt-0.5" size={16}/>
                          <div>
                              <p className="text-xs font-bold text-amber-800">Entrega Estimada</p>
                              <p className="text-xs text-amber-700">
                                  {poModalItem.part.leadTimeDays || 3} días hábiles después de confirmación.
                              </p>
                          </div>
                      </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                      <Button variant="ghost" onClick={() => setPoModalItem(null)}>Cancelar</Button>
                      <Button onClick={handleConfirmBuy}>Confirmar Generación</Button>
                  </div>
              </div>
          </div>
      )}

      {/* Global Success Toast */}
      {successMsg && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-xl animate-in slide-in-from-right-5 fade-in flex items-center gap-3">
            <CheckCircle className="text-white" size={20} />
            <span className="font-bold">{successMsg}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Gestión de Stock</h2>
          <p className="text-sm text-slate-500">Inventario y reabastecimiento.</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-full md:w-auto">
           <button 
             onClick={() => setTab('SHOPPING')}
             className={`flex-1 md:flex-none px-4 py-2 text-xs md:text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${tab === 'SHOPPING' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
           >
             <ShoppingCart size={16} /> Compras <span className="ml-1 bg-rose-500 text-white text-[10px] px-1.5 rounded-full">{shoppingSuggestions.length}</span>
           </button>
           <button 
             onClick={() => setTab('LIST')}
             className={`flex-1 md:flex-none px-4 py-2 text-xs md:text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${tab === 'LIST' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
           >
             <Package size={16} /> Inventario
           </button>
        </div>
      </div>

      {tab === 'SHOPPING' && (
        <div className="space-y-8">
           {/* Section 1: Alerts / Requirements */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <AlertTriangle className="text-amber-500" size={20} />
                   <h3 className="text-lg font-bold text-slate-800">Necesidades Detectadas</h3>
                </div>
                
                {shoppingSuggestions.length === 0 ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-8 text-center">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <h4 className="text-emerald-800 font-bold">Todo en orden</h4>
                    <p className="text-emerald-600 text-sm">No hay stock crítico ni tickets detenidos.</p>
                  </div>
                ) : (
                  <>
                    {/* MOBILE CARD VIEW (Visible on small screens) */}
                    <div className="md:hidden space-y-3">
                      {shoppingSuggestions.map((item) => (
                        <div key={item.part.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">{item.part.name}</div>
                                    <div className="text-xs text-slate-400">{item.part.sku}</div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-2xl font-black text-slate-900 leading-none">{item.suggestedQty}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">{item.part.unit}</span>
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                {item.waitingQty > 0 ? (
                                    <div className="flex items-center gap-2 text-rose-700 text-xs font-bold">
                                        <AlertTriangle size={14}/>
                                        Requerido por {item.tickets.length} ticket(s)
                                    </div>
                                ) : (
                                    <div className="text-amber-700 text-xs font-medium">
                                        Stock Bajo (Mínimo: {item.part.minStock})
                                    </div>
                                )}
                            </div>

                            <Button size="md" className="w-full justify-center" onClick={() => openPOModal(item.part, item.suggestedQty)}>
                                <Plus size={16} className="mr-2" /> Generar Orden de Compra
                            </Button>
                        </div>
                      ))}
                    </div>

                    {/* DESKTOP TABLE VIEW (Fixing Overflow) */}
                    <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[600px]">
                          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-3 whitespace-nowrap">Artículo</th>
                              <th className="px-4 py-3 whitespace-nowrap">Motivo</th>
                              <th className="px-4 py-3 text-right whitespace-nowrap">Cant. Sugerida</th>
                              <th className="px-4 py-3 text-right whitespace-nowrap w-[180px]">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {shoppingSuggestions.map((item) => (
                              <tr key={item.part.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="font-bold text-slate-800">{item.part.name}</div>
                                  <div className="text-xs text-slate-400">{item.part.sku}</div>
                                </td>
                                <td className="px-4 py-3">
                                  {item.waitingQty > 0 ? (
                                    <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded text-xs whitespace-nowrap">
                                      Requerido ({item.tickets.length})
                                    </span>
                                  ) : (
                                    <span className="text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded text-xs whitespace-nowrap">
                                      Stock Bajo
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-lg">
                                  {item.suggestedQty} <span className="text-xs text-slate-400 font-normal">{item.part.unit}</span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <Button size="sm" onClick={() => openPOModal(item.part, item.suggestedQty)}>
                                    <Plus size={14} className="mr-1" /> Generar OC
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Section 2: Active Orders */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                   <Truck className="text-blue-500" size={20}/>
                   <h3 className="text-lg font-bold text-slate-800">En Camino</h3>
                </div>
                
                <div className="space-y-3">
                  {pos.filter(p => p.status === 'Pedido').length === 0 && (
                     <div className="p-6 border border-slate-200 border-dashed rounded-xl text-center text-slate-400 text-sm">
                        No hay órdenes activas.
                     </div>
                  )}
                  {pos.filter(p => p.status === 'Pedido').map(po => (
                    <div key={po.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden group">
                       <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                       <div className="flex justify-between items-start mb-2 pl-2">
                          <div>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">EN TRÁNSITO</span>
                            <div className="font-bold text-slate-800 mt-1">{po.vendor}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{po.id}</div>
                          </div>
                          <div className="text-right">
                             <div className="text-xs text-slate-500">ETA</div>
                             <div className="font-bold text-slate-700">{new Date(po.etaDate || '').getDate()}/{new Date(po.etaDate || '').getMonth()+1}</div>
                          </div>
                       </div>
                       <div className="pl-2 space-y-1 my-3 border-t border-slate-50 pt-2">
                          {po.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                               <span className="text-slate-600 truncate max-w-[140px]">{item.partName}</span>
                               <span className="font-bold">x{item.qty}</span>
                            </div>
                          ))}
                       </div>
                       <Button 
                          size="sm" 
                          className="w-full bg-slate-900 text-white justify-center disabled:opacity-70 disabled:cursor-not-allowed" 
                          onClick={() => handleReceivePO(po.id)}
                          disabled={processingPoId === po.id}
                        >
                          {processingPoId === po.id ? (
                              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Procesando...</>
                          ) : (
                              'Recibir Mercancía'
                          )}
                       </Button>
                    </div>
                  ))}
                </div>
              </div>
           </div>
        </div>
      )}

      {tab === 'LIST' && (
        <div className="space-y-4">
           {/* Filters */}
           <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Buscar refacción..." 
                  className="pl-9 pr-4 py-2 w-full bg-slate-50 text-slate-900 rounded-lg border-none text-sm focus:ring-2 focus:ring-slate-200"
                  value={q}
                  onChange={e => setQ(e.target.value)}
                />
              </div>
           </div>

            {/* MOBILE LIST CARD VIEW */}
            <div className="md:hidden grid grid-cols-1 gap-3">
                {filteredParts.map(part => {
                   const available = part.stockOnHand - part.stockReserved;
                   const badge = getStockBadge(part);
                   return (
                     <div key={part.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                             <div>
                                 <h4 className="font-bold text-slate-900 text-sm">{part.name}</h4>
                                 <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <Tag size={10}/> {part.category}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">{part.sku}</span>
                                 </div>
                             </div>
                             <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold border ${badge.className}`}>
                               {badge.label}
                             </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-50">
                             <div>
                                 <span className="text-[10px] text-slate-400 uppercase font-bold block">Disponible</span>
                                 <span className="text-xl font-bold text-slate-800">{available} <span className="text-xs font-normal text-slate-400">{part.unit}</span></span>
                             </div>
                             <div>
                                 <span className="text-[10px] text-slate-400 uppercase font-bold block">Ubicación</span>
                                 <span className="text-sm font-medium text-slate-600 flex items-center gap-1 mt-0.5">
                                     <MapPin size={12}/> {part.location}
                                 </span>
                             </div>
                        </div>
                     </div>
                   );
                })}
            </div>

           {/* DESKTOP TABLE VIEW */}
           <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left min-w-[700px]">
                 <thead className="bg-white text-slate-500 font-semibold border-b border-slate-200">
                   <tr>
                     <th className="px-6 py-4 whitespace-nowrap">Artículo</th>
                     <th className="px-6 py-4 whitespace-nowrap">Categoría</th>
                     <th className="px-6 py-4 whitespace-nowrap">Ubicación</th>
                     <th className="px-6 py-4 text-center whitespace-nowrap">Disponible</th>
                     <th className="px-6 py-4 text-center whitespace-nowrap">Reservado</th>
                     <th className="px-6 py-4 text-center whitespace-nowrap">Estado</th>
                     <th className="px-6 py-4 text-right whitespace-nowrap">Acciones</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {filteredParts.map(part => {
                     const available = part.stockOnHand - part.stockReserved;
                     const badge = getStockBadge(part);
                     return (
                       <tr key={part.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4">
                           <div className="font-bold text-slate-900">{part.name}</div>
                           <div className="text-xs text-slate-400 font-mono">{part.sku}</div>
                         </td>
                         <td className="px-6 py-4 text-slate-600">{part.category}</td>
                         <td className="px-6 py-4 text-slate-500 text-xs">{part.location}</td>
                         <td className="px-6 py-4 text-center font-bold text-lg">{available}</td>
                         <td className="px-6 py-4 text-center text-slate-400">{part.stockReserved}</td>
                         <td className="px-6 py-4 text-center">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${badge.className}`}>
                             {badge.label}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                           <button className="text-slate-400 hover:text-slate-900 transition-colors">
                             <History size={18} />
                           </button>
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};