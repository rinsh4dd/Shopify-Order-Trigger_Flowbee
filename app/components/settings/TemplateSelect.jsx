import { IconEye } from "./Icons";

/**
 * Template dropdown selector with an attached eye-icon preview button.
 * Each trigger row is presented as a clean horizontal card with
 * label, dropdown, status indicator, and preview action.
 */
export function TemplateSelect({
  label,
  name,
  value,
  onChange,
  templateList,
  onPreview,
  isPreviewing,
  isLast = false,
}) {
  const isSelected = !!value;
  const selectedTemplate = templateList.find(
    (t) => String(t.template_id || t.id) === String(value)
  );

  return (
    <div
      className={`rounded-xl border px-4 py-3.5 transition-all duration-200 ${
        isSelected
          ? "border-emerald-200/80 bg-emerald-50/20"
          : "border-slate-100 bg-slate-50/30"
      } ${isLast ? "" : "mb-3"}`}
    >
      {/* Top row: label + status */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[12px] font-medium text-slate-500">
          {label}
        </span>
        {isSelected ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Active
          </span>
        ) : (
          <span className="text-[10px] font-normal text-slate-400">
            Not set
          </span>
        )}
      </div>

      {/* Bottom row: dropdown + preview button */}
      <div className="flex gap-2 items-center w-full">
        <div className="flex-1 min-w-0 relative">
          <select
            className="w-full px-3 py-2 pr-8 rounded-lg border border-slate-200 bg-white text-[12.5px] font-normal text-slate-600 h-[38px] outline-none cursor-pointer transition-all duration-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 appearance-none"
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">— Select template —</option>
            {templateList.map((t) => (
              <option key={t.template_id || t.id} value={t.template_id || t.id}>
                {t.template_name || t.name}
              </option>
            ))}
            {value && !selectedTemplate && (
              <option value={value}>Current: {value}</option>
            )}
          </select>

          {/* Custom chevron */}
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Preview button */}
        <button
          type="button"
          disabled={!isSelected}
          onClick={onPreview}
          title="Preview template"
          className={`h-[38px] w-[38px] flex items-center justify-center rounded-lg border transition-all duration-200 shrink-0 cursor-pointer
            disabled:opacity-25 disabled:cursor-not-allowed
            hover:scale-105 active:scale-95
            ${isPreviewing
              ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
              : "bg-white border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-300"
            }`}
        >
          <IconEye size={14} />
        </button>
      </div>

      {/* Selected template name shown subtly */}
      {selectedTemplate && (
        <div className="mt-2 text-[10.5px] text-slate-400 font-normal truncate pl-0.5">
          {selectedTemplate.template_name || selectedTemplate.name}
        </div>
      )}
    </div>
  );
}
