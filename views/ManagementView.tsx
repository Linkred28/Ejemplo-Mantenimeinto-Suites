import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { Impact, Ticket, TicketStatus, Urgency } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import {
  AlertCircle,
  ShoppingBag,
  Clock,
  CheckCircle,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  User,
  Users
} from 'lucide-react';

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
  subtitle?: string;
  icon: React.ReactNode;
  colorClass: string; 
}> = ({ title, value, subtitle, icon, colorClass }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">{title}</p>
      <h4 className="text-2xl font-black text-slate-900">{value}</h4>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
    <div className={`p-3 rounded-xl ${colorClass} text-white shadow-sm`}>
      {icon}
    </div>
  </div>
);

export const ManagementView: React.FC = () => {
  const { tickets } = useApp();

  const pendingTickets = tickets.filter(t => t.status !== TicketStatus.VERIFIED);
  const guestComplaints = pendingTickets.filter(t => t.origin === 'GUEST').length;
  const staffFindings = pendingTickets.filter(t => t.origin === 'STAFF' || t.origin === 'SYSTEM').length;
  const blockedCount = tickets.filter(t => t.status === TicketStatus.WAITING_PART).length;
  
  // Average Time Calculation (Mock logic for demo)
  const resolvedTickets = tickets.filter(t => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.VERIFIED);
  const avgTime = resolvedTickets.length > 0 
    ? Math.round(resolvedTickets.reduce((acc, t) => acc + (t.timeSpentMinutes || 30), 0) / resolvedTickets.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Resumen Operativo</h1>
          <span className="text-sm text-slate-500">Última actualización: Ahora</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Quejas de Huésped" 
          value={guestComplaints} 
          subtitle="Requieren atención inmediata"
          icon={<Users size={24} />} 
          colorClass="bg-rose-500" 
        />
        <KPICard 
          title="Hallazgos Internos" 
          value={staffFindings} 
          subtitle="Preventivos / Inspecciones"
          icon={<CheckCircle size={24} />} 
          colorClass="bg-blue-500" 
        />
        <KPICard 
          title="Tiempo Promedio" 
          value={`${avgTime} min`} 
          subtitle="Por ticket resuelto"
          icon={<Clock size={24} />} 
          colorClass="bg-emerald-500" 
        />
        <KPICard 
          title="Falta Refacción" 
          value={blockedCount} 
          subtitle="Tickets detenidos"
          icon={<ShoppingBag size={24} />} 
          colorClass="bg-amber-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DashboardCard title="Desglose por Origen" className="lg:col-span-2">
              <div className="space-y-4">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold">
                          {Math.round((guestComplaints / (pendingTickets.length || 1)) * 100)}%
                      </div>
                      <div>
                          <h4 className="font-bold text-slate-800">Origen: Huésped</h4>
                          <p className="text-sm text-slate-500">Problemas reportados durante la estadía (Reactivo)</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {Math.round((staffFindings / (pendingTickets.length || 1)) * 100)}%
                      </div>
                      <div>
                          <h4 className="font-bold text-slate-800">Origen: Staff / Preventivo</h4>
                          <p className="text-sm text-slate-500">Detectados por limpieza, supervisión o bitácoras</p>
                      </div>
                  </div>
              </div>
          </DashboardCard>

          <DashboardCard title="Top Incidencias">
              <ul className="space-y-3">
                  {/* Mock Data for simplicity */}
                  <li className="flex justify-between items-center text-sm">
                      <span>Aire Acondicionado</span>
                      <span className="font-bold">42%</span>
                  </li>
                  <li className="flex justify-between items-center text-sm">
                      <span>Plomería (Fugas)</span>
                      <span className="font-bold">28%</span>
                  </li>
                  <li className="flex justify-between items-center text-sm">
                      <span>Iluminación</span>
                      <span className="font-bold">15%</span>
                  </li>
              </ul>
          </DashboardCard>
      </div>
    </div>
  );
};