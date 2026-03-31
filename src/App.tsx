import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useConnection } from '@evefrontier/dapp-kit';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { GoalDetailPage } from './pages/GoalDetailPage';
import { CreateGoalPage } from './pages/CreateGoalPage';
import { MembersPage } from './pages/MembersPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { IntelPage } from './pages/IntelPage';
import { AlliancePage } from './pages/AlliancePage';
import { NewsPage } from './pages/NewsPage';
import { FleetsPage } from './pages/FleetsPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { LoginPage } from './pages/LoginPage';
import { useAppStore } from './stores/appStore';

const DEMO_ACCOUNTS: Record<string, string> = {
  leader: '0xalpha_leader_address',
  officer: '0xplayer_a',
  member: '0xplayer_b',
  scout: '0xplayer_c',
};

function App() {
  const { walletAddress, isConnected: evConnected, handleConnect, handleDisconnect, hasEveVault } = useConnection();
  const { isConnected, setWallet, currentMember, joinTribe, createTribe, walletAddress: storeWallet } = useAppStore();

  // Sync EVE Vault connection state → Zustand store
  useEffect(() => {
    // Don't let EVE Vault auto-reconnect override a demo account
    const isDemoAddr = Object.values(DEMO_ACCOUNTS).includes(useAppStore.getState().walletAddress ?? '');
    if (isDemoAddr) return;

    if (evConnected && walletAddress) {
      setWallet(walletAddress);
    } else if (!evConnected && isConnected) {
      setWallet(null);
    }
  }, [evConnected, walletAddress, isConnected, setWallet]);

  const handleDemoLogin = (role: string) => {
    const addr = DEMO_ACCOUNTS[role];
    if (addr) setWallet(addr);
  };

  const handleFullDisconnect = () => {
    setWallet(null);
    try { handleDisconnect?.(); } catch { /* ignore if EVE Vault not connected */ }
  };

  const handleJoinTribe = (name: string) => {
    if (storeWallet) {
      joinTribe(storeWallet, name);
    }
  };

  const handleCreateTribe = (tribeName: string, description: string, pilotName: string) => {
    if (storeWallet) {
      createTribe(tribeName, description);
      // Update the leader member's name to the pilot name
      const members = useAppStore.getState().members;
      if (members.length > 0 && members[0].name !== pilotName) {
        useAppStore.setState((s) => ({
          members: s.members.map((m) =>
            m.address === storeWallet ? { ...m, name: pilotName } : m,
          ),
        }));
      }
    }
  };

  const member = currentMember();

  if (!isConnected) {
    return <LoginPage onConnect={handleConnect} hasEveVault={hasEveVault} onDemoLogin={handleDemoLogin} onDisconnect={handleFullDisconnect} />;
  }

  // Connected but no member record → show welcome / join screen
  if (!member) {
    return <LoginPage onConnect={handleConnect} hasEveVault={hasEveVault} memberStatus="new" onDemoLogin={handleDemoLogin} onDisconnect={handleFullDisconnect} onJoinTribe={handleJoinTribe} onCreateTribe={handleCreateTribe} />;
  }

  // Member exists but not approved
  if (member.status !== 'approved') {
    return <LoginPage onConnect={handleConnect} hasEveVault={hasEveVault} memberStatus={member.status as 'pending' | 'rejected'} onDemoLogin={handleDemoLogin} onDisconnect={handleFullDisconnect} />;
  }

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/goal/:goalId" element={<GoalDetailPage />} />
        <Route path="/create" element={<CreateGoalPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/intel" element={<IntelPage />} />
        <Route path="/alliance" element={<AlliancePage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/fleets" element={<FleetsPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App