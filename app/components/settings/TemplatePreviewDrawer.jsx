import {
  IconClose,
  IconArrowLeft,
  IconCheck,
  IconVideo,
} from "./Icons";
import { DeviceFrameset, DeviceOptions } from "react-device-frameset";
import "react-device-frameset/styles/marvel-devices.min.css";

// Inject iPhone 15 Pro metadata into the DeviceOptions dictionary to prevent library crashes
if (typeof DeviceOptions !== "undefined" && DeviceOptions && !DeviceOptions["iPhone 15 Pro"]) {
  DeviceOptions["iPhone 15 Pro"] = {
    device: "iphone-15-pro",
    colors: ["black"],
    hasLandscape: false,
    width: 302,
    height: 612
  };
}

/**
 * iPhone mockup using react-device-frameset with custom CSS overrides for iPhone 15 Pro.
 */
function CustomIPhone({ children }) {
  return (
    <div 
      className="relative mx-auto select-none flex items-start justify-center animate-fade-in" 
      style={{ 
        height: '80vh', 
        width: 'calc(80vh * 0.49346)',
        overflow: 'visible'
      }}
    >
      <div 
        className="relative origin-top"
        style={{ 
          transform: 'scale(calc(80vh / 612px))',
          width: '302px',
          height: '612px'
        }}
      >
        {/* Physical Hardware Side Buttons - Thin dark casing, low-profile punch out */}
        {/* Action Button (Left) */}
        <div className="absolute top-[90px] -left-[1px] w-[1.2px] h-[16px] bg-[#1a1a1a] rounded-l-[1px] border-l border-slate-700/40 shadow-sm z-10" />
        {/* Volume Up Button (Left) */}
        <div className="absolute top-[120px] -left-[1px] w-[1.2px] h-[30px] bg-[#1a1a1a] rounded-l-[1px] border-l border-slate-700/40 shadow-sm z-10" />
        {/* Volume Down Button (Left) */}
        <div className="absolute top-[160px] -left-[1px] w-[1.2px] h-[30px] bg-[#1a1a1a] rounded-l-[1px] border-l border-slate-700/40 shadow-sm z-10" />
        {/* Power Button (Right) */}
        <div className="absolute top-[115px] -right-[1px] w-[1.2px] h-[45px] bg-[#1a1a1a] rounded-r-[1px] border-r border-slate-700/40 shadow-sm z-10" />

        {/* CSS stylesheet override to style .marvel-device.iphone-15-pro */}
        <style>{`
          /* Hide unused default device markup elements to prevent rendering clashes */
          .marvel-device.iphone-15-pro .top-bar,
          .marvel-device.iphone-15-pro .sleep,
          .marvel-device.iphone-15-pro .bottom-bar,
          .marvel-device.iphone-15-pro .volume,
          .marvel-device.iphone-15-pro .camera,
          .marvel-device.iphone-15-pro .sensor,
          .marvel-device.iphone-15-pro .speaker,
          .marvel-device.iphone-15-pro .sensors,
          .marvel-device.iphone-15-pro .more-sensors,
          .marvel-device.iphone-15-pro .inner-shadow,
          .marvel-device.iphone-15-pro .inner {
            display: none !important;
          }
          
          .marvel-device.iphone-15-pro {
            position: relative !important;
            width: 302px !important;
            height: 612px !important;
            background: #000 !important;
            border-radius: 46px !important;
            border: 2.8px solid #1c1c1e !important;
            outline: 1.2px solid #cbd5e1 !important;
            padding: 4px !important;
            box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.45) !important;
            box-sizing: border-box !important;
          }
          
          .marvel-device.iphone-15-pro .screen {
            width: 100% !important;
            height: 100% !important;
            border-radius: 39px !important;
            overflow: hidden !important;
            background: #fff !important;
            position: relative !important;
            display: flex !important;
            flex-direction: column !important;
          }
        `}</style>

        <DeviceFrameset device="iPhone 15 Pro" color="black">
          {/* Dynamic Island inside the screen display */}
          <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-[84px] h-[21px] bg-black rounded-full z-50 flex items-center justify-end px-3.5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)] pointer-events-none">
            {/* Subtle Camera Lens Reflection Dot (Dark Indigo/Blue) */}
            <div className="w-[5.5px] h-[5.5px] rounded-full bg-[#08081a] border border-[#1a1a2e] shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.25)] opacity-90" />
          </div>

          {children}
        </DeviceFrameset>
      </div>
    </div>
  );
}

/**
 * Slide-over drawer that renders a WhatsApp template preview
 * inside a custom CSS iPhone mockup matching the user's layout.
 */
export function TemplatePreviewDrawer({ template, triggerType, onClose }) {
  if (!template) return null;

  return (
    <div className="fixed inset-0 z-[999] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/15 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-[440px] max-w-full h-full bg-white shadow-xl flex flex-col z-10 animate-slide-in-right overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-[13px] font-medium text-slate-700 m-0">
              Template Preview
            </h3>
            <p className="text-[10.5px] text-slate-400 m-0 mt-0.5 font-normal">
              {triggerType} · {template.template_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 border-none bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg cursor-pointer flex items-center justify-center transition-all"
          >
            <IconClose />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto scrollbar-none bg-slate-50/50">
          <div className="flex flex-col items-center gap-5 p-5 pb-8">
            {/* iPhone mockup */}
            <div className="shrink-0 w-full flex justify-center py-2">
              <CustomIPhone>
                <WhatsAppScreen template={template} onClose={onClose} />
              </CustomIPhone>
            </div>

            {/* Template metadata */}
            <TemplateMetadata template={template} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function WhatsAppScreen({ template, onClose }) {
  const bodyText = replaceVariables(template.body, template.samples);

  return (
    <div 
      className="w-full h-full relative flex flex-col text-left bg-white"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}
    >
      {/* iPhone Status Bar */}
      <div className="h-[38px] px-6 pt-1 flex justify-between items-center bg-white text-black z-45 shrink-0 select-none relative border-b border-slate-100/50">
        {/* Time - Medium weight rounded system font */}
        <span className="text-[11.5px] font-semibold text-slate-900 tracking-tight">10:52</span>
        {/* Space holder for Dynamic Island */}
        <div className="w-[80px] h-[20px]" />
        {/* Status Icons */}
        <div className="flex items-center gap-1.5 text-slate-900">
          {/* Signal Bars - Pill-shaped rounded bars exactly matching the range reference image */}
          <div className="flex items-end gap-[1.5px] h-[11.5px] shrink-0 mb-[0.5px]">
            <div className="w-[3px] h-[4.5px] bg-slate-900 rounded-full" />
            <div className="w-[3px] h-[6.8px] bg-slate-900 rounded-full" />
            <div className="w-[3px] h-[9.1px] bg-slate-900 rounded-full" />
            <div className="w-[3px] h-[11.5px] bg-slate-900 rounded-full" />
          </div>
          {/* Wifi Icon (iOS fan arches) - Exact solid iOS WiFi icon matching the reference image */}
          <svg className="w-[15px] h-[11.5px] shrink-0 text-slate-900" viewBox="0 0 16 12" fill="none" stroke="currentColor">
            {/* Center Dot */}
            <circle cx="8" cy="10" r="1.1" fill="currentColor" stroke="none" />
            {/* Arches */}
            <path d="M 5.88 8.38 A 3 3 0 0 1 10.12 8.38" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M 3.62 6.12 A 6.2 6.2 0 0 1 12.38 6.12" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M 1.35 3.85 A 9.4 9.4 0 0 1 14.65 3.85" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          {/* Battery Pill - Exact outline and inner solid fill matching the user's battery image */}
          <div className="w-[22px] h-[11.5px] border-[1.3px] border-slate-900 rounded-[3.5px] p-[1.2px] flex items-center relative shrink-0 ml-[1.5px]">
            {/* Inner solid fill bar indicating high/full charge */}
            <div className="h-full w-full bg-slate-900 rounded-[1.8px]" />
            {/* Battery tip/knob */}
            <div className="absolute -right-[2.5px] top-[3.75px] w-[1.2px] h-[4px] bg-slate-900 rounded-r-[1px]" />
          </div>
        </div>
      </div>

      {/* WhatsApp Top Profile Bar */}
      <div className="bg-white border-b border-slate-100 text-slate-800 px-3.5 py-2 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="text-[#007aff] hover:text-[#0051a8] border-none bg-transparent p-0 cursor-pointer flex items-center shrink-0 transition-colors"
          >
            <IconArrowLeft size={16} />
          </button>
          {/* Flowbee Custom Logo Avatar */}
          <div className="w-8 h-8 rounded-full shrink-0 border border-slate-100 shadow-sm relative overflow-hidden bg-[#fbc02d]">
            <img src="/flowbee-logo.jpg" alt="Flowbee.io" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-slate-800 text-[11.5px] leading-tight flex items-center gap-1.5">
              Flowbee.io
              {/* Meta Verified Badge (Vibrant Gradient-filled Rounded 10-Point Starburst with White Check) */}
              <svg className="w-[14px] h-[14px] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <defs>
                  <linearGradient id="metaVerifiedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#58b9ff" />
                    <stop offset="100%" stopColor="#0062ff" />
                  </linearGradient>
                </defs>
                <path d={getMetaVerifiedPath()} fill="url(#metaVerifiedGrad)" />
                <path 
                  d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" 
                  fill="white" 
                  transform="translate(5.4, 5.4) scale(0.55)"
                />
              </svg>
            </span>
          </div>
        </div>
        
        {/* Video / Phone Blue Icons */}
        <div className="flex items-center gap-3.5 text-[#007aff]">
          <button type="button" className="bg-transparent border-none p-0.5 cursor-pointer text-[#007aff] hover:opacity-75 transition-opacity flex items-center justify-center">
            <svg className="w-[19px] h-[19px]" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </button>
          <button type="button" className="bg-transparent border-none p-0.5 cursor-pointer text-[#007aff] hover:opacity-75 transition-opacity flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Screen Messages Canvas with Doodle Wallpaper */}
      <div 
        className="flex-1 flex flex-col justify-between overflow-hidden relative"
        style={{
          backgroundColor: "#efeae2",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%23e5ddd5' fill-opacity='0.4'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z'/%3E%3C/g%3E%3C/svg%3E")`
        }}
      >
        <div className="flex-1 flex flex-col justify-start p-3 pt-4 overflow-y-auto scrollbar-none">
          {/* Message bubble card - No border, standard WhatsApp shadow and radius */}
          <div className="bg-white rounded-[12px] rounded-tl-none shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] w-[92%] mx-auto p-4 text-[11.5px] leading-[1.65] relative flex flex-col gap-1.5 self-center animate-fade-in border-none">
            <MessageHeader header={template.header} />
            <div className="text-slate-800 whitespace-pre-line font-normal" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
              {bodyText}
            </div>
            {template.footer && (
              <div className="text-[9.5px] text-slate-400 font-normal mt-0.5 border-t border-slate-100/50 pt-1.5">
                {template.footer}
              </div>
            )}
            <span className="text-[8px] text-slate-400 self-end mt-1 font-normal">
              10:52
            </span>
          </div>

          {/* Action buttons */}
          {template.buttons?.map((btn, i) => (
            <div key={i} className="w-[92%] mx-auto mt-2">
              <div className="bg-white text-[#007aff] font-medium text-[10.5px] py-2 px-3 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-center border-none flex items-center justify-center gap-1.5 transition-all hover:bg-slate-50">
                {btn.text}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Message Input Bar - Includes centered iOS Home Indicator */}
        <div className="bg-[#f6f6f6] border-t border-slate-200/50 px-3.5 pt-2.5 pb-3 flex flex-col items-center gap-2 shrink-0 z-10">
          <div className="flex items-center gap-3 w-full">
            {/* Blue Plus */}
            <button type="button" className="bg-transparent border-none p-0.5 cursor-pointer text-[#007aff] hover:opacity-75 transition-opacity shrink-0 flex items-center justify-center">
              <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            {/* Text Input Pill */}
            <div className="flex-1 bg-white border border-slate-200 rounded-full px-3.5 h-[28px] flex items-center justify-between text-slate-300">
              <span className="text-slate-400 text-[10.5px]"></span>
              {/* Document icon inside input */}
              <svg className="w-3.5 h-3.5 text-[#007aff]" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>

            {/* Camera Icon */}
            <button type="button" className="bg-transparent border-none p-0.5 cursor-pointer text-[#007aff] hover:opacity-75 transition-opacity shrink-0 flex items-center justify-center">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>

            {/* Microphone Icon */}
            <button type="button" className="bg-transparent border-none p-0.5 cursor-pointer text-[#007aff] hover:opacity-75 transition-opacity shrink-0 flex items-center justify-center">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
              </svg>
            </button>
          </div>
          {/* iOS Home Indicator */}
          <div className="w-[100px] h-[3.5px] bg-[#1a1a1a] rounded-full mt-1 opacity-60" />
        </div>
      </div>
    </div>
  );
}

function MessageHeader({ header }) {
  if (!header || header.type === "NONE") return null;

  if (header.type === "TEXT") {
    return (
      <div className="font-semibold text-slate-900 border-b border-slate-100/50 pb-1 text-[11.5px] mb-1">
        {header.text}
      </div>
    );
  }

  if (header.type === "IMAGE") {
    return (
      <div className="rounded-lg overflow-hidden border-none mb-1 max-h-[120px] bg-slate-50">
        <img src={header.url} alt="Header" className="w-full h-full object-cover" />
      </div>
    );
  }

  if (header.type === "VIDEO") {
    return (
      <div className="rounded-lg overflow-hidden border-none mb-1 bg-slate-900 flex items-center justify-center h-[90px]">
        <IconVideo />
        <span className="text-white text-[9.5px] font-normal">Video</span>
      </div>
    );
  }

  return null;
}

function TemplateMetadata({ template }) {
  const rows = [
    { label: "Template ID", value: template.template_id },
    { label: "Category", value: template.category },
    { label: "Format", value: template.parameter_format },
  ];

  return (
    <div className="w-full text-left text-[11px] bg-white border border-slate-100 rounded-xl p-4 space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between items-baseline">
          <span className="text-slate-400 font-normal">{row.label}</span>
          <span className="text-slate-600 font-medium text-right break-all max-w-[60%]">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────── */

function replaceVariables(body = "", samples = []) {
  let text = body;
  samples.forEach((sample, i) => {
    text = text.replace(`{{${i + 1}}}`, `*${sample}*`);
  });
  return text;
}

function getMetaVerifiedPath() {
  const points = [];
  const R = 12; // Outer radius
  const r = 9.0; // Inner radius
  for (let i = 0; i < 20; i++) {
    const angle = (i * Math.PI) / 10 - Math.PI / 2;
    const radius = i % 2 === 0 ? R : r;
    const x = 12 + radius * Math.cos(angle);
    const y = 12 + radius * Math.sin(angle);
    points.push({ x, y });
  }
  const startMidX = (points[19].x + points[0].x) / 2;
  const startMidY = (points[19].y + points[0].y) / 2;
  let d = `M ${startMidX.toFixed(2)} ${startMidY.toFixed(2)}`;
  for (let i = 0; i < 20; i++) {
    const next = points[(i + 1) % 20];
    const curr = points[i];
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;
    d += ` Q ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}, ${midX.toFixed(2)} ${midY.toFixed(2)}`;
  }
  d += ' Z';
  return d;
}
