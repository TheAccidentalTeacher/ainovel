/**
 * Landing Page
 * 
 * Marketing page for AI Novel Generator with hero section,
 * features, and call-to-action.
 * 🦸 CODE MASTER: He-Man's Transformation Power!
 */

import { Link } from 'react-router-dom';
import { 
  SparklesIcon, 
  UserGroupIcon, 
  BookOpenIcon, 
  LightBulbIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpenIcon className="h-8 w-8 text-purple-400" />
            <span className="text-2xl font-bold text-white">AI Novel Generator</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              to="/login"
              className="px-4 py-2 text-white hover:text-purple-300 transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-white mb-6">
            Write Your Novel with
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {" "}AI-Powered Avatars
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Seven specialized AI writing avatars work together to help you craft your masterpiece.
            From premise to final draft, your creative team is ready.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link 
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold text-lg hover:opacity-90 transition"
            >
              Start Writing For Free
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white hover:text-gray-900 transition"
            >
              Sign In
            </Link>
          </div>

          {/* Avatar Preview */}
          <div className="mt-16 flex justify-center gap-4 flex-wrap">
            {['🎭', '📚', '✨', '🎨', '🔍', '💡', '🎬'].map((emoji, i) => (
              <div
                key={i}
                className="w-16 h-16 bg-white/10 backdrop-blur rounded-full flex items-center justify-center text-3xl hover:scale-110 transition"
              >
                {emoji}
              </div>
            ))}
          </div>
          <p className="mt-4 text-gray-400 text-sm">
            7 Specialized Writing Avatars at Your Command
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Everything You Need to Write Your Novel
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<UserGroupIcon className="h-8 w-8" />}
              title="Multi-Avatar System"
              description="Work with 7 specialized AI avatars, each with unique expertise in different aspects of storytelling."
            />
            
            <FeatureCard
              icon={<LightBulbIcon className="h-8 w-8" />}
              title="Premise Builder"
              description="Transform your idea into a complete premise with guided assistance from our AI avatars."
            />
            
            <FeatureCard
              icon={<BookOpenIcon className="h-8 w-8" />}
              title="Chapter Generation"
              description="Generate complete chapters based on your outline with consistent voice and style."
            />
            
            <FeatureCard
              icon={<SparklesIcon className="h-8 w-8" />}
              title="Story Bible"
              description="Maintain consistency with detailed character profiles, settings, and plot arcs."
            />
            
            <FeatureCard
              icon={<UserGroupIcon className="h-8 w-8" />}
              title="Creative Board"
              description="Get multiple perspectives by consulting several avatars simultaneously."
            />
            
            <FeatureCard
              icon={<CheckCircleIcon className="h-8 w-8" />}
              title="Export & Polish"
              description="Export your manuscript to DOCX and polish it to perfection."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Write Your Novel?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join writers who are bringing their stories to life with AI assistance.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition"
          >
            Get Started Free
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-white/10">
        <div className="text-center text-gray-400">
          <p>&copy; 2025 AI Novel Generator. Powered by AI. Built for writers.</p>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
      <div className="text-purple-400 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-300">
        {description}
      </p>
    </div>
  );
}
