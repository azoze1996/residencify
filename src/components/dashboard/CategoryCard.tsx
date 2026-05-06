import {
  ChevronRight,
  Folder,
  FileQuestion,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { motion } from 'motion/react'
import type { Categories } from '@/server/lib/appwrite.types'
import { Button } from '@/components/ui/button'

interface CategoryCardProps {
  category: Categories
  index: number
  onClick: () => void
  hasChildren: boolean
  questionCount: number
  subcategoryCount?: number
  isCompleted?: boolean
  onToggleComplete?: (categoryId: string) => void
}

export function CategoryCard({
  category,
  index,
  onClick,
  hasChildren,
  questionCount,
  subcategoryCount = 0,
  isCompleted = false,
  onToggleComplete,
}: CategoryCardProps) {
  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleComplete) {
      onToggleComplete(category.$id)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 rounded-2xl overflow-hidden hover:border-teal-300/50 dark:hover:border-teal-600/50 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 via-transparent to-emerald-500/0 group-hover:from-teal-500/5 group-hover:to-emerald-500/5 transition-all duration-300 pointer-events-none" />

      <div className="relative p-4 sm:p-5">
        <div className="flex items-center gap-3">
          {/* Category Icon */}
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              hasChildren
                ? 'bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30'
                : 'bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30'
            }`}
          >
            {hasChildren ? (
              <Folder
                className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  hasChildren
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-teal-600 dark:text-teal-400'
                }`}
              />
            ) : (
              <FileQuestion
                className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  hasChildren
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-teal-600 dark:text-teal-400'
                }`}
              />
            )}
          </div>

          {/* Category Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base mb-1 line-clamp-1 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
              {category.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              {hasChildren ? (
                <span>{subcategoryCount} subcategories</span>
              ) : (
                <span>{questionCount} questions</span>
              )}
              {category.description && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="line-clamp-1">{category.description}</span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Complete Toggle Button */}
            {onToggleComplete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleComplete}
                className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full transition-all ${
                  isCompleted
                    ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                    : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Circle className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>
            )}

            {/* Arrow indicator */}
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200 dark:text-slate-700 group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors" />
          </div>
        </div>

        {/* Completed Badge */}
        {isCompleted && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium">
            Completed
          </div>
        )}
      </div>
    </motion.div>
  )
}
