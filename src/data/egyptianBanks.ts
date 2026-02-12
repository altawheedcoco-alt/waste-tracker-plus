// قاعدة بيانات البنوك المصرية وفروعها الرئيسية
export interface BankBranch {
  name: string;
  city: string;
  area?: string;
  address?: string;
}

export interface EgyptianBank {
  id: string;
  name: string;
  nameEn: string;
  shortName?: string;
  logo?: string;
  branches: BankBranch[];
}

export const egyptianBanks: EgyptianBank[] = [
  {
    id: 'nbe',
    name: 'البنك الأهلي المصري',
    nameEn: 'National Bank of Egypt',
    shortName: 'NBE',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة', area: 'وسط البلد' },
      { name: 'فرع مدينة نصر', city: 'القاهرة', area: 'مدينة نصر' },
      { name: 'فرع المعادي', city: 'القاهرة', area: 'المعادي' },
      { name: 'فرع مصر الجديدة', city: 'القاهرة', area: 'مصر الجديدة' },
      { name: 'فرع الدقي', city: 'الجيزة', area: 'الدقي' },
      { name: 'فرع المهندسين', city: 'الجيزة', area: 'المهندسين' },
      { name: 'فرع العاشر من رمضان', city: 'الشرقية', area: 'العاشر من رمضان' },
      { name: 'فرع السادس من أكتوبر', city: 'الجيزة', area: '6 أكتوبر' },
      { name: 'فرع الإسكندرية الرئيسي', city: 'الإسكندرية', area: 'محطة الرمل' },
      { name: 'فرع سموحة', city: 'الإسكندرية', area: 'سموحة' },
      { name: 'فرع المنصورة', city: 'الدقهلية', area: 'المنصورة' },
      { name: 'فرع طنطا', city: 'الغربية', area: 'طنطا' },
      { name: 'فرع أسيوط', city: 'أسيوط' },
      { name: 'فرع الأقصر', city: 'الأقصر' },
      { name: 'فرع أسوان', city: 'أسوان' },
      { name: 'فرع بورسعيد', city: 'بورسعيد' },
      { name: 'فرع السويس', city: 'السويس' },
      { name: 'فرع الإسماعيلية', city: 'الإسماعيلية' },
      { name: 'فرع دمياط', city: 'دمياط' },
      { name: 'فرع الفيوم', city: 'الفيوم' },
      { name: 'فرع بني سويف', city: 'بني سويف' },
      { name: 'فرع المنيا', city: 'المنيا' },
      { name: 'فرع سوهاج', city: 'سوهاج' },
      { name: 'فرع قنا', city: 'قنا' },
      { name: 'فرع الزقازيق', city: 'الشرقية', area: 'الزقازيق' },
      { name: 'فرع شبرا الخيمة', city: 'القليوبية', area: 'شبرا الخيمة' },
      { name: 'فرع التجمع الخامس', city: 'القاهرة', area: 'التجمع الخامس' },
      { name: 'فرع الشيخ زايد', city: 'الجيزة', area: 'الشيخ زايد' },
      { name: 'فرع العاصمة الإدارية', city: 'القاهرة', area: 'العاصمة الإدارية الجديدة' },
    ],
  },
  {
    id: 'banque_misr',
    name: 'بنك مصر',
    nameEn: 'Banque Misr',
    shortName: 'BM',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة', area: 'وسط البلد' },
      { name: 'فرع مدينة نصر', city: 'القاهرة', area: 'مدينة نصر' },
      { name: 'فرع المعادي', city: 'القاهرة', area: 'المعادي' },
      { name: 'فرع مصر الجديدة', city: 'القاهرة', area: 'مصر الجديدة' },
      { name: 'فرع الدقي', city: 'الجيزة', area: 'الدقي' },
      { name: 'فرع المهندسين', city: 'الجيزة', area: 'المهندسين' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
      { name: 'فرع المنصورة', city: 'الدقهلية' },
      { name: 'فرع طنطا', city: 'الغربية' },
      { name: 'فرع الزقازيق', city: 'الشرقية' },
      { name: 'فرع بورسعيد', city: 'بورسعيد' },
      { name: 'فرع أسيوط', city: 'أسيوط' },
      { name: 'فرع السويس', city: 'السويس' },
      { name: 'فرع التجمع الخامس', city: 'القاهرة', area: 'التجمع الخامس' },
      { name: 'فرع 6 أكتوبر', city: 'الجيزة', area: '6 أكتوبر' },
      { name: 'فرع العاشر من رمضان', city: 'الشرقية' },
      { name: 'فرع سوهاج', city: 'سوهاج' },
      { name: 'فرع الأقصر', city: 'الأقصر' },
      { name: 'فرع أسوان', city: 'أسوان' },
      { name: 'فرع شبرا', city: 'القاهرة', area: 'شبرا' },
    ],
  },
  {
    id: 'cib',
    name: 'البنك التجاري الدولي',
    nameEn: 'Commercial International Bank',
    shortName: 'CIB',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة', area: 'جاردن سيتي' },
      { name: 'فرع مدينة نصر', city: 'القاهرة', area: 'مدينة نصر' },
      { name: 'فرع المعادي', city: 'القاهرة', area: 'المعادي' },
      { name: 'فرع مصر الجديدة', city: 'القاهرة', area: 'مصر الجديدة' },
      { name: 'فرع الدقي', city: 'الجيزة', area: 'الدقي' },
      { name: 'فرع المهندسين', city: 'الجيزة', area: 'المهندسين' },
      { name: 'فرع التجمع الخامس', city: 'القاهرة', area: 'التجمع الخامس' },
      { name: 'فرع الشيخ زايد', city: 'الجيزة', area: 'الشيخ زايد' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
      { name: 'فرع المنصورة', city: 'الدقهلية' },
      { name: 'فرع 6 أكتوبر', city: 'الجيزة', area: '6 أكتوبر' },
      { name: 'فرع سيتي ستارز', city: 'القاهرة', area: 'مدينة نصر' },
    ],
  },
  {
    id: 'qnb',
    name: 'بنك QNB الأهلي',
    nameEn: 'QNB Alahli',
    shortName: 'QNB',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة', area: 'وسط البلد' },
      { name: 'فرع مدينة نصر', city: 'القاهرة', area: 'مدينة نصر' },
      { name: 'فرع المعادي', city: 'القاهرة', area: 'المعادي' },
      { name: 'فرع مصر الجديدة', city: 'القاهرة', area: 'مصر الجديدة' },
      { name: 'فرع الدقي', city: 'الجيزة' },
      { name: 'فرع المهندسين', city: 'الجيزة' },
      { name: 'فرع التجمع الخامس', city: 'القاهرة' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
      { name: 'فرع طنطا', city: 'الغربية' },
      { name: 'فرع المنصورة', city: 'الدقهلية' },
      { name: 'فرع أسيوط', city: 'أسيوط' },
    ],
  },
  {
    id: 'hsbc',
    name: 'بنك HSBC مصر',
    nameEn: 'HSBC Egypt',
    shortName: 'HSBC',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة', area: 'وسط البلد' },
      { name: 'فرع مدينة نصر', city: 'القاهرة', area: 'مدينة نصر' },
      { name: 'فرع المعادي', city: 'القاهرة', area: 'المعادي' },
      { name: 'فرع التجمع الخامس', city: 'القاهرة' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
    ],
  },
  {
    id: 'alex_bank',
    name: 'بنك الإسكندرية',
    nameEn: 'Bank of Alexandria',
    shortName: 'ALEXBANK',
    branches: [
      { name: 'الفرع الرئيسي', city: 'الإسكندرية' },
      { name: 'فرع القاهرة الرئيسي', city: 'القاهرة', area: 'وسط البلد' },
      { name: 'فرع مدينة نصر', city: 'القاهرة' },
      { name: 'فرع المعادي', city: 'القاهرة' },
      { name: 'فرع المهندسين', city: 'الجيزة' },
      { name: 'فرع المنصورة', city: 'الدقهلية' },
      { name: 'فرع طنطا', city: 'الغربية' },
      { name: 'فرع أسيوط', city: 'أسيوط' },
      { name: 'فرع 6 أكتوبر', city: 'الجيزة' },
      { name: 'فرع بورسعيد', city: 'بورسعيد' },
    ],
  },
  {
    id: 'aaib',
    name: 'المصرف العربي الدولي',
    nameEn: 'Arab African International Bank',
    shortName: 'AAIB',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة', area: 'جاردن سيتي' },
      { name: 'فرع مدينة نصر', city: 'القاهرة' },
      { name: 'فرع المهندسين', city: 'الجيزة' },
      { name: 'فرع التجمع الخامس', city: 'القاهرة' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
    ],
  },
  {
    id: 'arab_bank',
    name: 'البنك العربي',
    nameEn: 'Arab Bank',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة', area: 'وسط البلد' },
      { name: 'فرع مدينة نصر', city: 'القاهرة' },
      { name: 'فرع المعادي', city: 'القاهرة' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
    ],
  },
  {
    id: 'faisal',
    name: 'بنك فيصل الإسلامي',
    nameEn: 'Faisal Islamic Bank',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة', area: 'وسط البلد' },
      { name: 'فرع مدينة نصر', city: 'القاهرة' },
      { name: 'فرع المعادي', city: 'القاهرة' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
      { name: 'فرع المنصورة', city: 'الدقهلية' },
      { name: 'فرع طنطا', city: 'الغربية' },
      { name: 'فرع أسيوط', city: 'أسيوط' },
      { name: 'فرع سوهاج', city: 'سوهاج' },
    ],
  },
  {
    id: 'aib',
    name: 'بنك الاستثمار العربي',
    nameEn: 'Arab Investment Bank',
    shortName: 'AIB',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة' },
      { name: 'فرع مدينة نصر', city: 'القاهرة' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
    ],
  },
  {
    id: 'adib',
    name: 'مصرف أبو ظبي الإسلامي',
    nameEn: 'Abu Dhabi Islamic Bank',
    shortName: 'ADIB',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة' },
      { name: 'فرع مدينة نصر', city: 'القاهرة' },
      { name: 'فرع المعادي', city: 'القاهرة' },
      { name: 'فرع التجمع الخامس', city: 'القاهرة' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
      { name: 'فرع 6 أكتوبر', city: 'الجيزة' },
      { name: 'فرع طنطا', city: 'الغربية' },
    ],
  },
  {
    id: 'fab',
    name: 'بنك أبو ظبي الأول',
    nameEn: 'First Abu Dhabi Bank',
    shortName: 'FAB',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة' },
      { name: 'فرع مدينة نصر', city: 'القاهرة' },
      { name: 'فرع التجمع الخامس', city: 'القاهرة' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
    ],
  },
  {
    id: 'ube',
    name: 'المصرف المتحد',
    nameEn: 'United Bank of Egypt',
    shortName: 'UBE',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة' },
      { name: 'فرع مدينة نصر', city: 'القاهرة' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
      { name: 'فرع المنصورة', city: 'الدقهلية' },
    ],
  },
  {
    id: 'abe',
    name: 'البنك الزراعي المصري',
    nameEn: 'Agricultural Bank of Egypt',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
      { name: 'فرع المنصورة', city: 'الدقهلية' },
      { name: 'فرع طنطا', city: 'الغربية' },
      { name: 'فرع الزقازيق', city: 'الشرقية' },
      { name: 'فرع أسيوط', city: 'أسيوط' },
      { name: 'فرع المنيا', city: 'المنيا' },
      { name: 'فرع سوهاج', city: 'سوهاج' },
      { name: 'فرع قنا', city: 'قنا' },
      { name: 'فرع الأقصر', city: 'الأقصر' },
      { name: 'فرع أسوان', city: 'أسوان' },
      { name: 'فرع الفيوم', city: 'الفيوم' },
      { name: 'فرع بني سويف', city: 'بني سويف' },
      { name: 'فرع دمياط', city: 'دمياط' },
    ],
  },
  {
    id: 'hdb',
    name: 'بنك التعمير والإسكان',
    nameEn: 'Housing & Development Bank',
    shortName: 'HDB',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة' },
      { name: 'فرع مدينة نصر', city: 'القاهرة' },
      { name: 'فرع 6 أكتوبر', city: 'الجيزة' },
      { name: 'فرع التجمع الخامس', city: 'القاهرة' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
      { name: 'فرع المنصورة', city: 'الدقهلية' },
    ],
  },
  {
    id: 'saib',
    name: 'بنك الشركة المصرفية العربية',
    nameEn: 'Société Arabe Internationale de Banque',
    shortName: 'SAIB',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة' },
      { name: 'فرع مدينة نصر', city: 'القاهرة' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
    ],
  },
  {
    id: 'nsgb',
    name: 'بنك كريدي أجريكول',
    nameEn: 'Crédit Agricole Egypt',
    shortName: 'CAE',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة' },
      { name: 'فرع مدينة نصر', city: 'القاهرة' },
      { name: 'فرع المعادي', city: 'القاهرة' },
      { name: 'فرع التجمع الخامس', city: 'القاهرة' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
    ],
  },
  {
    id: 'enbm',
    name: 'بنك مصر إيران للتنمية',
    nameEn: 'Misr Iran Development Bank',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة' },
      { name: 'فرع مدينة نصر', city: 'القاهرة' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
    ],
  },
  {
    id: 'post',
    name: 'البريد المصري (البريد بنك)',
    nameEn: 'Egypt Post (Banque du Caire)',
    branches: [
      { name: 'مكتب بريد عتبة', city: 'القاهرة', area: 'وسط البلد' },
      { name: 'مكتب بريد مدينة نصر', city: 'القاهرة' },
      { name: 'مكتب بريد المعادي', city: 'القاهرة' },
      { name: 'مكتب بريد الإسكندرية', city: 'الإسكندرية' },
    ],
  },
  {
    id: 'banque_du_caire',
    name: 'بنك القاهرة',
    nameEn: 'Banque du Caire',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة', area: 'وسط البلد' },
      { name: 'فرع مدينة نصر', city: 'القاهرة' },
      { name: 'فرع المعادي', city: 'القاهرة' },
      { name: 'فرع مصر الجديدة', city: 'القاهرة' },
      { name: 'فرع الدقي', city: 'الجيزة' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
      { name: 'فرع المنصورة', city: 'الدقهلية' },
      { name: 'فرع طنطا', city: 'الغربية' },
      { name: 'فرع أسيوط', city: 'أسيوط' },
      { name: 'فرع التجمع الخامس', city: 'القاهرة' },
      { name: 'فرع 6 أكتوبر', city: 'الجيزة' },
    ],
  },
  {
    id: 'ebank',
    name: 'البنك المصري لتنمية الصادرات',
    nameEn: 'Export Development Bank of Egypt',
    shortName: 'EBE',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة' },
      { name: 'فرع مدينة نصر', city: 'القاهرة' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
    ],
  },
  {
    id: 'suez_canal',
    name: 'بنك قناة السويس',
    nameEn: 'Suez Canal Bank',
    branches: [
      { name: 'الفرع الرئيسي', city: 'الإسماعيلية' },
      { name: 'فرع القاهرة', city: 'القاهرة' },
      { name: 'فرع بورسعيد', city: 'بورسعيد' },
      { name: 'فرع السويس', city: 'السويس' },
    ],
  },
  {
    id: 'audi',
    name: 'بنك عودة',
    nameEn: 'Bank Audi',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة' },
      { name: 'فرع مدينة نصر', city: 'القاهرة' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
    ],
  },
  {
    id: 'mashreq',
    name: 'بنك المشرق',
    nameEn: 'Mashreq Bank',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة' },
      { name: 'فرع التجمع الخامس', city: 'القاهرة' },
    ],
  },
  {
    id: 'abk',
    name: 'البنك الأهلي الكويتي',
    nameEn: 'Al Ahli Bank of Kuwait',
    shortName: 'ABK',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة' },
      { name: 'فرع مدينة نصر', city: 'القاهرة' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
    ],
  },
  {
    id: 'egbank',
    name: 'البنك المصري الخليجي',
    nameEn: 'Egyptian Gulf Bank',
    shortName: 'EG Bank',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة' },
      { name: 'فرع مدينة نصر', city: 'القاهرة' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
    ],
  },
  {
    id: 'industrial_dev',
    name: 'بنك التنمية الصناعية',
    nameEn: 'Industrial Development Bank',
    shortName: 'IDB',
    branches: [
      { name: 'الفرع الرئيسي', city: 'القاهرة' },
      { name: 'فرع الإسكندرية', city: 'الإسكندرية' },
      { name: 'فرع العاشر من رمضان', city: 'الشرقية' },
      { name: 'فرع 6 أكتوبر', city: 'الجيزة' },
      { name: 'فرع برج العرب', city: 'الإسكندرية' },
    ],
  },
];

// Helper functions
export function getBankNames(): string[] {
  return egyptianBanks.map(b => b.name);
}

export function getBankById(id: string): EgyptianBank | undefined {
  return egyptianBanks.find(b => b.id === id);
}

export function getBankByName(name: string): EgyptianBank | undefined {
  return egyptianBanks.find(b => b.name === name || b.nameEn === name || b.shortName === name);
}

export function getBranchesForBank(bankName: string): BankBranch[] {
  const bank = getBankByName(bankName);
  return bank?.branches || [];
}

export function searchBanks(query: string): EgyptianBank[] {
  if (!query.trim()) return egyptianBanks;
  const q = query.toLowerCase();
  return egyptianBanks.filter(
    b => b.name.includes(q) || b.nameEn.toLowerCase().includes(q) || b.shortName?.toLowerCase().includes(q)
  );
}

export function searchBranches(bankName: string, query: string): BankBranch[] {
  const branches = getBranchesForBank(bankName);
  if (!query.trim()) return branches;
  const q = query.toLowerCase();
  return branches.filter(
    b => b.name.includes(q) || b.city.includes(q) || b.area?.includes(q)
  );
}
