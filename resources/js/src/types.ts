export type LeadStatus = 'Nuevo Prospecto' | 'Contactado' | 'Demostración Agendada' | 'Propuesta Enviada' | 'Cliente Ganado' | 'Cliente Perdido';

export interface Lead {
  id: string;
  contactName: string;
  companyName: string;
  phone: string;
  email: string;
  serviceOfInterest: string;
  status: LeadStatus;
  notes: string;
  meta?: Record<string, string>;
  createdAt: string;
  convertedClientId?: string | null;
}

export type ClientStatus = 'Activo' | 'Inactivo';

export interface Client {
  id: string;
  businessName: string;
  documentNumber: string;
  contactName: string;
  phone: string;
  billingEmail: string;
  status: ClientStatus;
  createdAt: string;
}

export type PaymentStatus = 'Al Día' | 'Por Vencer' | 'Vencido' | 'Suspendido';
export type PaymentFrequency = 'Mensual' | 'Trimestral' | 'Semestral' | 'Anual';

export interface Subscription {
  id: string;
  clientId: string;
  serviceName: string;
  amount: number;
  frequency: PaymentFrequency;
  startDate: string;
  nextPaymentDate: string;
  status: PaymentStatus;
}

export type PaymentMethod = 'Yape' | 'Plin' | 'BCP' | 'Transferencia';

export interface Transaction {
  id: string;
  subscriptionId: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  operationCode: string;
  dateReceived: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  progress: number;
  status: 'Planificación' | 'En Desarrollo' | 'Pruebas' | 'Completado';
  totalAmount?: number;
  amountPaid?: number;
  remainingAmount?: number;
  dueDate?: string;
  repoUrl?: string;
  localPathPc?: string;
  localPathLaptop?: string;
  lastSyncDevice?: string;
  lastSyncAt?: string;
  lastSyncAtHuman?: string;
  syncNote?: string;
  dbNote?: string;
  lastDbTouchAt?: string;
  milestonesTotal?: number;
  milestonesDone?: number;
  domainId?: string | null;
  domainName?: string | null;
  client?: Client;
}

export interface Infrastructure {
  id: string;
  clientId: string;
  type: 'Servidor VPS' | 'Hosting cPanel' | 'Dominio';
  name: string;
  provider: string;
  expirationDate: string;
}

export type TicketPriority = 'Baja' | 'Media' | 'Alta' | 'Crítica';
export type TicketStatus = 'Pendiente' | 'En Proceso' | 'Resuelto';

export interface SupportTicket {
  id: string;
  clientId: string;
  subject: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  description?: string | null;
  internalNotes?: string | null;
}

export interface SaaSProduct {
  id: string;
  name: string;
  description: string;
  category: 'Gestión & ERP' | 'E-commerce' | 'Módulos Extra' | 'Beta / Desarrollo';
  status: 'Activo' | 'Beta' | 'En Desarrollo' | 'Inactivo';
  setupFee: number;
  monthlyFee: number;
  activeClients: number;
  techStack: string[];
  iconName: string; 
  imageUrls?: string[];
}

export interface CompanySettings {
  // 1. Datos Corporativos y Legales
  legalName: string;
  commercialName: string;
  /** @deprecated Preferir isologo* / imagotipo*; se mantiene por compatibilidad. */
  logoUrl: string;
  /** @deprecated Usar logotipoLightUrl / logotipoDarkUrl. */
  logotipoUrl: string;
  logotipoLightUrl: string;
  logotipoDarkUrl: string;
  /** @deprecated Usar isotipoLightUrl / isotipoDarkUrl. */
  isotipoUrl: string;
  isotipoLightUrl: string;
  isotipoDarkUrl: string;
  /** @deprecated Usar imagotipoLightUrl / imagotipoDarkUrl. */
  imagotipoUrl: string;
  imagotipoLightUrl: string;
  imagotipoDarkUrl: string;
  /** @deprecated Usar isologoLightUrl / isologoDarkUrl. */
  isologoUrl: string;
  isologoLightUrl: string;
  isologoDarkUrl: string;
  ruc: string;
  address: string;
  city: string;
  country: string;
  legalRepresentative: string;
  brandSlogan: string;

  // 2. Canales de Contacto Oficiales
  salesPhone: string;
  salesWhatsapp: string;
  whatsappWelcomeMessage: string;
  supportPhone: string;
  salesEmail: string;
  supportEmail: string;
  businessHours: string;

  // 3. Cuentas Bancarias y Pasarelas de Cobro Locales
  bcpAccount: string;
  bcpCci: string;
  bbvaAccount: string;
  bbvaCci: string;
  interbankAccount: string;
  interbankCci: string;
  bankAccountHolder: string;
  
  yapePhone: string;
  yapeHolder: string;
  plinPhone: string;
  plinHolder: string;

  // 4. Redes Sociales & Presencia Digital
  instagramUrl: string;
  tiktokUrl: string;
  linkedinUrl: string;
  facebookUrl: string;
  youtubeUrl: string;

  // 5. Parámetros Técnicos y SLA
  slaUptime: string;
  serverLatency: string;
  storageType: string;
  defaultDeliveryDays: string;
  currencySymbol: string;
  currencyCode: string;
  variashopDemoUrl: string;
  /** Prueba = series BPR/FPR sin valor tributario. Oficial = series B001/F001 (aún sin SUNAT). */
  billingEmissionMode: 'Prueba' | 'Oficial';
}
