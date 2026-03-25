import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import { lazy, Suspense } from "react";
import PageNavBar from "@/components/ui/page-nav-bar";
const Footer = lazy(() => import("@/components/Footer"));

const Privacy = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 pt-28 pb-16 max-w-3xl">
        <PageNavBar className="mb-6" />
        <h1 className="text-3xl font-bold mb-8 text-foreground">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</h1>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground">{isAr ? '1. جمع البيانات' : '1. Data Collection'}</h2>
            <p>{isAr ? 'نجمع البيانات الضرورية لتقديم خدماتنا بما في ذلك: بيانات التسجيل، معلومات الشحنات، بيانات الموقع الجغرافي، وسجلات النشاط على المنصة.' : 'We collect data necessary to provide our services including: registration data, shipment information, geolocation data, and platform activity logs.'}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">{isAr ? '2. استخدام البيانات' : '2. Data Usage'}</h2>
            <p>{isAr ? 'نستخدم بياناتك لتحسين خدماتنا، تتبع الشحنات، إصدار التقارير البيئية، والامتثال للمتطلبات القانونية والتنظيمية في مصر.' : 'We use your data to improve our services, track shipments, generate environmental reports, and comply with legal and regulatory requirements in Egypt.'}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">{isAr ? '3. حماية البيانات' : '3. Data Protection'}</h2>
            <p>{isAr ? 'نطبق أعلى معايير الأمان لحماية بياناتك الشخصية، بما في ذلك التشفير، والتحكم في الوصول، والنسخ الاحتياطي المنتظم، وفقًا لقانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020.' : 'We implement the highest security standards to protect your personal data, including encryption, access control, and regular backups, in compliance with Egyptian Personal Data Protection Law No. 151/2020.'}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">{isAr ? '4. مشاركة البيانات' : '4. Data Sharing'}</h2>
            <p>{isAr ? 'لا نشارك بياناتك مع أطراف ثالثة إلا في الحالات التالية: بموافقتك الصريحة، للامتثال لأوامر قضائية، أو لتنفيذ التزاماتنا القانونية تجاه الجهات الرقابية مثل جهاز شؤون البيئة المصري (EEAA).' : 'We do not share your data with third parties except: with your explicit consent, to comply with court orders, or to fulfill legal obligations to regulatory bodies such as the Egyptian Environmental Affairs Agency (EEAA).'}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">{isAr ? '5. حقوقك' : '5. Your Rights'}</h2>
            <p>{isAr ? 'يحق لك الوصول إلى بياناتك الشخصية، تصحيحها، حذفها، أو تقييد معالجتها. للاستفسار، يُرجى التواصل معنا عبر info@irecycle.eg.' : 'You have the right to access, correct, delete, or restrict the processing of your personal data. For inquiries, please contact us at info@irecycle.eg.'}</p>
          </section>
        </div>
      </main>
      <Suspense fallback={null}><Footer /></Suspense>
    </div>
  );
};

export default Privacy;
