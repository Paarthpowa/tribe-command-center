import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { GoalDetailPage } from './pages/GoalDetailPage';
import { CreateGoalPage } from './pages/CreateGoalPage';
import { MembersPage } from './pages/MembersPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { LoginPage } from './pages/LoginPage';
import { useAppStore } from './stores/appStore';

function App() {
  const { isConnected, setWallet } = useAppStore();

  const handleConnect = () => {
    // Mock wallet connect — will be replaced with EVE Vault integration
    setWallet('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
  };

  if (!isConnected) {
    return <LoginPage onConnect={handleConnect} />;
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
      </Routes>
    </BrowserRouter>
  );
}

export default App