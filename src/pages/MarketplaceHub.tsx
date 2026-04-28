import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, ShoppingCart, Store } from 'lucide-react';
import Marketplace from './Marketplace';
import MarketplaceOrders from './MarketplaceOrders';
import SupplierProfileSettings from './SupplierProfileSettings';

const TABS = [
  { value: 'discover', label: 'Découvrir', icon: Globe, Comp: Marketplace },
  { value: 'orders', label: 'Mes commandes', icon: ShoppingCart, Comp: MarketplaceOrders },
  { value: 'profile', label: 'Mon profil fournisseur', icon: Store, Comp: SupplierProfileSettings },
];

export default function MarketplaceHub() {
  const [params, setParams] = useSearchParams();
  const active = params.get('tab') || 'discover';
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
