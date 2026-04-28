import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, FolderTree, Grid3x3, ArrowLeftRight, Printer } from 'lucide-react';
import Reports from './Reports';
import Categories from './Categories';
import MultiDepotStock from './MultiDepotStock';
import StockTransfers from './StockTransfers';
import Labels from './Labels';

const TABS = [
  { value: 'products', label: 'Produits', icon: Package, Comp: Reports },
  { value: 'categories', label: 'Catégories', icon: FolderTree, Comp: Categories },
  { value: 'multi-depot', label: 'Multi-dépôts', icon: Grid3x3, Comp: MultiDepotStock },
  { value: 'transfers', label: 'Transferts', icon: ArrowLeftRight, Comp: StockTransfers },
  { value: 'labels', label: 'Étiquettes', icon: Printer, Comp: Labels },
];

export default function StockHub() {
  const [params, setParams] = useSearchParams();
  const active = params.get('tab') || 'products';
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
