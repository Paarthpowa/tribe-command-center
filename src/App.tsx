import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
  const { isConnected, setWallet, currentMember } = useAppStore();

  const handleConnect = () => {
    // Mock wallet connect — will be replaced with EVE Vault integration
    setWallet('0xalpha_leader_address');
  };

  const member = currentMember();

  if (!isConnected) {
    return <LoginPage onConnect={handleConnect} />;
  }

  // Connected but member not found or not approved
  if (!member || member.status !== 'approved') {
    return <LoginPage onConnect={handleConnect} memberStatus={member?.status === 'approved' ? null : (member?.status ?? 'pending')} />;
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