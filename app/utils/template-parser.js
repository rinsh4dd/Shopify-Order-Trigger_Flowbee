const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80";

/**
 * Normalises any synced or fallback WhatsApp template into a flat,
 * render-ready shape used by the preview drawer.
 *
 * Supports:
 *  - Standard Meta Business API `components[]` arrays
 *  - Flat key structures returned by some Flowbee API wrappers
 *
 * @param {object} template  Raw template object from API or fallback list
 * @returns {{ template_id, template_name, category, parameter_format,
 *             header, body, footer, buttons, samples } | null}
 */
export function parseTemplate(template) {
  if (!template) return null;

  let header = { type: "NONE", text: "", url: "" };
  let body = "";
  let footer = "";
  let buttons = [];
  let samples = [];

  if (Array.isArray(template.components)) {
    header = extractHeader(template.components);
    body = extractBody(template.components);
    samples = extractBodySamples(template.components);
    footer = extractFooter(template.components);
    buttons = extractButtons(template.components);
  } else {
    // Flat-structure fallback
    body =
      template.template_text ||
      template.template_body ||
      template.body ||
      template.text ||
      "";
    footer = template.footer || template.footer_text || "";
    if (Array.isArray(template.buttons)) {
      buttons = template.buttons.map((b) => ({
        type: b.type || "QUICK_REPLY",
        text: b.text || b.label || "",
      }));
    }
  }

  // Auto-generate sample placeholders when none are provided
  if (samples.length === 0) {
    const regex = /\{\{([^}]+)\}\}/g;
    let idx = 1;
    while (regex.exec(body) !== null) {
      samples.push(`Sample ${idx}`);
      idx++;
    }
  }

  return {
    template_id: template.template_id || template.id,
    template_name: template.template_name || template.name,
    category: template.category || "UTILITY",
    parameter_format: template.parameter_format || "Positional",
    header,
    body,
    footer,
    buttons,
    samples,
  };
}

/* ── Private helpers ─────────────────────────────────────────── */

function findComponent(components, type) {
  return components.find((c) => String(c.type).toUpperCase() === type);
}

function extractHeader(components) {
  const comp = findComponent(components, "HEADER");
  if (!comp) return { type: "NONE", text: "", url: "" };

  const format = String(comp.format).toUpperCase();
  if (format === "TEXT") return { type: "TEXT", text: comp.text || "" };
  if (format === "IMAGE") {
    return {
      type: "IMAGE",
      url: comp.example?.header_handle?.[0] || DEFAULT_IMAGE,
    };
  }
  if (format === "VIDEO") {
    return { type: "VIDEO", url: "https://www.w3schools.com/html/mov_bbb.mp4" };
  }
  return { type: "NONE", text: "", url: "" };
}

function extractBody(components) {
  return findComponent(components, "BODY")?.text || "";
}

function extractBodySamples(components) {
  return findComponent(components, "BODY")?.example?.body_text?.[0] || [];
}

function extractFooter(components) {
  return findComponent(components, "FOOTER")?.text || "";
}

function extractButtons(components) {
  const comp = findComponent(components, "BUTTONS");
  if (!comp || !Array.isArray(comp.buttons)) return [];
  return comp.buttons.map((b) => ({ type: b.type, text: b.text || "" }));
}

export function getTemplateDisplayName(templateId, templateList = []) {
  if (!templateId) return "";

  const matched = (templateList || []).find(
    (t) => String(t.template_id || t.id) === String(templateId)
  );
  if (matched) {
    return matched.template_name || matched.name || templateId;
  }

  return templateId;
}
