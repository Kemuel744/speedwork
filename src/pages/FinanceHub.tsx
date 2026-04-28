import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Banknote, Undo2, Wallet, Calculator, Receipt, Percent } from 'lucide-react';
import CashRegister from './CashRegister';
import Returns from './Returns';
import CustomerCredits from './CustomerCredits';
import Accounting from './Accounting';
import VatDeclaration from './VatDeclaration';
import TaxRates from './TaxRates';

const TABS = [
  { value: 'cash', label: 'Caisse', icon: Banknote, Comp: CashRegister },
  { value: 'returns', label: 'Retours', icon: Undo2, Comp: Returns },
  { value: 'credits', label: 'Crédit clients', icon: Wallet, Comp: CustomerCredits },
  { value: 'accounting', label: 'Comptabilité', icon: Calculator, Comp: Accounting },
  { value: 'vat', label: 'TVA', icon: Receipt, Comp: VatDeclaration },
  { value: 'tax-rates', label: 'Taux TVA', icon: Percent, Comp: TaxRates },
];

export default function FinanceHub() {
  const [params, setParams] = useSearchParams();
  const active = params.get('tab') || 'cash';
  return (
    <div className="page-container">
      <Tabs value={active} onValueChange={(v) => setParams({ tab: v })}>
        <TabsList className="mb-4 flex flex-wrap h-auto">
          {TABS.map(t => (
            <TabsTrigger key={t.value} value={t.value} className="gap-2">
              <t.icon className="w-4 h-4" />{t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map(t => (
          <TabsContent key={t.value} value={t.value} className="mt-0">
            <t.Comp />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
