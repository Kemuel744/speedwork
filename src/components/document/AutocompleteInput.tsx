import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Suggestion {
  label: string;
  sublabel?: string;
  data?: Record<string, any>;
}

interface AutocompleteInputProps extends Omit<React.ComponentProps<'input'>, 'onSelect'> {
  suggestions: Suggestion[];
  onSelect: (suggestion: Suggestion) => void;
}

export default function AutocompleteInput({
  suggestions,
  onSelect,
  value,
  onChange,
  className,
  ...props
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<Suggestion[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const val = String(value || '').toLowerCase().trim();
    if (!val) {
      setFiltered([]);
      return;
    }
    setFiltered(
      suggestions.filter(s =>
        s.label.toLowerCase().includes(val)
      ).slice(0, 6)
    );
  }, [value, suggestions]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={value}
        onChange={e => {
          onChange?.(e);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className={className}
        {...props}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-auto">
          {filtered.map((s, i) => (
            <button
              key={i}
              type="button"
              className={cn(
                'w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors flex justify-between items-center',
                i > 0 && 'border-t border-border/50'
              )}
              onMouseDown={e => {
                e.preventDefault();
                onSelect(s);
                setOpen(false);
              }}
            >
              <span className="text-foreground truncate">{s.label}</span>
              {s.sublabel && (
                <span className="text-xs text-muted-foreground ml-2 shrink-0">{s.sublabel}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
