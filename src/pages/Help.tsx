import { useLanguage } from "@/contexts/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import Header from "@/components/Header";
import { lazy, Suspense, useState } from "react";
import { ChevronDown, Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import PageNavBar from "@/components/ui/page-nav-bar";

const Footer = lazy(() => import("@/components/Footer"));

const faqs = {
  ar: [
    { q: 'ما هي منصة iRecycle؟', a: 'منصة متكاملة لإدارة النفايات وإعادة التدوير في مصر، تربط المولّدين والناقلين والمدوّرين في منظومة رقمية واحدة تلتزم بالقوانين المصرية.' },
    { q: 'كيف أسجل حسابًا جديدًا؟', a: 'اضغط على "تسجيل الدخول" في أعلى الصفحة، ثم اختر "إنشاء حساب جديد". أدخل بيانات المنشأة والبريد الإلكتروني وكلمة المرور.' },
    { q: 'هل المنصة مجانية؟', a: 'يمكنك التسجيل واستكشاف المنصة مجانًا. الخطط المدفوعة توفر ميزات إضافية مثل التقارير المتقدمة وإدارة الأسطول.' },
    { q: 'كيف أتتبع شحنة؟', a: 'من لوحة التحكم، انتقل إلى قسم "الشحنات" واختر الشحنة المطلوبة. يمكنك أيضًا استخدام صفحة التتبع العام بإدخال رقم الشحنة.' },
    { q: 'ما أنواع النفايات المدعومة؟', a: 'ندعم جميع أنواع النفايات طبقًا للقانون المصري: بلدية، صناعية، طبية، إلكترونية، خطرة، وغير خطرة، مع تصنيف دقيق لكل نوع.' },
    { q: 'كيف أبلغ عن تجمع نفايات؟', a: 'استخدم صفحة "الخريطة" واضغط على زر "أبلغ عن تجمع نفايات"، ثم حدد الموقع وأضف التفاصيل.' },
  ],
  en: [
    { q: 'What is iRecycle?', a: 'An integrated waste management and recycling platform in Egypt that connects generators, transporters, and recyclers in a single digital ecosystem compliant with Egyptian laws.' },
    { q: 'How do I register?', a: 'Click "Login" at the top of the page, then choose "Create New Account". Enter your organization details, email, and password.' },
    { q: 'Is the platform free?', a: 'You can register and explore for free. Paid plans offer additional features like advanced reports and fleet management.' },
    { q: 'How do I track a shipment?', a: 'From the dashboard, go to "Shipments" and select the desired shipment. You can also use the public tracking page by entering the shipment number.' },
    { q: 'What waste types are supported?', a: 'We support all waste types per Egyptian law: municipal, industrial, medical, electronic, hazardous, and non-hazardous, with detailed classification for each type.' },
    { q: 'How do I report illegal dumping?', a: 'Use the "Map" page and click "Report Waste Dumping", then mark the location and add details.' },
  ],
};

const Help = () => {
  const { language } = useLanguage();
  usePageTitle(language === 'ar' ? 'مركز المساعدة' : 'Help Center');
  const isAr = language === 'ar';
  const faqList = faqs[language] || faqs.ar;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 pt-28 pb-16 max-w-3xl">
        <PageNavBar className="mb-6" />
        <h1 className="text-3xl font-bold mb-2 text-foreground">{isAr ? 'مركز المساعدة' : 'Help Center'}</h1>
        <p className="text-muted-foreground mb-10">{isAr ? 'ابحث عن إجابات لأسئلتك أو تواصل معنا' : 'Find answers to your questions or contact us'}</p>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-5 text-foreground">{isAr ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}</h2>
          <div className="space-y-3">
            {faqList.map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-xl font-semibold mb-5 text-foreground">{isAr ? 'تواصل معنا' : 'Contact Us'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ContactCard icon={Mail} title={isAr ? 'البريد الإلكتروني' : 'Email'} value="info@irecycle.eg" />
            <ContactCard icon={Phone} title={isAr ? 'الهاتف' : 'Phone'} value="+20 2 1234 5678" />
            <ContactCard icon={MapPin} title={isAr ? 'العنوان' : 'Address'} value={isAr ? 'القاهرة، مصر' : 'Cairo, Egypt'} />
            <ContactCard icon={MessageCircle} title={isAr ? 'الدعم المباشر' : 'Live Support'} value={isAr ? 'متاح 24/7' : 'Available 24/7'} />
          </div>
        </section>
      </main>
      <Suspense fallback={null}><Footer /></Suspense>
    </div>
  );
};

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full p-4 text-start font-medium text-foreground hover:bg-accent/30 transition-colors">
        {question}
        <ChevronDown className={`w-4 h-4 flex-shrink-0 ms-2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed animate-fade-in">{answer}</div>}
    </div>
  );
};

const ContactCard = ({ icon: Icon, title, value }: { icon: React.ElementType; title: string; value: string }) => (
  <div className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-accent/20">
    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  </div>
);

export default Help;
