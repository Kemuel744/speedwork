import React from 'react';
import { useLocations } from '@/contexts/LocationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Store, Warehouse } from 'lucide-react';

export default function LocationSwitcher() {
  const { locations, currentLocationId, setCurrentLocationId } = useLocations();

  if (locations.length === 0) return null;

  return (
    <Select value={currentLocationId || ''} onValueChange={setCurrentLocationId}>
      <SelectTrigger className="h-9 w-auto min-w-[160px] max-w-[220px] text-sm">
        <SelectValue placeholder="Choisir un lieu" />
      </SelectTrigger>
      <SelectContent align="end">
        {locations.map(l => (
          <SelectItem key={l.id} value={l.id}>
            <span className="flex items-center gap-2">
              {l.location_type === 'shop'
                ? <Store className="w-3.5 h-3.5 text-primary" />
                : <Warehouse className="w-3.5 h-3.5 text-primary" />}
              <span>{l.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
