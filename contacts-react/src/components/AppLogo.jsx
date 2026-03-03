// ContactsHub Logo Component
// Use anywhere: <AppLogo /> or <AppLogo size="sm" /> or <AppLogo size="lg" showText />

export default function AppLogo({ size = 'md', showText = true, className = '' }) {
  const sizes = {
    sm: { icon: 32, text1: 14, text2: 9,  radius: 8  },
    md: { icon: 44, text1: 17, text2: 11, radius: 11 },
    lg: { icon: 64, text1: 24, text2: 14, radius: 16 },
  }
  const s = sizes[size] || sizes.md

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon */}
      <svg width={s.icon} height={s.icon} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`bg-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb"/>
            <stop offset="100%" stopColor="#4f46e5"/>
          </linearGradient>
          <linearGradient id={`star-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24"/>
            <stop offset="100%" stopColor="#f59e0b"/>
          </linearGradient>
        </defs>
        {/* Rounded square background */}
        <rect width="64" height="64" rx="16" fill={`url(#bg-${size})`}/>
        {/* Subtle shine */}
        <rect width="64" height="32" rx="16" fill="white" opacity="0.06"/>
        {/* Person head */}
        <circle cx="30" cy="22" r="10" fill="white" opacity="0.95"/>
        {/* Person body */}
        <ellipse cx="30" cy="46" rx="15" ry="10" fill="white" opacity="0.95"/>
        {/* Star badge */}
        <circle cx="50" cy="14" r="11" fill={`url(#star-${size})`}/>
        <circle cx="50" cy="14" r="11" fill="none" stroke="white" strokeWidth="1.5" opacity="0.4"/>
        {/* Star shape */}
        <polygon
          points="50,7 52,12 57,12 53,15 55,20 50,17 45,20 47,15 43,12 48,12"
          fill="white"
          opacity="0.95"
        />
      </svg>

      {/* Text */}
      {showText && (
        <div className="leading-tight">
          <div style={{ fontSize: s.text1 }} className="font-black text-white tracking-tight">
            Contacts
            <span className="text-amber-400">Hub</span>
          </div>
          <div style={{ fontSize: s.text2 }} className="text-blue-300 font-medium tracking-widest uppercase">
            Contact Manager
          </div>
        </div>
      )}
    </div>
  )
}