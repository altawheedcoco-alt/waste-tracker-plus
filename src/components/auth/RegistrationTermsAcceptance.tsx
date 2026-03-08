/**
 * RegistrationTermsAcceptance — شروط وأحكام التسجيل الإلزامية
 * يجب الموافقة عليها قبل إتمام التسجيل لأي نوع حساب
 */
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Shield, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccountType = 'jobseeker' | 'driver' | 'company';

interface RegistrationTermsAcceptanceProps {
  accountType: AccountType;
  onAcceptChange: (accepted: boolean) => void;
  className?: string;
}

const sharedTerms = [
  'أقر بصحة ودقة واكتمال جميع البيانات المقدمة وأتحمل المسؤولية القانونية الكاملة عن أي خطأ أو تضليل.',
  'أفهم أن منصة iRecycle تقدم حلولاً برمجية تقنية فقط (SaaS) ولا تتحمل أي مسؤولية قانونية عن العمليات التشغيلية أو التعاقدات بين الأطراف.',
  'أقبل بأن المنصة جهة وسيطة تقنية وليست طرفاً في أي تعاقد أو عملية تتم من خلالها.',
  'ألتزم بجميع معايير السلامة والصحة المهنية المعمول بها وفقاً للقوانين المصرية.',
  'ألتزم بجميع المعايير البيئية وقوانين تنظيم إدارة المخلفات (قانون 202 لسنة 2020 ولائحته التنفيذية).',
  'أوافق على أن بياناتي ستكون مرئية للأطراف المرتبطة بي داخل المنصة وفقاً لإعدادات الخصوصية.',
  'أفهم أن حسابي يخضع للمراجعة الإدارية ولن يتم تفعيله إلا بعد استيفاء كافة المتطلبات والموافقة عليه.',
  'أوافق على سياسة الخصوصية وشروط الاستخدام الخاصة بالمنصة.',
];

const jobseekerTerms = [
  'أقر بأن بياناتي الشخصية وسيرتي الذاتية ستكون متاحة لجميع الجهات والأعضاء المسجلين في المنصة للاطلاع عليها.',
  'أفهم أن المنصة لا تضمن الحصول على فرص عمل وأن التوظيف يتم بين الباحث والجهة مباشرة.',
  'ألتزم بتقديم معلومات صحيحة عن مؤهلاتي وخبراتي المهنية.',
];

const driverTerms = [
  'أقر بأن بياناتي وبيانات مركبتي ستكون مرئية لجميع الجهات والأعضاء في المنصة.',
  'ألتزم بجميع معايير السلامة أثناء نقل المخلفات وفقاً للقوانين واللوائح المعمول بها.',
  'أقر بأنني أحمل رخصة قيادة سارية ومناسبة لنوع المركبة المسجلة.',
  'أفهم أن الشحنات المرسلة إلي تتطلب القبول خلال 15 دقيقة وإلا سيتم تحويلها لسائق آخر.',
  'ألتزم بالحفاظ على سرية بيانات الشحنات وعدم إفشائها لأطراف غير مصرح لها.',
  'أتحمل المسؤولية الكاملة عن سلامة الحمولة من لحظة الاستلام حتى التسليم.',
];

const companyTerms = [
  'أقر بأنني المفوض القانوني أو الممثل الرسمي للجهة المسجلة وأملك صلاحية التسجيل نيابة عنها.',
  'ألتزم برفع جميع المستندات المطلوبة (السجل التجاري، الترخيص البيئي، صورة البطاقة) خلال الفترة المحددة.',
  'أفهم أن الحساب لن يتم تفعيله إلا بعد رفع المستندات ودفع رسوم الاشتراك والموافقة الإدارية.',
  'ألتزم بتحديث بيانات الجهة والتراخيص فور تجديدها أو تغييرها.',
  'أقر بمسؤوليتي عن جميع العمليات التي تتم من خلال حساب الجهة على المنصة.',
  'أوافق على أن بيانات الجهة ستكون مرئية للأطراف المرتبطة بها (شركاء، ناقلين، مدورين) وفقاً لإعدادات الخصوصية.',
];

const getTermsForType = (type: AccountType): string[] => {
  switch (type) {
    case 'jobseeker': return [...sharedTerms, ...jobseekerTerms];
    case 'driver': return [...sharedTerms, ...driverTerms];
    case 'company': return [...sharedTerms, ...companyTerms];
  }
};

const getTypeLabel = (type: AccountType): string => {
  switch (type) {
    case 'jobseeker': return 'باحث عن عمل';
    case 'driver': return 'سائق مستقل';
    case 'company': return 'جهة / شركة';
  }
};

const RegistrationTermsAcceptance = ({
  accountType,
  onAcceptChange,
  className,
}: RegistrationTermsAcceptanceProps) => {
  const [accepted, setAccepted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const terms = getTermsForType(accountType);

  const handleChange = (checked: boolean) => {
    setAccepted(checked);
    onAcceptChange(checked);
  };

  return (
    <div
      className={cn(
        'rounded-xl border-2 transition-all duration-300',
        accepted
          ? 'border-primary/40 bg-primary/5'
          : 'border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20',
        className
      )}
      dir="rtl"
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-right"
      >
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
            الشروط والأحكام — {getTypeLabel(accountType)}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Expandable terms list */}
      {expanded && (
        <div className="px-3 pb-2">
          <ScrollArea className="h-[200px] rounded-lg border border-border/30 bg-background/50 p-3">
            <div className="space-y-2.5">
              {terms.map((term, i) => (
                <div key={i} className="flex gap-2 text-[11px] leading-relaxed text-muted-foreground">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span>{term}</span>
                </div>
              ))}
            </div>

            {/* إخلاء مسؤولية المنصة */}
            <div className="mt-4 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20">
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                <span className="text-[11px] font-bold text-destructive">إخلاء مسؤولية</span>
              </div>
              <p className="text-[10px] leading-relaxed text-destructive/80">
                منصة iRecycle هي جهة وسيطة تقنية (SaaS) تقدم حلولاً برمجية لإدارة المخلفات فقط. لا تتحمل المنصة
                أي مسؤولية قانونية — مدنية أو جنائية — عن دقة البيانات المدخلة أو طبيعة المواد المنقولة فعلياً
                أو أي مخالفة لقوانين البيئة أو السلامة من قبل المستخدمين. المسؤولية الكاملة تقع على عاتق
                المستخدم/الجهة المسجلة وفقاً للقوانين المصرية المعمول بها.
              </p>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Checkbox */}
      <div className="px-3 pb-3">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <Checkbox
            checked={accepted}
            onCheckedChange={(checked) => handleChange(!!checked)}
            className="mt-0.5"
          />
          <span className="text-[11px] leading-relaxed text-foreground/80">
            أقر بأنني قرأت وفهمت جميع{' '}
            <button type="button" onClick={() => setExpanded(true)} className="text-primary font-semibold underline underline-offset-2">
              الشروط والأحكام وسياسة إخلاء المسؤولية
            </button>{' '}
            وأوافق عليها بالكامل، وأتحمل المسؤولية القانونية الكاملة عن صحة بياناتي.
          </span>
        </label>
      </div>
    </div>
  );
};

export default RegistrationTermsAcceptance;
