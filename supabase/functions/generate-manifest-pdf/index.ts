import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { error: authError } = await supabaseAuth.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (authError) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { shipmentId } = await req.json();
    if (!shipmentId) throw new Error("shipmentId required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const orgFields = `name, name_en, address, address_details, city, region, phone, secondary_phone, email, business_email, commercial_register, tax_card, license_number, environmental_license, environmental_approval_number, wmra_license, wmra_license_issue_date, wmra_license_expiry_date, eeaa_license_issue_date, eeaa_license_expiry_date, ida_license, ida_license_issue_date, ida_license_expiry_date, land_transport_license, land_transport_license_issue_date, land_transport_license_expiry_date, industrial_registry, establishment_registration, organization_type, partner_code, client_code, representative_name, representative_phone, representative_email, representative_position, representative_national_id, agent_name, agent_phone, agent_email, agent_national_id, delegate_name, delegate_phone, delegate_email, delegate_national_id, activity_type, field_of_work, hazardous_certified, headquarters, logo_url, digital_declaration_number, certifications_approvals, stamp_url, signature_url`;
    const { data: shipment, error } = await supabase
      .from("shipments")
      .select(`*, generator:organizations!shipments_generator_id_fkey(${orgFields}), transporter:organizations!shipments_transporter_id_fkey(${orgFields}), recycler:organizations!shipments_recycler_id_fkey(${orgFields})`)
      .eq("id", shipmentId)
      .single();

    if (error || !shipment) throw new Error(`Shipment not found: ${error?.message || 'no data'}`);

    const { data: custodyChain } = await supabase
      .from("custody_chain_events")
      .select("*, actor_organization:organizations!custody_chain_events_actor_organization_id_fkey(name)")
      .eq("shipment_id", shipmentId)
      .order("created_at", { ascending: true });

    const { data: signatures } = await supabase
      .from("document_signatures")
      .select("*, signer:profiles!document_signatures_signer_id_fkey(full_name), signer_organization:organizations!document_signatures_organization_id_fkey(name)")
      .eq("document_id", shipmentId)
      .order("signed_at", { ascending: true });

    const html = generateManifestHTML(shipment, custodyChain || [], signatures || []);

    return new Response(
      JSON.stringify({ success: true, html, shipmentNumber: shipment.shipment_number }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Manifest generation error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function generateQRSvg(data: string, size = 60): string {
  const encodedData = encodeURIComponent(data);
  return `<img src="https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&format=svg" width="${size}" height="${size}" style="display:block;margin:0 auto;" alt="QR Code" crossorigin="anonymous" />`;
}

function generateBarcodeSvg(text: string, width = 180, height = 30): string {
  const chars = text.replace(/[^A-Z0-9-]/gi, '');
  let bars = '';
  let x = 0;
  const barWidth = width / (chars.length * 11 + 20);
  for (let i = 0; i < chars.length; i++) {
    const code = chars.charCodeAt(i);
    const pattern = [(code >> 6) & 1, (code >> 5) & 1, (code >> 4) & 1, (code >> 3) & 1, (code >> 2) & 1, (code >> 1) & 1, code & 1, 1, 0, 1, 0];
    for (const bit of pattern) {
      if (bit) bars += `<rect x="${x}" y="0" width="${barWidth}" height="${height}" fill="#000"/>`;
      x += barWidth;
    }
  }
  return `<svg width="${width}" height="${height + 12}" viewBox="0 0 ${width} ${height + 12}" xmlns="http://www.w3.org/2000/svg">${bars}<text x="${width/2}" y="${height + 10}" text-anchor="middle" font-family="monospace" font-size="7" fill="#333">${text}</text></svg>`;
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

function getLicenseStatusHTML(expiryDate: string | null | undefined): string {
  if (!expiryDate) return '<span style="color:#9ca3af;font-size:5.5px">⚪ غير محدد</span>';
  const now = new Date();
  const expiry = new Date(expiryDate);
  const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return `<span style="color:#dc2626;font-size:5.5px;font-weight:bold">🔴 منتهي (${new Date(expiryDate).toLocaleDateString("ar-EG")})</span>`;
  if (days <= 30) return `<span style="color:#d97706;font-size:5.5px;font-weight:bold">🟡 ينتهي خلال ${days} يوم</span>`;
  return `<span style="color:#16a34a;font-size:5.5px">🟢 ساري حتى ${new Date(expiryDate).toLocaleDateString("ar-EG")}</span>`;
}

function renderLicensesBlock(org: any): string {
  if (!org) return '';
  const isTransporter = org.organization_type === 'transporter';
  const isRecyclerOrDisposal = org.organization_type === 'recycler' || org.organization_type === 'disposal';
  let html = `<div style="border-top:1px dashed #d1d5db;margin-top:2px;padding-top:2px;">`;
  html += `<p style="font-size:5.5px;font-weight:bold;color:#15803d;margin-bottom:1px;">📋 التراخيص:</p>`;
  if (org.wmra_license) html += `<p><span class="lbl">WMRA:</span> ${org.wmra_license} ${getLicenseStatusHTML(org.wmra_license_expiry_date)}</p>`;
  if (org.environmental_license) html += `<p><span class="lbl">EEAA:</span> ${org.environmental_license} ${getLicenseStatusHTML(org.eeaa_license_expiry_date)}</p>`;
  if (isRecyclerOrDisposal && org.ida_license) html += `<p><span class="lbl">IDA:</span> ${org.ida_license} ${getLicenseStatusHTML(org.ida_license_expiry_date)}</p>`;
  if (isTransporter && org.land_transport_license) html += `<p><span class="lbl">نقل بري:</span> ${org.land_transport_license} ${getLicenseStatusHTML(org.land_transport_license_expiry_date)}</p>`;
  if (org.digital_declaration_number) html += `<p><span class="lbl">إقرار رقمي:</span> ${org.digital_declaration_number}</p>`;
  html += `</div>`;
  return html;
}

// ═══════════════════════════════════════════════════════════════
// SECURE DIGITAL SEAL SYSTEM — ported from secureDigitalSeal.ts
// ═══════════════════════════════════════════════════════════════

function secureSealHash(data: string, salt: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0xcbf29ce4;
  const combined = `${salt}::${data}::iRecycle::2024`;
  for (let i = 0; i < combined.length; i++) {
    const c = combined.charCodeAt(i);
    h1 ^= c; h1 = Math.imul(h1, 0x01000193);
    h2 ^= c; h2 = Math.imul(h2, 0x01000193);
    h1 ^= h2 >>> 13; h2 ^= h1 >>> 7;
  }
  return `${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`.toUpperCase();
}

function generateSealNumber(entityId: string, entityType: string, name: string): string {
  const hash = secureSealHash(`${entityId}|${name}`, entityType);
  const prefix = entityType === 'member' ? 'MS' : 'OS';
  return `${prefix}-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`;
}

function generateDocumentSealProof(sealNumber: string, documentRef: string, timestamp: string): string {
  return secureSealHash(`${sealNumber}|${documentRef}|${timestamp}`, 'doc-proof').slice(0, 12);
}

function hashToColor(hash: string, offset = 0): string {
  const h = parseInt(hash.slice(offset, offset + 3), 16) % 360;
  const s = 55 + (parseInt(hash.slice(offset + 3, offset + 5), 16) % 30);
  const l = 30 + (parseInt(hash.slice(offset + 5, offset + 7), 16) % 20);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function generateGuillochePath(hash: string, radius: number, complexity: number): string {
  const points: string[] = [];
  const steps = 360;
  const a1 = 2 + (parseInt(hash.slice(0, 2), 16) % 6);
  const a2 = 3 + (parseInt(hash.slice(2, 4), 16) % 8);
  const depth = 2 + (parseInt(hash.slice(4, 6), 16) % 4) * complexity;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const r = radius + Math.sin(angle * a1) * depth + Math.cos(angle * a2) * (depth * 0.6) + Math.sin(angle * (a1 + a2)) * (depth * 0.3);
    const x = 100 + r * Math.cos(angle);
    const y = 100 + r * Math.sin(angle);
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  points.push('Z');
  return points.join(' ');
}

function generateSecurityDots(hash: string, radius: number): string {
  let dots = '';
  const count = 24 + (parseInt(hash.slice(6, 8), 16) % 16);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = radius + (parseInt(hash.charAt(i % hash.length), 16) % 3) - 1;
    const x = 100 + r * Math.cos(angle);
    const y = 100 + r * Math.sin(angle);
    const size = 0.3 + (parseInt(hash.charAt((i + 5) % hash.length), 16) % 3) * 0.2;
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${size}" fill="currentColor" opacity="0.4"/>`;
  }
  return dots;
}

function generateDigitalSealSVG(entityId: string, entityType: string, entityName: string, documentRef: string, size = 80): string {
  const sealNumber = generateSealNumber(entityId, entityType, entityName);
  const hash = secureSealHash(`${entityId}|${entityName}|${entityType}`, 'visual-seed');
  const primaryColor = hashToColor(hash, 0);
  const accentColor = hashToColor(hash, 6);
  const guillocheOuter = generateGuillochePath(hash, 85, 0.8);
  const guillocheInner = generateGuillochePath(hash.split('').reverse().join(''), 55, 0.5);
  const securityDots = generateSecurityDots(hash, 70);
  const microText = `iRecycle • ${hash.slice(0, 4)} • مُوثّق • ${hash.slice(4, 8)} • رقمي • ${hash.slice(8, 12)} • مؤمّن •`;
  const typeLabel = entityType === 'member' ? 'عضو معتمد' : 'جهة معتمدة';
  const displayName = entityName.length > 20 ? entityName.slice(0, 18) + '…' : entityName;
  const timestamp = new Date().toISOString();
  const docProof = generateDocumentSealProof(sealNumber, documentRef, timestamp);
  const uid = hash.slice(0, 4);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}" style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.15));">
  <defs>
    <linearGradient id="sg_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:0.9"/>
      <stop offset="50%" style="stop-color:${accentColor};stop-opacity:0.7"/>
      <stop offset="100%" style="stop-color:${primaryColor};stop-opacity:0.9"/>
    </linearGradient>
    <pattern id="sp_${uid}" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="0.5" fill="${primaryColor}" opacity="0.1"/>
    </pattern>
    <path id="tp_o_${uid}" d="M 100,100 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0" fill="none"/>
    <path id="tp_i_${uid}" d="M 100,100 m -62,0 a 62,62 0 1,1 124,0 a 62,62 0 1,1 -124,0" fill="none"/>
    <path id="tp_n_${uid}" d="M 100,100 m -42,0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0" fill="none"/>
  </defs>
  <circle cx="100" cy="100" r="96" fill="white" stroke="${primaryColor}" stroke-width="2"/>
  <circle cx="100" cy="100" r="94" fill="url(#sp_${uid})"/>
  <path d="${guillocheOuter}" fill="none" stroke="url(#sg_${uid})" stroke-width="1.2" opacity="0.6"/>
  <path d="${guillocheInner}" fill="none" stroke="${accentColor}" stroke-width="0.8" opacity="0.4"/>
  <g style="color:${primaryColor}">${securityDots}</g>
  <circle cx="100" cy="100" r="88" fill="none" stroke="${primaryColor}" stroke-width="1.5" opacity="0.3"/>
  <circle cx="100" cy="100" r="86" fill="none" stroke="${primaryColor}" stroke-width="0.5" stroke-dasharray="2,3" opacity="0.4"/>
  <circle cx="100" cy="100" r="50" fill="none" stroke="${primaryColor}" stroke-width="1" opacity="0.3"/>
  <text font-size="3.5" fill="${primaryColor}" opacity="0.5" font-family="monospace" direction="rtl">
    <textPath href="#tp_o_${uid}" startOffset="0%">${microText} ${microText}</textPath>
  </text>
  <text font-size="4.5" fill="${primaryColor}" opacity="0.6" font-family="monospace" font-weight="bold">
    <textPath href="#tp_i_${uid}" startOffset="0%">● ${sealNumber} ● ${hash.slice(0,8)} ● ${typeLabel} ●</textPath>
  </text>
  <g transform="translate(88, 68)">
    <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6L12 2z" fill="${primaryColor}" opacity="0.15" stroke="${primaryColor}" stroke-width="1"/>
    <path d="M10 12l2 2 4-4" fill="none" stroke="${primaryColor}" stroke-width="1.5" stroke-linecap="round"/>
  </g>
  <text font-size="6" fill="${primaryColor}" font-weight="bold" font-family="'Cairo','Segoe UI',sans-serif" text-anchor="middle" direction="rtl">
    <textPath href="#tp_n_${uid}" startOffset="75%">${displayName}</textPath>
  </text>
  <text x="100" y="108" text-anchor="middle" font-size="5" font-family="monospace" font-weight="bold" fill="${primaryColor}" opacity="0.9">${sealNumber}</text>
  <text x="100" y="116" text-anchor="middle" font-size="4.5" font-family="'Cairo',sans-serif" fill="${accentColor}" font-weight="600">${typeLabel}</text>
  <text x="100" y="130" text-anchor="middle" font-size="3" font-family="monospace" fill="#9ca3af">DOC: ${docProof}</text>
  <text x="100" y="142" text-anchor="middle" font-size="3.5" font-family="sans-serif" fill="${primaryColor}" opacity="0.5" font-weight="bold">iRecycle Platform</text>
  <circle cx="100" cy="100" r="97" fill="none" stroke="${primaryColor}" stroke-width="0.5" stroke-dasharray="4,2,1,2" opacity="0.4"/>
</svg>`;
}

function generatePartySealBlock(org: any, orgId: string, label: string, documentRef: string): string {
  if (!org || !orgId) return '';
  const sealSVG = generateDigitalSealSVG(orgId, 'organization', org.name || label, documentRef, 65);
  const sealNum = generateSealNumber(orgId, 'organization', org.name || label);
  const docProof = generateDocumentSealProof(sealNum, documentRef, new Date().toISOString());
  return `<div style="text-align:center;flex:1;">
    ${sealSVG}
    <div style="font-size:4.5px;color:#6b7280;margin-top:1px;font-family:monospace;">
      <div style="font-weight:bold;color:#059669;font-size:5px;">${sealNum}</div>
      <div>DOC:${docProof}</div>
    </div>
    <div style="font-size:5px;color:#374151;margin-top:1px;">${label}: ${org.name || '—'}</div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// SECURITY LAYERS — ported from ShipmentA4Document & printSecurityUtils
// ═══════════════════════════════════════════════════════════════

const GUILLOCHE_TEXT_EN = 'iRecycle Waste Management System';
const GUILLOCHE_TEXT_AR = 'آي ريسايكل لإدارة المخلفات';
const GUILLOCHE_TEXT_HIERO = '𓇋𓂋𓇌𓋴𓇌𓎡𓃭 𓅱𓇌𓋴𓏏 𓅓𓈖𓇌𓆓𓅓𓈖𓏏 𓋴𓇌𓋴𓏏𓅓';

function generateGuillocheTextFillerHTML(accentColor = '#059669'): string {
  const textLine = `${GUILLOCHE_TEXT_EN}  ✦  ${GUILLOCHE_TEXT_AR}  ✦  ${GUILLOCHE_TEXT_HIERO}`;
  const rows: string[] = [];

  for (let i = 0; i < 28; i++) {
    const top = 2 + i * 3.5;
    const alpha = i % 3 === 0 ? 0.045 : i % 3 === 1 ? 0.035 : 0.028;
    const fontSize = i % 2 === 0 ? 7.5 : 6.5;
    const angle = i % 4 === 0 ? -18 : i % 4 === 1 ? 12 : i % 4 === 2 ? -8 : 15;
    const offsetX = (i % 5) * -60;
    rows.push(
      `<div style="position:absolute;top:${top}%;left:${offsetX}px;right:-200px;text-align:center;font-size:${fontSize}px;font-family:'Noto Sans Egyptian Hieroglyphs','Cairo','Aref Ruqaa Ink',serif;color:rgba(${hexToRgb(accentColor)},${alpha});transform:rotate(${angle}deg);white-space:nowrap;letter-spacing:3px;font-weight:400;line-height:1;pointer-events:none;user-select:none;">${textLine}&nbsp;&nbsp;◈&nbsp;&nbsp;${textLine}&nbsp;&nbsp;◈&nbsp;&nbsp;${textLine}&nbsp;&nbsp;◈&nbsp;&nbsp;${textLine}</div>`
    );
  }

  const waveSVGs: string[] = [];
  for (let w = 0; w < 14; w++) {
    const y = 5 + w * 7;
    const amp = 8 + (w % 3) * 4;
    const freq = 0.008 + (w % 4) * 0.002;
    const alpha = 0.04 + (w % 3) * 0.01;
    const sw = 0.3 + (w % 2) * 0.2;
    let d = `M 0 ${amp}`;
    for (let x = 0; x <= 900; x += 3) {
      const yp = amp * Math.sin(freq * x * Math.PI * 2 + w * 0.7);
      d += ` L ${x} ${amp + yp}`;
    }
    waveSVGs.push(
      `<div style="position:absolute;top:${y}%;left:0;right:0;height:${amp * 2 + 4}px;pointer-events:none;opacity:${alpha};overflow:hidden;">` +
      `<svg width="100%" height="${amp * 2 + 4}" viewBox="0 0 900 ${amp * 2 + 4}" preserveAspectRatio="none" style="display:block;">` +
      `<path d="${d}" fill="none" stroke="${accentColor}" stroke-width="${sw}" stroke-linecap="round"/>` +
      `</svg></div>`
    );
  }

  return `<div style="position:absolute;inset:10mm;z-index:0;pointer-events:none;overflow:hidden;">${rows.join('')}${waveSVGs.join('')}</div>`;
}

function generateWatermarkHTML(orgName: string): string {
  const now = new Date();
  const dateAr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeAr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateEn = now.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeEn = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const watermarkText = `${orgName} | ${dateAr} ${timeAr} | ${dateEn} ${timeEn}`;
  const rows: string[] = [];
  for (let i = 0; i < 12; i++) {
    const top = 1 + i * 8.5;
    const angle = i % 2 === 0 ? -33 : -28;
    const size = i % 2 === 0 ? 13 : 11;
    const alpha = i % 2 === 0 ? 0.08 : 0.055;
    rows.push(
      `<div style="position:absolute;top:${top}%;left:-20%;right:-20%;text-align:center;font-size:${size}px;font-family:'Cairo','Segoe UI',sans-serif;color:rgba(6,95,70,${alpha});transform:rotate(${angle}deg);white-space:nowrap;letter-spacing:1.8px;font-weight:600;line-height:1.5;pointer-events:none;user-select:none;">${watermarkText}    ${watermarkText}    ${watermarkText}</div>`
    );
  }
  return `<div style="position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden;mix-blend-mode:multiply;">${rows.join('')}</div>`;
}

function generateVerticalStampHTML(): string {
  return `<div style="font-family:'Courier New','Cairo',monospace;font-size:7px;letter-spacing:1px;color:#000;font-weight:900;direction:rtl;text-align:center;pointer-events:none;user-select:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
    <span style="background:rgba(255,255,255,0.85);padding:2px 8px;border:1px solid rgba(0,0,0,0.15);border-radius:2px;">▸ منصة اي ريسايكل — هذه الوثيقة مؤمنة وذكية | iRecycle Platform — This Document is Secured &amp; Smart | 𓇋𓂋𓇌𓋴𓇌𓎡𓃭 — 𓅓𓋴𓏏𓈖𓂧 𓅓𓀀𓅓𓈖 𓅱𓇌𓎡𓇌 ◂</span>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════

function generateManifestHTML(shipment: any, custodyChain: any[], signatures: any[]) {
  const wasteTypeLabels: Record<string, string> = {
    plastic: "بلاستيك", paper: "ورق وكرتون", metal: "معادن", glass: "زجاج",
    organic: "عضوي", electronic: "إلكتروني", textile: "منسوجات",
    chemical: "كيميائي", medical: "طبي", construction: "مخلفات بناء",
    rubber: "مطاط", wood: "خشب", mixed: "مخلوط", other: "أخرى",
    hazardous_chemical: "كيميائي خطر", hazardous_medical: "طبي خطر",
    hazardous_electronic: "إلكتروني خطر", hazardous_industrial: "صناعي خطر",
  };
  const hazardLabels: Record<string, string> = { low: "منخفض", medium: "متوسط", high: "عالي", critical: "حرج" };
  const eventTypeLabels: Record<string, string> = {
    generator_handover: "تسليم المولد", transporter_pickup: "استلام الناقل",
    transporter_delivery: "تسليم الناقل", recycler_receipt: "استلام المدوّر",
  };
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("ar-EG") : "—";
  const formatDateTime = (d: string | null) => d ? new Date(d).toLocaleString("ar-EG") : "—";

  // Integrity hash
  const docData = `${shipment.shipment_number}|${shipment.created_at}|${shipment.quantity}|${shipment.waste_type}`;
  let hash = 0;
  for (let i = 0; i < docData.length; i++) { hash = ((hash << 5) - hash) + docData.charCodeAt(i); hash = hash & hash; }
  const integrityHash = Math.abs(hash).toString(16).padStart(16, '0').toUpperCase();
  const genHash = Math.abs(hash * 31).toString(16).padStart(8, '0').toUpperCase();
  const transHash = Math.abs(hash * 37).toString(16).padStart(8, '0').toUpperCase();
  const recHash = Math.abs(hash * 41).toString(16).padStart(8, '0').toUpperCase();

  // Document serial & security code
  const securityCode = `SEC-${integrityHash.slice(0, 4)}-${integrityHash.slice(4, 8)}`;
  const documentSerial = `DOC-${shipment.shipment_number?.replace('SHP-', '') || '000000'}`;

  const isHazardous = shipment.hazard_level && shipment.hazard_level !== "low";
  const verifyUrl = `https://irecycle.app/qr-verify?ref=${shipment.shipment_number}`;
  const genVerifyUrl = `https://irecycle.app/qr-verify?ref=${shipment.shipment_number}&party=generator&h=${genHash}`;
  const transVerifyUrl = `https://irecycle.app/qr-verify?ref=${shipment.shipment_number}&party=transporter&h=${transHash}`;
  const recVerifyUrl = `https://irecycle.app/qr-verify?ref=${shipment.shipment_number}&party=recycler&h=${recHash}`;

  const genSig = signatures.find((s: any) => s.signer_role === 'generator' || s.organization_id === shipment.generator_id);
  const transSig = signatures.find((s: any) => s.signer_role === 'transporter' || s.organization_id === shipment.transporter_id);
  const recSig = signatures.find((s: any) => s.signer_role === 'recycler' || s.organization_id === shipment.recycler_id);

  // MICR line data
  const now = new Date();
  const dateStamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const timeStamp = `${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
  const orgCode = shipment.transporter?.client_code || shipment.generator?.client_code || '000000';
  const micrLine = `A${orgCode}A B${dateStamp}D${timeStamp}B C${shipment.shipment_number}C`;

  // Org name for watermark
  const primaryOrgName = shipment.transporter?.name || shipment.generator?.name || 'iRecycle';

  // Unified font size — matches ShipmentA4Document
  const FS = '6.5px';

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
  @font-face { font-family: 'MICR E13B'; src: url('/fonts/micr-e13b.ttf') format('truetype'); font-weight: normal; font-style: normal; }
  @page { size: A4 portrait; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  body { 
    font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif; 
    font-size: ${FS}; color: #1a1a1a; direction: rtl; 
    width: 210mm; height: 297mm; position: relative;
    margin: 0; padding: 0;
    background: #fff;
    overflow: hidden;
  }
  .manifest-page {
    font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif; 
    font-size: ${FS}; color: #1a1a1a; direction: rtl; 
    width: 210mm; height: 297mm; position: relative;
    padding: 15mm 15mm 20mm 15mm;
    background: #fff;
    overflow: hidden;
  }
  @media print {
    html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; overflow: hidden; }
    .manifest-page { width: 210mm; height: 297mm; padding: 15mm 15mm 20mm 15mm; overflow: hidden; }
    svg, path, rect, div, span {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }

  /* Vertical rotated text on left side — inside 15mm text margin */
  .vertical-text {
    position: absolute; left: 0; top: 0; bottom: 0; width: 5mm;
    writing-mode: vertical-rl; text-orientation: mixed;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cairo', 'Courier New', monospace; font-size: ${FS}; font-weight: 900;
    letter-spacing: 1px; color: #000; z-index: 10; direction: ltr;
    background: rgba(240,253,244,0.6); border-left: 1px solid #16a34a;
  }
  .vertical-text span {
    transform: rotate(180deg);
    white-space: nowrap;
    padding: 4px 2px;
  }

  /* MICR line at bottom inside content area */
  .micr-line {
    direction: ltr; text-align: center;
    font-family: 'MICR E13B', 'Courier New', monospace;
    font-size: 10px; letter-spacing: 1.5px; color: #000;
    z-index: 5; pointer-events: none; user-select: none;
    border-top: 1px solid #e5e7eb; padding-top: 1mm; margin-top: 2px;
  }

  .hdr { text-align: center; border-bottom: 2.5px solid #16a34a; padding-bottom: 3px; margin-bottom: 3px; position: relative; z-index: 2; }
  .hdr-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
  .hdr-logo { font-size: 11px; font-weight: 900; color: #16a34a; }
  .hdr h1 { font-size: 9px; color: #16a34a; margin: 1px 0; }
  .hdr-sub { font-size: ${FS}; color: #666; }
  .hdr-num { font-size: 8px; font-weight: bold; margin-top: 2px; background: transparent; padding: 1px 6px; display: inline-block; border-radius: 3px; border: 1px solid #bbf7d0; }
  .hdr-codes { display: flex; justify-content: center; gap: 8px; align-items: center; margin-top: 3px; }
  .hdr-codes .qr-box { border: 1px solid #d1d5db; border-radius: 3px; padding: 1px; background: #fff; }
  .hdr-codes .barcode-box { text-align: center; }

  .sec { margin-bottom: 2px; position: relative; z-index: 2; }
  .sec-t { background: transparent; border-right: 3px solid #16a34a; padding: 1px 5px; font-weight: bold; font-size: 7px; margin-bottom: 1px; color: #15803d; }
  
  table { width: 100%; border-collapse: collapse; }
  td, th { border: 1px solid #d1d5db; padding: 1.5px 3px; text-align: right; font-size: ${FS}; line-height: 1.25; background: transparent; }
  th { font-weight: bold; color: #15803d; font-size: ${FS}; }
  
  .parties { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2px; margin-bottom: 2px; }
  .party { border: 1px solid #d1d5db; border-radius: 3px; padding: 2px 3px; background: transparent; }
  .party h4 { font-size: ${FS}; color: #16a34a; margin-bottom: 1px; border-bottom: 1px solid #e5e7eb; padding-bottom: 1px; }
  .party p { font-size: ${FS}; margin: 0.5px 0; line-height: 1.25; }
  .lbl { color: #6b7280; }
  .val { font-weight: 600; }
  
  .chain-row td { font-size: ${FS}; padding: 1px 2px; }
  
  .sigs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3px; margin: 3px 0; }
  .sig-box { border: 1px solid #d1d5db; border-radius: 3px; padding: 2px; text-align: center; min-height: 45px; background: transparent; }
  .sig-box h5 { font-size: ${FS}; color: #15803d; margin-bottom: 1px; }
  .sig-line { border-bottom: 1px dotted #9ca3af; margin: 4px 4px 1px; }
  .sig-label { font-size: 5px; color: #9ca3af; }
  .sig-qr { margin: 1px auto; }
  .sig-hash { font-family: monospace; font-size: 4.5px; color: #16a34a; background: transparent; padding: 1px 3px; border-radius: 2px; display: inline-block; margin-top: 1px; border: 1px solid #bbf7d0; }
  .sig-status { font-size: 5px; padding: 1px 3px; border-radius: 2px; display: inline-block; margin-top: 1px; }
  .sig-signed { background: rgba(220,252,231,0.7); color: #166534; }
  .sig-pending { background: rgba(254,243,199,0.7); color: #92400e; }
  
  .decl { background: transparent; border: 1px solid #fde68a; border-radius: 3px; padding: 2px 3px; margin: 2px 0; }
  .decl h4 { font-size: ${FS}; color: #92400e; margin-bottom: 1px; }
  .decl p { font-size: 5.5px; color: #78350f; line-height: 1.35; }
  .decl-party { background: transparent; border: 1px solid #fde047; border-radius: 2px; padding: 1px 3px; margin: 1px 0; }
  .decl-party strong { font-size: ${FS}; color: #854d0e; }
  .decl-party p { font-size: 5px; color: #713f12; margin: 0.5px 0; }
  
  .terms { background: transparent; border: 1px solid #e2e8f0; border-radius: 3px; padding: 2px 4px; margin: 2px 0; }
  .terms h4 { font-size: ${FS}; color: #334155; margin-bottom: 1px; }
  .terms ol { font-size: 5px; color: #475569; padding-right: 10px; line-height: 1.35; columns: 2; column-gap: 10px; }
  .terms li { break-inside: avoid; margin-bottom: 0.5px; }
  
  .sec-footer { display: flex; justify-content: space-between; align-items: center; border-top: 2.5px solid #16a34a; padding-top: 3px; margin-top: 3px; position: relative; z-index: 2; }
  .sec-footer .left { font-size: 5px; color: #6b7280; }
  .sec-footer .center { text-align: center; }
  .sec-footer .right { text-align: left; direction: ltr; }
  .qr-main { border: 1px solid #d1d5db; border-radius: 3px; padding: 1px; background: #fff; display: inline-block; }
  .hash-badge { font-family: monospace; font-size: 5px; color: #16a34a; background: transparent; padding: 1px 3px; border-radius: 2px; border: 1px solid #bbf7d0; }
</style>
</head>
<body>
<div class="manifest-page">
<!-- ═══ Layer 0: Guilloche Text Filler — trilingual threads + sine waves ═══ -->
${generateGuillocheTextFillerHTML('#059669')}

<!-- ═══ Layer 1: Dynamic Watermark — org + date/time ═══ -->
${generateWatermarkHTML(primaryOrgName)}

<!-- Vertical Rotated Text on Left Side -->
<div class="vertical-text">
  <span>▸ منصة اي ريسايكل — هذه الوثيقة مؤمنة وذكية | iRecycle Platform — This Document is Secured &amp; Smart | 𓇋𓂋𓇌𓋴𓇌𓎡𓃭 — 𓅓𓋴𓏏𓈖𓂧 𓅓𓀀𓅓𓈖 𓅱𓇌𓎡𓇌 ◂</span>
</div>

<!-- Header with QR & Barcode -->
<div class="hdr">
  <div class="hdr-top">
    <div style="font-size:5.5px;color:#666;text-align:right;">
      جمهورية مصر العربية<br/>جهاز تنظيم إدارة المخلفات (WMRA)
    </div>
    <div class="hdr-logo">♻️ iRecycle</div>
    <div style="font-size:5.5px;color:#666;text-align:left;direction:ltr;">
      Arab Republic of Egypt<br/>Waste Management Regulatory Agency
    </div>
  </div>
  <h1>مانيفست نقل المخلفات | Waste Transport Manifest</h1>
  <div class="hdr-sub">نموذج موحد وفقاً لقانون تنظيم إدارة المخلفات رقم 202 لسنة 2020 ولائحته التنفيذية</div>
  <div class="hdr-num">رقم المانيفست: ${shipment.shipment_number} &nbsp;|&nbsp; ${documentSerial} &nbsp;|&nbsp; ${securityCode} &nbsp;|&nbsp; ${formatDate(shipment.created_at)}</div>
  ${isHazardous ? `<div style="background:rgba(254,242,242,0.8);color:#dc2626;padding:1px 5px;border-radius:3px;font-weight:bold;font-size:${FS};border:1px solid #fecaca;display:inline-block;margin-top:1px;">⚠️ مخلفات خطرة - مستوى: ${hazardLabels[shipment.hazard_level] || shipment.hazard_level}</div>` : ''}
  
  <div class="hdr-codes">
    <div class="qr-box">${generateQRSvg(verifyUrl, 40)}</div>
    <div class="barcode-box">${generateBarcodeSvg(shipment.shipment_number, 150, 20)}</div>
    <div style="font-size:5px;color:#6b7280;">
      <div>امسح للتحقق من صحة الوثيقة</div>
      <div class="hash-badge" style="margin-top:1px;">SHA: ${integrityHash}</div>
    </div>
  </div>
</div>

<!-- Org Logos Row -->
<div style="display:flex;justify-content:center;gap:8px;align-items:center;margin-bottom:2px;position:relative;z-index:2;">
  ${[shipment.generator, shipment.transporter, shipment.recycler].filter(Boolean).map((org: any) => 
    `<div style="text-align:center;">
      ${org.logo_url ? `<img src="${org.logo_url}" style="max-height:18px;max-width:55px;object-fit:contain;" alt="" crossorigin="anonymous"/>` : ''}
      <div style="font-size:5px;color:#6b7280;">${org.client_code || org.partner_code || ''}</div>
    </div>`
  ).join('')}
</div>

<!-- 1. الأطراف -->
<div class="sec">
  <div class="sec-t">القسم الأول: الأطراف المعنية | Involved Parties</div>
  <div class="parties">
    <div class="party">
      <h4>🏭 المولّد | Generator</h4>
      <p><span class="lbl">الاسم:</span> <span class="val">${shipment.generator?.name || shipment.manual_generator_name || "—"}</span></p>
      ${shipment.generator?.name_en ? `<p><span class="lbl">Name:</span> <span class="val">${shipment.generator.name_en}</span></p>` : ''}
      <p><span class="lbl">كود:</span> ${shipment.generator?.partner_code || "—"} ${shipment.generator?.client_code ? `| ${shipment.generator.client_code}` : ''}</p>
      <p><span class="lbl">العنوان:</span> ${shipment.generator?.address || "—"}${shipment.generator?.city ? ` - ${shipment.generator.city}` : ''}</p>
      <p><span class="lbl">هاتف:</span> ${shipment.generator?.phone || "—"}${shipment.generator?.secondary_phone ? ` / ${shipment.generator.secondary_phone}` : ''}</p>
      <p><span class="lbl">بريد:</span> ${shipment.generator?.email || "—"}${shipment.generator?.business_email ? ` / ${shipment.generator.business_email}` : ''}</p>
      <p><span class="lbl">سجل:</span> ${shipment.generator?.commercial_register || "—"} ${shipment.generator?.tax_card ? `| ض: ${shipment.generator.tax_card}` : ''}</p>
      ${shipment.generator?.environmental_approval_number ? `<p><span class="lbl">موافقة بيئية:</span> ${shipment.generator.environmental_approval_number}</p>` : ''}
      ${shipment.generator?.activity_type ? `<p><span class="lbl">النشاط:</span> ${shipment.generator.activity_type}</p>` : ''}
      ${shipment.generator?.representative_name ? `<p><span class="lbl">المفوض:</span> ${shipment.generator.representative_name} ${shipment.generator.representative_position ? `(${shipment.generator.representative_position})` : ''}</p>` : ''}
      ${shipment.generator?.representative_phone ? `<p><span class="lbl">هاتف المفوض:</span> ${shipment.generator.representative_phone}</p>` : ''}
      ${renderLicensesBlock(shipment.generator)}
    </div>
    <div class="party">
      <h4>🚛 الناقل | Transporter</h4>
      <p><span class="lbl">الاسم:</span> <span class="val">${shipment.transporter?.name || shipment.manual_transporter_name || "—"}</span></p>
      ${shipment.transporter?.name_en ? `<p><span class="lbl">Name:</span> <span class="val">${shipment.transporter.name_en}</span></p>` : ''}
      <p><span class="lbl">كود:</span> ${shipment.transporter?.partner_code || "—"} ${shipment.transporter?.client_code ? `| ${shipment.transporter.client_code}` : ''}</p>
      <p><span class="lbl">العنوان:</span> ${shipment.transporter?.address || "—"}${shipment.transporter?.city ? ` - ${shipment.transporter.city}` : ''}</p>
      <p><span class="lbl">هاتف:</span> ${shipment.transporter?.phone || "—"}${shipment.transporter?.secondary_phone ? ` / ${shipment.transporter.secondary_phone}` : ''}</p>
      <p><span class="lbl">بريد:</span> ${shipment.transporter?.email || "—"}</p>
      <p><span class="lbl">سجل:</span> ${shipment.transporter?.commercial_register || "—"}</p>
      <p><span class="lbl">رخصة نقل:</span> ${shipment.transporter?.license_number || "—"}</p>
      ${shipment.transporter?.hazardous_certified ? `<p><span class="lbl">مخلفات خطرة:</span> ✅ معتمد</p>` : ''}
      ${shipment.transporter?.representative_name ? `<p><span class="lbl">المفوض:</span> ${shipment.transporter.representative_name} ${shipment.transporter.representative_position ? `(${shipment.transporter.representative_position})` : ''}</p>` : ''}
      ${shipment.transporter?.representative_phone ? `<p><span class="lbl">هاتف المفوض:</span> ${shipment.transporter.representative_phone}</p>` : ''}
      ${renderLicensesBlock(shipment.transporter)}
    </div>
    <div class="party">
      <h4>♻️ المدوّر | Recycler</h4>
      <p><span class="lbl">الاسم:</span> <span class="val">${shipment.recycler?.name || shipment.manual_recycler_name || "—"}</span></p>
      ${shipment.recycler?.name_en ? `<p><span class="lbl">Name:</span> <span class="val">${shipment.recycler.name_en}</span></p>` : ''}
      <p><span class="lbl">كود:</span> ${shipment.recycler?.partner_code || "—"} ${shipment.recycler?.client_code ? `| ${shipment.recycler.client_code}` : ''}</p>
      <p><span class="lbl">العنوان:</span> ${shipment.recycler?.address || "—"}${shipment.recycler?.city ? ` - ${shipment.recycler.city}` : ''}</p>
      <p><span class="lbl">هاتف:</span> ${shipment.recycler?.phone || "—"}${shipment.recycler?.secondary_phone ? ` / ${shipment.recycler.secondary_phone}` : ''}</p>
      <p><span class="lbl">بريد:</span> ${shipment.recycler?.email || "—"}</p>
      <p><span class="lbl">سجل:</span> ${shipment.recycler?.commercial_register || "—"}</p>
      ${shipment.recycler?.environmental_approval_number ? `<p><span class="lbl">موافقة بيئية:</span> ${shipment.recycler.environmental_approval_number}</p>` : ''}
      ${shipment.recycler?.activity_type ? `<p><span class="lbl">النشاط:</span> ${shipment.recycler.activity_type}</p>` : ''}
      ${shipment.recycler?.representative_name ? `<p><span class="lbl">المفوض:</span> ${shipment.recycler.representative_name} ${shipment.recycler.representative_position ? `(${shipment.recycler.representative_position})` : ''}</p>` : ''}
      ${shipment.recycler?.representative_phone ? `<p><span class="lbl">هاتف المفوض:</span> ${shipment.recycler.representative_phone}</p>` : ''}
      ${renderLicensesBlock(shipment.recycler)}
    </div>
  </div>
</div>

<!-- 2. توصيف المخلف -->
<div class="sec">
  <div class="sec-t">القسم الثاني: التوصيف الدقيق للمخلف | Waste Description</div>
  <table>
    <tr>
      <th>تصنيف المخلف</th><th>الوصف التفصيلي</th><th>الحالة</th><th>الخطورة</th><th>التعبئة</th><th>المعالجة</th><th>التخلص</th>
    </tr>
    <tr>
      <td><strong>${wasteTypeLabels[shipment.waste_type] || shipment.waste_type || "—"}</strong></td>
      <td>${shipment.waste_description || "غير محدد"}</td>
      <td>${shipment.waste_state || "—"}</td>
      <td style="${isHazardous ? 'color:#dc2626;font-weight:bold;' : ''}">${hazardLabels[shipment.hazard_level] || shipment.hazard_level || "—"} ${isHazardous ? '⚠️' : ''}</td>
      <td>${shipment.packaging_method || "—"}</td>
      <td>${shipment.disposal_method || "—"}</td>
      <td>${shipment.disposal_type || "—"}</td>
    </tr>
  </table>
</div>

<!-- 3. الكميات -->
<div class="sec">
  <div class="sec-t">القسم الثالث: الكميات والأوزان | Quantities & Weights</div>
  <table>
    <tr>
      <th>الكمية</th><th>الوحدة</th><th>تذكرة الميزان</th><th>إجمالي</th><th>فارغة</th><th>صافي</th><th>فعلي</th><th>عند المصدر</th><th>عند الوجهة</th><th>فرق %</th>
    </tr>
    <tr>
      <td><strong>${shipment.quantity || "—"}</strong></td>
      <td>${shipment.unit || "طن"}</td>
      <td>${shipment.weighbridge_ticket_number || "—"}</td>
      <td>${shipment.weighbridge_gross_weight || "—"}</td>
      <td>${shipment.weighbridge_tare_weight || "—"}</td>
      <td>${shipment.weighbridge_net_weight || "—"}</td>
      <td>${shipment.actual_weight || "—"}</td>
      <td>${shipment.weight_at_source || "—"}</td>
      <td>${shipment.weight_at_destination || "—"}</td>
      <td style="${shipment.weight_discrepancy_pct && shipment.weight_discrepancy_pct > 5 ? 'color:#dc2626;font-weight:bold;' : ''}">${shipment.weight_discrepancy_pct != null ? shipment.weight_discrepancy_pct + '%' : "—"}</td>
    </tr>
  </table>
</div>

<!-- 4. السائق والمركبة -->
<div class="sec">
  <div class="sec-t">القسم الرابع: السائق والمركبة | Driver & Vehicle</div>
  <table>
    <tr><th>اسم السائق</th><th>الرخصة</th><th>الهاتف</th><th>نوع المركبة</th><th>رقم اللوحة</th><th>تحقق</th></tr>
    <tr>
      <td>${shipment.driver?.full_name || shipment.manual_driver_name || "—"}</td>
      <td>${shipment.driver?.license_number || "—"}</td>
      <td>${shipment.driver?.phone || "—"}</td>
      <td>${shipment.driver?.vehicle_type || "—"}</td>
      <td>${shipment.driver?.vehicle_plate_number || shipment.manual_vehicle_plate || "—"}</td>
      <td>${shipment.plate_verified ? '✅' : '—'}</td>
    </tr>
  </table>
</div>

<!-- 5. المسار والجدول الزمني -->
<div class="sec">
  <div class="sec-t">القسم الخامس: المسار والجدول الزمني | Route & Timeline</div>
  <table>
    <tr><th>نقطة الاستلام</th><th>إحداثيات</th><th>نقطة التسليم</th><th>إحداثيات</th></tr>
    <tr>
      <td>${shipment.pickup_address || "—"} ${shipment.pickup_city ? `- ${shipment.pickup_city}` : ''}</td>
      <td style="font-family:monospace;font-size:5px;">${shipment.gps_pickup_lat ? `${Number(shipment.gps_pickup_lat).toFixed(4)},${Number(shipment.gps_pickup_lng).toFixed(4)}` : "—"}</td>
      <td>${shipment.delivery_address || "—"} ${shipment.delivery_city ? `- ${shipment.delivery_city}` : ''}</td>
      <td style="font-family:monospace;font-size:5px;">${shipment.gps_delivery_lat ? `${Number(shipment.gps_delivery_lat).toFixed(4)},${Number(shipment.gps_delivery_lng).toFixed(4)}` : "—"}</td>
    </tr>
  </table>
  <table style="margin-top:1px;">
    <tr><th>الإنشاء</th><th>الاستلام</th><th>بدء النقل</th><th>التسليم المتوقع</th><th>التسليم</th><th>الاعتماد</th></tr>
    <tr>
      <td>${formatDateTime(shipment.created_at)}</td>
      <td>${formatDate(shipment.pickup_date)}</td>
      <td>${formatDateTime(shipment.in_transit_at)}</td>
      <td>${formatDate(shipment.expected_delivery_date)}</td>
      <td>${formatDateTime(shipment.delivered_at)}</td>
      <td>${formatDateTime(shipment.approved_at)}</td>
    </tr>
  </table>
  <p style="font-size:5px;color:#6b7280;margin-top:1px;">
    GPS: ${shipment.gps_active_throughout ? '✅ نشط' : '⚠️ غير مؤكد'} | الحيازة: ${shipment.custody_chain_complete ? '✅ مكتملة' : '⏳'} | الامتثال: ${shipment.compliance_verified ? '✅' : '⏳'}
  </p>
</div>

<!-- 6. سلسلة الحيازة -->
${custodyChain.length > 0 ? `
<div class="sec">
  <div class="sec-t">القسم السادس: سلسلة الحيازة الرقمية | Digital Chain of Custody</div>
  <table>
    <tr><th>#</th><th>الحدث</th><th>الجهة</th><th>التاريخ</th><th>الإحداثيات</th><th>بصمة</th></tr>
    ${custodyChain.slice(0, 6).map((evt: any, i: number) => `
    <tr class="chain-row">
      <td>${i + 1}</td>
      <td>${eventTypeLabels[evt.event_type] || evt.event_type}</td>
      <td>${evt.actor_organization?.name || "—"}</td>
      <td>${formatDateTime(evt.created_at)}</td>
      <td style="font-family:monospace;font-size:5px;">${evt.gps_latitude ? `${Number(evt.gps_latitude).toFixed(4)},${Number(evt.gps_longitude).toFixed(4)}` : "—"}</td>
      <td style="font-family:monospace;font-size:4.5px;">${evt.qr_code_hash?.slice(0, 16) || "—"}</td>
    </tr>`).join("")}
  </table>
</div>` : ""}

<!-- 7. الإقرارات -->
<div class="decl">
  <h4>📜 الإقرارات والتعهدات القانونية</h4>
  <p style="margin-bottom:1px;font-size:5px;">
    يقر كل طرف بصحة البيانات الواردة ويتحمل المسئولية المدنية والجنائية عن أي مخالفة وفقاً لقانون 202/2020 ولائحته التنفيذية وقانون البيئة 4/1994 واتفاقية بازل.
  </p>
  <div class="decl-party">
    <strong>🏭 المولّد: ${shipment.generator?.name || "—"}</strong>
    <p>أقر بتصنيف المخلفات بدقة وفقاً للكود المصري وأن الكميات والأوصاف صحيحة. (المادة 27 — ق202/2020)</p>
  </div>
  <div class="decl-party">
    <strong>🚛 الناقل: ${shipment.transporter?.name || "—"}</strong>
    <p>أقر باستلام المخلفات والتزامي بالمسار المحدد وعدم التفريغ في غير الجهة المستلمة. (المادة 29 — ق202/2020)</p>
  </div>
  <div class="decl-party">
    <strong>♻️ المستلم: ${shipment.recycler?.name || "—"}</strong>
    <p>أقر باستلام المخلفات وتحققي من مطابقتها للمانيفست. (المادة 31 — ق202/2020)</p>
  </div>
  <p style="margin-top:1px;font-weight:bold;font-size:5px;color:#991b1b;">
    ⚠️ تحذير: التوقيع بمثابة موافقة نهائية. المخالفة تعرض للعقوبات (المواد 68-82 — ق202/2020).
  </p>
</div>

<!-- 8. التوقيعات والأختام -->
<div class="sigs">
  <div class="sig-box">
    <h5>🏭 المولّد</h5>
    ${genSig?.signature_url ? `<img src="${genSig.signature_url}" style="max-width:40px;max-height:16px;margin:1px auto;display:block;" alt="توقيع" crossorigin="anonymous"/>` : shipment.generator?.signature_url ? `<img src="${shipment.generator.signature_url}" style="max-width:40px;max-height:16px;margin:1px auto;display:block;" alt="توقيع" crossorigin="anonymous"/>` : `<div class="sig-line"></div>`}
    ${shipment.generator?.stamp_url ? `<img src="${shipment.generator.stamp_url}" style="max-width:30px;max-height:14px;margin:1px auto;display:block;opacity:0.7;" alt="ختم" crossorigin="anonymous"/>` : ''}
    <div class="sig-label">${genSig?.signer?.full_name || shipment.generator?.representative_name || shipment.generator?.name || ".................."}</div>
    <div class="sig-label">${genSig?.signed_at ? formatDate(genSig.signed_at) : formatDate(shipment.pickup_date)}</div>
    <span class="sig-status ${genSig ? 'sig-signed' : 'sig-pending'}">${genSig ? '✓ موقّع' : '⏳ انتظار'}</span>
    <div class="sig-qr">${generateQRSvg(genVerifyUrl, 22)}</div>
    <div class="sig-hash">VRF-G: ${genHash}</div>
  </div>
  <div class="sig-box">
    <h5>🚛 الناقل</h5>
    ${transSig?.signature_url ? `<img src="${transSig.signature_url}" style="max-width:40px;max-height:16px;margin:1px auto;display:block;" alt="توقيع" crossorigin="anonymous"/>` : shipment.transporter?.signature_url ? `<img src="${shipment.transporter.signature_url}" style="max-width:40px;max-height:16px;margin:1px auto;display:block;" alt="توقيع" crossorigin="anonymous"/>` : `<div class="sig-line"></div>`}
    ${shipment.transporter?.stamp_url ? `<img src="${shipment.transporter.stamp_url}" style="max-width:30px;max-height:14px;margin:1px auto;display:block;opacity:0.7;" alt="ختم" crossorigin="anonymous"/>` : ''}
    <div class="sig-label">${transSig?.signer?.full_name || shipment.transporter?.representative_name || shipment.transporter?.name || ".................."}</div>
    <div class="sig-label">${transSig?.signed_at ? formatDate(transSig.signed_at) : formatDate(shipment.in_transit_at)}</div>
    <span class="sig-status ${transSig ? 'sig-signed' : 'sig-pending'}">${transSig ? '✓ موقّع' : '⏳ انتظار'}</span>
    <div class="sig-qr">${generateQRSvg(transVerifyUrl, 22)}</div>
    <div class="sig-hash">VRF-T: ${transHash}</div>
  </div>
  <div class="sig-box">
    <h5>♻️ المستلم</h5>
    ${recSig?.signature_url ? `<img src="${recSig.signature_url}" style="max-width:40px;max-height:16px;margin:1px auto;display:block;" alt="توقيع" crossorigin="anonymous"/>` : shipment.recycler?.signature_url ? `<img src="${shipment.recycler.signature_url}" style="max-width:40px;max-height:16px;margin:1px auto;display:block;" alt="توقيع" crossorigin="anonymous"/>` : `<div class="sig-line"></div>`}
    ${shipment.recycler?.stamp_url ? `<img src="${shipment.recycler.stamp_url}" style="max-width:30px;max-height:14px;margin:1px auto;display:block;opacity:0.7;" alt="ختم" crossorigin="anonymous"/>` : ''}
    <div class="sig-label">${recSig?.signer?.full_name || shipment.recycler?.representative_name || shipment.recycler?.name || ".................."}</div>
    <div class="sig-label">${recSig?.signed_at ? formatDate(recSig.signed_at) : formatDate(shipment.delivered_at)}</div>
    <span class="sig-status ${recSig ? 'sig-signed' : 'sig-pending'}">${recSig ? '✓ موقّع' : '⏳ انتظار'}</span>
    <div class="sig-qr">${generateQRSvg(recVerifyUrl, 22)}</div>
    <div class="sig-hash">VRF-R: ${recHash}</div>
  </div>
</div>

<!-- 9. الشروط -->
<div class="terms">
  <h4>📋 الشروط والأحكام</h4>
  <ol>
    <li>يلتزم المولّد بتصنيف المخلفات بدقة ويتحمل مسئولية أي خطأ في التصنيف.</li>
    <li>يُحظر على الناقل الانحراف عن المسار أو التفريغ في غير الجهة المستلمة.</li>
    <li>يلتزم المستلم بالتحقق من مطابقة المخلفات للمانيفست ورفض غير المطابق.</li>
    <li>يُحظر تداول مخلفات خطرة بدون التصاريح اللازمة (م.29 — ق202/2020).</li>
    <li>تخضع العمليات للرقابة الإلكترونية عبر GPS وسلسلة الحيازة الرقمية.</li>
    <li>أي مخالفة تعرض المخالف للعقوبات (م.68-82 — ق202/2020).</li>
    <li>المانيفست وثيقة رسمية إلكترونية محمية ببصمة SHA-256.</li>
    <li>الاختصاص القضائي: محاكم جمهورية مصر العربية المختصة.</li>
  </ol>
</div>

<!-- Security Footer -->
<div class="sec-footer">
  <div class="left">
    <div><strong>iRecycle</strong> — نظام إدارة المخلفات الذكي</div>
    <div>تاريخ الطباعة: ${new Date().toLocaleString("ar-EG")}</div>
    <div>⚠️ وثيقة إلكترونية محمية — يمنع التعديل أو التزوير</div>
    <div class="hash-badge">SHA-256: ${integrityHash}</div>
  </div>
  <div class="center">
    <div class="qr-main">${generateQRSvg(verifyUrl, 40)}</div>
    <div style="font-size:4.5px;color:#6b7280;margin-top:1px;">امسح للتحقق</div>
  </div>
  <div class="right">
    ${generateBarcodeSvg(shipment.shipment_number, 120, 18)}
    <div style="font-size:4.5px;color:#9ca3af;text-align:center;">Barcode: ${shipment.shipment_number}</div>
  </div>
</div>

<!-- ═══ Vertical Stamp + MICR in Footer ═══ -->
<div style="margin-top:2px;position:relative;z-index:2;">
  ${generateVerticalStampHTML()}
  <div class="micr-line">${micrLine}</div>
  <div style="font-family:monospace;font-size:5px;color:#6b7280;text-align:center;margin-top:1px;direction:ltr;">
    رقم التتبع: ${shipment.shipment_number} | ${documentSerial} | ${securityCode} | ${new Date().toLocaleString("ar-EG")}
  </div>
</div>
</div><!-- /manifest-page -->

</body>
</html>`;
}
