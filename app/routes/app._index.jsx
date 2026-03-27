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
    const phone = document.getElementsByName("flowbeeRegisteredPhone")[0]?.value;
    
    if (!apiKey || !phone) {
      shopify.toast.show("Enter API Key and Registered Phone");
      return;
    }
    
    const formData = new FormData();
    formData.append("intent", "fetchTemplates");
    formData.append("flowbeeApiKey", apiKey);
    formData.append("flowbeeRegisteredPhone", phone);
    fetcher.submit(formData, { method: "post" });
  };

  const submitSettings = (form) => {
    if (!form) return;
    const formData = new FormData();
    const fields = form.querySelectorAll("s-text-field, select");
    fields.forEach(field => {
      const name = field.getAttribute("name");
      const val = field.value || "";
      if (name) formData.append(name, val);
    });
    formData.append("intent", "save");
    fetcher.submit(formData, { method: "post" });
  };

  const handleSave = (event) => {
    event.preventDefault();
    submitSettings(event.currentTarget);
  };

  return (
    <div style={{ backgroundColor: "#FFD600", minHeight: "100vh", padding: "20px" }}>
      <style>{`
        .flowbee-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          padding: 32px;
          max-width: 600px;
          margin: 0 auto;
        }
        .flowbee-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .flowbee-header img {
          height: 32px;
        }
        .flowbee-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
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
        .api-key-toggle:hover {
          color: #1a1a1a;
        }
        s-text-field {
          width: 100%;
        }
        .save-button {
          background-color: #000;
          color: #fff;
          border-radius: 8px;
          padding: 12px 24px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          margin-top: 16px;
        }
        .save-button:hover {
          background-color: #333;
        }
        .save-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
      `}</style>

      <div className="flowbee-card">
        <div className="flowbee-header">
          <img src="https://app.flowbee.io/svg/brand-logos/logo-flowbee-secondary.svg" alt="Flowbee Logo" />
          <h2>Flowbee Settings</h2>
        </div>

        <s-section>
          <s-paragraph>
            Configure your Flowbee credentials to enable WhatsApp order alerts.
          </s-paragraph>
          
          <form
            ref={formRef}
            onSubmit={handleSave}
            key={settings?.updatedAt ? "updated" : "empty"}
          >
            <s-stack direction="block" gap="base">
              <s-stack direction="block" gap="base">
                <div className="api-key-container">
                  <s-text-field
                    label="Flowbee API Key"
                    name="flowbeeApiKey"
                    type={showApiKey ? "text" : "password"}
                    defaultValue={settings?.flowbeeApiKey || ""}
                    required
                  />
                  <button
                    type="button"
                    className="api-key-toggle"
                    onClick={() => setShowApiKey(!showApiKey)}
                    aria-label={showApiKey ? "Hide API Key" : "Show API Key"}
                  >
                    {showApiKey ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                
                <s-text-field
                  label="Company Name"
                  name="flowbeeCompany"
                  defaultValue={settings?.flowbeeCompany || ""}
                  required
                  helpText="Your Flowbee company identifier"
                />

                <s-text-field
                  label="Registered Phone Number"
                  name="flowbeeRegisteredPhone"
                  defaultValue={settings?.flowbeeRegisteredPhone || ""}
                  required
                />

                <s-divider />
                
                <s-text-field
                  label="Notification Phone Number (Admin)"
                  name="flowbeeNotifyPhone"
                  defaultValue={settings?.flowbeeNotifyPhone || ""}
                  required
                  helpText="Where alerts will be sent (e.g. 919876543210)"
                />

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
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #c9cccf',
                      background: 'white',
                      fontSize: '14px'
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
        </s-section>
      </div>
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
