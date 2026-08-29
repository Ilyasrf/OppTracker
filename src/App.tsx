import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import OpportunitiesList from './pages/OpportunitiesList'
import OpportunityForm from './pages/OpportunityForm'
import OpportunityDetail from './pages/OpportunityDetail'
import ScamList from './pages/ScamList'
import AiAssistant from './pages/AiAssistant'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import VerifyPage from './pages/auth/VerifyPage'
import AuthCallback from './pages/auth/AuthCallback'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/opportunities" element={<OpportunitiesList />} />
            <Route path="/opportunities/new" element={<OpportunityForm />} />
            <Route path="/opportunities/:id/edit" element={<OpportunityForm />} />
            <Route path="/opportunities/:id" element={<OpportunityDetail />} />
            <Route path="/scam-list" element={<ScamList />} />
            <Route path="/ai-assistant" element={<AiAssistant />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
