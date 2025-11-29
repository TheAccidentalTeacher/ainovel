import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { ChatPage } from './pages/ChatPage'
import { StudioPage } from './pages/StudioPage'
import { CoversPage } from './pages/CoversPage'
import { BotsPage } from './pages/BotsPage'

function App() {
  return (
    <Routes>
      {/* Chat - New Home Page (with sidebar) */}
      <Route path="/" element={
        <AppLayout showSidebar={true}>
          <ChatPage />
        </AppLayout>
      } />

      {/* Novel Studio - All existing routes */}
      <Route path="/studio/*" element={<StudioPage />} />

      {/* Covers - Future feature */}
      <Route path="/covers" element={
        <AppLayout>
          <CoversPage />
        </AppLayout>
      } />

      {/* Bots - Phase 2 */}
      <Route path="/bots" element={
        <AppLayout>
          <BotsPage />
        </AppLayout>
      } />
    </Routes>
  )
}

export default App
