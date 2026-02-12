import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { DocumentData } from '@/types';
import { mockDocuments } from '@/lib/mockData';

interface DocumentsContextType {
  documents: DocumentData[];
  addDocument: (doc: DocumentData) => void;
  updateDocument: (id: string, doc: Partial<DocumentData>) => void;
  deleteDocument: (id: string) => void;
  getDocument: (id: string) => DocumentData | undefined;
}

const DocumentsContext = createContext<DocumentsContextType | undefined>(undefined);

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<DocumentData[]>(mockDocuments);

  const addDocument = useCallback((doc: DocumentData) => {
    setDocuments(prev => [doc, ...prev]);
  }, []);

  const updateDocument = useCallback((id: string, updates: Partial<DocumentData>) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);

  const deleteDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  }, []);

  const getDocument = useCallback((id: string) => {
    return documents.find(d => d.id === id);
  }, [documents]);

  return (
    <DocumentsContext.Provider value={{ documents, addDocument, updateDocument, deleteDocument, getDocument }}>
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocuments() {
  const ctx = useContext(DocumentsContext);
  if (!ctx) throw new Error('useDocuments must be used within DocumentsProvider');
  return ctx;
}
