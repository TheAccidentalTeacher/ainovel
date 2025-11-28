import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import NewProjectPage from './pages/NewProjectPage'
import PremiseBuilderWizard from './pages/PremiseBuilderWizard'
import ProjectDetailPage from './pages/ProjectDetailPage'
import OutlineEditorPage from './pages/OutlineEditorPage'
import BookCoverDesigner from './pages/BookCoverDesigner'
import StandaloneBookCoverDesigner from './pages/StandaloneBookCoverDesigner'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/new" element={<NewProjectPage />} />
        <Route path="/premise-builder/new" element={<PremiseBuilderWizard />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/projects/:id/outline" element={<OutlineEditorPage />} />
        <Route path="/projects/:id/cover-designer" element={<BookCoverDesigner />} />
        <Route path="/cover-designer" element={<StandaloneBookCoverDesigner />} />
      </Routes>
    </Layout>
  )
}

export default App
