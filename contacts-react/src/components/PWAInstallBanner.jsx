import { useState } from 'react'
import { X, Download, Smartphone, Share } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'

export default function PWAInstallBanner() {
  const { installPrompt, isInstalled, isIOS, install } = usePWA()
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('pwa-dismissed') === 'true'
  )

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('pwa-dismissed', 'true')
  }

  const handleInstall = async () => {
    const accepted = await install()
    if (accepted) setDismissed(true)
  }

  // Don't show if installed, dismissed, or no prompt available (and not iOS)
  if (isInstalled || dismissed || (!installPrompt && !isIOS)) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Smartphone size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Install ContactsHub</p>
              <p className="text-blue-100 text-xs">Add to your home screen</p>
            </div>
          </div>
          <button onClick={handleDismiss}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {isIOS ? (
            // iOS instructions
            <div className="space-y-3">
              <p className="text-sm text-slate-600">To install on iPhone/iPad:</p>
              <div className="space-y-2">
                {[
                  { n: 1, text: 'Tap the Share button', icon: <Share size={14} className="text-blue-500" /> },
                  { n: 2, text: 'Scroll and tap "Add to Home Screen"', icon: <Smartphone size={14} className="text-blue-500" /> },
                  { n: 3, text: 'Tap "Add" to confirm', icon: <Download size={14} className="text-blue-500" /> },
                ].map(s => (
                  <div key={s.n} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-blue-600">{s.n}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      {s.icon} {s.text}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleDismiss}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors">
                Got it!
              </button>
            </div>
          ) : (
            // Android/Chrome install button
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Install ContactsHub as an app for quick access — works offline too!
              </p>
              <div className="flex gap-2">
                <button onClick={handleDismiss}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Not now
                </button>
                <button onClick={handleInstall}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                  <Download size={14} /> Install
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}