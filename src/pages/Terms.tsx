import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import { lazy, Suspense } from "react";

const Footer = lazy(() => import("@/components/Footer"));

const Terms = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-28 pb-16 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8 text-foreground">{isAr ? 'شروط الاستخدام' : 'Terms of Use'}</h1>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground">{isAr ? '1. مقدمة' : '1. Introduction'}</h2>
            <p>{isAr ? 'مرحبًا بك في منصة iRecycle لإدارة النفايات. باستخدامك لهذه المنصة، فإنك توافق على الالتزام بهذه الشروط والأحكام. يُرجى قراءتها بعناية قبل استخدام أي من خدماتنا.' : 'Welcome to the iRecycle waste management platform. By using this platform, you agree to comply with these terms and conditions. Please read them carefully before using any of our services.'}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">{isAr ? '2. الخدمات المقدمة' : '2. Services Provided'}</h2>
            <p>{isAr ? 'توفر منصة iRecycle خدمات إدارة النفايات بما في ذلك تتبع الشحنات، إدارة عمليات إعادة التدوير، التقارير البيئية، وتنسيق عمليات النقل وفقًا للقوانين المصرية رقم 4 لسنة 1994 ورقم 202 لسنة 2020.' : 'iRecycle provides waste management services including shipment tracking, recycling operations management, environmental reporting, and transport coordination in compliance with Egyptian laws No. 4/1994 and No. 202/2020.'}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">{isAr ? '3. مسؤوليات المستخدم' : '3. User Responsibilities'}</h2>
            <p>{isAr ? 'يلتزم المستخدم بتقديم معلومات صحيحة ودقيقة، والحفاظ على سرية بيانات حسابه، واستخدام المنصة وفقًا للقوانين واللوائح المعمول بها في جمهورية مصر العربية.' : 'Users are responsible for providing accurate information, maintaining account confidentiality, and using the platform in accordance with applicable laws and regulations of the Arab Republic of Egypt.'}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">{isAr ? '4. حماية البيانات' : '4. Data Protection'}</h2>
            <p>{isAr ? 'نلتزم بحماية بياناتك الشخصية وفقًا لقانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020. لمزيد من التفاصيل، يُرجى مراجعة سياسة الخصوصية الخاصة بنا.' : 'We are committed to protecting your personal data in accordance with Egyptian Personal Data Protection Law No. 151/2020. For more details, please review our Privacy Policy.'}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">{isAr ? '5. تعديل الشروط' : '5. Modification of Terms'}</h2>
            <p>{isAr ? 'نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطار المستخدمين بأي تغييرات جوهرية عبر البريد الإلكتروني أو من خلال إشعار على المنصة.' : 'We reserve the right to modify these terms at any time. Users will be notified of any material changes via email or platform notification.'}</p>
          </section>
        </div>
      </main>
      <Suspense fallback={null}><Footer /></Suspense>
    </div>
  );
};

export default Terms;
