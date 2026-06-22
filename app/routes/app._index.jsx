import { useLoaderData, Link } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  getFlowbeeSettings,
  getFlowbeeTemplates,
} from "../features/flowbee/flowbee-settings.service.server";
import { getRecentActivityLogs } from "../features/orders/activity-log.repository.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await getFlowbeeSettings(session.shop);
  const activityLogs = await getRecentActivityLogs(session.shop);
  return { settings, shop: session.shop, activityLogs };
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "fetchTemplates") {
    const apiKey = formData.get("flowbeeApiKey");
    const phone = formData.get("flowbeeRegisteredPhone");
    try {
      const templates = await getFlowbeeTemplates({ apiKey, phone });
      return { success: true, templates, intent: "fetchTemplates" };
    } catch (error) {
      return { success: false, error: error.message, intent: "fetchTemplates" };
    }
  }

  return { success: false, error: "Invalid intent" };
};

const COUNTRY_CODES = [
  { code: '91', name: 'India (+91)' },
  { code: '1', name: 'USA/Canada (+1)' },
  { code: '44', name: 'UK (+44)' },
  { code: '971', name: 'UAE (+971)' },
  { code: '61', name: 'Australia (+61)' },
  { code: '65', name: 'Singapore (+65)' },
  { code: '60', name: 'Malaysia (+60)' },
  { code: '966', name: 'Saudi Arabia (+966)' },
  { code: '974', name: 'Qatar (+974)' },
];

function formatPhone(phone = "") {
  if (!phone) return "Not configured";
  const match = COUNTRY_CODES.find(c => phone.startsWith(c.code));
  if (match) {
    return `+${match.code} ${phone.slice(match.code.length)}`;
  }
  return `+${phone}`;
}

function formatDelay(seconds) {
  if (!seconds) return "30 minutes";
  const secs = parseInt(seconds, 10);
  if (secs === 30) return "30 seconds (Testing)";
  if (secs >= 3600) {
    const hours = secs / 3600;
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return `${secs / 60} minutes`;
}

export default function Index() {
  const { settings, shop, activityLogs = [] } = useLoaderData();

  const isConnected = !!settings?.flowbeeApiKey;
  const activeTemplateOrderCreated = settings?.flowbeeTemplateOrderCreated || settings?.flowbeeTemplateId;

  return (
    <div className="font-sans bg-slate-50 min-h-screen px-10 py-8 text-slate-900 box-border max-md:px-5">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-5 max-sm:flex-col max-sm:items-start max-sm:gap-4 max-sm:pb-4">
        <div className="flex items-center gap-4 max-sm:gap-3">
          <img src="https://app.flowbee.io/svg/brand-logos/logo-flowbee-secondary.svg" alt="Flowbee" className="h-[38px]" />
          <div>
            <h1 className="font-display text-[22px] font-extrabold text-slate-900 m-0 max-sm:text-lg">Flowbee WhatsApp Notifications</h1>
            <p className="text-[13px] text-slate-500 mt-1 m-0">Monitor connection status, order event automations, and recovery templates.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 max-sm:w-full max-sm:justify-start max-sm:flex-wrap max-sm:gap-2.5">
          <span className="bg-white text-slate-700 text-[13px] font-medium px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm">{shop}</span>
          <span className={`inline-flex items-center gap-2 text-[13px] font-semibold px-3.5 py-1.5 rounded-full ${isConnected ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-red-100 text-red-800 border border-red-300"}`}>
            <span className={`w-2 h-2 rounded-full inline-block animate-pulse-dot ${isConnected ? "bg-emerald-500" : "bg-red-500"}`}></span>
            {isConnected ? "API Connected" : "API Disconnected"}
          </span>
        </div>
      </div>

      {/* Action banner */}
      <div className="bg-white border border-slate-200/60 rounded-2xl px-6 py-5 mb-6 flex items-center justify-between shadow-sm w-full box-border max-sm:flex-col max-sm:items-start max-sm:gap-4 max-sm:p-4 transition-all hover:shadow-md hover:border-slate-300">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <div>
            <strong className="text-slate-900 text-sm font-semibold block">Configurations Overview</strong>
            <p className="text-slate-500 text-[13px] mt-0.5 m-0 leading-relaxed">These settings are live in your Shopify store. Click Edit to modify API credentials, numbers, or templates.</p>
          </div>
        </div>
        <Link to="/app/settings" className="bg-slate-900 text-white no-underline px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:bg-slate-800 hover:shadow-md border border-slate-800 inline-flex items-center gap-2 max-sm:w-full max-sm:justify-center box-border focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon></svg>
          Edit Configurations
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5 mb-8">
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 flex items-center gap-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5">
          <div className="bg-orange-50 text-orange-600 w-12 h-12 rounded-xl flex items-center justify-center border border-orange-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] text-slate-500 font-medium tracking-wide">WhatsApp Sender</span>
            <span className="text-[15px] font-bold text-slate-900 mt-1">{formatPhone(settings?.flowbeeRegisteredPhone)}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 flex items-center gap-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5">
          <div className="bg-emerald-50 text-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center border border-emerald-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] text-slate-500 font-medium tracking-wide">Admin Recipient</span>
            <span className="text-[15px] font-bold text-slate-900 mt-1">{formatPhone(settings?.flowbeeNotifyPhone)}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 flex items-center gap-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5">
          <div className="bg-sky-50 text-sky-600 w-12 h-12 rounded-xl flex items-center justify-center border border-sky-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] text-slate-500 font-medium tracking-wide">Cart Recovery Delay</span>
            <span className="text-[15px] font-bold text-slate-900 mt-1">{formatDelay(settings?.flowbeeAbandonedCartDelay)}</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-[2fr_1fr] gap-8 max-lg:grid-cols-1">
        {/* Left Column (Automations & Recovery Info) */}
        <div className="flex flex-col gap-6">
          {/* Section: Shopify Order Events */}
          <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-7 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-display text-[15px] font-semibold text-slate-800 flex items-center gap-2 m-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="11" y2="17"></line></svg>
                Shopify Order Automations
              </h2>
            </div>
            <div className="p-7">
              {/* Order Created */}
              <AutomationRow
                label="Order Created Notification (Admin)"
                templateId={activeTemplateOrderCreated}
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>}
              />
              {/* Order Paid */}
              <AutomationRow
                label="Order Paid Notification (Admin)"
                templateId={settings?.flowbeeTemplateOrderPaid}
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>}
              />
              {/* Order Fulfilled */}
              <AutomationRow
                label="Order Fulfilled Notification (Admin)"
                templateId={settings?.flowbeeTemplateOrderFulfilled}
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>}
              />
              {/* Order Cancelled */}
              <AutomationRow
                label="Order Cancelled Notification (Admin)"
                templateId={settings?.flowbeeTemplateOrderCancelled}
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>}
                isLast
              />
            </div>
          </div>

          {/* Section: Abandoned Checkout Settings */}
          <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-7 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-display text-[15px] font-semibold text-slate-800 flex items-center gap-2 m-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                Abandoned Cart Recovery Details
              </h2>
            </div>
            <div className="p-7">
              <div className="flex justify-between border-b border-flowbee-100 py-3.5">
                <span className="text-[13.5px] text-gray-600 font-medium">Recovery Template ID</span>
                <span className="text-[13.5px] font-semibold text-gray-800">{settings?.flowbeeTemplateAbandonedCart || "Not configured"}</span>
              </div>
              <div className="flex justify-between py-3.5">
                <span className="text-[13.5px] text-gray-600 font-medium">Recovery Schedule</span>
                <span className="text-[13.5px] font-semibold text-gray-800">Send recovery message after {formatDelay(settings?.flowbeeAbandonedCartDelay)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Widget / Help column) */}
        <div className="flex flex-col gap-6">
          {/* Quick Guide */}
          <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-7 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-display text-[15px] font-semibold text-slate-800 m-0">Setup & Help Checklist</h2>
            </div>
            <div className="p-6">
              <WidgetItem title="Get Flowbee API Key" description="Obtain your secret API key from the Flowbee API platform under Settings." />
              <WidgetItem title="Register WhatsApp Number" description="Specify the sender phone number associated with your WhatsApp business profile." />
              <WidgetItem title="Select Approved Templates" description="Choose WhatsApp-approved notification templates for order logs and recovering checkouts." isLast />
            </div>
          </div>

          {/* Real Activity Monitor */}
          <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-7 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-display text-[15px] font-semibold text-slate-800 m-0">Activity Monitor</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-3">
                {activityLogs.length === 0 ? (
                  <div className="text-center text-gray-500 text-[13px] py-2.5">
                    No activity events yet. Events will appear here once orders are placed or abandoned checkouts are detected.
                  </div>
                ) : (
                  activityLogs.map((log) => {
                    const badgeClass = log.status === "success" ? "bg-emerald-50 text-emerald-600" : log.status === "failed" ? "bg-red-50 text-red-600" : log.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600";
                    const badgeText = log.status === "success" ? "Success" : log.status === "failed" ? "Failed" : log.status === "pending" ? "Pending" : "Info";

                    let date = new Date();
                    if (log.createdAt?.toMillis) {
                      date = new Date(log.createdAt.toMillis());
                    } else if (log.createdAt?._seconds) {
                      date = new Date(log.createdAt._seconds * 1000);
                    } else if (log.createdAt?.seconds) {
                      date = new Date(log.createdAt.seconds * 1000);
                    } else if (log.createdAt) {
                      date = new Date(log.createdAt);
                    }
                    if (isNaN(date.getTime())) date = new Date();

                    const cleanDetail = (log.detail || "").replace(" for Customer", "");

                    return (
                      <div className="p-3 rounded-[10px] bg-gray-50 border border-gray-100 flex items-center gap-3 text-xs" key={log.id}>
                        <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded uppercase ${badgeClass}`}>{badgeText}</span>
                        <div className="grow">
                          <div className="font-semibold text-gray-800">{log.title}</div>
                          <span className="text-gray-500 text-[11px]">{cleanDetail}</span>
                          <span className="text-gray-400 text-[11px] ml-2">— {date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Footer */}
      <footer className="mt-12 border-t border-flowbee-200 pt-5 flex justify-between items-center text-[13px] text-flowbee-700 max-sm:flex-col max-sm:gap-3 max-sm:items-center max-sm:text-center">
        <p>&copy; {new Date().getFullYear()} Flowbee.io. All rights reserved.</p>
        <div className="flex items-center gap-2.5">
          <a href="https://flowbee.io" target="_blank" rel="noopener noreferrer" className="text-flowbee-600 no-underline font-medium transition-colors hover:text-flowbee-700">Website</a>
          <span>&bull;</span>
          <a href="mailto:support@flowbee.io" className="text-flowbee-600 no-underline font-medium transition-colors hover:text-flowbee-700">Support</a>
          <span>&bull;</span>
          <a href="https://flowbee.io/docs" target="_blank" rel="noopener noreferrer" className="text-flowbee-600 no-underline font-medium transition-colors hover:text-flowbee-700">Documentation</a>
        </div>
      </footer>
    </div>
  );
}

/* Reusable sub-components */

function AutomationRow({ label, templateId, icon, isLast = false }) {
  const enabled = !!templateId;
  return (
    <div className={`flex justify-between items-center px-5 py-4 rounded-xl border border-slate-100 bg-slate-50/50 transition-all hover:border-slate-300 hover:bg-slate-50 ${isLast ? "" : "mb-3.5"}`}>
      <div className="flex items-center gap-3.5">
        <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center border ${enabled ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-white text-slate-400 border-slate-200"}`}>
          {icon}
        </div>
        <div>
          <div className="text-[13.5px] font-semibold text-slate-800">{label}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {enabled ? `Template ID: ${templateId}` : "No template configured"}
          </div>
        </div>
      </div>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${enabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
        {enabled ? "Active" : "Disabled"}
      </span>
    </div>
  );
}

function WidgetItem({ title, description, isLast = false }) {
  return (
    <div className={`flex gap-3 ${isLast ? "" : "mb-4"}`}>
      <div className="w-1.5 h-1.5 rounded-full bg-slate-800 mt-2 shrink-0"></div>
      <div>
        <h4 className="text-[13.5px] font-semibold text-slate-800 m-0">{title}</h4>
        <p className="text-[12.5px] text-slate-500 mt-1 m-0 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
