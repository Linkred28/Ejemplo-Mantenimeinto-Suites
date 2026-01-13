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
  ArrowRight
} from 'lucide-react';

export const StockView: React.FC = () => {
  const { parts, tickets, createPOForPart, pos, receivePO, reservePartForTicket } = useApp();
  const [tab, setTab] = useState<'LIST' | 'SHOPPING'>('SHOPPING');
  const [q, setQ] = useState('');

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

  const handleBuy = (partId: string, qty: number) => {
    const res = createPOForPart({ partId, qty, etaDays: 2 });
    if(res.ok) {
      alert(`Orden de Compra ${res.poId} generada.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestión de Stock y Compras</h2>
          <p className="text-slate-500">Control de inventario, reabastecimiento y órdenes de compra.</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
           <button 
             onClick={() => setTab('SHOPPING')}
             className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${tab === 'SHOPPING' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
           >
             <ShoppingCart size={16} /> Compras <span className="ml-1 bg-rose-500 text-white text-[10px] px-1.5 rounded-full">{shoppingSuggestions.length}</span>
           </button>
           <button 
             onClick={() => setTab('LIST')}
             className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${tab === 'LIST' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
           >
             <Package size={16} /> Inventario Total
           </button>
        </div>
      </div>

      {tab === 'SHOPPING' && (
        <div className="space-y-8">
           {/* Section 1: Alerts / Requirements */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <AlertTriangle className="text-amber-500" />
                   <h3 className="text-lg font-bold text-slate-800">Necesidades Detectadas</h3>
                </div>
                
                {shoppingSuggestions.length === 0 ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-8 text-center">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <h4 className="text-emerald-800 font-bold">Todo en orden</h4>
                    <p className="text-emerald-600 text-sm">No hay stock crítico ni tickets detenidos por falta de piezas.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Artículo</th>
                          <th className="px-4 py-3">Motivo</th>
                          <th className="px-4 py-3 text-right">Cantidad Sugerida</th>
                          <th className="px-4 py-3 text-right">Acción</th>
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
                                <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded text-xs">
                                  Requerido por {item.tickets.length} ticket(s)
                                </span>
                              ) : (
                                <span className="text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded text-xs">
                                  Stock Bajo (Mín: {item.part.minStock})
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-lg">
                              {item.suggestedQty} <span className="text-xs text-slate-400 font-normal">{item.part.unit}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button size="sm" onClick={() => handleBuy(item.part.id, item.suggestedQty)}>
                                <Plus size={14} className="mr-1" /> Generar OC
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Section 2: Active Orders */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                   <Truck className="text-blue-500" />
                   <h3 className="text-lg font-bold text-slate-800">Órdenes en Camino</h3>
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
                            <span className="text-xs font-bold text-blue-600">EN TRÁNSITO</span>
                            <div className="font-bold text-slate-800">{po.vendor}</div>
                            <div className="text-xs text-slate-500">ETA: {new Date(po.etaDate || '').toLocaleDateString()}</div>
                          </div>
                          <div className="text-right">
                             <div className="font-mono text-xs text-slate-400">{po.id}</div>
                          </div>
                       </div>
                       <div className="pl-2 space-y-1 my-3">
                          {po.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm border-b border-slate-50 pb-1 last:border-0">
                               <span className="text-slate-600 truncate max-w-[140px]">{item.partName}</span>
                               <span className="font-bold">x{item.qty}</span>
                            </div>
                          ))}
                       </div>
                       <Button size="sm" className="w-full bg-slate-900 text-white" onClick={() => receivePO(po.id)}>
                          Recibir Mercancía
                       </Button>
                    </div>
                  ))}
                </div>
              </div>
           </div>
        </div>
      )}

      {tab === 'LIST' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           {/* Filters */}
           <div className="p-4 border-b border-slate-200 flex items-center gap-4 bg-slate-50">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Buscar refacción..." 
                  className="pl-9 pr-4 py-2 w-full rounded-lg border border-slate-300 text-sm focus:ring-slate-500 focus:border-slate-500"
                  value={q}
                  onChange={e => setQ(e.target.value)}
                />
              </div>
           </div>

           {/* Table */}
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-white text-slate-500 font-semibold border-b border-slate-200">
                 <tr>
                   <th className="px-6 py-4">Artículo</th>
                   <th className="px-6 py-4">Categoría</th>
                   <th className="px-6 py-4">Ubicación</th>
                   <th className="px-6 py-4 text-center">Disponible</th>
                   <th className="px-6 py-4 text-center">Reservado</th>
                   <th className="px-6 py-4 text-center">Estado</th>
                   <th className="px-6 py-4 text-right">Acciones</th>
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
      )}
    </div>
  );
};
