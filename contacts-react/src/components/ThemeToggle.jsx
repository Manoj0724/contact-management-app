import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isDark
          ? 'bg-gradient-to-r from-indigo-600 to-blue-600 shadow-lg shadow-blue-900/50'
          : 'bg-slate-200 hover:bg-slate-300'
      } ${className}`}>

      {/* Track icons */}
      <Sun  size={11} className={`absolute left-1.5 top-1/2 -translate-y-1/2 transition-opacity ${isDark ? 'opacity-0' : 'opacity-60 text-amber-500'}`}/>
      <Moon size={11} className={`absolute right-1.5 top-1/2 -translate-y-1/2 transition-opacity ${isDark ? 'opacity-80 text-blue-200' : 'opacity-0'}`}/>

      {/* Thumb */}
      <span className={`absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
        isDark
          ? 'translate-x-7 bg-white'
          : 'translate-x-0.5 bg-white'
      }`}>
        {isDark
          ? <Moon size={12} className="text-indigo-600" />
          : <Sun  size={12} className="text-amber-500" />}
      </span>
    </button>
  )
}