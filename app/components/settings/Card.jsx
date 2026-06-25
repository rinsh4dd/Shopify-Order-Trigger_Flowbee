/**
 * Reusable card wrapper with a titled header section.
 */
export function Card({ title, icon, badge, action, children }) {
  return (
    <div className="bg-white border border-slate-200/70 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
      <div className="px-6 py-3.5 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {icon && <span className="text-slate-400">{icon}</span>}
          <h2 className="text-[13.5px] font-medium text-slate-700 m-0">
            {title}
          </h2>
          {badge}
        </div>
        {action}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

/**
 * Label + input wrapper for form fields.
 */
export function FieldGroup({ label, hint, children }) {
  return (
    <div className="mb-5 last:mb-0">
      <label className="text-[12px] font-medium text-slate-500 mb-1.5 block">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[10.5px] text-slate-400 mt-1.5 m-0 leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

/**
 * Top-level summary metric card shown in the overview strip.
 */
export function MetricCard({ label, value, icon }) {
  return (
    <div className="bg-white border border-slate-200/70 rounded-xl p-4 flex items-center gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.06)]">
      <div className="bg-emerald-50/80 text-emerald-500 w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase leading-none">
          {label}
        </span>
        <span className="text-[13px] font-medium text-slate-700 mt-1 truncate">
          {value}
        </span>
      </div>
    </div>
  );
}
