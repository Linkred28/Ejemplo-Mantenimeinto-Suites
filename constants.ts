// src/constants.ts

import {
  Room,
  Ticket,
  TicketStatus,
  Urgency,
  Impact,
  Role,
  InventoryPart,
  PurchaseOrder,
  MaintenanceType
} from './types';
import { getMaintenanceType } from './utils';

// Helper to generate a past date
const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

export const ROOMS: Room[] = [
  ...Array.from({ length: 20 }, (_, i) => ({
    number: (101 + i).toString(),
    floor: 1,
    type: (i % 3 === 0 ? 'Suite' : i % 2 === 0 ? 'Deluxe' : 'Standard') as any,
  })),
  // Habitaciones extra para los tickets urgentes
  ...Array.from({ length: 30 }, (_, i) => ({
    number: (201 + i).toString(),
    floor: 2,
    type: (i % 4 === 0 ? 'Suite' : 'Standard') as any,
  })),
];

export const ASSETS = [
  'Aire Acondicionado',
  'Plomería',
  'Eléctrico',
  'TV/WiFi',
  'Mobiliario',
  'Cerrajería',
  'Otros',
];

export const ISSUE_TYPES = [
  'No enciende',
  'Gotea',
  'Ruido extraño',
  'Roto/Dañado',
  'Sucio/Manchado',
  'Sin señal',
  'Mal olor',
];

// =========================
// DEMO: Inventario Refacciones
// =========================

export const INITIAL_PARTS: InventoryPart[] = [
  {
    id: 'P-001',
    name: 'Outlet Universal Premium Blanco',
    category: 'Eléctrico',
    unit: 'pza',
    stockOnHand: 0,
    stockReserved: 1,
    minStock: 2,
    preferredVendor: 'Ferretería Local (DEMO)',
    leadTimeDays: 2,
    location: 'Bodega • Anaquel E-2',
    sku: 'ELE-OUT-UNI-WHT',
  },
  {
    id: 'P-002',
    name: 'Empaque Lavabo 1/2" (Kit)',
    category: 'Plomería',
    unit: 'kit',
    stockOnHand: 3,
    stockReserved: 0,
    minStock: 4,
    preferredVendor: 'Plomería Express (DEMO)',
    leadTimeDays: 1,
    location: 'Bodega • Anaquel P-1',
    sku: 'PLO-EMP-12-KIT',
  },
  {
    id: 'P-003',
    name: 'Baterías AA Alcalinas (Pack 4)',
    category: 'Cerrajería',
    unit: 'pza',
    stockOnHand: 6,
    stockReserved: 0,
    minStock: 4,
    preferredVendor: 'Mayorista Consumibles (DEMO)',
    leadTimeDays: 1,
    location: 'Almacén • Gabinete C-1',
    sku: 'CON-AA-4PK',
  },
  {
    id: 'P-004',
    name: 'Control Remoto Aire Acondicionado (Universal)',
    category: 'HVAC',
    unit: 'pza',
    stockOnHand: 1,
    stockReserved: 0,
    minStock: 2,
    preferredVendor: 'Proveedor HVAC (DEMO)',
    leadTimeDays: 3,
    location: 'Bodega • Anaquel H-3',
    sku: 'HVAC-CTRL-UNI',
  },
  {
    id: 'P-005',
    name: 'Manguera Drenaje Condensados (2m)',
    category: 'HVAC',
    unit: 'pza',
    stockOnHand: 2,
    stockReserved: 0,
    minStock: 2,
    preferredVendor: 'Proveedor HVAC (DEMO)',
    leadTimeDays: 3,
    location: 'Bodega • Anaquel H-2',
    sku: 'HVAC-DRN-2M',
  },
  {
    id: 'P-006',
    name: 'Foco LED E27 9W Luz Cálida',
    category: 'Eléctrico',
    unit: 'pza',
    stockOnHand: 5,
    stockReserved: 0,
    minStock: 6,
    preferredVendor: 'Ferretería Local (DEMO)',
    leadTimeDays: 1,
    location: 'Bodega • Anaquel E-1',
    sku: 'ELE-FOC-E27-9W',
  },
  {
    id: 'P-007',
    name: 'Chapa Electrónica — Batería Pack Servicio',
    category: 'Cerrajería',
    unit: 'kit',
    stockOnHand: 1,
    stockReserved: 0,
    minStock: 2,
    preferredVendor: 'Seguridad Accesos (DEMO)',
    leadTimeDays: 4,
    location: 'Almacén • Gabinete S-2',
    sku: 'CER-LOCK-BATT-KIT',
  },
  {
    id: 'P-008',
    name: 'Pegamento Industrial (Cartucho)',
    category: 'Mobiliario',
    unit: 'pza',
    stockOnHand: 2,
    stockReserved: 0,
    minStock: 1,
    preferredVendor: 'Ferretería Local (DEMO)',
    leadTimeDays: 1,
    location: 'Bodega • Anaquel M-1',
    sku: 'MOB-PEG-IND',
  },
];

// DEMO: Órdenes de compra (inician vacías)
export const INITIAL_POS: PurchaseOrder[] = [];

// =========================
// DEMO: Tickets (Base + 30 Urgent)
// =========================

const BASE_TICKETS: Ticket[] = [
  {
    id: 'T-1001',
    roomNumber: '105',
    isOccupied: true,
    asset: 'Aire Acondicionado',
    maintenanceType: 'Técnico HVAC',
    issueType: 'No enciende',
    description: 'Huésped reporta mucho calor, el control no responde.',
    urgency: Urgency.HIGH,
    impact: Impact.BLOCKING,
    status: TicketStatus.OPEN,
    createdAt: daysAgo(0),
    createdBy: Role.RECEPTION,
    notes: [],
    history: [{ date: daysAgo(0), action: 'Ticket creado', user: Role.RECEPTION }],
    priorityScore: 0,
  },
  {
    id: 'T-1002',
    roomNumber: '112',
    isOccupied: false,
    asset: 'Plomería',
    maintenanceType: 'Plomero',
    issueType: 'Gotea',
    description: 'Grifo del lavabo gotea constantemente.',
    urgency: Urgency.MEDIUM,
    impact: Impact.ANNOYING,
    status: TicketStatus.IN_PROGRESS,
    createdAt: daysAgo(2),
    createdBy: Role.CLEANING,
    assignedTo: 'Carlos M.',
    notes: ['Se requiere cambiar empaque.'],
    history: [
      { date: daysAgo(2), action: 'Ticket creado', user: Role.CLEANING },
      { date: daysAgo(1), action: 'Asignado a Carlos M.', user: Role.MAINTENANCE },
    ],
    priorityScore: 0,
  },
  {
    id: 'T-1003',
    roomNumber: '101',
    isOccupied: true,
    asset: 'Eléctrico',
    maintenanceType: 'Electricista',
    issueType: 'Roto/Dañado',
    description: 'Enchufe de mesa de noche hace chispa.',
    urgency: Urgency.HIGH,
    impact: Impact.BLOCKING,
    status: TicketStatus.WAITING_PART,
    createdAt: daysAgo(1),
    createdBy: Role.RECEPTION,
    notes: ['Desconectado circuito por seguridad.', 'Solicitado reemplazo.'],

    // Inventario DEMO (vínculo real)
    needsPart: true,
    partId: 'P-001',
    partName: 'Outlet Universal Premium Blanco',
    partQty: 1,

    history: [
      { date: daysAgo(1), action: 'Ticket creado', user: Role.RECEPTION },
      { date: daysAgo(0), action: 'Marcado espera refacción', user: Role.MAINTENANCE },
    ],
    priorityScore: 0,
  },
  {
    id: 'T-1004',
    roomNumber: '118',
    isOccupied: false,
    asset: 'Mobiliario',
    maintenanceType: 'Carpintero',
    issueType: 'Roto/Dañado',
    description: 'Pata de silla de escritorio inestable.',
    urgency: Urgency.LOW,
    impact: Impact.ANNOYING,
    status: TicketStatus.RESOLVED,
    createdAt: daysAgo(5),
    createdBy: Role.CLEANING,
    notes: ['Reparado con pegamento industrial.'],
    history: [
      { date: daysAgo(5), action: 'Ticket creado', user: Role.CLEANING },
      { date: daysAgo(2), action: 'Resuelto', user: Role.MAINTENANCE },
    ],
    priorityScore: 0,
  },
  {
    id: 'T-1005',
    roomNumber: '105',
    isOccupied: true,
    asset: 'Aire Acondicionado',
    maintenanceType: 'Técnico HVAC',
    issueType: 'Gotea',
    description: 'Agua condensada cayendo en la alfombra (Recurrente).',
    urgency: Urgency.HIGH,
    impact: Impact.ANNOYING,
    status: TicketStatus.OPEN,
    createdAt: daysAgo(0),
    createdBy: Role.CLEANING,
    notes: [],
    history: [{ date: daysAgo(0), action: 'Ticket creado', user: Role.CLEANING }],
    priorityScore: 0,
  },
  {
    id: 'T-1006',
    roomNumber: '120',
    isOccupied: false,
    asset: 'TV/WiFi',
    maintenanceType: 'Técnico TV/Redes',
    issueType: 'Sin señal',
    description: 'TV no conecta al sistema de entretenimiento.',
    urgency: Urgency.LOW,
    impact: Impact.ANNOYING,
    status: TicketStatus.VENDOR,
    needsVendor: true,
    vendorType: 'Soporte IT Externo',
    createdAt: daysAgo(3),
    createdBy: Role.MAINTENANCE,
    notes: ['Reinicio no funciona. Escalado a proveedor.'],
    history: [{ date: daysAgo(3), action: 'Ticket creado y escalado', user: Role.MAINTENANCE }],
    priorityScore: 0,
  },
  {
    id: 'T-1007',
    roomNumber: '115',
    isOccupied: true,
    asset: 'Plomería',
    maintenanceType: 'Plomero',
    issueType: 'Mal olor',
    description: 'Olor a drenaje en baño principal.',
    urgency: Urgency.HIGH,
    impact: Impact.ANNOYING,
    status: TicketStatus.OPEN,
    createdAt: daysAgo(0),
    createdBy: Role.RECEPTION,
    notes: [],
    history: [{ date: daysAgo(0), action: 'Ticket creado', user: Role.RECEPTION }],
    priorityScore: 0,
  },
  {
    id: 'T-1008',
    roomNumber: '102',
    isOccupied: false,
    asset: 'Cerrajería',
    maintenanceType: 'Cerrajero',
    issueType: 'Roto/Dañado',
    description: 'Chapa electrónica con poca batería.',
    urgency: Urgency.MEDIUM,
    impact: Impact.BLOCKING,
    status: TicketStatus.VERIFIED,
    createdAt: daysAgo(6),
    createdBy: Role.CLEANING,
    verifiedBy: 'Gerente Nocturno',
    closedAt: daysAgo(1),
    notes: ['Baterías cambiadas.'],
    history: [
      { date: daysAgo(6), action: 'Ticket creado', user: Role.CLEANING },
      { date: daysAgo(2), action: 'Resuelto', user: Role.MAINTENANCE },
      { date: daysAgo(1), action: 'Verificado', user: Role.MANAGEMENT },
    ],
    priorityScore: 0,
  },
  {
    id: 'T-1009',
    roomNumber: '109',
    isOccupied: true,
    asset: 'Eléctrico',
    maintenanceType: 'Electricista',
    issueType: 'No enciende',
    description: 'Lámpara de pie fundida.',
    urgency: Urgency.LOW,
    impact: Impact.NONE,
    status: TicketStatus.OPEN,
    createdAt: daysAgo(1),
    createdBy: Role.CLEANING,
    notes: [],
    history: [{ date: daysAgo(1), action: 'Ticket creado', user: Role.CLEANING }],
    priorityScore: 0,
  },
];

// Generar 30 tickets urgentes aleatorios
const URGENT_ASSETS = [
  { asset: 'Aire Acondicionado', issue: 'No enfría nada', maint: 'Técnico HVAC' },
  { asset: 'Plomería', issue: 'Fuga mayor inundando baño', maint: 'Plomero' },
  { asset: 'Eléctrico', issue: 'Sin energía en habitación', maint: 'Electricista' },
  { asset: 'Cerrajería', issue: 'Huésped encerrado / puerta no abre', maint: 'Cerrajero' },
];

const EXTRA_URGENT_TICKETS: Ticket[] = Array.from({ length: 30 }, (_, i) => {
  const tData = URGENT_ASSETS[i % URGENT_ASSETS.length];
  const room = (201 + i).toString();
  
  return {
    id: `T-${2000 + i}`,
    roomNumber: room,
    isOccupied: i % 2 === 0, // 50% ocupadas
    asset: tData.asset,
    maintenanceType: tData.maint as MaintenanceType,
    issueType: tData.issue,
    description: `[URGENTE] Reporte masivo generado automáticamente. Problema crítico en ${tData.asset}.`,
    urgency: Urgency.HIGH,
    impact: Impact.BLOCKING,
    status: TicketStatus.OPEN,
    createdAt: daysAgo(0),
    createdBy: Role.MANAGEMENT,
    notes: ['Generado por simulación de carga alta.'],
    history: [{ date: daysAgo(0), action: 'Ticket de emergencia creado', user: Role.MANAGEMENT }],
    priorityScore: 0, // Se calculará al iniciar
  };
});

export const INITIAL_TICKETS: Ticket[] = [...BASE_TICKETS, ...EXTRA_URGENT_TICKETS];
