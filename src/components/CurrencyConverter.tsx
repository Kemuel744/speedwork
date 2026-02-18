import React, { useState, useEffect } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { currencies, formatAmount } from '@/lib/currencies';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, RefreshCw, Loader2 } from 'lucide-react';

export default function CurrencyConverter() {
  const { rates, loading, refreshRates, convertAmount, displayCurrency } = useCurrency();
  const [amount, setAmount] = useState(1000);
  const [from, setFrom] = useState(displayCurrency || 'XAF');
  const [to, setTo] = useState(displayCurrency === 'EUR' ? 'XAF' : 'EUR');
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    if (rates) {
      setResult(convertAmount(amount, from, to));
    }
  }, [amount, from, to, rates, convertAmount]);

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="stat-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Convertisseur de devises</h3>
        <Button variant="ghost" size="sm" onClick={refreshRates} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
        {/* From */}
        <div className="space-y-2">
          <Label className="text-xs">De</Label>
          <Select value={from} onValueChange={setFrom}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {currencies.map(c => (
                <SelectItem key={c.code} value={c.code}>{c.symbol} — {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            min={0}
            step={0.01}
          />
        </div>

        {/* Swap */}
        <div className="flex justify-center pb-2">
          <Button type="button" variant="outline" size="icon" onClick={handleSwap} className="rounded-full">
            <ArrowRightLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* To */}
        <div className="space-y-2">
          <Label className="text-xs">Vers</Label>
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {currencies.map(c => (
                <SelectItem key={c.code} value={c.code}>{c.symbol} — {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="h-10 flex items-center px-3 rounded-md border border-input bg-muted text-foreground font-semibold">
            {loading ? '...' : result !== null ? formatAmount(result, to) : '—'}
          </div>
        </div>
      </div>

      {rates?.time_last_update && (
        <p className="text-xs text-muted-foreground text-right">
          Mis à jour : {rates.time_last_update}
        </p>
      )}
    </div>
  );
}
