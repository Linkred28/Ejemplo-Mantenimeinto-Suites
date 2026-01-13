import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { Impact, Ticket, TicketStatus, Urgency } from '../types';
import { ROOMS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import {
  AlertCircle,
  ShoppingBag,
  Clock,
  CheckCircle,
  ChevronRight,
  Sparkles,
  Flame,
  Repeat,
  Package,
  Minus,
  Plus,
  FileText,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  LayoutGrid,
  Filter
} from 'lucide-react';
import { getStatusColor, getUrgencyColor } from '../utils';

// ===============================
// INVENTARIO (DEMO LOCAL)
// ===============================

type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  onHand: number;
  min: number;
  reorderTo: number;
  location?: string;
  updatedAt?: string;
};

type POItem = { partId: string; name: string; qty: number };

type PurchaseOrder = {
  id: string;
  createdAt: string;
  status: 'BORRADOR' | 'ENVIADA' | 'RECIBIDA';
  items: POItem[];
  notes?: string;
};

const INVENTORY_STORAGE_KEY = 'metodiko_demo_inventory_v1';
const PO_STORAGE_KEY = 'metodiko_demo_purchase_orders_v1';

const normalizePart = (s: string) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const DEFAULT_INVENTORY: InventoryItem[] = [
  {
    id: 'P-001',
    name: 'Outlet Universal Premium Blanco',
    unit: 'pza',
    onHand: 0,
    min: 2,
    reorderTo: 6,
    location: 'Almacén',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'P-002',
    name: 'Empaque lavabo (universal)',
    unit: 'pza',
    onHand: 12,
    min: 5,
    reorderTo: 20,
    location: 'Almacén',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'P-003',
    name: 'Capacitor HVAC 35uF',
    unit: 'pza',
    onHand: 1,
    min: 2,
    reorderTo: 6,
    location: 'Almacén',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'P-004',
    name: 'Baterías AA (Pack)',
    unit: 'pack',
    onHand: 3,
    min: 2,
    reorderTo: 8,
    location: 'Recepción',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'P-005',
    name: 'Filtro AC (standard)',
    unit: 'pza',
    onHand: 0,
    min: 4,
    reorderTo: 12,
    location: 'Almacén',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'P-006',
    name: 'Cable HDMI 2m',
    unit: 'pza',
    onHand: 5,
    min: 2,
    reorderTo: 10,
    location: 'Almacén',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'P-007',
    name: 'Silicón sanitario',
    unit: 'tubo',
    onHand: 1,
    min: 2,
    reorderTo: 6,
    location: 'Almacén',
    updatedAt: new Date().toISOString()
  }
];

const stockBadge = (onHand: number, min: number) => {
  if (onHand <= 0) {
    return {
      label: 'SIN STOCK',
      cls: 'bg-rose-100 text-rose-800 border-rose-200'
    };
  }
  if (onHand <= min) {
    return {
      label: 'BAJO',
      cls: 'bg-amber-100 text-amber-800 border-amber-200'
    };
  }
  return {
    label: 'OK',
    cls: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  };
};

const suggestedReorder = (item: InventoryItem) => {
  if (item.onHand <= 0) return Math.max(0, item.reorderTo);
  if (item.onHand <= item.min) return Math.max(0, item.reorderTo - item.onHand);
  return 0;
};

const nextPOId = (existing: PurchaseOrder[]) => {
  const max = existing.reduce((m, po) => {
    const n = parseInt(String(po.id).replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 2000);
  return `PO-${max + 1}`;
};

// ===============================
// UI COMPONENTS (DASHBOARD STYLE)
// ===============================

const DashboardCard: React.FC<{
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, action, children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col ${className}`}>
    <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100/50">
      <h3 className="font-bold text-slate-800 text-sm tracking-tight">{title}</h3>
      {action && <div>{action}</div>}
      {!action && (
        <button className="text-slate-400 hover:text-slate-600">
          <MoreHorizontal size={16} />
        </button>
      )}
    </div>
    <div className="p-6 flex-1 flex flex-col">{children}</div>
  </div>
);

const KPICard: React.FC<{ 
  title: string; 
  value: string | number; 
  trend?: { value: string; up: boolean };
  icon: React.ReactNode;
  colorClass: string; 
}> = ({ title, value, trend, icon, colorClass }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">{title}</p>
      <h4 className="text-2xl font-black text-slate-900">{value}</h4>
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trend.up ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{trend.value}</span>
          <span className="text-slate-400 font-normal ml-1">vs mes pasado</span>
        </div>
      )}
    </div>
    <div className={`p-3 rounded-xl ${colorClass} text-white shadow-sm`}>
      {icon}
    </div>
  </div>
);

const Pill: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${className}`}
  >
    {children}
  </span>
);

const daysBetween = (iso: string) => {
  const d = new Date(iso).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - d) / (1000 * 3600 * 24)));
};

const withinDays = (iso: string, days: number) => {
  const t = new Date(iso).getTime();
  return Date.now() - t <= days * 24 * 3600 * 1000;
};

const isCriticalTicket = (t: Ticket) => t.urgency === Urgency.HIGH || t.impact === Impact.BLOCKING;
const isPendingTicket = (t: Ticket) => t.status !== TicketStatus.VERIFIED;

const getVerifiedDate = (t: Ticket): Date | null => {
  if (t.closedAt) return new Date(t.closedAt);
  const ev = [...t.history].reverse().find(h => (h.action || '').toLowerCase().includes('verific'));
  return ev ? new Date(ev.date) : null;
};

const withinLastDays = (d: Date, days: number) => {
  const diff = Date.now() - d.getTime();
  return diff <= days * 24 * 3600 * 1000;
};

// ===============================
// MAIN VIEW
// ===============================

export const ManagementView: React.FC = () => {
  const { tickets, exportCSV, runScenario } = useApp();

  const [tab, setTab] = useState<'PRIORITY' | 'BUY' | 'VENDOR'>('PRIORITY');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [toast, setToast] = useState<string>('');
  
  // INVENTARIO (local)
  const [inventory, setInventory] = useState<InventoryItem[]>(DEFAULT_INVENTORY);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  // Load inventory + POs
  useEffect(() => {
    const inv = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (inv) {
      try {
        const parsed: InventoryItem[] = JSON.parse(inv);
        if (Array.isArray(parsed) && parsed.length) setInventory(parsed);
      } catch { /* ignore */ }
    }
    const pos = localStorage.getItem(PO_STORAGE_KEY);
    if (pos) {
      try {
        const parsed: PurchaseOrder[] = JSON.parse(pos);
        if (Array.isArray(parsed)) setPurchaseOrders(parsed);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(PO_STORAGE_KEY, JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  // ---------- Calculations ----------
  const pendingTickets = tickets.filter(isPendingTicket);
  const pendingCount = pendingTickets.length;
  const criticalCount = pendingTickets.filter(isCriticalTicket).length;
  const blockedCount = tickets.filter(t => t.status === TicketStatus.WAITING_PART || t.status === TicketStatus.VENDOR).length;
  const closed7d = tickets.filter(t => t.status === TicketStatus.VERIFIED && withinLastDays(getVerifiedDate(t) || new Date(), 7)).length;

  const topPriority = useMemo(() => {
    return [...tickets]
      .filter(t => t.status !== TicketStatus.VERIFIED)
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 5);
  }, [tickets]);

  // Chart: issues by asset
  const assetData = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach(t => {
      counts[t.asset] = (counts[t.asset] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [tickets]);

  const fireToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const handleScenario = (type: 'GUEST_COMPLAINT' | 'CLEANING_REPORT' | 'BLOCK_PART' | 'BLOCK_VENDOR') => {
    runScenario(type);
    fireToast('Escenario ejecutado: Dashboard actualizado');
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl z-50 text-sm animate-bounce">
          {toast}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bienvenido de nuevo, Marc!</h1>
          <p className="text-slate-500 text-sm mt-1">Aquí tienes el resumen operativo de hoy en European Lifestyle Suites.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex bg-white border border-slate-200 rounded-lg p-1">
             <button className="px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded">Propiedad</button>
             <button className="px-3 py-1 text-xs font-bold text-white bg-slate-800 rounded shadow-sm">Portafolio</button>
          </div>
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all"
          >
            <FileText size={16} /> Reporte CSV
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Pendientes Activos" 
          value={pendingCount} 
          trend={{ value: '12%', up: false }} // Red is bad for pending count going up, but logic is simplified here
          icon={<Clock size={24} />} 
          colorClass="bg-blue-500" 
        />
        <KPICard 
          title="Casos Críticos" 
          value={criticalCount} 
          trend={{ value: '2', up: false }} 
          icon={<AlertCircle size={24} />} 
          colorClass="bg-rose-500" 
        />
        <KPICard 
          title="Bloqueados" 
          value={blockedCount} 
          icon={<ShoppingBag size={24} />} 
          colorClass="bg-amber-500" 
        />
        <KPICard 
          title="Resueltos (7d)" 
          value={closed7d} 
          trend={{ value: '8%', up: true }} 
          icon={<CheckCircle size={24} />} 
          colorClass="bg-emerald-500" 
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Charts & Map) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Chart Widget */}
          <DashboardCard title="Frecuencia de Incidencias (Por Activo)">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-slate-500">Últimos 30 días</div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-800"></span>Top</span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-rose-500"></span>Crítico</span>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assetData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                    {assetData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index < 2 ? '#f43f5e' : '#1e293b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          {/* Quick Actions (Scenarios) */}
          <DashboardCard title="Acciones Rápidas (Demo Trigger)">
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button onClick={() => handleScenario('GUEST_COMPLAINT')} className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-rose-50 hover:border-rose-100 transition-colors group">
                   <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"><AlertCircle size={16} className="text-rose-500"/></div>
                   <span className="text-xs font-bold text-slate-600 text-center">Queja Huésped</span>
                </button>
                <button onClick={() => handleScenario('CLEANING_REPORT')} className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-100 transition-colors group">
                   <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"><Repeat size={16} className="text-blue-500"/></div>
                   <span className="text-xs font-bold text-slate-600 text-center">Reporte Limpieza</span>
                </button>
                <button onClick={() => handleScenario('BLOCK_PART')} className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-amber-50 hover:border-amber-100 transition-colors group">
                   <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"><ShoppingBag size={16} className="text-amber-500"/></div>
                   <span className="text-xs font-bold text-slate-600 text-center">Falta Pieza</span>
                </button>
                <button onClick={() => handleScenario('BLOCK_VENDOR')} className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-purple-50 hover:border-purple-100 transition-colors group">
                   <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"><Flame size={16} className="text-purple-500"/></div>
                   <span className="text-xs font-bold text-slate-600 text-center">Proveedor</span>
                </button>
             </div>
          </DashboardCard>

        </div>

        {/* Right Column (Lists) */}
        <div className="space-y-6">
          
          {/* Priority List */}
          <DashboardCard 
            title="Atención Requerida (Top 5)" 
            className="h-full max-h-[500px]"
            action={
              <button className="text-xs font-bold text-blue-600 hover:underline flex items-center">
                Ver todos <ChevronRight size={12} />
              </button>
            }
          >
            <div className="space-y-4 overflow-y-auto pr-2">
              {topPriority.length === 0 && <p className="text-sm text-slate-400 italic text-center py-4">Todo al día 🎉</p>}
              
              {topPriority.map(t => (
                <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group cursor-pointer">
                  <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0 ${isCriticalTicket(t) ? 'bg-rose-500' : 'bg-slate-700'}`}>
                    {t.roomNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-slate-800 truncate pr-2">{t.asset}</h4>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getStatusColor(t.status)}`}>{t.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{t.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] flex items-center gap-1 font-medium ${getUrgencyColor(t.urgency)}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${t.urgency === Urgency.HIGH ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                        {t.urgency}
                      </span>
                      <span className="text-[10px] text-slate-400">•</span>
                      <span className="text-[10px] text-slate-400">{daysBetween(t.createdAt)}d antigüedad</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>

          {/* Inventory Snapshot */}
          <DashboardCard title="Inventario Crítico">
             <div className="space-y-3">
                {inventory.filter(i => i.onHand <= i.min).slice(0,4).map(i => (
                   <div key={i.id} className="flex items-center justify-between p-2 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3">
                         <div className={`w-2 h-8 rounded-full ${i.onHand === 0 ? 'bg-rose-500' : 'bg-amber-400'}`}></div>
                         <div>
                            <p className="text-xs font-bold text-slate-800">{i.name}</p>
                            <p className="text-[10px] text-slate-400">Stock: {i.onHand} {i.unit}</p>
                         </div>
                      </div>
                      <button className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors">
                         Reordenar
                      </button>
                   </div>
                ))}
                {inventory.filter(i => i.onHand <= i.min).length === 0 && (
                   <div className="text-center py-4">
                      <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-50"/>
                      <p className="text-xs text-slate-400">Niveles de stock óptimos.</p>
                   </div>
                )}
             </div>
          </DashboardCard>

        </div>
      </div>
    </div>
  );
};