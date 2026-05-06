import { Code2 } from 'lucide-react'

export function DashboardFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center sm:text-left">
            © {new Date().getFullYear()} Residencify. All rights reserved.
            Jeddah, Saudi Arabia.
          </p>

          {/* Developer Credit */}
          <a
            href="https://github.com/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            title="Freelancing Registration ID: FL-240411054, Saudi Arabia"
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors group"
          >
            <span>Developed by Abdulaziz Saud</span>
            <Code2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          </a>
        </div>
      </div>
    </footer>
  )
}
