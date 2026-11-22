import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  'danger-soft': 'btn-danger-soft',
  subtle: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
};

const SIZES = {
  sm: 'btn-sm',
  md: '',
  lg: 'px-5 py-3 text-base',
  icon: 'btn-icon',
};

const Button = forwardRef(function Button(
  {
    children,
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon: Icon,
    iconRight: IconRight,
    type = 'button',
    disabled,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn('btn', VARIANTS[variant] || VARIANTS.primary, SIZES[size], className)}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="h-4 w-4" aria-hidden="true" />
      ) : null}
      {children}
      {IconRight && !loading ? <IconRight className="h-4 w-4" aria-hidden="true" /> : null}
    </button>
  );
});

export default Button;
