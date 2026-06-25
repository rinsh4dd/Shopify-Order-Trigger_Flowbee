/**
 * Automation row — shows the status of a single notification trigger.
 */
export function AutomationRow({ label, templateId, icon, isLast = false }) {
  const enabled = !!templateId;

  return (
    <div
      className={`flex justify-between items-center px-4 py-3.5 rounded-xl border transition-all ${
        enabled
          ? "border-emerald-100 bg-emerald-50/40 hover:border-emerald-200"
          : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
      } ${isLast ? "" : "mb-3"}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            enabled
              ? "bg-emerald-100 text-emerald-600"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-slate-800 truncate">
            {label}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium truncate">
            {enabled ? templateId : "No template configured"}
          </div>
        </div>
      </div>

      <span
        className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-md shrink-0 ${
          enabled
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {enabled ? "Active" : "Off"}
      </span>
    </div>
  );
}

/**
 * A single activity log entry in the activity feed.
 */
export function ActivityLogItem({ log }) {
  const { badgeClass, badgeText } = getStatusBadge(log.status);
  const date = parseTimestamp(log.createdAt);
  const detail = (log.detail || "").replace(" for Customer", "");

  return (
    <div className="px-3.5 py-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start gap-3 transition-all hover:bg-slate-50 hover:border-slate-200">
      <span
        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 mt-0.5 ${badgeClass}`}
      >
        {badgeText}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-semibold text-slate-700 truncate">
          {log.title}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
          {detail}
          <span className="text-slate-300 ml-1.5">
            — {date.toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Help checklist item in the quick-start guide.
 */
export function GuideItem({ title, description, isLast = false }) {
  return (
    <div className={`flex gap-3 ${isLast ? "" : "mb-3.5"}`}>
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
      <div>
        <h4 className="text-[12.5px] font-semibold text-slate-700 m-0">
          {title}
        </h4>
        <p className="text-[11.5px] text-slate-400 mt-0.5 m-0 leading-relaxed font-medium">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────── */

function getStatusBadge(status) {
  const map = {
    success: { badgeClass: "bg-emerald-50 text-emerald-600", badgeText: "Success" },
    failed:  { badgeClass: "bg-red-50 text-red-600",         badgeText: "Failed" },
    pending: { badgeClass: "bg-amber-50 text-amber-600",     badgeText: "Pending" },
  };
  return map[status] || { badgeClass: "bg-blue-50 text-blue-600", badgeText: "Info" };
}

/**
 * Normalises Firestore timestamps into a plain Date.
 */
function parseTimestamp(ts) {
  if (!ts) return new Date();
  if (ts.toMillis) return new Date(ts.toMillis());
  if (ts._seconds) return new Date(ts._seconds * 1000);
  if (ts.seconds) return new Date(ts.seconds * 1000);
  const d = new Date(ts);
  return isNaN(d.getTime()) ? new Date() : d;
}
