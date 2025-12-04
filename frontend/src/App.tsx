import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { ChatPage } from './pages/ChatPage'
import { StudioPage } from './pages/StudioPage'
import { CoversPage } from './pages/CoversPage'
import { BotsPage } from './pages/BotsPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
// import { ProtectedRoute } from './components/ProtectedRoute'

/**
 * 🚨 AUTHENTICATION DISABLED FOR TESTING 🚨
 * 
 * TO RE-ENABLE AUTHENTICATION:
 * 1. Uncomment the ProtectedRoute import above
 * 2. Wrap routes with <ProtectedRoute> as shown in commented sections below
 * 3. Change root redirect from "/studio" to "/landing"
 * 4. Redeploy
 * 
 * See git history for original protected route configuration.
 */

function App() {
  return (
    <Routes>
      {/* Public Routes - Keep for when auth is re-enabled */}
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Root - BYPASS LANDING PAGE - Go directly to studio */}
      <Route path="/" element={<Navigate to="/studio" replace />} />

      {/* Chat - Home Page (with sidebar) - UNPROTECTED FOR TESTING */}
      <Route path="/chat" element={
        // <ProtectedRoute>
          <AppLayout showSidebar={true}>
            <ChatPage />
          </AppLayout>
        // </ProtectedRoute>
      } />

      {/* Novel Studio - All existing routes - UNPROTECTED FOR TESTING */}
      <Route path="/studio/*" element={
        // <ProtectedRoute>
          <StudioPage />
        // </ProtectedRoute>
      } />

      {/* Covers - Future feature - UNPROTECTED FOR TESTING */}
      <Route path="/covers" element={
        // <ProtectedRoute>
          <AppLayout>
            <CoversPage />
          </AppLayout>
        // </ProtectedRoute>
      } />

      {/* Bots - Phase 2 - UNPROTECTED FOR TESTING */}
      <Route path="/bots" element={
        // <ProtectedRoute>
          <AppLayout>
            <BotsPage />
          </AppLayout>
        // </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
