import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tag, Award } from 'lucide-react';
import Promotions from './Promotions';
import Loyalty from './Loyalty';

const TABS = [
  { value: 'promotions', label: 'Promotions', icon: Tag, Comp: Promotions },
  { value: 'loyalty', label: 'Fidélité', icon: Award, Comp: Loyalty },
];

export default function MarketingHub() {
  const [params, setParams] = useSearchParams();
  const active = params.get('tab') || 'promotions';
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
