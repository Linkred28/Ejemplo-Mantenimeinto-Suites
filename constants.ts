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
  MaintenanceType,
  TicketOrigin
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
// NUEVO: CHECKLISTS & BITÁCORAS
// =========================

export const CHECKLIST_ROOM_EXIT = [
  { id: 'lights', label: 'Iluminación (Todas encienden)' },
  { id: 'tv', label: 'TV y Control Remoto (Señal OK)' },
  { id: 'ac', label: 'A/C (Enfría y sin ruido)' },
  { id: 'water', label: 'Grifos y WC (Sin fugas)' },
  { id: 'lock', label: 'Chapa/Cerradura (Funciona)' },
];

export const LOGBOOK_FIELDS = {
  ALBERCA: [
    { key: 'cloro', label: 'Cloro (ppm)', min: 1.0, max: 3.0, unit: 'ppm' },
    { key: 'ph', label: 'pH', min: 7.2, max: 7.6, unit: '' },
    { key: 'temp', label: 'Temperatura', min: 26, max: 29, unit: '°C' },
  ],
  CALDERAS: [
    { key: 'presion', label: 'Presión (psi)', min: 30, max: 50, unit: 'psi' },
    { key: 'temp_salida', label: 'Temp. Salida', min: 55, max: 65, unit: '°C' },
    { key: 'nivel_gas', label: 'Nivel Gas', min: 20, max: 100, unit: '%' },
  ],
  ENERGIA: [
    { key: 'lectura', label: 'Lectura Medidor', min: 0, max: 999999, unit: 'kWh' },
    { key: 'voltaje', label: 'Voltaje Línea', min: 110, max: 127, unit: 'V' },
  ]
};

// =========================
// DEMO: Inventario Refacciones
// =========================

export const INITIAL_PARTS: InventoryPart[] = [
  // 1. ELÉCTRICO: Stock Crítico
  {
    id: 'P-001',
    name: 'Outlet Universal Premium Blanco',
    category: 'Eléctrico',
    unit: 'pza',
    stockOnHand: 1,
    stockReserved: 0,
    minStock: 10,
    preferredVendor: 'Ferretería Local',
    leadTimeDays: 2,
    location: 'Bodega E-2',
    sku: 'ELE-OUT-UNI-WHT',
  },
  // 2. PLOMERÍA: Stock Bajo
  {
    id: 'P-002',
    name: 'Kit Empaques Lavabo Universal',
    category: 'Plomería',
    unit: 'kit',
    stockOnHand: 2,
    stockReserved: 0,
    minStock: 15,
    preferredVendor: 'Plomería Express',
    leadTimeDays: 1,
    location: 'Bodega P-1',
    sku: 'PLO-EMP-KIT',
  },
  // 3. HVAC: Requerido por Ticket (Sin stock)
  {
    id: 'P-004',
    name: 'Control Remoto Universal AC',
    category: 'HVAC',
    unit: 'pza',
    stockOnHand: 0,
    stockReserved: 1, 
    minStock: 5,
    preferredVendor: 'Climas del Sur',
    leadTimeDays: 3,
    location: 'Bodega H-3',
    sku: 'HVAC-RMT-UNI',
  },
  // 4. TV/WIFI: Stock en Cero
  {
    id: 'P-009',
    name: 'Cable HDMI 4K (2m)',
    category: 'TV/WiFi',
    unit: 'pza',
    stockOnHand: 0,
    stockReserved: 0,
    minStock: 5,
    preferredVendor: 'TechSolutions',
    leadTimeDays: 2,
    location: 'Gabinete T-1',
    sku: 'TV-HDMI-2M',
  },
  // 5. CERRAJERÍA: Alto consumo (Bajo Mínimo)
  {
    id: 'P-003',
    name: 'Baterías AA Alcalinas Industriales',
    category: 'Cerrajería',
    unit: 'pack',
    stockOnHand: 4,
    stockReserved: 0,
    minStock: 20,
    preferredVendor: 'Mayorista Bat',
    leadTimeDays: 1,
    location: 'Recepción',
    sku: 'CER-BAT-AA',
  },
  // 6. MOBILIARIO: Stock Bajo
  {
    id: 'P-008',
    name: 'Pegamento Epóxico Madera',
    category: 'Mobiliario',
    unit: 'tubo',
    stockOnHand: 0,
    stockReserved: 0,
    minStock: 3,
    preferredVendor: 'Maderas Finas',
    leadTimeDays: 2,
    location: 'Taller',
    sku: 'MOB-EPO-WOD',
  },
  // 7. OTROS / PINTURA: Stock Bajo
  {
    id: 'P-011',
    name: 'Pintura Blanca Mate (Galón)',
    category: 'Otros',
    unit: 'gal',
    stockOnHand: 1,
    stockReserved: 0,
    minStock: 4,
    preferredVendor: 'Pinturas Pro',
    leadTimeDays: 1,
    location: 'Bodega Q-1',
    sku: 'OTR-PNT-WHT',
  },
  // 8. CONSUMIBLES / ILUMINACIÓN: Requerido por Ticket
  {
    id: 'P-006',
    name: 'Foco LED Cálido 9W',
    category: 'Eléctrico',
    unit: 'pza',
    stockOnHand: 0,
    stockReserved: 2,
    minStock: 10,
    preferredVendor: 'Ilumina2',
    leadTimeDays: 1,
    location: 'Bodega E-1',
    sku: 'ELE-LED-9W',
  },
  {
    id: 'P-099',
    name: 'Cinta Aislante Negra',
    category: 'Consumibles',
    unit: 'rollo',
    stockOnHand: 10,
    stockReserved: 0,
    minStock: 2,
    preferredVendor: 'Ferretería Local',
    leadTimeDays: 0,
    location: 'Caja Htas',
    sku: 'CON-TAPE-BLK',
  }
];

export const INITIAL_POS: PurchaseOrder[] = [];

// =========================
// DEMO: Tickets (Vinculados a necesidades)
// =========================

const BASE_TICKETS: Ticket[] = [
  {
    id: 'T-8001',
    roomNumber: '105',
    isOccupied: true,
    asset: 'Aire Acondicionado',
    maintenanceType: 'Técnico HVAC',
    issueType: 'No enciende',
    description: 'Control remoto perdido por el huésped. Se requiere reposición urgente.',
    urgency: Urgency.HIGH,
    impact: Impact.BLOCKING,
    status: TicketStatus.WAITING_PART,
    origin: 'GUEST',
    createdAt: daysAgo(1),
    createdBy: Role.RECEPTION,
    notes: [],
    history: [{ date: daysAgo(1), action: 'Ticket creado', user: Role.RECEPTION }],
    priorityScore: 0,
    needsPart: true,
    partId: 'P-004',
    partName: 'Control Remoto Universal AC',
    partQty: 1
  },
  {
    id: 'T-8002',
    roomNumber: '202',
    isOccupied: false,
    asset: 'Eléctrico',
    maintenanceType: 'Electricista',
    issueType: 'No enciende',
    description: 'Fundidos focos principales de la suite.',
    urgency: Urgency.MEDIUM,
    impact: Impact.ANNOYING,
    status: TicketStatus.WAITING_PART,
    origin: 'STAFF',
    createdAt: daysAgo(2),
    createdBy: Role.MAINTENANCE,
    notes: [],
    history: [{ date: daysAgo(2), action: 'Ticket creado', user: Role.MAINTENANCE }],
    priorityScore: 0,
    needsPart: true,
    partId: 'P-006',
    partName: 'Foco LED Cálido 9W',
    partQty: 2
  },
  {
    id: 'T-8003',
    roomNumber: '101',
    isOccupied: true,
    asset: 'Plomería',
    maintenanceType: 'Plomero',
    issueType: 'Gotea',
    description: 'Fuga leve en regadera.',
    urgency: Urgency.LOW,
    impact: Impact.ANNOYING,
    status: TicketStatus.OPEN,
    origin: 'STAFF',
    createdAt: daysAgo(0),
    createdBy: Role.CLEANING,
    notes: [],
    history: [{ date: daysAgo(0), action: 'Ticket creado', user: Role.CLEANING }],
    priorityScore: 0,
  }
];

// Generar tickets urgentes (Relleno)
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
    isOccupied: i % 2 === 0, 
    asset: tData.asset,
    maintenanceType: tData.maint as MaintenanceType,
    issueType: tData.issue,
    description: `[URGENTE] Reporte masivo generado automáticamente. Problema crítico en ${tData.asset}.`,
    urgency: Urgency.HIGH,
    impact: Impact.BLOCKING,
    status: TicketStatus.OPEN,
    origin: 'GUEST', // Asumimos que si es urgente, el huésped lo notó
    createdAt: daysAgo(0),
    createdBy: Role.MANAGEMENT,
    notes: ['Generado por simulación de carga alta.'],
    history: [{ date: daysAgo(0), action: 'Ticket de emergencia creado', user: Role.MANAGEMENT }],
    priorityScore: 0,
  };
});

export const INITIAL_TICKETS: Ticket[] = [...BASE_TICKETS, ...EXTRA_URGENT_TICKETS];