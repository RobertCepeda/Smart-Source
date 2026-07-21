import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3.5 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700">{eyebrow}</p> : null}
        <h1 className="text-xl font-bold text-ink md:text-[22px]">{title}</h1>
        <p className="mt-1.5 text-[13px] leading-6 text-slate-600">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
