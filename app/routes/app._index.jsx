import { useLoaderData, Link } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

// ── Server-side services ──────────────────────────────────────
import { authenticate } from "../shopify.server";
import { getFlowbeeSettings } from "../features/flowbee/flowbee-settings.service.server";
import { getRecentActivityLogs } from "../features/orders/activity-log.repository.server";

// ── Shared utilities (reused from settings refactor) ──────────
import { formatPhone, formatDelay } from "../utils/phone-utils";
import { getTemplateDisplayName } from "../utils/template-parser";

// ── Shared card components ────────────────────────────────────
import { MetricCard } from "../components/settings/Card";
import { IconPhone, IconBell, IconClock } from "../components/settings/Icons";

// ── Dashboard-specific components ─────────────────────────────
import {
  IconOrderCreate,
  IconDollar,
  IconTruck,
  IconCancel,
  IconEdit,
  IconSettings,
} from "../components/dashboard/Icons";
import {
  AutomationRow,
  ActivityLogItem,
  GuideItem,
} from "../components/dashboard/DashboardWidgets";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * LOADER
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const [settings, activityLogs] = await Promise.all([
    getFlowbeeSettings(session.shop),
    getRecentActivityLogs(session.shop),
  ]);
  return { settings, shop: session.shop, activityLogs };
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * AUTOMATION TRIGGER CONFIG
 * Data-driven list removes repetitive JSX.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const AUTOMATIONS = [
  { key: "orderCreated",   label: "Order Created",   settingsKey: "flowbeeTemplateOrderCreated", fallbackKey: "flowbeeTemplateId", icon: <IconOrderCreate /> },
  { key: "orderPaid",      label: "Order Paid",      settingsKey: "flowbeeTemplateOrderPaid",     icon: <IconDollar /> },
  { key: "orderFulfilled", label: "Order Shipped",   settingsKey: "flowbeeTemplateOrderFulfilled", icon: <IconTruck /> },
  { key: "orderCancelled", label: "Order Cancelled",  settingsKey: "flowbeeTemplateOrderCancelled", icon: <IconCancel /> },
];

const SETUP_GUIDE = [
  { title: "Get Flowbee API Key",         description: "Obtain your secret API key from the Flowbee platform under Settings → API." },
  { title: "Register WhatsApp Number",    description: "Specify the sender phone associated with your WhatsApp Business profile." },
  { title: "Select Approved Templates",   description: "Choose WhatsApp-approved templates for order notifications and cart recovery." },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * DASHBOARD COMPONENT
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function Dashboard() {
  const { settings, shop, activityLogs = [] } = useLoaderData();

  const isConnected = !!settings?.flowbeeApiKey;

  return (
    <div
      className="bg-gradient-to-br from-slate-50 via-[#f8fbfc] to-[#f1f5f9] min-h-screen px-8 py-8 text-slate-900 max-md:px-4 relative overflow-x-hidden"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* ── Page Header ──────────────────────────────────────── */}
      <header className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex justify-between items-center mb-6 max-sm:flex-col max-sm:items-start max-sm:gap-3">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100/60">
            <img
              src="https://app.flowbee.io/svg/brand-logos/logo-flowbee-secondary.svg"
              alt="Flowbee"
              className="h-[22px]"
            />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-800 m-0 tracking-tight">
              Flowbee WhatsApp
            </h1>
            <p className="text-[11.5px] text-slate-400 mt-0.5 m-0 font-medium">
              Monitor automations, connection status &amp; activity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 max-sm:w-full max-sm:justify-start max-sm:flex-wrap">
          <span className="bg-slate-50 text-slate-500 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-slate-100">
            {shop}
          </span>
          <StatusBadge connected={isConnected} />
        </div>
      </header>

      {/* ── Quick Action Banner ──────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04)] max-sm:flex-col max-sm:items-start max-sm:gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-500 flex items-center justify-center border border-violet-100/60 shrink-0">
            <IconSettings />
          </div>
          <div>
            <strong className="text-slate-800 text-[13.5px] font-semibold block">
              Configuration Overview
            </strong>
            <p className="text-slate-400 text-[11.5px] mt-0.5 m-0 font-medium">
              Live settings from your Shopify store. Click Edit to modify.
            </p>
          </div>
        </div>
        <Link
          to="/app/settings"
          className="bg-slate-900 text-white! no-underline px-4 py-2.5 rounded-lg text-[12.5px] font-semibold transition-all whitespace-nowrap inline-flex items-center gap-2 shadow-sm hover:bg-slate-800 hover:shadow-md max-sm:w-full max-sm:justify-center"
        >
          <IconEdit size={14} />
          Edit Settings
        </Link>
      </div>

      {/* ── Metrics Row ──────────────────────────────────────── */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 mb-6">
        <MetricCard label="WhatsApp Sender" value={formatPhone(settings?.flowbeeRegisteredPhone)} icon={<IconPhone size={18} />} />
        <MetricCard label="Admin Recipient" value={formatPhone(settings?.flowbeeNotifyPhone)} icon={<IconBell size={18} />} />
        <MetricCard label="Cart Delay" value={formatDelay(settings?.flowbeeAbandonedCartDelay)} icon={<IconClock size={18} />} />
      </div>

      {/* ── Main 2-Column Layout ─────────────────────────────── */}
      <div className="grid grid-cols-[2fr_1fr] gap-6 max-lg:grid-cols-1">

        {/* Left Column */}
        <div className="flex flex-col gap-5">

          {/* Automations Card */}
          <DashboardCard title="Order Automations" icon={<IconOrderCreate size={16} />}>
            {AUTOMATIONS.map((auto, i) => {
              const templateId = settings?.[auto.settingsKey] || (auto.fallbackKey ? settings?.[auto.fallbackKey] : null);
              const displayName = getTemplateDisplayName(templateId, settings?.flowbeeTemplates);
              return (
                <AutomationRow
                  key={auto.key}
                  label={auto.label}
                  templateId={displayName}
                  icon={auto.icon}
                  isLast={i === AUTOMATIONS.length - 1}
                />
              );
            })}
          </DashboardCard>

          {/* Cart Recovery Card */}
          <DashboardCard title="Abandoned Cart Recovery" icon={<IconCancel size={16} />}>
            <InfoRow
              label="Recovery Template"
              value={getTemplateDisplayName(settings?.flowbeeTemplateAbandonedCart, settings?.flowbeeTemplates) || "Not configured"}
            />
            <InfoRow
              label="Recovery Schedule"
              value={`Send after ${formatDelay(settings?.flowbeeAbandonedCartDelay)}`}
              isLast
            />
          </DashboardCard>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-5">

          {/* Setup Guide */}
          <DashboardCard title="Quick Start Guide">
            {SETUP_GUIDE.map((item, i) => (
              <GuideItem
                key={item.title}
                title={item.title}
                description={item.description}
                isLast={i === SETUP_GUIDE.length - 1}
              />
            ))}
          </DashboardCard>

          {/* Activity Monitor */}
          <DashboardCard title="Activity Feed">
            {activityLogs.length === 0 ? (
              <div className="text-center text-slate-400 text-[12px] py-4 font-medium">
                No activity yet. Events appear here when orders are placed or carts are recovered.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {activityLogs.map((log) => (
                  <ActivityLogItem key={log.id} log={log} />
                ))}
              </div>
            )}
          </DashboardCard>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="mt-10 border-t border-slate-200/60 pt-5 flex justify-between items-center text-[11.5px] text-slate-400 max-sm:flex-col max-sm:gap-2 max-sm:text-center">
        <p className="m-0 font-medium">
          &copy; {new Date().getFullYear()} Flowbee.io
        </p>
        <div className="flex items-center gap-3">
          <a href="https://flowbee.io" target="_blank" rel="noopener noreferrer" className="text-slate-400 no-underline font-semibold hover:text-emerald-500 transition-colors">Website</a>
          <span>&bull;</span>
          <a href="mailto:support@flowbee.io" className="text-slate-400 no-underline font-semibold hover:text-emerald-500 transition-colors">Support</a>
          <span>&bull;</span>
          <a href="https://flowbee.io/docs" target="_blank" rel="noopener noreferrer" className="text-slate-400 no-underline font-semibold hover:text-emerald-500 transition-colors">Docs</a>
        </div>
      </footer>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * INLINE SUB-COMPONENTS (page-specific, not shared)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function StatusBadge({ connected }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
        connected
          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
          : "bg-rose-50 text-rose-600 border-rose-100"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full inline-block ${
          connected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
        }`}
      />
      {connected ? "Connected" : "Disconnected"}
    </span>
  );
}

function DashboardCard({ title, icon, children }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden transition-shadow duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
      <div className="px-5 py-3.5 border-b border-slate-100/80 bg-gradient-to-r from-slate-50/80 to-white">
        <h2 className="text-[13.5px] font-semibold text-slate-800 flex items-center gap-2 m-0">
          {icon && <span className="text-slate-400">{icon}</span>}
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, isLast = false }) {
  return (
    <div className={`flex justify-between items-center py-3 ${isLast ? "" : "border-b border-slate-100"}`}>
      <span className="text-[12.5px] text-slate-400 font-medium">{label}</span>
      <span className="text-[12.5px] font-semibold text-slate-700">{value}</span>
    </div>
  );
}

/* ── Route boundary header export ────────────────────────────── */
export const headers = (headersArgs) => boundary.headers(headersArgs);
