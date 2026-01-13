// src/AppContext.tsx

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AuditEvent,
  InventoryPart,
  PartMovement,
  POStatus,
  PurchaseOrder,
  Role,
  Ticket,
  TicketStatus,
  Urgency,
  Impact,
  LogbookEntry,
  TicketOrigin
} from './types';
import { INITIAL_PARTS, INITIAL_POS, INITIAL_TICKETS } from './constants';
import { calculatePriority, getMaintenanceType } from './utils';

type DemoScenario = 'GUEST_COMPLAINT' | 'CLEANING_REPORT' | 'BLOCK_PART' | 'BLOCK_VENDOR';
type ViewType = 'DASHBOARD' | 'STOCK';

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;

  currentView: ViewType;
  setView: (view: ViewType) => void;

  // Tickets
  tickets: Ticket[];
  addTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'history' | 'priorityScore' | 'maintenanceType' | 'origin'> & { status?: TicketStatus, origin?: TicketOrigin }) => void;
  updateTicket: (id: string, updates: Partial<Ticket>, actionDescription: string) => void;
  cannibalizePart: (recipientTicketId: string, donorRoom: string, partName: string) => void;

  // Inventario
  parts: InventoryPart[];
  pos: PurchaseOrder[];
  movements: PartMovement[];

  // Bitácora
  logbook: LogbookEntry[];
  addLogbookEntry: (entry: Omit<LogbookEntry, 'id'>) => void;
  
  // Inspecciones (NUEVO)
  inspections: Record<string, string>; // roomNumber -> ISODateString (última inspección)
  registerInspection: (roomNumber: string) => void;

  // Acciones inventario
  reservePartForTicket: (ticketId: string, partId: string, qty: number) => { ok: boolean; message: string };
  releaseReservationForTicket: (ticketId: string, note?: string) => { ok: boolean; message: string };
  issueReservedPartForTicket: (ticketId: string, note?: string) => { ok: boolean; message: string };

  createPOForPart: (params: {
    partId: string;
    qty: number;
    vendor?: string;
    etaDays?: number;
    ticketId?: string;
  }) => { ok: boolean; message: string; poId?: string };
  receivePO: (poId: string) => { ok: boolean; message: string };
  adjustStock: (params: { partId: string; delta: number; note?: string }) => { ok: boolean; message: string };

  // Utilidades
  resetDemoData: () => void;
  exportCSV: () => void;
  runScenario: (scenario: DemoScenario) => string | null;

  permissions: {
    canViewInventory: boolean;
    canReserve: boolean;
    canCreatePO: boolean;
    canAdjustStock: boolean;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helpers
const nextId = (prefix: string, existingIds: string[], start: number) => {
  const max = existingIds.reduce((m, id) => {
    const n = parseInt(String(id).replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, start);
  return `${prefix}${max + 1}`;
};

const nextTicketId = (tickets: Ticket[]) => nextId('T-', tickets.map(t => t.id), 1000);
const nextMovementId = (movs: PartMovement[]) => nextId('M-', movs.map(m => m.id), 0);
const nextPOId = (pos: PurchaseOrder[]) => nextId('OC-', pos.map(p => p.id), 0);
const nextLogId = (logs: LogbookEntry[]) => nextId('LOG-', logs.map(l => l.id), 0);

const createAudit = (user: Role, action: string): AuditEvent => ({
  date: new Date().toISOString(),
  action,
  user,
});

const clampNonNeg = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0);

const findPartIdByName = (parts: InventoryPart[], name?: string) => {
  if (!name) return undefined;
  const match = parts.find(p => p.name.toLowerCase().trim() === name.toLowerCase().trim());
  return match?.id;
};

// Provider
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>(Role.MANAGEMENT);
  const [currentView, setView] = useState<ViewType>('DASHBOARD');

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [parts, setParts] = useState<InventoryPart[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [movements, setMovements] = useState<PartMovement[]>([]);
  const [logbook, setLogbook] = useState<LogbookEntry[]>([]);
  const [inspections, setInspections] = useState<Record<string, string>>({}); // NUEVO

  const [hydrated, setHydrated] = useState(false);
  const didHydrate = useRef(false);

  const permissions = useMemo(() => {
    // UPDATED: Supervisor now has inventory view access
    const canViewInventory = role === Role.MANAGEMENT || role === Role.MAINTENANCE || role === Role.SUPERVISOR;
    const canReserve = role === Role.MANAGEMENT || role === Role.MAINTENANCE;
    const canCreatePO = role === Role.MANAGEMENT;
    const canAdjustStock = role === Role.MANAGEMENT;
    return { canViewInventory, canReserve, canCreatePO, canAdjustStock };
  }, [role]);

  // Load from local storage or init
  useEffect(() => {
    const storedTickets = localStorage.getItem('metodiko_demo_tickets');
    const storedParts = localStorage.getItem('metodiko_demo_parts');
    const storedPOs = localStorage.getItem('metodiko_demo_pos');
    const storedMovs = localStorage.getItem('metodiko_demo_movements');
    const storedLog = localStorage.getItem('metodiko_demo_logbook');
    const storedInsp = localStorage.getItem('metodiko_demo_inspections');

    let loadedParts: InventoryPart[] = INITIAL_PARTS;
    if (storedParts) { try { loadedParts = JSON.parse(storedParts); } catch { loadedParts = INITIAL_PARTS; } }

    let loadedTickets: Ticket[] = INITIAL_TICKETS;
    if (storedTickets) { try { loadedTickets = JSON.parse(storedTickets); } catch { loadedTickets = INITIAL_TICKETS; } }

    // Migración suave (DEMO)
    loadedTickets = loadedTickets.map(t => {
      const patched: Ticket = { ...t };
      if (patched.needsPart && !patched.partId && patched.partName) {
        const pid = findPartIdByName(loadedParts, patched.partName);
        if (pid) patched.partId = pid;
      }
      if (!patched.maintenanceType) {
        patched.maintenanceType = getMaintenanceType(patched.asset);
      }
      if (!patched.origin) {
        patched.origin = patched.createdBy === Role.RECEPTION ? 'GUEST' : 'STAFF';
      }
      return { ...patched, priorityScore: calculatePriority(patched) };
    });

    let loadedPOs: PurchaseOrder[] = INITIAL_POS;
    if (storedPOs) { try { loadedPOs = JSON.parse(storedPOs); } catch { loadedPOs = INITIAL_POS; } }

    let loadedMovs: PartMovement[] = [];
    if (storedMovs) { try { loadedMovs = JSON.parse(storedMovs); } catch { loadedMovs = []; } }
    
    let loadedLog: LogbookEntry[] = [];
    if (storedLog) { try { loadedLog = JSON.parse(storedLog); } catch { loadedLog = []; } }

    let loadedInsp: Record<string, string> = {};
    if (storedInsp) { try { loadedInsp = JSON.parse(storedInsp); } catch { loadedInsp = {}; } }

    setParts(loadedParts);
    setTickets(loadedTickets);
    setPos(loadedPOs);
    setMovements(loadedMovs);
    setLogbook(loadedLog);
    setInspections(loadedInsp);

    didHydrate.current = true;
    setHydrated(true);
  }, []);

  // Save to local storage
  useEffect(() => { if (!hydrated || !didHydrate.current) return; localStorage.setItem('metodiko_demo_tickets', JSON.stringify(tickets)); }, [tickets, hydrated]);
  useEffect(() => { if (!hydrated || !didHydrate.current) return; localStorage.setItem('metodiko_demo_parts', JSON.stringify(parts)); }, [parts, hydrated]);
  useEffect(() => { if (!hydrated || !didHydrate.current) return; localStorage.setItem('metodiko_demo_pos', JSON.stringify(pos)); }, [pos, hydrated]);
  useEffect(() => { if (!hydrated || !didHydrate.current) return; localStorage.setItem('metodiko_demo_movements', JSON.stringify(movements)); }, [movements, hydrated]);
  useEffect(() => { if (!hydrated || !didHydrate.current) return; localStorage.setItem('metodiko_demo_logbook', JSON.stringify(logbook)); }, [logbook, hydrated]);
  useEffect(() => { if (!hydrated || !didHydrate.current) return; localStorage.setItem('metodiko_demo_inspections', JSON.stringify(inspections)); }, [inspections, hydrated]);

  // =========================
  // Tickets
  // =========================

  const addTicket = (data: Omit<Ticket, 'id' | 'createdAt' | 'history' | 'priorityScore' | 'maintenanceType' | 'origin'> & { status?: TicketStatus, origin?: TicketOrigin }) => {
    const newTicket: Ticket = {
      ...data,
      id: nextTicketId(tickets),
      createdAt: new Date().toISOString(),
      status: data.status || TicketStatus.OPEN,
      origin: data.origin || (role === Role.RECEPTION ? 'GUEST' : 'STAFF'),
      priorityScore: 0,
      maintenanceType: getMaintenanceType(data.asset),
      history: [createAudit(role, 'Ticket Creado')],
    };
    newTicket.priorityScore = calculatePriority(newTicket);
    setTickets(prev => [newTicket, ...prev]);
  };

  const updateTicket = (id: string, updates: Partial<Ticket>, actionDescription: string) => {
    setTickets(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const updated = { ...t, ...updates };
        updated.history = [...updated.history, createAudit(role, actionDescription)];
        updated.priorityScore = calculatePriority(updated);
        return updated;
      })
    );
  };

  // ... (Cannibalize logic remains same)
  const cannibalizePart = (recipientTicketId: string, donorRoom: string, partName: string) => {
    const recipientTicket = tickets.find(t => t.id === recipientTicketId);
    if(!recipientTicket) return;

    const donorTicket: Ticket = {
      id: nextTicketId(tickets),
      roomNumber: donorRoom,
      isOccupied: false, 
      asset: recipientTicket.asset,
      issueType: 'Falta Pieza (Canibalizada)',
      description: `Pieza retirada (${partName}) para reparar Habitación ${recipientTicket.roomNumber}. Reponer urgente.`,
      urgency: Urgency.HIGH,
      impact: Impact.BLOCKING,
      status: TicketStatus.WAITING_PART,
      maintenanceType: recipientTicket.maintenanceType,
      origin: 'SYSTEM',
      createdAt: new Date().toISOString(),
      createdBy: Role.MAINTENANCE,
      needsPart: true,
      partName: partName,
      partQty: 1,
      notes: [`Pieza tomada para ticket ${recipientTicket.id}`],
      history: [createAudit(role, `Ticket automático por canibalización hacia Hab ${recipientTicket.roomNumber}`)],
      priorityScore: 0
    };
    
    const donorIdInt = parseInt(donorTicket.id.split('-')[1]) + 1;
    donorTicket.id = `T-${donorIdInt}`;

    const updatedRecipient = {
      ...recipientTicket,
      cannibalizedFromRoom: donorRoom,
      notes: [...recipientTicket.notes, `Refacción tomada de Habitación ${donorRoom}`]
    };

    setTickets(prev => [donorTicket, ...prev.map(t => t.id === recipientTicketId ? updatedRecipient : t)]);
  };

  // =========================
  // Inspecciones (NUEVO)
  // =========================
  const registerInspection = (roomNumber: string) => {
    setInspections(prev => ({
      ...prev,
      [roomNumber]: new Date().toISOString()
    }));
  };

  // =========================
  // Bitácora & Inventory (Rest remains similar)
  // =========================
  const addLogbookEntry = (entry: Omit<LogbookEntry, 'id'>) => {
    const newEntry: LogbookEntry = { ...entry, id: nextLogId(logbook) };
    setLogbook(prev => [newEntry, ...prev]);
  };

  const addMovement = (m: Omit<PartMovement, 'id' | 'date' | 'user'>) => {
    setMovements(prev => [
      { ...m, id: nextMovementId(prev), date: new Date().toISOString(), user: role, },
      ...prev,
    ]);
  };

  const reservePartForTicket = (ticketId: string, partId: string, qty: number) => {
    if (!permissions.canReserve) return { ok: false, message: 'Permiso insuficiente.' };
    const q = Math.max(1, Math.floor(qty || 1));
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return { ok: false, message: 'Ticket no encontrado.' };
    const part = parts.find(p => p.id === partId);
    if (!part) return { ok: false, message: 'Refacción no encontrada.' };

    const available = clampNonNeg(part.stockOnHand - part.stockReserved);
    if (available < q) return { ok: false, message: `Stock insuficiente.` };

    if (ticket.partId && ticket.partQty && ticket.partQty > 0) {
      setParts(prev => prev.map(p => {
          if (p.id !== ticket.partId) return p;
          return { ...p, stockReserved: clampNonNeg(p.stockReserved - ticket.partQty!) };
        })
      );
    }

    setParts(prev => prev.map(p => (p.id === partId ? { ...p, stockReserved: p.stockReserved + q } : p)));

    updateTicket(
      ticketId,
      { needsPart: true, status: TicketStatus.WAITING_PART, partId, partName: part.name, partQty: q },
      `Reservada refacción: ${part.name} (x${q})`
    );

    addMovement({ partId, type: 'RESERVE', qty: q, note: `Reserva para ticket ${ticketId}`, ticketId });
    return { ok: true, message: 'Reservado correctamente.' };
  };

  const releaseReservationForTicket = (ticketId: string, note?: string) => {
    if (!permissions.canReserve) return { ok: false, message: 'Permiso insuficiente.' };
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket || !ticket.partId || !ticket.partQty) return { ok: false, message: 'No hay reserva.' };

    setParts(prev => prev.map(p => {
        if (p.id !== ticket.partId) return p;
        return { ...p, stockReserved: clampNonNeg(p.stockReserved - ticket.partQty!) };
      })
    );

    addMovement({ partId: ticket.partId, type: 'RELEASE', qty: ticket.partQty, note: note || 'Liberación', ticketId });
    updateTicket(ticketId, { needsPart: false }, 'Reserva liberada');
    return { ok: true, message: 'Liberado correctamente.' };
  };

  const issueReservedPartForTicket = (ticketId: string, note?: string) => {
    if (!permissions.canReserve) return { ok: false, message: 'Permiso insuficiente.' };
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket || !ticket.partId || !ticket.partQty) return { ok: false, message: 'No hay reserva.' };

    const part = parts.find(p => p.id === ticket.partId);
    if (!part) return { ok: false, message: 'Refacción no encontrada.' };
    const q = Math.max(1, Math.floor(ticket.partQty || 1));

    setParts(prev => prev.map(p => {
        if (p.id !== ticket.partId) return p;
        return { ...p, stockReserved: clampNonNeg(p.stockReserved - q), stockOnHand: clampNonNeg(p.stockOnHand - q) };
      })
    );

    addMovement({ partId: ticket.partId, type: 'ISSUE', qty: q, note: note || 'Consumo', ticketId });
    updateTicket(ticketId, { needsPart: false }, `Refacción utilizada: ${part.name} (x${q})`);
    return { ok: true, message: 'Consumido correctamente.' };
  };

  const createPOForPart = (params: { partId: string; qty: number; vendor?: string; etaDays?: number; ticketId?: string; }) => {
    if (!permissions.canCreatePO) return { ok: false, message: 'Sin permisos.' };
    const part = parts.find(p => p.id === params.partId);
    if (!part) return { ok: false, message: 'Refacción no encontrada.' };

    const q = Math.max(1, Math.floor(params.qty || 1));
    const vendor = params.vendor || part.preferredVendor || 'Proveedor (DEMO)';
    const now = new Date();
    const eta = new Date(now);
    eta.setDate(eta.getDate() + (params.etaDays ?? part.leadTimeDays ?? 3));

    const newPO: PurchaseOrder = {
      id: nextPOId(pos), status: POStatus.ORDERED, createdAt: now.toISOString(), createdBy: role, vendor, etaDate: eta.toISOString(),
      items: [{ partId: part.id, partName: part.name, qty: q, unit: part.unit }], notes: 'OC generada en DEMO.',
    };

    setPos(prev => [newPO, ...prev]);
    addMovement({ partId: part.id, type: 'PO_CREATED', qty: q, note: `OC ${newPO.id}`, poId: newPO.id, ticketId: params.ticketId });

    if (params.ticketId) { updateTicket(params.ticketId, { poId: newPO.id }, `OC vinculada: ${newPO.id}`); }
    return { ok: true, message: `OC ${newPO.id} creada`, poId: newPO.id };
  };

  const receivePO = (poId: string) => {
    if (!permissions.canCreatePO) return { ok: false, message: 'Sin permisos.' };
    const po = pos.find(p => p.id === poId);
    if (!po || po.status === POStatus.RECEIVED) return { ok: false, message: 'Error en OC.' };

    setParts(prev => prev.map(p => {
        const item = po.items.find(i => i.partId === p.id);
        if (!item) return p;
        return { ...p, stockOnHand: p.stockOnHand + item.qty };
      })
    );
    po.items.forEach(item => { addMovement({ partId: item.partId, type: 'RECEIVE', qty: item.qty, note: `Recepción OC ${po.id}`, poId: po.id }); });
    setPos(prev => prev.map(p => (p.id === poId ? { ...p, status: POStatus.RECEIVED } : p)));
    addMovement({ partId: po.items[0]?.partId || 'P-000', type: 'PO_RECEIVED', qty: po.items.reduce((s, i) => s + i.qty, 0), note: `OC ${po.id} recibida`, poId: po.id });
    return { ok: true, message: `OC ${po.id} recibida.` };
  };

  const adjustStock = (params: { partId: string; delta: number; note?: string }) => {
    if (!permissions.canAdjustStock) return { ok: false, message: 'Sin permisos.' };
    const delta = Math.trunc(params.delta || 0);
    if (delta === 0) return { ok: false, message: 'Delta inválido.' };

    setParts(prev => prev.map(p => {
        if (p.id !== params.partId) return p;
        return { ...p, stockOnHand: clampNonNeg(p.stockOnHand + delta) };
      })
    );
    addMovement({ partId: params.partId, type: 'ADJUST', qty: Math.abs(delta), note: params.note });
    return { ok: true, message: 'Stock ajustado.' };
  };

  const resetDemoData = () => {
    const calculatedTickets = INITIAL_TICKETS.map(t => ({ 
      ...t, 
      maintenanceType: t.maintenanceType || getMaintenanceType(t.asset),
      origin: t.origin || (t.createdBy === Role.RECEPTION ? 'GUEST' : 'STAFF'),
      priorityScore: calculatePriority(t) 
    }));

    localStorage.removeItem('metodiko_demo_tickets');
    localStorage.removeItem('metodiko_demo_parts');
    localStorage.removeItem('metodiko_demo_pos');
    localStorage.removeItem('metodiko_demo_movements');
    localStorage.removeItem('metodiko_demo_logbook');
    localStorage.removeItem('metodiko_demo_inspections');

    setRole(Role.MANAGEMENT);
    setView('DASHBOARD');
    setTickets(calculatedTickets);
    setParts(INITIAL_PARTS);
    setPos(INITIAL_POS);
    setMovements([]);
    setLogbook([]);
    setInspections({});
  };

  const exportCSV = () => {
    const rows = tickets.map(t => [t.id, t.roomNumber, t.status, t.description].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,ID,Habitacion,Estado,Descripcion\n' + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'reporte.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const runScenario = (scenario: DemoScenario): string | null => { return null; };

  const value = useMemo(
    () => ({
      role, setRole, currentView, setView,
      tickets, addTicket, updateTicket, cannibalizePart,
      parts, pos, movements, logbook, addLogbookEntry,
      inspections, registerInspection, // NUEVO
      reservePartForTicket, releaseReservationForTicket, issueReservedPartForTicket,
      createPOForPart, receivePO, adjustStock,
      resetDemoData, exportCSV, runScenario,
      permissions,
    }),
    [role, currentView, tickets, parts, pos, movements, logbook, inspections, permissions]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};