// frontend/src/components/ui/Logo.tsx
import { Trophy, Zap } from 'lucide-react'

interface LogoProps {
  className?: string
  showText?: boolean
  variant?: 'light' | 'dark'
}

export default function Logo({ className = '', showText = true, variant = 'dark' }: LogoProps) {
  const textColor = variant === 'light' ? 'text-white' : 'text-gray-900'
  const iconBg = variant === 'light' ? 'bg-white/20 backdrop-blur-sm border border-white/20' : 'bg-gradient-to-br from-equestrian-gold-400 to-equestrian-gold-600'
  const iconColor = variant === 'light' ? 'text-white' : 'text-white'

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`relative h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center shadow-lg`}>
        <Trophy className={`h-6 w-6 ${iconColor}`} />
        <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-br from-equestrian-green-400 to-equestrian-green-500 rounded-full flex items-center justify-center">
          <Zap className="h-2.5 w-2.5 text-white" />
        </div>
      </div>
      {showText && (
        <div className="ml-3">
          <div className={`text-xl font-bold ${textColor}`}>
            Sistema <span className="text-transparent bg-clip-text bg-gradient-to-r from-equestrian-gold-500 to-equestrian-gold-600">FEI</span>
          </div>
          <div className={`text-xs font-medium ${variant === 'light' ? 'text-white/70' : 'text-gray-500'}`}>
            Competencias Ecuestres
          </div>
        </div>
      )}
    </div>
  )
}