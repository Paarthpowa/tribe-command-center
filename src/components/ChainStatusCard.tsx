import { useState, useEffect } from 'react';
import { GlassCard } from './ui';
import { Link2, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { isContractDeployed, suiClient } from '../lib/sui';
import { useAppStore } from '../stores/appStore';

/**
 * On-chain status card — shows Sui contract deployment / wallet connection status.
 * Displayed on the Dashboard stats row.
 */
export function ChainStatusCard() {
  const walletAddress = useAppStore((s) => s.walletAddress);
  const [balance, setBalance] = useState<string | null>(null);
  const deployed = isContractDeployed();

  // Fetch SUI balance for connected wallet
  useEffect(() => {
    if (!walletAddress || walletAddress.startsWith('0xalpha') || walletAddress.startsWith('0xplayer')) {
      setBalance(null);
      return;
    }
    suiClient
      .getBalance({ owner: walletAddress })
      .then((b: { totalBalance: string }) => {
        const sui = (Number(b.totalBalance) / 1e9).toFixed(2);
        setBalance(`${sui} SUI`);
      })
      .catch(() => setBalance(null));
  }, [walletAddress]);

  const isDemo = walletAddress?.startsWith('0xalpha') || walletAddress?.startsWith('0xplayer');

  const StatusIcon = deployed ? CheckCircle2 : isDemo ? Shield : AlertTriangle;
  const statusColor = deployed ? 'var(--accent-emerald)' : isDemo ? 'var(--accent-cyan)' : 'var(--accent-amber)';
  const statusLabel = deployed
    ? 'On-Chain'
    : isDemo
      ? 'Demo Mode'
      : 'Offline';
  const statusDetail = deployed
    ? balance ?? 'Connected'
    : isDemo
      ? 'Sui Move ready'
      : 'Contract not deployed';

  return (
    <GlassCard style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `color-mix(in srgb, ${statusColor} 10%, transparent)`,
        }}
      >
        <StatusIcon size={20} color={statusColor} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {statusLabel}
          <Link2 size={14} color={statusColor} style={{ opacity: 0.6 }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{statusDetail}</div>
      </div>
    </GlassCard>
  );
}
