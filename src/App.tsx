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
import { LoginPage } from './pages/LoginPage';
import { useAppStore } from './stores/appStore';

function App() {
  const { walletAddress, isConnected: evConnected, handleConnect, hasEveVault } = useConnection();
  const { isConnected, setWallet, currentMember } = useAppStore();

  // Sync EVE Vault connection state → Zustand store
  useEffect(() => {
    if (evConnected && walletAddress) {
      setWallet(walletAddress);
    } else if (!evConnected && isConnected) {
      setWallet(null);
    }
  }, [evConnected, walletAddress, isConnected, setWallet]);

  const member = currentMember();

  if (!isConnected) {
    return <LoginPage onConnect={handleConnect} hasEveVault={hasEveVault} />;
  }

  // Connected but member not found or not approved
  if (!member || member.status !== 'approved') {
    return <LoginPage onConnect={handleConnect} hasEveVault={hasEveVault} memberStatus={member?.status === 'approved' ? null : (member?.status ?? 'pending')} />;
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
      </Routes>
    </BrowserRouter>
  );
}

export default App