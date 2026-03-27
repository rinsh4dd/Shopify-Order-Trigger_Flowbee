import { useEffect, useRef, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
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
  return { settings };
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
      return { success: true, settings: data, intent: "save" };
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

export default function Index() {
  const { settings: initialSettings } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  
  const [templateList, setTemplateList] = useState([]);
  const [showApiKey, setShowApiKey] = useState(false);
  const formRef = useRef(null);
  const settings = fetcher.data?.settings || initialSettings;

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        if (fetcher.data.intent === "save") {
          shopify.toast.show("Saved to Firebase!");
        } else if (fetcher.data.intent === "fetchTemplates") {
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

    // Combine phones
    const registeredPhone = (data["flowbeeRegisteredPhone_country"] || "") + (data["flowbeeRegisteredPhone_number"] || "");
    const notifyPhone = (data["flowbeeNotifyPhone_country"] || "") + (data["flowbeeNotifyPhone_number"] || "");

    formData.append("intent", "save");
    formData.append("flowbeeApiKey", data["flowbeeApiKey"] || "");
    formData.append("flowbeeCompany", data["flowbeeCompany"] || "");
    formData.append("flowbeeRegisteredPhone", registeredPhone);
    formData.append("flowbeeNotifyPhone", notifyPhone);
    formData.append("flowbeeTemplateId", data["flowbeeTemplateId"] || "");

    fetcher.submit(formData, { method: "post" });
  };

  const handleSave = (event) => {
    event.preventDefault();
    submitSettings(event.currentTarget);
  };

  const regPhone = splitPhone(settings?.flowbeeRegisteredPhone);
  const notifyPhone = splitPhone(settings?.flowbeeNotifyPhone);

  return (
    <div style={{ 
      backgroundColor: "#FFD600", 
      backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.03) 0, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 20px)",
      minHeight: "100vh", 
      padding: "40px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <style>{`
        .flowbee-card {
          background: white;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
          padding: 40px;
          max-width: 500px;
          width: 100%;
          border: 1px solid rgba(0,0,0,0.05);
        }
        .flowbee-header {
          display: flex;
          justify-content: center;
          margin-bottom: 32px;
        }
        .flowbee-header img {
          height: 48px;
        }
        .api-key-container {
          position: relative;
          display: flex;
          align-items: center;
        }
        .api-key-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #6d7175;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          z-index: 10;
        }
        .phone-group {
          display: flex;
          gap: 8px;
          align-items: flex-end;
          width: 100%;
        }
        .country-select {
          width: 100px;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #c9cccf;
          background: #f6f6f7;
          font-size: 14px;
          height: 38px;
        }
        .modern-input {
          width: 100%;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #c9cccf;
          font-size: 14px;
          outline: none;
        }
        .modern-input:focus {
          border-color: #000;
        }
        .save-button {
          background-color: #000;
          color: #fff;
          border-radius: 12px;
          padding: 16px 24px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: transform 0.2s, background-color 0.2s;
          width: 100%;
          margin-top: 24px;
          font-size: 16px;
        }
        .save-button:hover {
          background-color: #222;
          transform: translateY(-1px);
        }
        .save-button:active {
          transform: translateY(0);
        }
        .save-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        .field-label {
           font-size: 13px;
           font-weight: 600;
           color: #4a4a4a;
           margin-bottom: 6px;
           display: block;
        }
      `}</style>

      <div className="flowbee-card">
        <div className="flowbee-header">
          <img src="https://app.flowbee.io/svg/brand-logos/logo-flowbee-secondary.svg" alt="Flowbee Logo" />
        </div>

        <form
          ref={formRef}
          onSubmit={handleSave}
          key={settings?.updatedAt ? "updated" : "empty"}
        >
          <s-stack direction="block" gap="loose">
            <s-stack direction="block" gap="base">
              <div>
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>
              
              <s-text-field
                label="Company Name"
                name="flowbeeCompany"
                defaultValue={settings?.flowbeeCompany || ""}
                required
              />

              <div>
                <span className="field-label">Registered Phone Number</span>
                <div className="phone-group">
                  <select name="flowbeeRegisteredPhone_country" className="country-select" defaultValue={regPhone.country}>
                    {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                  <input
                    className="modern-input"
                    name="flowbeeRegisteredPhone_number"
                    defaultValue={regPhone.number}
                    placeholder="Phone number"
                    required
                  />
                </div>
              </div>

              <s-divider />
              
              <div>
                <span className="field-label">Notification Phone Number (Admin)</span>
                <div className="phone-group">
                  <select name="flowbeeNotifyPhone_country" className="country-select" defaultValue={notifyPhone.country}>
                    {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
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

              <s-stack direction="block" gap="small">
                <s-stack direction="inline" align="center" justify="space-between">
                  <s-text variant="headingSm">WhatsApp Template</s-text>
                  <s-button onClick={handleFetch} disabled={fetcher.state !== "idle"}>
                     Fetch Templates
                  </s-button>
                </s-stack>

                <select 
                  name="flowbeeTemplateId" 
                  defaultValue={settings?.flowbeeTemplateId || ""} 
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #c9cccf',
                    background: 'white',
                    fontSize: '14px',
                    height: '40px'
                  }}
                >
                  <option value="">-- Select Template --</option>
                  {templateList.map((t) => (
                    <option key={t.template_id || t.id} value={t.template_id || t.id}>
                      {t.template_name || t.name} ({t.template_id || t.id})
                    </option>
                  ))}
                  {settings?.flowbeeTemplateId && !templateList.some(t => (t.template_id || t.id) === settings.flowbeeTemplateId) && (
                    <option value={settings.flowbeeTemplateId}>
                      Saved: {settings.flowbeeTemplateId}
                    </option>
                  )}
                </select>
              </s-stack>
            </s-stack>
            
            <button
              className="save-button"
              type="button"
              onClick={() => submitSettings(formRef.current)}
              disabled={fetcher.state !== "idle"}
            >
              {fetcher.state !== "idle" ? "Saving..." : "Save Settings to Firebase"}
            </button>
          </s-stack>
        </form>
      </div>
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
