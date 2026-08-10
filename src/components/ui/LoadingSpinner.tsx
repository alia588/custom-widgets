'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  text,
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const borderSizes = {
    sm: 'border-2',
    md: 'border-4',
    lg: 'border-4',
  };

  const spinnerSize = sizeClasses[size];
  const borderSize = borderSizes[size];

  const spinner = (
    <div className={`${className} ${fullScreen ? 'fixed inset-0 flex items-center justify-center bg-white/80 z-50' : ''}`}>
      <div className="flex flex-col items-center justify-center gap-3">
        <div className={`${spinnerSize} relative`}>
          {/* Outer rotating ring */}
          <div
            className={`absolute inset-0 rounded-full ${borderSize} border-transparent border-t-[var(--color-accent)] border-r-[var(--color-accent)]`}
            style={{
              animation: 'spin 1s linear infinite',
            }}
          />
          {/* Middle ring - counter-rotating */}
          <div
            className={`absolute inset-1 rounded-full ${size === 'sm' ? 'border-2' : 'border-4'} border-transparent border-b-[var(--color-accent)] border-l-[var(--color-accent)] opacity-60`}
            style={{
              animation: 'spin 0.8s linear infinite reverse',
            }}
          />
          {/* Inner pulsing circle */}
          <div
            className={`absolute ${size === 'sm' ? 'inset-1' : size === 'md' ? 'inset-2' : 'inset-3'} rounded-full bg-[var(--color-accent-light)]`}
            style={{
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`${size === 'sm' ? 'w-0.5 h-0.5' : size === 'md' ? 'w-1 h-1' : 'w-1.5 h-1.5'} bg-[var(--color-accent)] rounded-full`} />
          </div>
        </div>
        {text && (
          <p className="text-sm text-[var(--color-text-secondary)] font-medium">
            {text}
          </p>
        )}
      </div>
    </div>
  );

  return spinner;
}
