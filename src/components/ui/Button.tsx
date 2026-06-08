import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const buttonStyles = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-white hover:bg-brand-700 active:bg-brand-800 shadow-card',
        secondary:
          'bg-white text-slate-900 border border-slate-200 hover:bg-surface-muted active:bg-slate-100',
        ghost: 'text-slate-700 hover:bg-surface-muted',
        danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800',
        sidebar:
          'text-slate-300 hover:bg-sidebar-hover hover:text-white w-full justify-start font-normal',
        sidebarActive: 'bg-sidebar-active text-white w-full justify-start font-medium',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-11 px-5 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {
  loading?: boolean;
}

// Defaulting `type="button"` is the important bit: a <button> with no type
// attribute defaults to type="submit" in HTML. Inside a Modal form (Branches,
// Users, etc.) any click on an icon button — say the row-level Edit pencil —
// would actually try to submit the surrounding form. That's the silent reason
// edit/delete row buttons appeared dead: they were submitting the modal form
// while the modal was already closed, doing nothing visible.
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={cn(buttonStyles({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
