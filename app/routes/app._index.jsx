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

        .metric-card:hover {
          box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.05);
          border-color: #f59e0b;
          transform: translateY(-2px);
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
          background: #ffffff;
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

        /* Automation Item Row */
        .automation-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-radius: 12px;
          border: 1px solid #fef3c7;
          background: #fafafa;
          margin-bottom: 14px;
          transition: all 0.2s;
        }

        .automation-item:last-child {
          margin-bottom: 0;
        }

        .automation-item:hover {
          border-color: #f59e0b;
          background: #fefdf0;
        }

        .automation-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .automation-icon-indicator {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .automation-icon-indicator.enabled {
          background: #ecfdf5;
          color: #059669;
        }

        .automation-icon-indicator.disabled {
          background: #f3f4f6;
          color: #6b7280;
        }

        .automation-name {
          font-size: 14px;
          font-weight: 600;
          color: #1c2434;
        }

        .automation-template-id {
          font-size: 12px;
          color: #6d7175;
          margin-top: 2px;
        }

        .automation-status-tag {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 9999px;
        }

        .automation-status-tag.enabled {
          background: #d1fae5;
          color: #065f46;
        }

        .automation-status-tag.disabled {
          background: #f3f4f6;
          color: #4b5563;
        }

        /* General Info Row */
        .info-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #fef3c7;
          padding: 14px 0;
        }

        .info-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .info-label {
          font-size: 13.5px;
          color: #4b5563;
          font-weight: 500;
        }

        .info-value {
          font-size: 13.5px;
          font-weight: 600;
          color: #1c2434;
        }

        /* Action bar */
        .locked-banner {
          background: #ffffff;
          border: 1px solid #fde68a;
          border-radius: 16px;
          padding: 16px 24px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.02);
          box-sizing: border-box;
          width: 100%;
        }

        .banner-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .banner-content strong {
          color: #78350f;
          font-size: 14.5px;
          font-weight: 700;
          display: block;
        }

        .banner-content p {
          color: #b45309;
          font-size: 13px;
          margin: 4px 0 0 0;
        }

        .update-link-btn {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #ffffff !important;
          text-decoration: none;
          padding: 10px 22px;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 700;
          transition: all 0.2s;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 10px rgba(245, 158, 11, 0.15);
        }

        .update-link-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(245, 158, 11, 0.22);
        }

        /* Side column widgets */
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

        /* Simulated logs list */
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

        .log-badge.failed {
          background: #fff0f0;
          color: #e03131;
        }

        .log-badge.pending {
          background: #fff9db;
          color: #e67700;
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

          .locked-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            padding: 16px;
          }

          .update-link-btn {
            width: 100%;
            justify-content: center;
            box-sizing: border-box;
          }

          .dashboard-footer {
            flex-direction: column;
            gap: 12px;
            align-items: center;
            text-align: center;
          }
        }
      `}</style>

      {/* Top Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <img src="https://app.flowbee.io/svg/brand-logos/logo-flowbee-secondary.svg" alt="Flowbee" className="logo-img" />
          <div className="header-title-group">
            <h1>Flowbee WhatsApp Notifications</h1>
            <p>Monitor connection status, order event automations, and recovery templates.</p>
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

      {/* Action banner */}
      <div className="locked-banner">
        <div className="banner-left">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <div className="banner-content">
            <strong>Configurations Overview</strong>
            <p>These are the settings currently live in your Shopify store database. Click Edit below to modify API credentials, numbers, or templates.</p>
          </div>
        </div>
        <Link to="/app/settings" className="update-link-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon></svg>
          Edit Configurations
        </Link>
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
      <div className="dashboard-content-layout">
        {/* Left Column (Automations & Recovery Info) */}
        <div className="dashboard-column">
          {/* Section: Shopify Order Events */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="11" y2="17"></line></svg>
                Shopify Order Automations
              </h2>
            </div>
            <div className="dash-card-body">
              {/* Order Created */}
              <div className="automation-item">
                <div className="automation-info">
                  <div className={`automation-icon-indicator ${activeTemplateOrderCreated ? "enabled" : "disabled"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                  </div>
                  <div>
                    <div className="automation-name">Order Created Notification (Admin)</div>
                    <div className="automation-template-id">
                      {activeTemplateOrderCreated ? `Template ID: ${activeTemplateOrderCreated}` : "No template configured"}
                    </div>
                  </div>
                </div>
                <span className={`automation-status-tag ${activeTemplateOrderCreated ? "enabled" : "disabled"}`}>
                  {activeTemplateOrderCreated ? "Active" : "Disabled"}
                </span>
              </div>

              {/* Order Paid */}
              <div className="automation-item">
                <div className="automation-info">
                  <div className={`automation-icon-indicator ${settings?.flowbeeTemplateOrderPaid ? "enabled" : "disabled"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  </div>
                  <div>
                    <div className="automation-name">Order Paid Notification (Admin)</div>
                    <div className="automation-template-id">
                      {settings?.flowbeeTemplateOrderPaid ? `Template ID: ${settings.flowbeeTemplateOrderPaid}` : "No template configured"}
                    </div>
                  </div>
                </div>
                <span className={`automation-status-tag ${settings?.flowbeeTemplateOrderPaid ? "enabled" : "disabled"}`}>
                  {settings?.flowbeeTemplateOrderPaid ? "Active" : "Disabled"}
                </span>
              </div>

              {/* Order Fulfilled */}
              <div className="automation-item">
                <div className="automation-info">
                  <div className={`automation-icon-indicator ${settings?.flowbeeTemplateOrderFulfilled ? "enabled" : "disabled"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                  </div>
                  <div>
                    <div className="automation-name">Order Fulfilled Notification (Admin)</div>
                    <div className="automation-template-id">
                      {settings?.flowbeeTemplateOrderFulfilled ? `Template ID: ${settings.flowbeeTemplateOrderFulfilled}` : "No template configured"}
                    </div>
                  </div>
                </div>
                <span className={`automation-status-tag ${settings?.flowbeeTemplateOrderFulfilled ? "enabled" : "disabled"}`}>
                  {settings?.flowbeeTemplateOrderFulfilled ? "Active" : "Disabled"}
                </span>
              </div>

              {/* Order Cancelled */}
              <div className="automation-item">
                <div className="automation-info">
                  <div className={`automation-icon-indicator ${settings?.flowbeeTemplateOrderCancelled ? "enabled" : "disabled"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                  </div>
                  <div>
                    <div className="automation-name">Order Cancelled Notification (Admin)</div>
                    <div className="automation-template-id">
                      {settings?.flowbeeTemplateOrderCancelled ? `Template ID: ${settings.flowbeeTemplateOrderCancelled}` : "No template configured"}
                    </div>
                  </div>
                </div>
                <span className={`automation-status-tag ${settings?.flowbeeTemplateOrderCancelled ? "enabled" : "disabled"}`}>
                  {settings?.flowbeeTemplateOrderCancelled ? "Active" : "Disabled"}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Abandoned Checkout Settings */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                Abandoned Cart Recovery Details
              </h2>
            </div>
            <div className="dash-card-body">
              <div className="info-row">
                <span className="info-label">Recovery Template ID</span>
                <span className="info-value">{settings?.flowbeeTemplateAbandonedCart || "Not configured"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Recovery Schedule</span>
                <span className="info-value">Send recovery message after {formatDelay(settings?.flowbeeAbandonedCartDelay)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Maximum Attempts</span>
                <span className="info-value">{settings?.flowbeeAbandonedCartCount || "1"} attempt{parseInt(settings?.flowbeeAbandonedCartCount || "1") > 1 ? "s" : ""}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Retry Interval</span>
                <span className="info-value">Every {formatDelay(settings?.flowbeeAbandonedCartInterval)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Widget / Help column) */}
        <div className="dashboard-column">
          {/* Quick Guide */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">Setup & Help Checklist</h2>
            </div>
            <div className="dash-card-body" style={{ padding: '24px' }}>
              <div className="widget-item">
                <div className="widget-dot-indicator"></div>
                <div className="widget-text">
                  <h4>Get Flowbee API Key</h4>
                  <p>Obtain your secret API key from the Flowbee API platform under Settings.</p>
                </div>
              </div>
              <div className="widget-item">
                <div className="widget-dot-indicator"></div>
                <div className="widget-text">
                  <h4>Register WhatsApp Number</h4>
                  <p>Specify the sender phone number associated with your WhatsApp business profile.</p>
                </div>
              </div>
              <div className="widget-item">
                <div className="widget-dot-indicator"></div>
                <div className="widget-text">
                  <h4>Select Approved Templates</h4>
                  <p>Choose WhatsApp-approved notification templates for order logs and recovering checkouts.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Real Activity Monitor */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">Activity Monitor</h2>
            </div>
            <div className="dash-card-body" style={{ padding: '24px' }}>
              <div className="logs-list">
                {activityLogs.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#6b7280", fontSize: "13px", padding: "10px 0" }}>
                    No activity events yet. Events will appear here once orders are placed or abandoned checkouts are detected.
                  </div>
                ) : (
                  activityLogs.map((log) => {
                    const badgeClass = log.status === "success" ? "success" : log.status === "failed" ? "failed" : log.status === "pending" ? "pending" : "info";
                    const badgeText = log.status === "success" ? "Success" : log.status === "failed" ? "Failed" : log.status === "pending" ? "Pending" : "Info";
                    
                    const date = log.createdAt?.toMillis 
                      ? new Date(log.createdAt.toMillis()) 
                      : (log.createdAt ? new Date(log.createdAt) : new Date());
                    
                    return (
                      <div className="log-item" key={log.id}>
                        <span className={`log-badge ${badgeClass}`}>{badgeText}</span>
                        <div className="log-info">
                          <div>{log.title}</div>
                          <span className="log-time">{log.detail} — {date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
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
