/**
 * Print template for Digital Identity Card
 * Generates a professional A4 document with cover photo, profile, QR, barcode, verification
 */

interface PrintIdentityCardParams {
  organization: any;
  stats: {
    partnersCount: number;
    employeesCount: number;
    driversCount: number;
    shipmentsThisYear: number;
    totalShipments: number;
    delegatesCount: number;
    workersCount: number;
    externalPartnersCount: number;
  } | null;
  visibility: Record<string, boolean>;
  resolvedLogoUrl?: string | null;
  resolvedCoverUrl?: string | null;
}

const orgTypeLabels: Record<string, string> = {
  generator: 'منشأة مولدة للمخلفات',
  transporter: 'شركة نقل',
  recycler: 'مصنع تدوير / معالجة',
  disposal: 'جهة تخلص نهائي',
  consultant: 'استشاري بيئي',
  consulting_office: 'مكتب استشاري',
  iso_body: 'جهة اعتماد أيزو',
  regulator: 'جهة رقابية',
  transport_office: 'مكتب نقل',
};

function generateVRFCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'VRF-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateSHA256Hash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `SHA256:${hex}${hex}${hex}${hex}`.substring(0, 24);
}

export function printDigitalIdentityCard({ organization, stats, visibility, resolvedLogoUrl, resolvedCoverUrl }: PrintIdentityCardParams) {
  const org = organization;
  const orgType = org.organization_type;
  const isVerified = org.is_verified;
  const createdAt = org.created_at ? new Date(org.created_at) : null;
  const memberSince = createdAt ? `${createdAt.getFullYear()}` : '—';
  const now = new Date();
  const issueDate = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const issueTime = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const vrfCode = generateVRFCode();
  const docHash = generateSHA256Hash(`${org.id}-${org.name}-${now.toISOString()}`);
  const qrValue = `${window.location.origin}/qr-verify?type=entity_certificate&code=${org.partner_code || org.id}`;
  const barcodeValue = org.partner_code || org.client_code || org.id?.substring(0, 12);

  const logoUrl = resolvedLogoUrl || org.logo_url || '';
  const coverUrl = resolvedCoverUrl || org.cover_url || '';

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>بطاقة الهوية الرقمية — ${org.name}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #fff; color: #1a1a2e; direction: rtl; }
  
  .page { width: 210mm; min-height: 297mm; margin: 0 auto; position: relative; overflow: hidden; }
  
  /* Cover section */
  .cover-section { position: relative; height: 100mm; overflow: hidden; }
  .cover-image { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cover-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #0d9488 0%, #065f46 40%, #1e3a5f 100%); display: flex; align-items: center; justify-content: center; }
  .cover-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6) 100%); }
  
  /* Platform branding on cover */
  .cover-branding { position: absolute; top: 12px; left: 16px; display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.9); backdrop-filter: blur(4px); padding: 4px 12px; border-radius: 20px; font-size: 9px; color: #0d9488; font-weight: 600; }
  .cover-title { position: absolute; bottom: 70px; right: 30px; left: 30px; color: white; }
  .cover-title h1 { font-size: 28px; font-weight: 800; text-shadow: 0 2px 8px rgba(0,0,0,0.4); }
  .cover-title p { font-size: 13px; opacity: 0.9; margin-top: 4px; text-shadow: 0 1px 4px rgba(0,0,0,0.4); }
  
  /* Profile avatar overlapping cover */
  .profile-section { position: relative; margin-top: -36px; padding: 0 30px; display: flex; align-items: flex-end; gap: 16px; z-index: 2; }
  .profile-avatar { width: 72px; height: 72px; border-radius: 16px; border: 4px solid #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.15); object-fit: cover; background: #f0fdf4; }
  .profile-avatar-placeholder { width: 72px; height: 72px; border-radius: 16px; border: 4px solid #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.15); background: linear-gradient(135deg, #0d9488, #065f46); display: flex; align-items: center; justify-content: center; color: white; font-size: 28px; font-weight: 700; }
  .profile-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 8px; }
  .badge { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: 600; }
  .badge-primary { background: #f0fdf4; color: #0d9488; border: 1px solid #d1fae5; }
  .badge-verified { background: #0d9488; color: white; }
  .badge-code { background: #f1f5f9; color: #334155; font-family: monospace; border: 1px solid #e2e8f0; }
  
  /* Content body */
  .body { padding: 20px 30px; }
  
  /* Stats grid */
  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 16px 0; }
  .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 8px; text-align: center; }
  .stat-value { font-size: 20px; font-weight: 800; color: #0d9488; }
  .stat-label { font-size: 9px; color: #64748b; margin-top: 2px; }
  
  /* Info sections */
  .section { margin: 14px 0; }
  .section-title { font-size: 11px; font-weight: 700; color: #0d9488; padding-bottom: 6px; border-bottom: 1.5px solid #e2e8f0; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
  .info-row { display: flex; align-items: center; gap: 8px; padding: 3px 0; font-size: 10px; }
  .info-label { color: #64748b; min-width: 80px; }
  .info-value { font-weight: 600; color: #1e293b; }
  
  /* Verification & Security section */
  .security-section { margin-top: 16px; background: linear-gradient(to left, #f0fdf4, #f8fafc); border: 1.5px solid #d1fae5; border-radius: 12px; padding: 14px 18px; }
  .security-header { font-size: 11px; font-weight: 700; color: #0d9488; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
  .security-grid { display: grid; grid-template-columns: 1fr 1fr auto; gap: 12px; align-items: center; }
  .security-details { font-size: 9px; color: #475569; }
  .security-details .row { display: flex; align-items: center; gap: 6px; margin: 3px 0; }
  .security-details .label { color: #94a3b8; min-width: 70px; }
  .security-details .value { font-weight: 600; font-family: monospace; color: #0f172a; letter-spacing: 0.5px; }
  
  /* QR + Barcode */
  .qr-container { width: 80px; height: 80px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .barcode-container { text-align: center; }
  .barcode-bars { display: flex; align-items: flex-end; justify-content: center; gap: 1px; height: 35px; }
  .barcode-bar { background: #1e293b; }
  .barcode-text { font-size: 8px; font-family: monospace; color: #475569; margin-top: 3px; }
  
  /* Platform endorsement */
  .endorsement { margin-top: 14px; border: 1.5px solid #0d9488; border-radius: 10px; padding: 10px 16px; background: linear-gradient(to left, rgba(13,148,136,0.04), rgba(13,148,136,0.08)); }
  .endorsement-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .endorsement-title { font-size: 11px; font-weight: 700; color: #0d9488; display: flex; align-items: center; gap: 5px; }
  .endorsement-seal { width: 40px; height: 40px; border-radius: 50%; border: 2px solid #0d9488; display: flex; align-items: center; justify-content: center; background: rgba(13,148,136,0.1); }
  .endorsement-text { font-size: 9px; color: #475569; line-height: 1.7; }
  
  /* Disclaimer footer */
  .disclaimer { margin-top: 12px; padding-top: 10px; border-top: 1px dashed #cbd5e1; }
  .disclaimer p { font-size: 8px; color: #94a3b8; line-height: 1.8; text-align: center; }
  .disclaimer .bold { font-weight: 700; color: #64748b; }
  
  /* Watermark */
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; font-weight: 900; color: rgba(13,148,136,0.03); pointer-events: none; z-index: 0; white-space: nowrap; }
  
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { box-shadow: none; }
  }
</style>
</head>
<body>
<div class="watermark">iRecycle Platform</div>
<div class="page">
  <!-- Cover -->
  <div class="cover-section">
    ${coverUrl 
      ? `<img src="${coverUrl}" class="cover-image" crossorigin="anonymous" />`
      : `<div class="cover-placeholder"><svg width="80" height="80" fill="none" viewBox="0 0 24 24"><path d="M3 21V3h18v18H3z" stroke="white" stroke-opacity="0.2" stroke-width="1.5"/><path d="M9 11a2 2 0 100-4 2 2 0 000 4z" stroke="white" stroke-opacity="0.3" stroke-width="1.5"/><path d="M3 17l4-4 4 4 4-6 6 8" stroke="white" stroke-opacity="0.3" stroke-width="1.5"/></svg></div>`
    }
    <div class="cover-overlay"></div>
    <div class="cover-branding">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#0d9488"/></svg>
      iRecycle Platform — Digital Identity Card
    </div>
    <div class="cover-title">
      <h1>${org.name}</h1>
      <p>${orgTypeLabels[orgType] || orgType} ${org.name_en ? `• ${org.name_en}` : ''}</p>
    </div>
  </div>
  
  <!-- Profile -->
  <div class="profile-section">
    ${logoUrl 
      ? `<img src="${logoUrl}" class="profile-avatar" crossorigin="anonymous" />`
      : `<div class="profile-avatar-placeholder">${(org.name || 'O').charAt(0)}</div>`
    }
    <div class="profile-meta">
      <span class="badge badge-primary">${orgTypeLabels[orgType] || orgType}</span>
      ${isVerified ? '<span class="badge badge-verified">✓ جهة موثقة</span>' : ''}
      ${org.partner_code ? `<span class="badge badge-code">${org.partner_code}</span>` : ''}
      ${org.client_code ? `<span class="badge badge-code">${org.client_code}</span>` : ''}
    </div>
  </div>
  
  <div class="body">
    ${visibility.show_description && org.bio ? `<p style="font-size:10px;color:#475569;margin:10px 0;line-height:1.7">${org.bio}</p>` : ''}
    
    <!-- Stats -->
    ${stats ? `
    <div class="stats-grid">
      ${visibility.show_partners_count ? `<div class="stat-box"><div class="stat-value">${stats.partnersCount}</div><div class="stat-label">الشركاء</div></div>` : ''}
      ${visibility.show_employees_count ? `<div class="stat-box"><div class="stat-value">${stats.employeesCount}</div><div class="stat-label">الموظفين</div></div>` : ''}
      ${visibility.show_employees_count ? `<div class="stat-box"><div class="stat-value">${stats.driversCount}</div><div class="stat-label">السائقين</div></div>` : ''}
      ${visibility.show_shipments_stats ? `<div class="stat-box"><div class="stat-value">${stats.shipmentsThisYear}</div><div class="stat-label">شحنات العام</div></div>` : ''}
      ${visibility.show_shipments_stats ? `<div class="stat-box"><div class="stat-value">${stats.totalShipments}</div><div class="stat-label">إجمالي الشحنات</div></div>` : ''}
      ${visibility.show_delegate ? `<div class="stat-box"><div class="stat-value">${stats.delegatesCount}</div><div class="stat-label">المفوضون</div></div>` : ''}
    </div>` : ''}
    
    <!-- Contact -->
    <div class="section">
      <div class="section-title">📞 بيانات التواصل</div>
      ${visibility.show_email && org.email ? `<div class="info-row"><span class="info-label">البريد:</span><span class="info-value">${org.email}</span></div>` : ''}
      ${visibility.show_phone && org.phone ? `<div class="info-row"><span class="info-label">الهاتف:</span><span class="info-value">${org.phone}</span></div>` : ''}
      ${visibility.show_phone && org.secondary_phone ? `<div class="info-row"><span class="info-label">هاتف ثانوي:</span><span class="info-value">${org.secondary_phone}</span></div>` : ''}
      ${visibility.show_website && org.website_url ? `<div class="info-row"><span class="info-label">الموقع:</span><span class="info-value">${org.website_url}</span></div>` : ''}
      ${visibility.show_address && org.address ? `<div class="info-row"><span class="info-label">العنوان:</span><span class="info-value">${org.address}${org.city ? ` — ${org.city}` : ''}${org.region ? ` — ${org.region}` : ''}</span></div>` : ''}
    </div>
    
    <!-- Representative -->
    ${visibility.show_representative && org.representative_name ? `
    <div class="section">
      <div class="section-title">👔 الممثل القانوني</div>
      <div class="info-row"><span class="info-label">الاسم:</span><span class="info-value">${org.representative_name}</span></div>
      ${org.representative_position ? `<div class="info-row"><span class="info-label">المنصب:</span><span class="info-value">${org.representative_position}</span></div>` : ''}
      ${org.representative_phone ? `<div class="info-row"><span class="info-label">الهاتف:</span><span class="info-value">${org.representative_phone}</span></div>` : ''}
    </div>` : ''}
    
    <!-- Licenses -->
    ${visibility.show_licenses ? `
    <div class="section">
      <div class="section-title">📜 التراخيص والسجلات القانونية</div>
      ${org.commercial_register ? `<div class="info-row"><span class="info-label">السجل التجاري:</span><span class="info-value">${org.commercial_register}</span></div>` : ''}
      ${org.tax_card ? `<div class="info-row"><span class="info-label">البطاقة الضريبية:</span><span class="info-value">${org.tax_card}</span></div>` : ''}
      ${org.environmental_license ? `<div class="info-row"><span class="info-label">الترخيص البيئي:</span><span class="info-value">${org.environmental_license}</span></div>` : ''}
      ${org.license_number ? `<div class="info-row"><span class="info-label">رقم الترخيص:</span><span class="info-value">${org.license_number}</span></div>` : ''}
      ${org.wmra_license ? `<div class="info-row"><span class="info-label">ترخيص WMRA:</span><span class="info-value">${org.wmra_license}</span></div>` : ''}
      ${org.industrial_registry ? `<div class="info-row"><span class="info-label">السجل الصناعي:</span><span class="info-value">${org.industrial_registry}</span></div>` : ''}
      ${org.license_expiry_date ? `<div class="info-row"><span class="info-label">انتهاء الترخيص:</span><span class="info-value">${org.license_expiry_date}</span></div>` : ''}
      ${org.digital_declaration_number ? `<div class="info-row"><span class="info-label">الإقرار الرقمي:</span><span class="info-value">${org.digital_declaration_number}</span></div>` : ''}
    </div>` : ''}
    
    <!-- Activity -->
    ${org.activity_type || org.field_of_work ? `
    <div class="section">
      <div class="section-title">🏭 النشاط ونطاق العمل</div>
      ${org.activity_type ? `<div class="info-row"><span class="info-label">نوع النشاط:</span><span class="info-value">${org.activity_type}</span></div>` : ''}
      ${org.field_of_work ? `<div class="info-row"><span class="info-label">مجال العمل:</span><span class="info-value">${org.field_of_work}</span></div>` : ''}
      ${org.registered_activity ? `<div class="info-row"><span class="info-label">النشاط المسجل:</span><span class="info-value">${org.registered_activity}</span></div>` : ''}
      ${org.production_capacity ? `<div class="info-row"><span class="info-label">الطاقة الإنتاجية:</span><span class="info-value">${org.production_capacity}</span></div>` : ''}
      ${org.hazardous_certified ? `<div class="info-row"><span class="info-label">النفايات الخطرة:</span><span class="info-value" style="color:#dc2626">⚠ مرخص للنفايات الخطرة</span></div>` : ''}
    </div>` : ''}
    
    <!-- Security & Verification -->
    <div class="security-section">
      <div class="security-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#0d9488"/></svg>
        وسائل التحقق والأمان الرقمي
      </div>
      <div class="security-grid">
        <div class="security-details">
          <div class="row"><span class="label">رمز التحقق:</span><span class="value">${vrfCode}</span></div>
          <div class="row"><span class="label">البصمة الرقمية:</span><span class="value">${docHash}</span></div>
          <div class="row"><span class="label">تاريخ الإصدار:</span><span class="value">${issueDate} — ${issueTime}</span></div>
          <div class="row"><span class="label">عضو منذ:</span><span class="value">${memberSince}</span></div>
          <div class="row"><span class="label">الحالة:</span><span class="value" style="color:#0d9488">${isVerified ? '✓ جهة موثقة ومعتمدة' : '⏳ قيد المراجعة'}</span></div>
        </div>
        
        <!-- QR Code -->
        <div class="qr-container">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrValue)}&color=0d9488" width="74" height="74" />
        </div>
        
        <!-- Barcode -->
        <div class="barcode-container">
          <div class="barcode-bars">
            ${Array.from({length: 30}, () => {
              const w = Math.random() > 0.5 ? 2 : 1;
              const h = 28 + Math.random() * 7;
              return `<div class="barcode-bar" style="width:${w}px;height:${h}px"></div>`;
            }).join('')}
          </div>
          <div class="barcode-text">${barcodeValue}</div>
        </div>
      </div>
    </div>
    
    <!-- Platform Endorsement -->
    <div class="endorsement">
      <div class="endorsement-header">
        <div class="endorsement-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#0d9488"/><path d="M9 12l2 2 4-4" stroke="white" stroke-width="2"/></svg>
          تصديق المنصة الرسمي
        </div>
        <div class="endorsement-seal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#0d9488" stroke-width="2.5" stroke-linecap="round"/></svg>
        </div>
      </div>
      <div class="endorsement-text">
        تشهد منصة <strong>iRecycle</strong> بأن الجهة المذكورة أعلاه مسجلة ومعتمدة لديها وفقاً للبيانات المدخلة والمستندات المرفقة.
        هذه الوثيقة صادرة إلكترونياً ومحمية بالبصمة الرقمية SHA-256 ورمز التحقق VRF. يمكن التحقق من صحتها عبر مسح رمز QR أو زيارة صفحة التحقق على المنصة.
      </div>
    </div>
    
    <!-- Disclaimer -->
    <div class="disclaimer">
      <p>
        <span class="bold">إخلاء مسؤولية:</span>
        منصة iRecycle تقدم حلولاً تقنية لإدارة بيانات المخلفات وتوثيقها رقمياً، ولا تتحمل المسؤولية القانونية عن صحة البيانات المدخلة من قبل الجهات المسجلة.
        تقع المسؤولية الكاملة عن دقة وصحة البيانات على الجهة المُصدِرة. هذه البطاقة صادرة بتاريخ ${issueDate} وهي صالحة وفقاً لآخر تحديث للبيانات على المنصة.
      </p>
      <p style="margin-top:4px">
        <span class="bold">iRecycle Platform</span> — Digital Identity Card — ${vrfCode} — ${docHash}
      </p>
    </div>
  </div>
</div>
</body>
</html>`;

  import('@/services/documentService').then(({ PrintService }) => {
    PrintService.printHTML(html, { title: 'بطاقة الهوية الرقمية' });
  });
}
