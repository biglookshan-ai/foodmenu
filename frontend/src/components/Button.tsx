import { ReactNode } from 'react'
import LoadingSpinner from './LoadingSpinner'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-primary text-white shadow-sm
    hover:bg-primary/90 hover:shadow-md
    active:bg-primary/80
    disabled:bg-primary/50 disabled:shadow-none
  `,
  secondary: `
    bg-secondary text-white shadow-sm
    hover:bg-secondary/90 hover:shadow-md
    active:bg-secondary/80
    disabled:bg-secondary/50 disabled:shadow-none
  `,
  outline: `
    border-2 border-primary text-primary bg-transparent
    hover:bg-primary/5 hover:shadow-sm
    active:bg-primary/10
    disabled:border-primary/50 disabled:text-primary/50
  `,
  ghost: `
    bg-transparent text-gray-600
    hover:bg-gray-100 hover:text-gray-800
    active:bg-gray-200
    disabled:text-gray-300
  `,
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-lg',
  md: 'px-5 py-2.5 text-base gap-2 rounded-xl',
  lg: 'px-7 py-3.5 text-lg gap-2.5 rounded-xl',
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  onClick,
  className = '',
  type = 'button',
}: ButtonProps) => {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {loading ? (
        <LoadingSpinner size="sm" className="!gap-0" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
          <span>{children}</span>
          {icon && iconPosition === 'right' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
        </>
      )}
    </button>
  )
}

export default Button
