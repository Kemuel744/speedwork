import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Truck, ShoppingCart } from 'lucide-react';
import Locations from './Locations';
import Suppliers from './Suppliers';
import PurchaseOrders from './PurchaseOrders';

const TABS = [
  { value: 'locations', label: 'Boutiques & dépôts', icon: Building2, Comp: Locations },
  { value: 'suppliers', label: 'Fournisseurs', icon: Truck, Comp: Suppliers },
  { value: 'purchase-orders', label: 'Commandes achat', icon: ShoppingCart, Comp: PurchaseOrders },
];

export default function NetworkHub() {
  const [params, setParams] = useSearchParams();
  const active = params.get('tab') || 'locations';
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
