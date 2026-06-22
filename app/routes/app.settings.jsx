import { useEffect, useRef, useState } from "react";
import { useFetcher, useLoaderData, redirect, Link } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  createFlowbeeSettingsInput,
  getFlowbeeSettings,
  getFlowbeeTemplates,
  saveFlowbeeSettings,
} from "../features/flowbee/flowbee-settings.service.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await getFlowbeeSettings(session.shop);
  return { settings, shop: session.shop };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
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

  if (intent === "save") {
    const data = createFlowbeeSettingsInput({ shop: session.shop, formData });

    try {
      await saveFlowbeeSettings(session.shop, data);
      return redirect("/app");
    } catch (error) {
      return { success: false, error: error.message, intent: "save" };
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

function splitPhone(phone = "") {
  const match = COUNTRY_CODES.find(c => phone.startsWith(c.code));
  if (match) {
    return { country: match.code, number: phone.slice(match.code.length) };
  }
  return { country: "91", number: phone };
}

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
  if (secs >= 3600) {
    const hours = secs / 3600;
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return `${secs / 60} minutes`;
}

export default function Settings() {
  const { settings: initialSettings, shop } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  
  const [templateList, setTemplateList] = useState([]);
  const [showApiKey, setShowApiKey] = useState(false);
  const formRef = useRef(null);
  const settings = fetcher.data?.settings || initialSettings;

  // Controlled state for template selects — preserves selections when template list reloads
  const [selOrderCreated, setSelOrderCreated] = useState(settings?.flowbeeTemplateOrderCreated || settings?.flowbeeTemplateId || "");
  const [selOrderPaid, setSelOrderPaid] = useState(settings?.flowbeeTemplateOrderPaid || "");
  const [selOrderFulfilled, setSelOrderFulfilled] = useState(settings?.flowbeeTemplateOrderFulfilled || "");
  const [selOrderCancelled, setSelOrderCancelled] = useState(settings?.flowbeeTemplateOrderCancelled || "");
  const [selAbandonedCart, setSelAbandonedCart] = useState(settings?.flowbeeTemplateAbandonedCart || "");

  const isConnected = !!settings?.flowbeeApiKey;

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        if (fetcher.data.intent === "fetchTemplates") {
          setTemplateList(fetcher.data.templates || []);
          shopify.toast.show("Templates loaded");
        }
      } else {
        shopify.toast.show(`Error: ${fetcher.data.error}`);
      }
    }
  }, [fetcher.data, shopify]);

  const handleFetch = () => {
    const apiKey = document.getElementsByName("flowbeeApiKey")[0]?.value;
    const country = document.getElementsByName("flowbeeRegisteredPhone_country")[0]?.value;
    const phone = document.getElementsByName("flowbeeRegisteredPhone_number")[0]?.value;
    
    if (!apiKey || !phone) {
      shopify.toast.show("Enter API Key and Registered Phone");
      return;
    }
    
    const formData = new FormData();
    formData.append("intent", "fetchTemplates");
    formData.append("flowbeeApiKey", apiKey);
    formData.append("flowbeeRegisteredPhone", country + phone);
    fetcher.submit(formData, { method: "post" });
  };

  const submitSettings = (form) => {
    if (!form) return;
    const formData = new FormData();
    const fields = form.querySelectorAll("s-text-field, select, input:not([type='hidden'])");
    
    const data = {};
    fields.forEach(field => {
      const name = field.getAttribute("name");
      if (!name) return;
      data[name] = field.value || "";
    });

    const registeredPhone = (data["flowbeeRegisteredPhone_country"] || "") + (data["flowbeeRegisteredPhone_number"] || "");
    const notifyPhone = (data["flowbeeNotifyPhone_country"] || "") + (data["flowbeeNotifyPhone_number"] || "");

    formData.append("intent", "save");
    formData.append("flowbeeApiKey", data["flowbeeApiKey"] || "");
    formData.append("flowbeeCompany", data["flowbeeCompany"] || "");
    formData.append("flowbeeRegisteredPhone", registeredPhone);
    formData.append("flowbeeNotifyPhone", notifyPhone);
    formData.append("flowbeeTemplateId", data["flowbeeTemplateId"] || "");
    formData.append("flowbeeTemplateOrderCreated", data["flowbeeTemplateOrderCreated"] || "");
    formData.append("flowbeeTemplateOrderPaid", data["flowbeeTemplateOrderPaid"] || "");
    formData.append("flowbeeTemplateOrderFulfilled", data["flowbeeTemplateOrderFulfilled"] || "");
    formData.append("flowbeeTemplateOrderCancelled", data["flowbeeTemplateOrderCancelled"] || "");
    formData.append("flowbeeTemplateAbandonedCart", data["flowbeeTemplateAbandonedCart"] || "");
    formData.append("flowbeeAbandonedCartDelay", data["flowbeeAbandonedCartDelay"] || "1800");
    formData.append("flowbeeAbandonedCartCount", data["flowbeeAbandonedCartCount"] || "1");
    formData.append("flowbeeAbandonedCartInterval", data["flowbeeAbandonedCartInterval"] || "86400");

    fetcher.submit(formData, { method: "post" });
  };

  const handleSave = (event) => {
    event.preventDefault();
    submitSettings(event.currentTarget);
  };

  const isSaving = fetcher.state !== "idle" && fetcher.formData?.get("intent") === "save";
  const isFetching = fetcher.state !== "idle" && fetcher.formData?.get("intent") === "fetchTemplates";
  const regPhone = splitPhone(settings?.flowbeeRegisteredPhone);
  const notifyPhone = splitPhone(settings?.flowbeeNotifyPhone);

  const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-sans text-slate-800 outline-none box-border transition-all focus:border-flowbee-500 focus:shadow-[0_0_0_4px_rgba(245,158,11,0.12)]";
  const selectClass = "w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-sans text-slate-800 h-[46px] outline-none cursor-pointer box-border transition-all focus:border-flowbee-500 focus:shadow-[0_0_0_4px_rgba(245,158,11,0.12)]";
  const countryClass = "w-[120px] px-3 py-3 rounded-xl border border-slate-300 bg-slate-50 text-sm font-sans text-slate-800 h-[46px] outline-none cursor-pointer transition-all focus:border-flowbee-500 focus:shadow-[0_0_0_4px_rgba(245,158,11,0.12)]";

  return (
    <div className="font-sans bg-slate-50 min-h-screen px-10 py-8 text-slate-900 box-border max-md:px-5">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-5 max-sm:flex-col max-sm:items-start max-sm:gap-4 max-sm:pb-4">
        <div className="flex items-center gap-4 max-sm:gap-3">
          <img src="https://app.flowbee.io/svg/brand-logos/logo-flowbee-secondary.svg" alt="Flowbee" className="h-[38px]" />
          <div>
            <h1 className="font-display text-[22px] font-extrabold text-slate-900 m-0 max-sm:text-lg">Update Configurations</h1>
            <p className="text-[13px] text-slate-500 mt-1 m-0">Modify templates and automatic customer notifications</p>
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

      {/* Metrics Row */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5 mb-8">
        <MetricCard label="WhatsApp Sender" value={formatPhone(settings?.flowbeeRegisteredPhone)}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>}
          iconBg="bg-orange-50 border border-orange-100" iconColor="text-orange-600"
        />
        <MetricCard label="Admin Recipient" value={formatPhone(settings?.flowbeeNotifyPhone)}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>}
          iconBg="bg-emerald-50 border border-emerald-100" iconColor="text-emerald-600"
        />
        <MetricCard label="Cart Recovery Delay" value={formatDelay(settings?.flowbeeAbandonedCartDelay)}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>}
          iconBg="bg-sky-50 border border-sky-100" iconColor="text-sky-600"
        />
      </div>

      {/* Main 2-Column Grid */}
      <form ref={formRef} onSubmit={handleSave}>
        <div className="grid grid-cols-[2fr_1fr] gap-8 max-lg:grid-cols-1">
          {/* Left Column (Inputs Cards) */}
          <div className="flex flex-col gap-6">
            {/* Section 1: Credentials */}
            <Card title="Connection & Credentials" icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>}>
              <FieldGroup label="Flowbee API Key">
                <div className="relative flex items-center w-full">
                  <input
                    className={inputClass}
                    name="flowbeeApiKey"
                    type={showApiKey ? "text" : "password"}
                    defaultValue={settings?.flowbeeApiKey || ""}
                    placeholder="Enter API Key"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-slate-400 flex items-center justify-center p-1 transition-colors hover:text-flowbee-500"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </FieldGroup>
              <FieldGroup label="Company Name">
                <input className={inputClass} name="flowbeeCompany" defaultValue={settings?.flowbeeCompany || ""} placeholder="Enter Company Name" required />
              </FieldGroup>
            </Card>

            {/* Section 2: Numbers */}
            <Card title="Phone Setup" icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>}>
              <FieldGroup label="Registered WhatsApp Number">
                <div className="flex gap-3 w-full">
                  <select name="flowbeeRegisteredPhone_country" className={countryClass} defaultValue={regPhone.country}>
                    {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>+{c.code}</option>)}
                  </select>
                  <input className={inputClass} name="flowbeeRegisteredPhone_number" defaultValue={regPhone.number} placeholder="WhatsApp number" required />
                </div>
              </FieldGroup>
              <FieldGroup label="Notification Phone Number (Admin)">
                <div className="flex gap-3 w-full">
                  <select name="flowbeeNotifyPhone_country" className={countryClass} defaultValue={notifyPhone.country}>
                    {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>+{c.code}</option>)}
                  </select>
                  <input className={inputClass} name="flowbeeNotifyPhone_number" defaultValue={notifyPhone.number} placeholder="Admin phone number" required />
                </div>
              </FieldGroup>
            </Card>

            {/* Section 3: Templates */}
            <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-7 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-display text-[15px] font-semibold text-slate-800 flex items-center gap-2 m-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="11" y2="17"></line></svg>
                  WhatsApp Templates
                </h2>
                <button type="button" className="bg-white border border-slate-200 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium cursor-pointer flex items-center gap-2 transition-all hover:bg-slate-50 hover:border-slate-300 shadow-sm disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2" onClick={handleFetch} disabled={isFetching}>
                  {isFetching ? <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-700 rounded-full inline-block animate-spin-fast"></span> : null}
                  {isFetching ? "Loading..." : "Sync Templates"}
                </button>
              </div>
              <div className="p-7">
                <TemplateSelect label="Order Created Notification" name="flowbeeTemplateOrderCreated" value={selOrderCreated} onChange={setSelOrderCreated} templateList={templateList} selectClass={selectClass} />
                <TemplateSelect label="Order Paid Notification" name="flowbeeTemplateOrderPaid" value={selOrderPaid} onChange={setSelOrderPaid} templateList={templateList} selectClass={selectClass} />
                <TemplateSelect label="Order Shipped Notification" name="flowbeeTemplateOrderFulfilled" value={selOrderFulfilled} onChange={setSelOrderFulfilled} templateList={templateList} selectClass={selectClass} />
                <TemplateSelect label="Order Cancelled Notification" name="flowbeeTemplateOrderCancelled" value={selOrderCancelled} onChange={setSelOrderCancelled} templateList={templateList} selectClass={selectClass} isLast />
              </div>
            </div>

            {/* Section 4: Abandoned Cart */}
            <Card title="Abandoned Cart Recovery" icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>}>
              <TemplateSelect label="Recovery Template" name="flowbeeTemplateAbandonedCart" value={selAbandonedCart} onChange={setSelAbandonedCart} templateList={templateList} selectClass={selectClass} />
              <FieldGroup label="Recovery Message Delay">
                <select className={selectClass} name="flowbeeAbandonedCartDelay" defaultValue={settings?.flowbeeAbandonedCartDelay || "1800"}>
                  <option value="900">15 minutes</option>
                  <option value="1800">30 minutes</option>
                  <option value="3600">1 hour</option>
                  <option value="7200">2 hours</option>
                </select>
              </FieldGroup>
              <input type="hidden" name="flowbeeAbandonedCartCount" value="1" />
              <input type="hidden" name="flowbeeAbandonedCartInterval" value="86400" />
            </Card>

            {/* Actions Form */}
            <div className="flex gap-4 mt-1 w-full max-sm:flex-col max-sm:gap-3">
              <Link to="/app" className="bg-white border border-slate-200 text-slate-700 rounded-lg px-6 py-3 text-sm font-medium no-underline text-center block w-full box-border transition-all shadow-sm hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2">Cancel</Link>
              <button
                className="bg-slate-900 text-white rounded-lg px-6 py-3 text-sm font-medium cursor-pointer w-full shadow-sm transition-all hover:bg-slate-800 hover:shadow-md border border-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 flex items-center justify-center gap-2"
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? <span className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full inline-block animate-spin-fast"></span> : null}
                {isSaving ? "Saving..." : "Save Configurations"}
              </button>
            </div>
          </div>

          {/* Right Column (Widget / Help column) */}
          <div className="flex flex-col gap-6">
            <Card title="Editing Tips" icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>}>
              <div className="flex gap-3 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800 mt-2 shrink-0"></div>
                <div>
                  <h4 className="text-[13.5px] font-semibold text-slate-800 m-0">Sync Approved Templates</h4>
                  <p className="text-[12.5px] text-slate-500 mt-1 m-0 leading-relaxed">Make sure to enter your API key and registered phone number, then click **Sync Templates** to load your WhatsApp Business approved templates dynamically.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800 mt-2 shrink-0"></div>
                <div>
                  <h4 className="text-[13.5px] font-semibold text-slate-800 m-0">Admin Notification Recipient</h4>
                  <p className="text-[12.5px] text-slate-500 mt-1 m-0 leading-relaxed">Provide a valid phone number (with country code) to receive administrative notifications regarding order triggers.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>

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

function Card({ title, icon, children }) {
  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-7 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h2 className="font-display text-[15px] font-semibold text-slate-800 flex items-center gap-2 m-0">
          {icon}
          {title}
        </h2>
      </div>
      <div className="p-7">{children}</div>
    </div>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div className="mb-5 last:mb-0">
      <span className="text-[13.5px] font-semibold text-slate-800 mb-2 block">{label}</span>
      {children}
    </div>
  );
}

function MetricCard({ label, value, icon, iconBg, iconColor }) {
  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl p-6 flex items-center gap-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5">
      <div className={`${iconBg} ${iconColor} w-12 h-12 rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[13px] text-slate-500 font-medium tracking-wide">{label}</span>
        <span className="text-[15px] font-bold text-slate-900 mt-1">{value}</span>
      </div>
    </div>
  );
}

function TemplateSelect({ label, name, value, onChange, templateList, selectClass, isLast = false }) {
  return (
    <div className={isLast ? "" : "mb-5"}>
      <span className="text-[13.5px] font-semibold text-slate-800 mb-2 block">{label}</span>
      <select
        className={selectClass}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">-- Select Template --</option>
        {templateList.map((t) => (
          <option key={t.template_id || t.id} value={t.template_id || t.id}>
            {t.template_name || t.name} ({t.template_id || t.id})
          </option>
        ))}
        {value && !templateList.some(t => (t.template_id || t.id) === value) && (
          <option value={value}>
            Current: {value}
          </option>
        )}
      </select>
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
