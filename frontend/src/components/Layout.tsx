import { type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpenIcon, PlusIcon, HomeIcon } from '@heroicons/react/24/outline'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-700'
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-800 border-r border-gray-700">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-700">
            <BookOpenIcon className="h-8 w-8 text-primary-500" />
            <span className="ml-3 text-xl font-bold text-white">AI Novel Gen</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link
              to="/"
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/')}`}
            >
              <HomeIcon className="h-5 w-5 mr-3" />
              <span className="font-medium">Projects</span>
            </Link>

            <Link
              to="/new"
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/new')}`}
            >
              <PlusIcon className="h-5 w-5 mr-3" />
              <span className="font-medium">New Project</span>
            </Link>
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-700">
            <p className="text-xs text-gray-400">© 2025 AI Novel Generator</p>
            <p className="text-xs text-gray-500 mt-1">v0.1.0</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
