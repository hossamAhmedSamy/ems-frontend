import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="px-4 md:px-8 py-6 flex flex-col md:flex-row md:items-start md:justify-between gap-3 max-w-7xl mx-auto w-full">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">{title}</h1>
          {description && (
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
