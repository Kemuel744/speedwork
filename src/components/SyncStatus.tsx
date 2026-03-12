import { useState, useEffect } from 'react';
import { Cloud, CloudOff, Loader2, AlertTriangle } from 'lucide-react';
import { onSyncStatusChange, getPendingCount, syncAll, type SyncStatus } from '@/lib/syncQueue';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function SyncStatusIndicator() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const unsub = onSyncStatusChange(setStatus);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending count periodically
    const interval = setInterval(async () => {
      const count = await getPendingCount();
      setPendingCount(count);
    }, 5000);

    getPendingCount().then(setPendingCount);

    return () => {
      unsub();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleClick = async () => {
    if (navigator.onLine && pendingCount > 0) {
      await syncAll();
      const count = await getPendingCount();
      setPendingCount(count);
    }
  };

  const getIcon = () => {
    if (!isOnline) return <CloudOff className="w-4 h-4" />;
    if (status === 'syncing') return <Loader2 className="w-4 h-4 animate-spin" />;
    if (status === 'error') return <AlertTriangle className="w-4 h-4" />;
    return <Cloud className="w-4 h-4" />;
  };

  const getLabel = () => {
    if (!isOnline) return `Hors ligne${pendingCount > 0 ? ` • ${pendingCount} en attente` : ''}`;
    if (status === 'syncing') return 'Synchronisation...';
    if (pendingCount > 0) return `${pendingCount} modification${pendingCount > 1 ? 's' : ''} en attente`;
    return 'Synchronisé';
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors',
            !isOnline
              ? 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30'
              : status === 'error'
              ? 'text-destructive bg-destructive/10'
              : pendingCount > 0
              ? 'text-primary bg-primary/10 cursor-pointer hover:bg-primary/20'
              : 'text-muted-foreground'
          )}
        >
          {getIcon()}
          <span className="hidden sm:inline">{getLabel()}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>{getLabel()}</TooltipContent>
    </Tooltip>
  );
}
