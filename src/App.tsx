import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import OpportunitiesList from './pages/OpportunitiesList'
import OpportunityForm from './pages/OpportunityForm'
import OpportunityDetail from './pages/OpportunityDetail'
import ScamList from './pages/ScamList'
import AiAssistant from './pages/AiAssistant'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/opportunities" element={<OpportunitiesList />} />
          <Route path="/opportunities/new" element={<OpportunityForm />} />
          <Route path="/opportunities/:id/edit" element={<OpportunityForm />} />
          <Route path="/opportunities/:id" element={<OpportunityDetail />} />
          <Route path="/scam-list" element={<ScamList />} />
          <Route path="/ai-assistant" element={<AiAssistant />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
