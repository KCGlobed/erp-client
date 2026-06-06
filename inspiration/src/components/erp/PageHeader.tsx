import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: string[];
  actions?: ReactNode;
}

export function PageHeader({ title, description, breadcrumb, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
      <div className="space-y-2">
        {breadcrumb && (
          <nav className="flex items-center gap-1 text-xs text-muted-foreground">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                <span className={i === breadcrumb.length - 1 ? "text-foreground font-medium" : ""}>
                  {b}
                </span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
