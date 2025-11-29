import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import HomePage from './HomePage';
import NewProjectPage from './NewProjectPage';
import PremiseBuilderWizard from './PremiseBuilderWizard';
import ProjectDetailPage from './ProjectDetailPage';
import OutlineEditorPage from './OutlineEditorPage';
import BookCoverDesigner from './BookCoverDesigner';
import StandaloneBookCoverDesigner from './StandaloneBookCoverDesigner';

/**
 * StudioPage wraps the existing Novel Generator functionality
 * This preserves all existing routes under /studio/*
 */
export const StudioPage = () => {
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
  );
};
