import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  // Base classes for all buttons
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Size variations
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg'
  };
  
  // Variant styles
  const variantClasses = {
    primary: 'text-white focus:ring-orange-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500'
  };
  
  const combinedClasses = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={combinedClasses}
      disabled={disabled || loading}
      style={variant === 'primary' ? { backgroundColor: '#FF661F' } : undefined}
      onMouseEnter={variant === 'primary' ? (e) => e.currentTarget.style.backgroundColor = '#E55A1A' : undefined}
      onMouseLeave={variant === 'primary' ? (e) => e.currentTarget.style.backgroundColor = '#FF661F' : undefined}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;