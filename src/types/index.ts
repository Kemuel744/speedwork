export type UserRole = 'admin' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company?: string;
  phone?: string;
  address?: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type DocumentStatus = 'paid' | 'unpaid' | 'pending' | 'draft';
export type DocumentType = 'invoice' | 'quote';

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
}

export interface DocumentData {
  id: string;
  number: string;
  type: DocumentType;
  status: DocumentStatus;
  date: string;
  dueDate?: string;
  client: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  company: CompanyInfo;
  items: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  createdBy: string;
  clientId: string;
}
