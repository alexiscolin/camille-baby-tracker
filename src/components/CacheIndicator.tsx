import { CloudOff, RefreshCw } from 'lucide-react';
import styles from './CacheIndicator.module.css';

interface CacheIndicatorProps {
  fromCache: boolean;
  hasPendingWrites?: boolean;
}

export function CacheIndicator({ fromCache, hasPendingWrites }: CacheIndicatorProps) {
  if (!fromCache && !hasPendingWrites) return null;

  return (
    <div className={styles.indicator} role="status">
      {hasPendingWrites ? (
        <>
          <RefreshCw size={12} className={styles.spinning} />
          <span>Syncing...</span>
        </>
      ) : (
        <>
          <CloudOff size={12} />
          <span>Showing cached data</span>
        </>
      )}
    </div>
  );
}
