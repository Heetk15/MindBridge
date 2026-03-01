import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  icon?: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const DashboardCard = ({
  title,
  icon,
  iconBgColor = 'bg-primary/10',
  iconColor = 'text-primary',
  action,
  children,
  className,
}: DashboardCardProps) => (
  <div
    className={cn(
      'bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-hidden',
      className,
    )}
  >
    {/* Card header */}
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconBgColor)}>
            <span className={iconColor}>{icon}</span>
          </div>
        )}
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">{title}</h3>
      </div>
      {action && <div>{action}</div>}
    </div>

    {/* Card body */}
    <div className="p-5 flex-1">{children}</div>
  </div>
);

export default DashboardCard;
