import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { ChatPage } from './pages/ChatPage'
import { StudioPage } from './pages/StudioPage'
import { CoversPage } from './pages/CoversPage'
import { BotsPage } from './pages/BotsPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Root - redirect to landing for now */}
      <Route path="/" element={<Navigate to="/landing" replace />} />

      {/* Chat - Home Page (with sidebar) - Protected */}
      <Route path="/chat" element={
        <ProtectedRoute>
          <AppLayout showSidebar={true}>
            <ChatPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* Novel Studio - All existing routes - Protected */}
      <Route path="/studio/*" element={
        <ProtectedRoute>
          <StudioPage />
        </ProtectedRoute>
      } />

      {/* Covers - Future feature - Protected */}
      <Route path="/covers" element={
        <ProtectedRoute>
          <AppLayout>
            <CoversPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* Bots - Phase 2 - Protected */}
      <Route path="/bots" element={
        <ProtectedRoute>
          <AppLayout>
            <BotsPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
