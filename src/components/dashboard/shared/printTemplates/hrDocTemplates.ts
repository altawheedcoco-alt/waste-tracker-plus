import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface HRDocData {
  orgName: string;
  orgAddress?: string;
  orgPhone?: string;
  orgLogo?: string;
  employeeName: string;
  employeeTitle?: string;
  employeeDepartment?: string;
  employeeId?: string;
  employeeNationalId?: string;
  joinDate?: string;
  salary?: number;
  currency?: string;
  endDate?: string;
  leaveType?: string;
  leaveFrom?: string;
  leaveTo?: string;
  leaveDays?: number;
  targetEntity?: string; // بنك، سفارة، إلخ
}

const commonStyles = `
  @page { size: A4; margin: 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 14px; color: #1a1a1a; direction: rtl; line-height: 1.8; }
  .page { max-width: 700px; margin: 0 auto; padding: 40px; }
  .header { text-align: center; border-bottom: 3px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { font-size: 22px; color: #059669; margin-bottom: 4px; }
  .header .org-name { font-size: 18px; font-weight: bold; color: #333; }
  .header .org-info { font-size: 12px; color: #666; margin-top: 4px; }
  .doc-title { text-align: center; font-size: 20px; font-weight: bold; color: #059669; margin: 30px 0; border: 2px solid #059669; padding: 12px 30px; display: inline-block; border-radius: 8px; }
  .doc-title-wrap { text-align: center; margin: 20px 0 30px; }
  .ref-date { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; color: #555; }
  .body-text { font-size: 15px; line-height: 2; text-align: justify; margin-bottom: 20px; }
  .body-text strong { color: #059669; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: transparent !important; }
  .info-table th { background: rgba(240,253,244,0.55) !important; color: #059669; padding: 10px 14px; text-align: right; border: 1px solid #d1d5db; font-size: 13px; width: 35%; }
  .info-table td { padding: 10px 14px; border: 1px solid #d1d5db; font-size: 14px; background: transparent !important; }
  .signature-section { margin-top: 60px; display: flex; justify-content: space-between; }
  .signature-box { text-align: center; width: 200px; }
  .signature-box .line { border-top: 1px solid #333; margin-top: 50px; padding-top: 8px; font-size: 13px; color: #555; }
  .stamp-area { text-align: center; margin-top: 40px; padding: 20px; border: 2px dashed #d1d5db; border-radius: 8px; color: #999; font-size: 12px; }
  .footer { margin-top: 40px; padding-top: 15px; border-top: 2px solid #059669; font-size: 10px; color: #999; text-align: center; }
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(5, 150, 105, 0.05); font-weight: bold; z-index: -1; pointer-events: none; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
`;

const today = () => format(new Date(), 'dd MMMM yyyy', { locale: ar });
const todayHijri = () => format(new Date(), 'yyyy/MM/dd');

const docHeader = (d: HRDocData) => `
  <div class="header">
    <h1>${d.orgName}</h1>
    ${d.orgAddress ? `<div class="org-info">${d.orgAddress}</div>` : ''}
    ${d.orgPhone ? `<div class="org-info">هاتف: ${d.orgPhone}</div>` : ''}
  </div>
`;

const docFooter = (d: HRDocData) => `
  <div class="footer">
    <p>هذا المستند صادر من نظام آي ريسايكل — ${d.orgName} — ${todayHijri()}</p>
    <p>لا يعتد بهذا المستند بدون ختم وتوقيع المسؤول المختص</p>
  </div>
`;

const signatureSection = () => `
  <div class="signature-section">
    <div class="signature-box">
      <div class="line">توقيع المدير المسؤول</div>
    </div>
    <div class="signature-box">
      <div class="line">الختم الرسمي</div>
    </div>
  </div>
`;

// ═══════════════════════════════════════
// 1. شهادة راتب
// ═══════════════════════════════════════
export const generateSalaryCertificate = (d: HRDocData): string => `
<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>شهادة راتب</title>
<style>${commonStyles}</style></head><body>
<div class="watermark">شهادة راتب</div>
<div class="page">
  ${docHeader(d)}
  <div class="ref-date">
    <span>الرقم المرجعي: SC-${Date.now().toString(36).toUpperCase()}</span>
    <span>التاريخ: ${today()}</span>
  </div>
  <div class="doc-title-wrap"><div class="doc-title">شهادة تعريف بالراتب</div></div>
  
  <p class="body-text">
    ${d.targetEntity ? `إلى: <strong>${d.targetEntity}</strong><br><br>` : ''}
    تشهد <strong>${d.orgName}</strong> بأن السيد/ السيدة <strong>${d.employeeName}</strong>
    يعمل لديها بوظيفة <strong>${d.employeeTitle || 'موظف'}</strong>
    ${d.employeeDepartment ? `بقسم <strong>${d.employeeDepartment}</strong>` : ''}
    ${d.joinDate ? `وذلك اعتباراً من <strong>${d.joinDate}</strong>` : ''}
    وما زال على رأس العمل حتى تاريخه.
  </p>

  <table class="info-table">
    <tr><th>اسم الموظف</th><td>${d.employeeName}</td></tr>
    <tr><th>المسمى الوظيفي</th><td>${d.employeeTitle || '-'}</td></tr>
    ${d.employeeDepartment ? `<tr><th>القسم / الإدارة</th><td>${d.employeeDepartment}</td></tr>` : ''}
    ${d.employeeId ? `<tr><th>الرقم الوظيفي</th><td>${d.employeeId}</td></tr>` : ''}
    ${d.employeeNationalId ? `<tr><th>الرقم القومي</th><td>${d.employeeNationalId}</td></tr>` : ''}
    ${d.joinDate ? `<tr><th>تاريخ الالتحاق</th><td>${d.joinDate}</td></tr>` : ''}
    <tr><th>الراتب الأساسي</th><td><strong>${d.salary?.toLocaleString('ar-EG') || '---'} ${d.currency || 'جنيه مصري'}</strong></td></tr>
  </table>

  <p class="body-text">
    أُعطيت هذه الشهادة بناءً على طلب المعني بالأمر دون أدنى مسؤولية على الشركة.
  </p>

  ${signatureSection()}
  ${docFooter(d)}
</div></body></html>`;

// ═══════════════════════════════════════
// 2. شهادة خبرة
// ═══════════════════════════════════════
export const generateExperienceCertificate = (d: HRDocData): string => `
<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>شهادة خبرة</title>
<style>${commonStyles}</style></head><body>
<div class="watermark">شهادة خبرة</div>
<div class="page">
  ${docHeader(d)}
  <div class="ref-date">
    <span>الرقم المرجعي: EX-${Date.now().toString(36).toUpperCase()}</span>
    <span>التاريخ: ${today()}</span>
  </div>
  <div class="doc-title-wrap"><div class="doc-title">شهادة خبرة</div></div>

  <p class="body-text">
    ${d.targetEntity ? `إلى من يهمه الأمر،<br><br>` : 'إلى من يهمه الأمر،<br><br>'}
    تشهد <strong>${d.orgName}</strong> بأن السيد/ السيدة <strong>${d.employeeName}</strong>
    قد عمل لديها بوظيفة <strong>${d.employeeTitle || 'موظف'}</strong>
    ${d.employeeDepartment ? `في قسم <strong>${d.employeeDepartment}</strong>` : ''}
    ${d.joinDate ? `وذلك في الفترة من <strong>${d.joinDate}</strong>` : ''}
    ${d.endDate ? `إلى <strong>${d.endDate}</strong>` : 'وحتى تاريخه'}.
  </p>

  <table class="info-table">
    <tr><th>اسم الموظف</th><td>${d.employeeName}</td></tr>
    <tr><th>المسمى الوظيفي</th><td>${d.employeeTitle || '-'}</td></tr>
    ${d.employeeDepartment ? `<tr><th>القسم / الإدارة</th><td>${d.employeeDepartment}</td></tr>` : ''}
    ${d.joinDate ? `<tr><th>تاريخ بداية العمل</th><td>${d.joinDate}</td></tr>` : ''}
    <tr><th>تاريخ نهاية العمل</th><td>${d.endDate || 'لا يزال على رأس العمل'}</td></tr>
  </table>

  <p class="body-text">
    وقد أثبت كفاءة وانضباطاً خلال فترة عمله، وأُعطيت هذه الشهادة بناءً على طلبه دون أدنى مسؤولية على الشركة.
    <br><br>
    نتمنى له كل التوفيق والنجاح.
  </p>

  ${signatureSection()}
  ${docFooter(d)}
</div></body></html>`;

// ═══════════════════════════════════════
// 3. طلب إجازة
// ═══════════════════════════════════════
export const generateLeaveRequest = (d: HRDocData): string => `
<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>طلب إجازة</title>
<style>${commonStyles}
  .approval-box { margin-top: 30px; border: 1px solid #d1d5db; border-radius: 8px; padding: 20px; }
  .approval-box h3 { color: #059669; margin-bottom: 10px; font-size: 15px; }
  .approval-row { display: flex; gap: 30px; margin-top: 15px; }
  .approval-item { flex: 1; }
  .checkbox-line { display: flex; align-items: center; gap: 8px; margin: 8px 0; }
  .checkbox { width: 16px; height: 16px; border: 2px solid #059669; display: inline-block; border-radius: 3px; }
</style></head><body>
<div class="page">
  ${docHeader(d)}
  <div class="ref-date">
    <span>الرقم المرجعي: LR-${Date.now().toString(36).toUpperCase()}</span>
    <span>التاريخ: ${today()}</span>
  </div>
  <div class="doc-title-wrap"><div class="doc-title">نموذج طلب إجازة</div></div>

  <table class="info-table">
    <tr><th>اسم الموظف</th><td>${d.employeeName}</td></tr>
    ${d.employeeId ? `<tr><th>الرقم الوظيفي</th><td>${d.employeeId}</td></tr>` : ''}
    <tr><th>المسمى الوظيفي</th><td>${d.employeeTitle || '-'}</td></tr>
    ${d.employeeDepartment ? `<tr><th>القسم / الإدارة</th><td>${d.employeeDepartment}</td></tr>` : ''}
    <tr><th>نوع الإجازة</th><td><strong>${d.leaveType || 'سنوية'}</strong></td></tr>
    <tr><th>من تاريخ</th><td>${d.leaveFrom || '____/____/________'}</td></tr>
    <tr><th>إلى تاريخ</th><td>${d.leaveTo || '____/____/________'}</td></tr>
    <tr><th>عدد الأيام</th><td>${d.leaveDays || '______'} يوم</td></tr>
  </table>

  <div class="approval-box">
    <h3>قرار الإدارة</h3>
    <div class="approval-row">
      <div class="approval-item">
        <div class="checkbox-line"><span class="checkbox"></span> موافقة</div>
        <div class="checkbox-line"><span class="checkbox"></span> رفض</div>
        <div class="checkbox-line"><span class="checkbox"></span> تعديل المدة إلى: _______ يوم</div>
      </div>
    </div>
    <div style="margin-top: 15px;">
      <p style="font-size: 13px; color: #555;">ملاحظات: _______________________________________________</p>
    </div>
  </div>

  ${signatureSection()}
  ${docFooter(d)}
</div></body></html>`;

// ═══════════════════════════════════════
// 4. خطاب تعريف بالعمل
// ═══════════════════════════════════════
export const generateEmploymentLetter = (d: HRDocData): string => `
<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>خطاب تعريف بالعمل</title>
<style>${commonStyles}</style></head><body>
<div class="watermark">خطاب رسمي</div>
<div class="page">
  ${docHeader(d)}
  <div class="ref-date">
    <span>الرقم المرجعي: EL-${Date.now().toString(36).toUpperCase()}</span>
    <span>التاريخ: ${today()}</span>
  </div>
  <div class="doc-title-wrap"><div class="doc-title">خطاب تعريف بالعمل</div></div>

  <p class="body-text">
    ${d.targetEntity ? `إلى السادة/ <strong>${d.targetEntity}</strong>` : 'إلى من يهمه الأمر'}
    <br><br>
    تحية طيبة وبعد،
    <br><br>
    نحيط سيادتكم علماً بأن السيد/ السيدة <strong>${d.employeeName}</strong>
    ${d.employeeNationalId ? `والذي يحمل الرقم القومي <strong>${d.employeeNationalId}</strong>` : ''}
    يعمل لدى <strong>${d.orgName}</strong> بوظيفة <strong>${d.employeeTitle || 'موظف'}</strong>
    ${d.employeeDepartment ? `بقسم <strong>${d.employeeDepartment}</strong>` : ''}
    ${d.joinDate ? `وذلك اعتباراً من <strong>${d.joinDate}</strong>` : ''}
    وما زال على رأس العمل حتى تاريخه.
  </p>

  <table class="info-table">
    <tr><th>اسم الموظف</th><td>${d.employeeName}</td></tr>
    <tr><th>المسمى الوظيفي</th><td>${d.employeeTitle || '-'}</td></tr>
    ${d.employeeDepartment ? `<tr><th>القسم / الإدارة</th><td>${d.employeeDepartment}</td></tr>` : ''}
    ${d.employeeNationalId ? `<tr><th>الرقم القومي</th><td>${d.employeeNationalId}</td></tr>` : ''}
    ${d.employeeId ? `<tr><th>الرقم الوظيفي</th><td>${d.employeeId}</td></tr>` : ''}
    ${d.joinDate ? `<tr><th>تاريخ الالتحاق</th><td>${d.joinDate}</td></tr>` : ''}
    <tr><th>حالة الموظف</th><td><strong>على رأس العمل</strong></td></tr>
  </table>

  <p class="body-text">
    أُعطي هذا الخطاب بناءً على طلب المعني بالأمر لتقديمه إلى الجهة المختصة دون أدنى مسؤولية مالية أو قانونية على الشركة.
    <br><br>
    وتفضلوا بقبول فائق الاحترام والتقدير.
  </p>

  ${signatureSection()}
  ${docFooter(d)}
</div></body></html>`;

// ═══════════════════════════════════════
// 5. إفادة عمل (إثبات أنك على رأس العمل)
// ═══════════════════════════════════════
export const generateWorkConfirmation = (d: HRDocData): string => `
<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>إفادة عمل</title>
<style>${commonStyles}</style></head><body>
<div class="watermark">إفادة</div>
<div class="page">
  ${docHeader(d)}
  <div class="ref-date">
    <span>الرقم المرجعي: WC-${Date.now().toString(36).toUpperCase()}</span>
    <span>التاريخ: ${today()}</span>
  </div>
  <div class="doc-title-wrap"><div class="doc-title">إفادة عمل</div></div>

  <p class="body-text">
    ${d.targetEntity ? `إلى السادة/ <strong>${d.targetEntity}</strong>` : 'إلى من يهمه الأمر'}
    <br><br>
    تحية طيبة وبعد،
    <br><br>
    تفيد <strong>${d.orgName}</strong> بأن السيد/ السيدة <strong>${d.employeeName}</strong>
    يعمل لديها بوظيفة <strong>${d.employeeTitle || 'موظف'}</strong> وما زال على رأس العمل حتى تاريخه.
  </p>

  <p class="body-text">
    أُعطيت هذه الإفادة بناءً على طلب صاحب الشأن لتقديمها للجهة المعنية.
  </p>

  ${signatureSection()}
  ${docFooter(d)}
</div></body></html>`;

// ═══════════════════════════════════════
// 6. كشف حساب إجازات
// ═══════════════════════════════════════
export const generateLeaveBalance = (d: HRDocData & { 
  annualBalance?: number; annualUsed?: number; sickBalance?: number; sickUsed?: number;
}): string => `
<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>كشف حساب إجازات</title>
<style>${commonStyles}
  .balance-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
  .balance-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 20px; text-align: center; }
  .balance-value { font-size: 28px; font-weight: bold; color: #059669; }
  .balance-label { font-size: 12px; color: #666; margin-top: 4px; }
</style></head><body>
<div class="page">
  ${docHeader(d)}
  <div class="ref-date">
    <span>الرقم المرجعي: LB-${Date.now().toString(36).toUpperCase()}</span>
    <span>التاريخ: ${today()}</span>
  </div>
  <div class="doc-title-wrap"><div class="doc-title">كشف حساب الإجازات</div></div>

  <table class="info-table">
    <tr><th>اسم الموظف</th><td>${d.employeeName}</td></tr>
    <tr><th>المسمى الوظيفي</th><td>${d.employeeTitle || '-'}</td></tr>
    ${d.joinDate ? `<tr><th>تاريخ الالتحاق</th><td>${d.joinDate}</td></tr>` : ''}
  </table>

  <div class="balance-grid">
    <div class="balance-card">
      <div class="balance-value">${d.annualBalance ?? 21}</div>
      <div class="balance-label">رصيد الإجازة السنوية</div>
    </div>
    <div class="balance-card">
      <div class="balance-value">${d.annualUsed ?? 0}</div>
      <div class="balance-label">المستخدم من الإجازة السنوية</div>
    </div>
    <div class="balance-card">
      <div class="balance-value">${d.sickBalance ?? 30}</div>
      <div class="balance-label">رصيد الإجازة المرضية</div>
    </div>
    <div class="balance-card">
      <div class="balance-value">${d.sickUsed ?? 0}</div>
      <div class="balance-label">المستخدم من الإجازة المرضية</div>
    </div>
  </div>

  <p class="body-text" style="margin-top: 20px;">
    * الأرصدة محسوبة حتى تاريخ ${today()}
  </p>

  ${signatureSection()}
  ${docFooter(d)}
</div></body></html>`;

export type { HRDocData };
