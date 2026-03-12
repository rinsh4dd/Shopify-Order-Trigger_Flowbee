import { useEffect, useRef, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getFlowbeeSettings, saveFlowbeeSettings } from "../firebase.server";
import { getAllFlowbeeTemplates } from "../flowbee.server";

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
      const templates = await getAllFlowbeeTemplates(apiKey, phone);
      return { success: true, templates, intent: "fetchTemplates" };
    } catch (error) {
      return { success: false, error: error.message, intent: "fetchTemplates" };
    }
  }

  if (intent === "save") {
    const data = {
      shop: session.shop,
      flowbeeApiKey: formData.get("flowbeeApiKey") || "",
      flowbeeCompany: formData.get("flowbeeCompany") || "",
      flowbeeRegisteredPhone: formData.get("flowbeeRegisteredPhone") || "",
      flowbeeNotifyPhone: formData.get("flowbeeNotifyPhone") || "",
      flowbeeTemplateId: formData.get("flowbeeTemplateId") || "",
    };

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
    <s-page heading="WhatsApp Alerts (Firebase)">
      <s-section heading="Flowbee Credentials">
        <s-paragraph>
          Your settings are now securely stored on **Firebase Firestore**.
        </s-paragraph>
        
        <form
          ref={formRef}
          onSubmit={handleSave}
          key={settings?.updatedAt ? "updated" : "empty"}
        >
          <s-stack direction="block" gap="base">
            <s-box padding="base" borderWidth="base" borderRadius="base">
              <s-stack direction="block" gap="base">
                <s-text-field
                  label="Flowbee API Key"
                  name="flowbeeApiKey"
                  type="password"
                  defaultValue={settings?.flowbeeApiKey || ""}
                  required
                />
                
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
            </s-box>
            
            <s-button
              variant="primary"
              type="button"
              onClick={() => submitSettings(formRef.current)}
              disabled={fetcher.state !== "idle"}
              {...(fetcher.state !== "idle" ? { loading: true } : {})}
            >
              Save Settings to Firebase
            </s-button>
          </s-stack>
        </form>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
