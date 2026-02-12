import { User, DocumentData } from '@/types';

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@speedwork.com',
    name: 'Marie Dupont',
    role: 'admin',
    company: 'SpeedWork SAS',
    phone: '+33 1 23 45 67 89',
    address: '12 Rue de la Paix, 75002 Paris',
  },
  {
    id: '2',
    email: 'client@example.com',
    name: 'Jean Martin',
    role: 'client',
    company: 'Martin & Co',
    phone: '+33 6 12 34 56 78',
    address: '45 Avenue des Champs, 69001 Lyon',
  },
];

const defaultCompany: DocumentData['company'] = {
  name: 'SpeedWork SAS',
  address: '12 Rue de la Paix, 75002 Paris',
  phone: '+33 1 23 45 67 89',
  email: 'contact@speedwork.com',
};

export const mockDocuments: DocumentData[] = [
  {
    id: '1', number: 'FAC-2025-001', type: 'invoice', status: 'paid',
    date: '2025-01-15', dueDate: '2025-02-15',
    client: { name: 'Jean Martin', email: 'jean@martin.com', phone: '+33 6 12 34 56 78', address: '45 Avenue des Champs, Lyon' },
    company: defaultCompany,
    items: [
      { id: '1', description: 'Développement site web', quantity: 1, unitPrice: 3500, total: 3500 },
      { id: '2', description: 'Hébergement annuel', quantity: 1, unitPrice: 240, total: 240 },
    ],
    subtotal: 3740, taxRate: 20, taxAmount: 748, total: 4488,
    createdBy: '1', clientId: '2',
  },
  {
    id: '2', number: 'FAC-2025-002', type: 'invoice', status: 'unpaid',
    date: '2025-01-20', dueDate: '2025-02-20',
    client: { name: 'Sophie Leroy', email: 'sophie@leroy.fr', phone: '+33 6 98 76 54 32', address: '8 Rue Victor Hugo, Marseille' },
    company: defaultCompany,
    items: [
      { id: '1', description: 'Consulting stratégie digitale', quantity: 5, unitPrice: 800, total: 4000 },
    ],
    subtotal: 4000, taxRate: 20, taxAmount: 800, total: 4800,
    createdBy: '1', clientId: '3',
  },
  {
    id: '3', number: 'DEV-2025-001', type: 'quote', status: 'pending',
    date: '2025-01-25',
    client: { name: 'Jean Martin', email: 'jean@martin.com', phone: '+33 6 12 34 56 78', address: '45 Avenue des Champs, Lyon' },
    company: defaultCompany,
    items: [
      { id: '1', description: 'Refonte application mobile', quantity: 1, unitPrice: 12000, total: 12000 },
      { id: '2', description: 'Tests & QA', quantity: 1, unitPrice: 2000, total: 2000 },
    ],
    subtotal: 14000, taxRate: 20, taxAmount: 2800, total: 16800,
    createdBy: '1', clientId: '2',
  },
  {
    id: '4', number: 'FAC-2025-003', type: 'invoice', status: 'paid',
    date: '2025-02-01', dueDate: '2025-03-01',
    client: { name: 'Pierre Durand', email: 'pierre@durand.com', phone: '+33 6 55 44 33 22', address: '20 Boulevard Haussmann, Paris' },
    company: defaultCompany,
    items: [
      { id: '1', description: 'Formation React avancé', quantity: 3, unitPrice: 1200, total: 3600 },
    ],
    subtotal: 3600, taxRate: 20, taxAmount: 720, total: 4320,
    createdBy: '1', clientId: '4',
  },
  {
    id: '5', number: 'DEV-2025-002', type: 'quote', status: 'draft',
    date: '2025-02-05',
    client: { name: 'Sophie Leroy', email: 'sophie@leroy.fr', phone: '+33 6 98 76 54 32', address: '8 Rue Victor Hugo, Marseille' },
    company: defaultCompany,
    items: [
      { id: '1', description: 'Audit SEO complet', quantity: 1, unitPrice: 1500, total: 1500 },
      { id: '2', description: 'Optimisation performance', quantity: 1, unitPrice: 2500, total: 2500 },
    ],
    subtotal: 4000, taxRate: 20, taxAmount: 800, total: 4800,
    createdBy: '1', clientId: '3',
  },
];

export const monthlyRevenue = [
  { month: 'Sep', revenue: 8200 },
  { month: 'Oct', revenue: 12400 },
  { month: 'Nov', revenue: 9800 },
  { month: 'Déc', revenue: 15600 },
  { month: 'Jan', revenue: 13608 },
  { month: 'Fév', revenue: 4800 },
];
