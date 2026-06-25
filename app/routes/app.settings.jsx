import { useEffect, useRef, useState } from "react";
import { useFetcher, useLoaderData, redirect, Link } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";

// ── Server-side services ──────────────────────────────────────
import { authenticate } from "../shopify.server";
import {
  createFlowbeeSettingsInput,
  getFlowbeeSettings,
  getFlowbeeTemplates,
  saveFlowbeeSettings,
} from "../features/flowbee/flowbee-settings.service.server";

// ── Constants & utilities ─────────────────────────────────────
import { COUNTRY_CODES } from "../constants/country-codes";
import { splitPhone, formatPhone, formatDelay } from "../utils/phone-utils";
import { parseTemplate } from "../utils/template-parser";

// ── UI components ─────────────────────────────────────────────
import { Card, FieldGroup, MetricCard } from "../components/settings/Card";
import { TemplateSelect } from "../components/settings/TemplateSelect";
import { TemplatePreviewDrawer } from "../components/settings/TemplatePreviewDrawer";
import {
  IconLock,
  IconPhone,
  IconBell,
  IconClock,
  IconTemplate,
  IconCart,
  IconEye,
  IconEyeOff,
  IconSync,
  IconSettings,
} from "../components/settings/Icons";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * LOADER — fetches existing settings from Firestore
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await getFlowbeeSettings(session.shop);
  return { settings, shop: session.shop };
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ACTION — handles template sync + settings save
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "fetchTemplates") {
    return handleFetchTemplates(formData, session);
  }

  if (intent === "save") {
    return handleSaveSettings(formData, session);
  }

  return { success: false, error: "Invalid intent" };
};

async function handleFetchTemplates(formData, session) {
  const apiKey = formData.get("flowbeeApiKey");
  const phone = formData.get("flowbeeRegisteredPhone");
  try {
    const templates = await getFlowbeeTemplates({ apiKey, phone });
    // Persist fetched templates alongside settings for instant loads
    await saveFlowbeeSettings(session.shop, { flowbeeTemplates: templates });
    return { success: true, templates, intent: "fetchTemplates" };
  } catch (error) {
    return { success: false, error: error.message, intent: "fetchTemplates" };
  }
}

async function handleSaveSettings(formData, session) {
  const data = createFlowbeeSettingsInput({ shop: session.shop, formData });
  try {
    await saveFlowbeeSettings(session.shop, data);
    return redirect("/app");
  } catch (error) {
    return { success: false, error: error.message, intent: "save" };
  }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SETTINGS PAGE COMPONENT
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function Settings() {
  const { settings: initialSettings, shop } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const formRef = useRef(null);

  // Derived settings — prefer fresh fetcher data over initial loader data
  const settings = fetcher.data?.settings || initialSettings;

  // ── Local state ───────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("settings"); // "settings" | "templates"
  const [templateList, setTemplateList] = useState(settings?.flowbeeTemplates || []);
  const [showApiKey, setShowApiKey] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewTriggerType, setPreviewTriggerType] = useState("");

  // Template select controlled values
  const [selOrderCreated, setSelOrderCreated] = useState(
    settings?.flowbeeTemplateOrderCreated || settings?.flowbeeTemplateId || ""
  );
  const [selOrderPaid, setSelOrderPaid] = useState(settings?.flowbeeTemplateOrderPaid || "");
  const [selOrderFulfilled, setSelOrderFulfilled] = useState(settings?.flowbeeTemplateOrderFulfilled || "");
  const [selOrderCancelled, setSelOrderCancelled] = useState(settings?.flowbeeTemplateOrderCancelled || "");
  const [selAbandonedCart, setSelAbandonedCart] = useState(settings?.flowbeeTemplateAbandonedCart || "");

  const isConnected = !!settings?.flowbeeApiKey;

  // ── Side effects ──────────────────────────────────────────
  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.success && fetcher.data.intent === "fetchTemplates") {
      setTemplateList(fetcher.data.templates || []);
      shopify.toast.show("Templates synced successfully");
    } else if (!fetcher.data.success && fetcher.data.error) {
      shopify.toast.show(`Error: ${fetcher.data.error}`);
    }
  }, [fetcher.data, shopify]);

  useEffect(() => {
    if (activeTab === "templates") {
      const apiKey = document.getElementsByName("flowbeeApiKey")[0]?.value || settings?.flowbeeApiKey;
      const country = document.getElementsByName("flowbeeRegisteredPhone_country")[0]?.value || "";
      const phoneNum = document.getElementsByName("flowbeeRegisteredPhone_number")[0]?.value || "";
      let phone = country + phoneNum;
      if (!phone && settings?.flowbeeRegisteredPhone) {
        phone = settings.flowbeeRegisteredPhone;
      }

      if (apiKey && phone) {
        const fd = new FormData();
        fd.append("intent", "fetchTemplates");
        fd.append("flowbeeApiKey", apiKey);
        fd.append("flowbeeRegisteredPhone", phone);
        fetcher.submit(fd, { method: "post" });
      }
    }
  }, [activeTab]);

  // ── Derived state ─────────────────────────────────────────
  const isSaving = fetcher.state !== "idle" && fetcher.formData?.get("intent") === "save";
  const isFetching = fetcher.state !== "idle" && fetcher.formData?.get("intent") === "fetchTemplates";
  const regPhone = splitPhone(settings?.flowbeeRegisteredPhone);
  const notifyPhone = splitPhone(settings?.flowbeeNotifyPhone);

  // ── Event handlers ────────────────────────────────────────
  const handleFetch = () => {
    const apiKey = document.getElementsByName("flowbeeApiKey")[0]?.value;
    const country = document.getElementsByName("flowbeeRegisteredPhone_country")[0]?.value;
    const phone = document.getElementsByName("flowbeeRegisteredPhone_number")[0]?.value;

    if (!apiKey || !phone) {
      shopify.toast.show("Enter API Key and Registered Phone first");
      return;
    }

    const fd = new FormData();
    fd.append("intent", "fetchTemplates");
    fd.append("flowbeeApiKey", apiKey);
    fd.append("flowbeeRegisteredPhone", country + phone);
    fetcher.submit(fd, { method: "post" });
  };

  const handleSave = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fields = form.querySelectorAll("select, input:not([type='hidden'])");
    const data = {};
    fields.forEach((f) => {
      if (f.name) data[f.name] = f.value || "";
    });

    const fd = new FormData();
    fd.append("intent", "save");
    fd.append("flowbeeApiKey", data.flowbeeApiKey || "");
    fd.append("flowbeeCompany", data.flowbeeCompany || "");
    fd.append("flowbeeRegisteredPhone", (data.flowbeeRegisteredPhone_country || "") + (data.flowbeeRegisteredPhone_number || ""));
    fd.append("flowbeeNotifyPhone", (data.flowbeeNotifyPhone_country || "") + (data.flowbeeNotifyPhone_number || ""));
    fd.append("flowbeeTemplateId", data.flowbeeTemplateOrderCreated || "");
    fd.append("flowbeeTemplateOrderCreated", data.flowbeeTemplateOrderCreated || "");
    fd.append("flowbeeTemplateOrderPaid", data.flowbeeTemplateOrderPaid || "");
    fd.append("flowbeeTemplateOrderFulfilled", data.flowbeeTemplateOrderFulfilled || "");
    fd.append("flowbeeTemplateOrderCancelled", data.flowbeeTemplateOrderCancelled || "");
    fd.append("flowbeeTemplateAbandonedCart", data.flowbeeTemplateAbandonedCart || "");
    fd.append("flowbeeAbandonedCartDelay", data.flowbeeAbandonedCartDelay || "1800");
    fd.append("flowbeeAbandonedCartCount", data.flowbeeAbandonedCartCount || "1");
    fd.append("flowbeeAbandonedCartInterval", data.flowbeeAbandonedCartInterval || "86400");
    fetcher.submit(fd, { method: "post" });
  };

  /**
   * Resolves a template for preview using the synced real templates list.
   */
  const triggerPreview = (value, fallbackName, type) => {
    const tpl = templateList.find((t) => String(t.template_id || t.id) === String(value));
    if (tpl) {
      setPreviewTemplate(parseTemplate(tpl));
      setPreviewTriggerType(type);
    } else {
      shopify.toast.show("Please select a synced template to preview");
    }
  };

  // ── Shared input classes ──────────────────────────────────
  const inputCls =
    "w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-[12.5px] font-normal text-slate-600 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10";
  const countryCls =
    "w-[110px] px-2.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/80 text-[12.5px] font-normal text-slate-600 h-[40px] outline-none cursor-pointer transition-all duration-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10";

  // ── Trigger config — defines all notification template selectors
  const TRIGGERS = [
    { label: "Order Created", name: "flowbeeTemplateOrderCreated", value: selOrderCreated, setter: setSelOrderCreated, fallback: "order_confirmation", type: "Order Created" },
    { label: "Order Paid", name: "flowbeeTemplateOrderPaid", value: selOrderPaid, setter: setSelOrderPaid, fallback: "payment_reminder", type: "Order Paid" },
    { label: "Order Shipped", name: "flowbeeTemplateOrderFulfilled", value: selOrderFulfilled, setter: setSelOrderFulfilled, fallback: "delivery_update", type: "Order Shipped" },
    { label: "Order Cancelled", name: "flowbeeTemplateOrderCancelled", value: selOrderCancelled, setter: setSelOrderCancelled, fallback: "order_cancelled", type: "Order Cancelled" },
  ];

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * RENDER
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  return (
    <div
      className="bg-gradient-to-br from-slate-50 via-[#f8fbfc] to-[#f1f5f9] min-h-screen px-8 py-8 text-slate-900 max-md:px-4 relative overflow-x-hidden"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* ── Page Header ──────────────────────────────────────── */}
      <header className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex justify-between items-center mb-6 max-sm:flex-col max-sm:items-start max-sm:gap-3">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50/70 rounded-xl flex items-center justify-center">
            <img
              src="https://app.flowbee.io/svg/brand-logos/logo-flowbee-secondary.svg"
              alt="Flowbee"
              className="h-[22px]"
            />
          </div>
          <div>
            <h1 className="text-[16px] font-medium text-slate-700 m-0">
              Settings
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5 m-0 font-normal">
              Configure WhatsApp notifications & templates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 max-sm:w-full max-sm:justify-start max-sm:flex-wrap">
          <span className="bg-slate-50 text-slate-500 text-[11px] font-normal px-3 py-1.5 rounded-lg border border-slate-100">
            {shop}
          </span>
          <StatusBadge connected={isConnected} />
        </div>
      </header>

      {/* ── Tab Switcher ─────────────────────────────────────── */}
      <div className="flex justify-start mb-6">
        <div className="bg-slate-100/80 p-1 rounded-xl flex gap-1 border border-slate-200/50 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2 text-[12.5px] font-medium rounded-lg transition-all duration-200 border-none cursor-pointer ${
              activeTab === "settings"
                ? "bg-white text-slate-800 shadow-[0_2px_4px_rgba(0,0,0,0.04)]"
                : "bg-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <IconSettings size={15} />
            <span>Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-2 px-4 py-2 text-[12.5px] font-medium rounded-lg transition-all duration-200 border-none cursor-pointer ${
              activeTab === "templates"
                ? "bg-white text-slate-800 shadow-[0_2px_4px_rgba(0,0,0,0.04)]"
                : "bg-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <IconTemplate size={15} />
            <span>Templates</span>
          </button>
        </div>
      </div>

      {/* ── Main Form — Tabbed Layout ───────────────────────── */}
      <form ref={formRef} onSubmit={handleSave}>
        
        {/* ── Tab 1: Settings ────────────────────────────────── */}
        <div className={`grid grid-cols-2 gap-5 max-lg:grid-cols-1 items-start ${activeTab === "settings" ? "" : "hidden"}`}>
          <Card title="Connection & Credentials" icon={<IconLock />}>
            <FieldGroup label="Flowbee API Key">
              <div className="relative flex items-center w-full">
                <input
                  className={inputCls}
                  name="flowbeeApiKey"
                  type={showApiKey ? "text" : "password"}
                  defaultValue={settings?.flowbeeApiKey || ""}
                  placeholder="Enter your Flowbee API key"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-slate-400 hover:text-emerald-500 flex items-center p-0.5 transition-colors"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </FieldGroup>
            <FieldGroup label="Company Name">
              <input
                className={inputCls}
                name="flowbeeCompany"
                defaultValue={settings?.flowbeeCompany || ""}
                placeholder="Your company name"
                required
              />
            </FieldGroup>
          </Card>

          <Card title="Phone Numbers" icon={<IconPhone />}>
            <FieldGroup label="Registered WhatsApp Number" hint="The number registered with Flowbee for sending messages">
              <div className="flex gap-2 w-full">
                <select name="flowbeeRegisteredPhone_country" className={countryCls} defaultValue={regPhone.country}>
                  {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>+{c.code}</option>)}
                </select>
                <input className={inputCls} name="flowbeeRegisteredPhone_number" defaultValue={regPhone.number} placeholder="Phone number" required />
              </div>
            </FieldGroup>
            <FieldGroup label="Admin Notification Number" hint="Receives admin alerts for new orders">
              <div className="flex gap-2 w-full">
                <select name="flowbeeNotifyPhone_country" className={countryCls} defaultValue={notifyPhone.country}>
                  {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>+{c.code}</option>)}
                </select>
                <input className={inputCls} name="flowbeeNotifyPhone_number" defaultValue={notifyPhone.number} placeholder="Phone number" required />
              </div>
            </FieldGroup>
          </Card>
        </div>

        {/* ── Tab 2: Templates ───────────────────────────────── */}
        <div className={`grid grid-cols-2 gap-5 max-lg:grid-cols-1 items-start ${activeTab === "templates" ? "" : "hidden"}`}>
          <Card
            title="Notification Triggers"
            icon={<IconTemplate />}
            badge={
              templateList.length > 0 && (
                <span className="text-[10px] font-normal bg-emerald-50/70 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-100/60">
                  {templateList.length} templates
                </span>
              )
            }
            action={
              isFetching && (
                <span className="text-[10px] font-normal text-slate-400 flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-lg px-2.5 py-1">
                  <span className="w-2.5 h-2.5 border-2 border-slate-300 border-t-emerald-500 rounded-full inline-block animate-spin" />
                  <span>Syncing...</span>
                </span>
              )
            }
          >
            {TRIGGERS.map((t, i) => (
              <TemplateSelect
                key={t.name}
                label={t.label}
                name={t.name}
                value={t.value}
                onChange={t.setter}
                templateList={templateList}
                onPreview={() => triggerPreview(t.value, t.fallback, t.type)}
                isPreviewing={
                  previewTemplate?.template_id === t.value &&
                  !!t.value &&
                  previewTriggerType === t.type
                }
                isLast={i === TRIGGERS.length - 1}
              />
            ))}
          </Card>

          <Card title="Abandoned Cart Recovery" icon={<IconCart />}>
            <TemplateSelect
              label="Recovery Template"
              name="flowbeeTemplateAbandonedCart"
              value={selAbandonedCart}
              onChange={setSelAbandonedCart}
              templateList={templateList}
              onPreview={() => triggerPreview(selAbandonedCart, "abandoned_cart_recovery", "Abandoned Cart")}
              isPreviewing={
                previewTemplate?.template_id === selAbandonedCart &&
                !!selAbandonedCart &&
                previewTriggerType === "Abandoned Cart"
              }
            />
            <FieldGroup label="Message Delay" hint="How long to wait before sending a cart recovery message">
              <select
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-[12.5px] font-normal text-slate-600 h-[40px] outline-none cursor-pointer transition-all duration-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10"
                name="flowbeeAbandonedCartDelay"
                defaultValue={settings?.flowbeeAbandonedCartDelay || "1800"}
              >
                <option value="900">15 minutes</option>
                <option value="1800">30 minutes</option>
                <option value="3600">1 hour</option>
                <option value="7200">2 hours</option>
              </select>
            </FieldGroup>
            <input type="hidden" name="flowbeeAbandonedCartCount" value="1" />
            <input type="hidden" name="flowbeeAbandonedCartInterval" value="86400" />
          </Card>
        </div>

        {/* ── Form Actions (full width below grid) ──────────── */}
        <div className="flex gap-3 mt-5 max-w-md ml-auto max-sm:flex-col max-sm:max-w-none">
          <Link
            to="/app"
            className="bg-white border border-slate-200 text-slate-500 rounded-lg px-5 py-2.5 text-[12.5px] font-medium no-underline text-center block w-full transition-all hover:bg-slate-50 hover:border-slate-300"
          >
            Cancel
          </Link>
          <button
            className="bg-slate-800 text-white rounded-lg px-5 py-2.5 text-[12.5px] font-medium cursor-pointer w-full transition-all hover:bg-slate-700 border border-slate-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            type="submit"
            disabled={isSaving}
          >
            {isSaving && (
              <span className="w-3 h-3 border-2 border-slate-300 border-t-white rounded-full inline-block animate-spin" />
            )}
            {isSaving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </form>

      {/* ── Preview Drawer ───────────────────────────────────── */}
      {previewTemplate && (
        <TemplatePreviewDrawer
          template={previewTemplate}
          triggerType={previewTriggerType}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="mt-10 border-t border-slate-100 pt-5 flex justify-between items-center text-[11px] text-slate-400 max-sm:flex-col max-sm:gap-2 max-sm:text-center">
        <p className="m-0 font-normal">
          &copy; {new Date().getFullYear()} Flowbee.io
        </p>
        <div className="flex items-center gap-3">
          <a href="https://flowbee.io" target="_blank" rel="noopener noreferrer" className="text-slate-400 no-underline font-medium hover:text-emerald-500 transition-colors">Website</a>
          <span>&bull;</span>
          <a href="mailto:support@flowbee.io" className="text-slate-400 no-underline font-medium hover:text-emerald-500 transition-colors">Support</a>
          <span>&bull;</span>
          <a href="https://flowbee.io/docs" target="_blank" rel="noopener noreferrer" className="text-slate-400 no-underline font-medium hover:text-emerald-500 transition-colors">Docs</a>
        </div>
      </footer>
    </div>
  );
}

/* ── Inline sub-component ────────────────────────────────────── */

function StatusBadge({ connected }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10.5px] font-normal px-2.5 py-1 rounded-lg border transition-all ${
        connected
          ? "bg-emerald-50/70 text-emerald-600 border-emerald-100/60"
          : "bg-rose-50/70 text-rose-500 border-rose-100/60"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full inline-block ${
          connected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
        }`}
      />
      {connected ? "Connected" : "Disconnected"}
    </span>
  );
}

/* ── Route boundary header export ────────────────────────────── */
export const headers = (headersArgs) => boundary.headers(headersArgs);
