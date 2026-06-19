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
  if (secs === 30) return "30 seconds (Testing)";
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

  return (
    <div className="dashboard-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        
        .dashboard-container {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #fefdf0;
          min-height: 100vh;
          padding: 30px 40px;
          color: #202223;
          box-sizing: border-box;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          border-bottom: 1px solid #fde68a;
          padding-bottom: 20px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .logo-img {
          height: 38px;
        }

        .header-title-group h1 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #78350f;
          margin: 0;
        }

        .header-title-group p {
          font-size: 13px;
          color: #b45309;
          margin: 4px 0 0 0;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .store-badge {
          background: #fef3c7;
          color: #78350f;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 9999px;
          border: 1px solid #fde68a;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 9999px;
        }

        .status-badge.connected {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .status-badge.disconnected {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          animation: pulse 2s infinite;
        }

        .status-badge.connected .status-dot {
          background-color: #10b981;
        }

        .status-badge.disconnected .status-dot {
          background-color: #ef4444;
        }

        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.5; }
          100% { transform: scale(0.9); opacity: 1; }
        }

        /* Metrics grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .metric-card {
          background: #ffffff;
          border: 1px solid #fde68a;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.01);
          transition: all 0.2s;
        }

        .metric-icon-box {
          background: #fef3c7;
          color: #d97706;
          width: 52px;
          height: 52px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .metric-details {
          display: flex;
          flex-direction: column;
        }

        .metric-label {
          font-size: 13px;
          color: #b45309;
          font-weight: 500;
        }

        .metric-value {
          font-size: 16px;
          font-weight: 700;
          color: #78350f;
          margin-top: 4px;
        }

        /* Two column layout */
        .dashboard-content-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 30px;
        }

        @media (max-width: 1024px) {
          .dashboard-content-layout {
            grid-template-columns: 1fr;
          }
        }

        .dashboard-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Modern Dashboard Card */
        .dash-card {
          background: #ffffff;
          border: 1px solid #fde68a;
          border-radius: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.01);
          overflow: hidden;
        }

        .dash-card-header {
          padding: 24px 28px;
          border-bottom: 1px solid #fef3c7;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dash-card-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #78350f;
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
        }

        .dash-card-body {
          padding: 28px;
        }

        .field-group {
          margin-bottom: 20px;
        }

        .field-group:last-child {
          margin-bottom: 0;
        }

        .field-label {
          font-size: 13.5px;
          font-weight: 600;
          color: #78350f;
          margin-bottom: 8px;
          display: block;
        }

        .modern-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          font-size: 14px;
          font-family: inherit;
          color: #1e293b;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s ease-in-out;
        }

        .modern-input:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.12);
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
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          transition: color 0.2s;
        }

        .api-key-toggle:hover {
          color: #f59e0b;
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
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          font-size: 14px;
          font-family: inherit;
          color: #1e293b;
          height: 46px;
          outline: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .country-select:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.12);
        }

        .modern-select {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          font-size: 14px;
          font-family: inherit;
          color: #1e293b;
          height: 46px;
          outline: none;
          cursor: pointer;
          box-sizing: border-box;
          transition: all 0.2s ease-in-out;
        }

        .modern-select:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.12);
        }

        .templates-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .fetch-button {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #d97706;
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
          border-color: #f59e0b;
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

        .button-group {
          display: flex;
          gap: 16px;
          margin-top: 30px;
          width: 100%;
        }

        .cancel-button {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #475569;
          border-radius: 14px;
          padding: 14px 24px;
          font-size: 15px;
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

        .save-button {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #ffffff;
          border: none;
          border-radius: 14px;
          padding: 14px 24px;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          width: 100%;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
          transition: all 0.2s ease-in-out;
        }

        .save-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(245, 158, 11, 0.25);
        }

        .save-button:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          box-shadow: none;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(245, 158, 11, 0.2);
          border-top-color: #f59e0b;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }

        .spinner-white {
          border-color: rgba(255, 255, 255, 0.2);
          border-top-color: #ffffff;
          width: 18px;
          height: 18px;
        }

        /* Footer styling */
        .dashboard-footer {
          margin-top: 50px;
          border-top: 1px solid #fde68a;
          padding-top: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #b45309;
        }

        .dashboard-footer a {
          color: #d97706;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .dashboard-footer a:hover {
          color: #b45309;
        }

        .footer-links {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .widget-item {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .widget-item:last-child {
          margin-bottom: 0;
        }

        .widget-dot-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f59e0b;
          margin-top: 6px;
          flex-shrink: 0;
        }

        .widget-text h4 {
          font-size: 13.5px;
          font-weight: 600;
          color: #1c2434;
          margin: 0;
        }

        .widget-text p {
          font-size: 12.5px;
          color: #6b7280;
          margin: 4px 0 0 0;
          line-height: 1.4;
        }

        .logs-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .log-item {
          padding: 12px;
          border-radius: 10px;
          background: #fafafa;
          border: 1px solid #f1f2f4;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
        }

        .log-badge {
          font-weight: 700;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .log-badge.success {
          background: #e6fcf5;
          color: #0ca678;
        }

        .log-badge.info {
          background: #e7f5ff;
          color: #1c7ed6;
        }

        .log-info {
          flex-grow: 1;
        }

        .log-time {
          color: #a0aec0;
          font-size: 11px;
        }

        /* Mobile Viewport Responsiveness */
        @media (max-width: 640px) {
          .dashboard-container {
            padding: 20px;
          }
          
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            padding-bottom: 16px;
          }

          .header-left {
            gap: 12px;
          }

          .header-title-group h1 {
            font-size: 18px;
          }

          .header-right {
            width: 100%;
            justify-content: flex-start;
            flex-wrap: wrap;
            gap: 10px;
          }

          .button-group {
            flex-direction: column;
            gap: 12px;
          }

          .dashboard-footer {
            flex-direction: column;
            gap: 12px;
            align-items: center;
            text-align: center;
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Top Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <img src="https://app.flowbee.io/svg/brand-logos/logo-flowbee-secondary.svg" alt="Flowbee" className="logo-img" />
          <div className="header-title-group">
            <h1>Update Configurations</h1>
            <p>Modify templates and automatic customer notifications</p>
          </div>
        </div>

        <div className="header-right">
          <span className="store-badge">{shop}</span>
          <span className={`status-badge ${isConnected ? "connected" : "disconnected"}`}>
            <span className="status-dot"></span>
            {isConnected ? "API Connected" : "API Disconnected"}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </div>
          <div className="metric-details">
            <span className="metric-label">WhatsApp Sender</span>
            <span className="metric-value">{formatPhone(settings?.flowbeeRegisteredPhone)}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </div>
          <div className="metric-details">
            <span className="metric-label">Admin Recipient</span>
            <span className="metric-value">{formatPhone(settings?.flowbeeNotifyPhone)}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div className="metric-details">
            <span className="metric-label">Cart Recovery Delay</span>
            <span className="metric-value">{formatDelay(settings?.flowbeeAbandonedCartDelay)}</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <form ref={formRef} onSubmit={handleSave}>
        <div className="dashboard-content-layout">
          {/* Left Column (Inputs Cards) */}
          <div className="dashboard-column">
            {/* Section 1: Credentials */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h2 className="dash-card-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  Connection & Credentials
                </h2>
              </div>
              <div className="dash-card-body">
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
            </div>

            {/* Section 2: Numbers */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h2 className="dash-card-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  Phone Setup
                </h2>
              </div>
              <div className="dash-card-body">
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
            </div>

            {/* Section 3: Templates */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h2 className="dash-card-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="11" y2="17"></line></svg>
                  WhatsApp Templates
                </h2>
                <button type="button" className="fetch-button" onClick={handleFetch} disabled={isFetching}>
                  {isFetching ? <span className="spinner"></span> : null}
                  {isFetching ? "Loading..." : "Sync Templates"}
                </button>
              </div>
              <div className="dash-card-body">
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
            </div>

            {/* Section 4: Abandoned Cart */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h2 className="dash-card-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                  Abandoned Cart Recovery
                </h2>
              </div>
              <div className="dash-card-body">
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
            </div>

            {/* Actions Form */}
            <div className="button-group">
              <Link to="/app" className="cancel-button">Cancel</Link>
              <button
                className="save-button"
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? <span className="spinner spinner-white"></span> : "Save Configurations"}
              </button>
            </div>
          </div>

          {/* Right Column (Widget / Help column) */}
          <div className="dashboard-column">
            {/* Quick Guide */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h2 className="dash-card-title">Editing Tips</h2>
              </div>
              <div className="dash-card-body" style={{ padding: '24px' }}>
                <div className="widget-item">
                  <div className="widget-dot-indicator"></div>
                  <div className="widget-text">
                    <h4>Sync Approved Templates</h4>
                    <p>Make sure to enter your API key and registered phone number, then click **Sync Templates** to load your WhatsApp Business approved templates dynamically.</p>
                  </div>
                </div>
                <div className="widget-item">
                  <div className="widget-dot-indicator"></div>
                  <div className="widget-text">
                    <h4>Admin Notification Recipient</h4>
                    <p>Provide a valid phone number (with country code) to receive administrative notifications regarding order triggers.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Unified Footer */}
      <footer className="dashboard-footer">
        <p>&copy; {new Date().getFullYear()} Flowbee.io. All rights reserved.</p>
        <div className="footer-links">
          <a href="https://flowbee.io" target="_blank" rel="noopener noreferrer">Website</a>
          <span>&bull;</span>
          <a href="mailto:support@flowbee.io">Support</a>
          <span>&bull;</span>
          <a href="https://flowbee.io/docs" target="_blank" rel="noopener noreferrer">Documentation</a>
        </div>
      </footer>
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
