import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import TermsPage from './pages/TermsPage';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import RecommendationDetails from './pages/RecommendationDetails';
import Opportunities from './pages/Opportunities';
import OpportunityDetails from './pages/OpportunityDetails';
import IdeasPage from './pages/IdeasPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import HistoryPage from './pages/HistoryPage';
import ManageInfoPage from './pages/ManageInfoPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import SavedPage from './pages/SavedPage';
import RecommendationsPage from './pages/RecommendationsPage';

function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>
        
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<TermsPage />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/recommendation-details" element={<RecommendationDetails />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/opportunity-details" element={<OpportunityDetails />} />
        <Route path="/ideas" element={<IdeasPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/edit-profile" element={<EditProfilePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/manage-info" element={<ManageInfoPage />} />
        <Route path="/account" element={<AccountSettingsPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
      </Routes>
    </Router>
  );
}

export default App;