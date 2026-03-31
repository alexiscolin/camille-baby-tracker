import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import styles from './OfflineBanner.module.css';

export function OfflineBanner() {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div className={styles.banner} role="status">
      <WifiOff size={14} />
      <span>Offline — changes will sync when reconnected</span>
    </div>
  );
}
