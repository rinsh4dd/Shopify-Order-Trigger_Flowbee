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
  let shop = "";
  try {
    const { session } = await authenticate.admin(request);
    shop = session.shop;
  } catch (error) {
    const url = new URL(request.url);
    shop = url.searchParams.get("shop") || "flowbee-dev.myshopify.com";
  }
  const settings = await getFlowbeeSettings(shop);
  return { settings, shop };
};

export const action = async ({ request }) => {
  let shop = "";
  try {
    const { session } = await authenticate.admin(request);
    shop = session.shop;
  } catch (error) {
    const url = new URL(request.url);
    shop = url.searchParams.get("shop") || "flowbee-dev.myshopify.com";
  }
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
    const data = createFlowbeeSettingsInput({ shop, formData });

    try {
      await saveFlowbeeSettings(shop, data);
      return redirect(`/app?shop=${shop}`);
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

export default function Settings() {
  const { settings: initialSettings, shop } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  
  const [templateList, setTemplateList] = useState([]);
  const [showApiKey, setShowApiKey] = useState(false);
  const formRef = useRef(null);
  const settings = fetcher.data?.settings || initialSettings;

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

  return (
    <div className="flowbee-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        
        .flowbee-wrapper {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #f6f8fa;
          min-height: 100vh;
          padding: 60px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }

        .flowbee-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 28px;
          box-shadow: 
            0 30px 60px rgba(124, 58, 237, 0.08), 
            0 0 100px rgba(124, 58, 237, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          padding: 48px;
          max-width: 600px;
          width: 100%;
          box-sizing: border-box;
          transition: all 0.3s ease;
        }

        .flowbee-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 40px;
        }

        .flowbee-header img {
          height: 44px;
          margin-bottom: 16px;
        }

        .flowbee-header h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1e1b4b;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }

        .flowbee-header p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .settings-section {
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid #f3e8ff;
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 6px rgba(124, 58, 237, 0.02);
        }

        .section-title {
          font-size: 15px;
          font-weight: 700;
          color: #4c1d95;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px dashed #edd9ff;
          padding-bottom: 10px;
        }

        .field-group {
          margin-bottom: 18px;
        }

        .field-group:last-child {
          margin-bottom: 0;
        }

        .field-label {
          font-size: 13px;
          font-weight: 600;
          color: #4b5563;
          margin-bottom: 8px;
          display: block;
        }

        .modern-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          font-size: 14px;
          font-family: inherit;
          color: #1f2937;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s ease-in-out;
        }

        .modern-input:focus {
          border-color: #7c3aed;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.12);
        }

        .api-key-container {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .api-key-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          transition: color 0.2s;
        }

        .api-key-toggle:hover {
          color: #7c3aed;
        }

        .phone-group {
          display: flex;
          gap: 12px;
          width: 100%;
        }

        .country-select {
          width: 120px;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          font-size: 14px;
          font-family: inherit;
          color: #1f2937;
          height: 45px;
          outline: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .country-select:focus {
          border-color: #7c3aed;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.12);
        }

        .modern-select {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          font-size: 14px;
          font-family: inherit;
          color: #1f2937;
          height: 45px;
          outline: none;
          cursor: pointer;
          box-sizing: border-box;
          transition: all 0.2s ease-in-out;
        }

        .modern-select:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.12);
        }

        .templates-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .templates-header h3 {
          font-size: 15px;
          font-weight: 700;
          color: #4c1d95;
          margin: 0;
        }

        .fetch-button {
          background: #ffffff;
          border: 1px solid #d8b4fe;
          color: #7c3aed;
          border-radius: 10px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .fetch-button:hover {
          border-color: #7c3aed;
          background: #fdfaff;
          transform: translateY(-1px);
        }

        .fetch-button:disabled {
          background: #f3f4f6;
          border-color: #e5e7eb;
          color: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .save-button {
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          color: #ffffff;
          border: none;
          border-radius: 16px;
          padding: 16px 24px;
          font-size: 16px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          width: 100%;
          margin-top: 12px;
          box-shadow: 0 10px 20px rgba(124, 58, 237, 0.2);
          transition: all 0.2s ease-in-out;
        }

        .save-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px rgba(124, 58, 237, 0.3);
        }

        .save-button:active {
          transform: translateY(0);
        }

        .save-button:disabled {
          background: #d1d5db;
          color: #9ca3af;
          box-shadow: none;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(124, 58, 237, 0.2);
          border-top-color: #7c3aed;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }

        .spinner-white {
          border-color: rgba(255, 255, 255, 0.2);
          border-top-color: #ffffff;
          width: 20px;
          height: 20px;
        }

        .button-group {
          display: flex;
          gap: 16px;
          margin-top: 12px;
          width: 100%;
        }

        .cancel-button {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #475569;
          border-radius: 16px;
          padding: 16px 24px;
          font-size: 16px;
          font-weight: 700;
          font-family: inherit;
          text-decoration: none;
          text-align: center;
          display: block;
          width: 100%;
          box-sizing: border-box;
          transition: all 0.2s;
        }

        .cancel-button:hover {
          background: #f8fafc;
          border-color: #94a3b8;
          transform: translateY(-1px);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="flowbee-card">
        <div className="flowbee-header">
          <img src="https://app.flowbee.io/svg/brand-logos/logo-flowbee-secondary.svg" alt="Flowbee Logo" />
          <h1>Update Configurations</h1>
          <p>Modify templates and automatic customer notifications</p>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSave}
          key={settings?.updatedAt ? "updated" : "empty"}
        >
          {/* Section 1: Credentials */}
          <div className="settings-section">
            <div className="section-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Connection & Credentials
            </div>
            
            <div className="field-group">
              <span className="field-label">Flowbee API Key</span>
              <div className="api-key-container">
                <input
                  className="modern-input"
                  name="flowbeeApiKey"
                  type={showApiKey ? "text" : "password"}
                  defaultValue={settings?.flowbeeApiKey || ""}
                  placeholder="Enter API Key"
                  required
                />
                <button
                  type="button"
                  className="api-key-toggle"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="field-group">
              <span className="field-label">Company Name</span>
              <input
                className="modern-input"
                name="flowbeeCompany"
                defaultValue={settings?.flowbeeCompany || ""}
                placeholder="Enter Company Name"
                required
              />
            </div>
          </div>

          {/* Section 2: Numbers */}
          <div className="settings-section">
            <div className="section-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              Phone Setup
            </div>

            <div className="field-group">
              <span className="field-label">Registered WhatsApp Number</span>
              <div className="phone-group">
                <select name="flowbeeRegisteredPhone_country" className="country-select" defaultValue={regPhone.country}>
                  {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>+{c.code}</option>)}
                </select>
                <input
                  className="modern-input"
                  name="flowbeeRegisteredPhone_number"
                  defaultValue={regPhone.number}
                  placeholder="WhatsApp number"
                  required
                />
              </div>
            </div>

            <div className="field-group">
              <span className="field-label">Notification Phone Number (Admin)</span>
              <div className="phone-group">
                <select name="flowbeeNotifyPhone_country" className="country-select" defaultValue={notifyPhone.country}>
                  {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>+{c.code}</option>)}
                </select>
                <input
                  className="modern-input"
                  name="flowbeeNotifyPhone_number"
                  defaultValue={notifyPhone.number}
                  placeholder="Admin phone number"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Templates */}
          <div className="settings-section">
            <div className="templates-header">
              <div className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="11" y2="17"></line></svg>
                WhatsApp Templates
              </div>
              <button type="button" className="fetch-button" onClick={handleFetch} disabled={isFetching}>
                {isFetching ? <span className="spinner"></span> : null}
                {isFetching ? "Loading..." : "Sync Templates"}
              </button>
            </div>

            <div className="field-group">
              <span className="field-label">Order Created Notification</span>
              <select 
                className="modern-select"
                name="flowbeeTemplateOrderCreated" 
                defaultValue={settings?.flowbeeTemplateOrderCreated || settings?.flowbeeTemplateId || ""}
              >
                <option value="">-- Select Template --</option>
                {templateList.map((t) => (
                  <option key={t.template_id || t.id} value={t.template_id || t.id}>
                    {t.template_name || t.name} ({t.template_id || t.id})
                  </option>
                ))}
                {(settings?.flowbeeTemplateOrderCreated || settings?.flowbeeTemplateId) && !templateList.some(t => (t.template_id || t.id) === (settings.flowbeeTemplateOrderCreated || settings.flowbeeTemplateId)) && (
                  <option value={settings.flowbeeTemplateOrderCreated || settings.flowbeeTemplateId}>
                    Saved: {settings.flowbeeTemplateOrderCreated || settings.flowbeeTemplateId}
                  </option>
                )}
              </select>
            </div>

            <div className="field-group">
              <span className="field-label">Order Paid Notification</span>
              <select 
                className="modern-select"
                name="flowbeeTemplateOrderPaid" 
                defaultValue={settings?.flowbeeTemplateOrderPaid || ""}
              >
                <option value="">-- Select Template --</option>
                {templateList.map((t) => (
                  <option key={t.template_id || t.id} value={t.template_id || t.id}>
                    {t.template_name || t.name} ({t.template_id || t.id})
                  </option>
                ))}
                {settings?.flowbeeTemplateOrderPaid && !templateList.some(t => (t.template_id || t.id) === settings.flowbeeTemplateOrderPaid) && (
                  <option value={settings.flowbeeTemplateOrderPaid}>
                    Saved: {settings.flowbeeTemplateOrderPaid}
                  </option>
                )}
              </select>
            </div>

            <div className="field-group">
              <span className="field-label">Order Shipped Notification</span>
              <select 
                className="modern-select"
                name="flowbeeTemplateOrderFulfilled" 
                defaultValue={settings?.flowbeeTemplateOrderFulfilled || ""}
              >
                <option value="">-- Select Template --</option>
                {templateList.map((t) => (
                  <option key={t.template_id || t.id} value={t.template_id || t.id}>
                    {t.template_name || t.name} ({t.template_id || t.id})
                  </option>
                ))}
                {settings?.flowbeeTemplateOrderFulfilled && !templateList.some(t => (t.template_id || t.id) === settings.flowbeeTemplateOrderFulfilled) && (
                  <option value={settings.flowbeeTemplateOrderFulfilled}>
                    Saved: {settings.flowbeeTemplateOrderFulfilled}
                  </option>
                )}
              </select>
            </div>

            <div className="field-group">
              <span className="field-label">Order Cancelled Notification</span>
              <select 
                className="modern-select"
                name="flowbeeTemplateOrderCancelled" 
                defaultValue={settings?.flowbeeTemplateOrderCancelled || ""}
              >
                <option value="">-- Select Template --</option>
                {templateList.map((t) => (
                  <option key={t.template_id || t.id} value={t.template_id || t.id}>
                    {t.template_name || t.name} ({t.template_id || t.id})
                  </option>
                ))}
                {settings?.flowbeeTemplateOrderCancelled && !templateList.some(t => (t.template_id || t.id) === settings.flowbeeTemplateOrderCancelled) && (
                  <option value={settings.flowbeeTemplateOrderCancelled}>
                    Saved: {settings.flowbeeTemplateOrderCancelled}
                  </option>
                )}
              </select>
            </div>
          </div>

          {/* Section 4: Abandoned Cart */}
          <div className="settings-section">
            <div className="section-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              Abandoned Cart Recovery
            </div>

            <div className="field-group">
              <span className="field-label">Recovery Template</span>
              <select 
                className="modern-select"
                name="flowbeeTemplateAbandonedCart" 
                defaultValue={settings?.flowbeeTemplateAbandonedCart || ""}
              >
                <option value="">-- Select Template --</option>
                {templateList.map((t) => (
                  <option key={t.template_id || t.id} value={t.template_id || t.id}>
                    {t.template_name || t.name} ({t.template_id || t.id})
                  </option>
                ))}
                {settings?.flowbeeTemplateAbandonedCart && !templateList.some(t => (t.template_id || t.id) === settings.flowbeeTemplateAbandonedCart) && (
                  <option value={settings.flowbeeTemplateAbandonedCart}>
                    Saved: {settings.flowbeeTemplateAbandonedCart}
                  </option>
                )}
              </select>
            </div>

            <div className="field-group">
              <span className="field-label">Recovery Message Delay</span>
              <select 
                className="modern-select"
                name="flowbeeAbandonedCartDelay" 
                defaultValue={settings?.flowbeeAbandonedCartDelay || "1800"}
              >
                <option value="30">30 seconds (Testing)</option>
                <option value="900">15 minutes</option>
                <option value="1800">30 minutes</option>
                <option value="3600">1 hour</option>
                <option value="7200">2 hours</option>
              </select>
            </div>

            <div className="field-group">
              <span className="field-label">Recovery Attempt Limits</span>
              <select 
                className="modern-select"
                name="flowbeeAbandonedCartCount" 
                defaultValue={settings?.flowbeeAbandonedCartCount || "1"}
              >
                <option value="1">Send 1 recovery message</option>
                <option value="2">Send 2 recovery messages</option>
                <option value="3">Send 3 recovery messages</option>
              </select>
            </div>

            <div className="field-group">
              <span className="field-label">Interval Between Recovery Messages</span>
              <select 
                className="modern-select"
                name="flowbeeAbandonedCartInterval" 
                defaultValue={settings?.flowbeeAbandonedCartInterval || "86400"}
              >
                <option value="30">30 seconds (Testing)</option>
                <option value="3600">1 hour</option>
                <option value="7200">2 hours</option>
                <option value="43200">12 hours</option>
                <option value="86400">24 hours</option>
              </select>
            </div>
          </div>

          <div className="button-group">
            <Link to={`/app?shop=${shop}`} className="cancel-button">Cancel</Link>
            <button
              className="save-button"
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? <span className="spinner spinner-white"></span> : "Save Configurations"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
