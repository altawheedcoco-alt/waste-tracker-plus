// Egyptian Governorates and Major Cities
// المحافظات والمدن المصرية الرئيسية

export interface EgyptianCity {
  id: string;
  name: string;
  nameEn: string;
  governorate: string;
  governorateEn: string;
  lat: number;
  lng: number;
  isCapital?: boolean;
}

export interface EgyptianGovernorate {
  id: string;
  name: string;
  nameEn: string;
  capital: string;
  lat: number;
  lng: number;
  cities: EgyptianCity[];
}

// All 27 Egyptian Governorates with their major cities
export const egyptianGovernorates: EgyptianGovernorate[] = [
  {
    id: 'cairo',
    name: 'القاهرة',
    nameEn: 'Cairo',
    capital: 'القاهرة',
    lat: 30.0444,
    lng: 31.2357,
    cities: [
      { id: 'cairo-city', name: 'القاهرة', nameEn: 'Cairo', governorate: 'القاهرة', governorateEn: 'Cairo', lat: 30.0444, lng: 31.2357, isCapital: true },
      { id: 'nasr-city', name: 'مدينة نصر', nameEn: 'Nasr City', governorate: 'القاهرة', governorateEn: 'Cairo', lat: 30.0511, lng: 31.3656 },
      { id: 'heliopolis', name: 'مصر الجديدة', nameEn: 'Heliopolis', governorate: 'القاهرة', governorateEn: 'Cairo', lat: 30.0876, lng: 31.3230 },
      { id: 'maadi', name: 'المعادي', nameEn: 'Maadi', governorate: 'القاهرة', governorateEn: 'Cairo', lat: 29.9602, lng: 31.2569 },
      { id: 'shubra', name: 'شبرا', nameEn: 'Shubra', governorate: 'القاهرة', governorateEn: 'Cairo', lat: 30.1127, lng: 31.2422 },
      { id: 'new-cairo', name: 'القاهرة الجديدة', nameEn: 'New Cairo', governorate: 'القاهرة', governorateEn: 'Cairo', lat: 30.0300, lng: 31.4700 },
    ]
  },
  {
    id: 'giza',
    name: 'الجيزة',
    nameEn: 'Giza',
    capital: 'الجيزة',
    lat: 30.0131,
    lng: 31.2089,
    cities: [
      { id: 'giza-city', name: 'الجيزة', nameEn: 'Giza', governorate: 'الجيزة', governorateEn: 'Giza', lat: 30.0131, lng: 31.2089, isCapital: true },
      { id: '6october', name: '6 أكتوبر', nameEn: '6th of October', governorate: 'الجيزة', governorateEn: 'Giza', lat: 29.9285, lng: 30.9188 },
      { id: 'sheikh-zayed', name: 'الشيخ زايد', nameEn: 'Sheikh Zayed', governorate: 'الجيزة', governorateEn: 'Giza', lat: 30.0394, lng: 30.9822 },
      { id: 'dokki', name: 'الدقي', nameEn: 'Dokki', governorate: 'الجيزة', governorateEn: 'Giza', lat: 30.0380, lng: 31.2118 },
      { id: 'imbaba', name: 'إمبابة', nameEn: 'Imbaba', governorate: 'الجيزة', governorateEn: 'Giza', lat: 30.0758, lng: 31.2080 },
      { id: 'haram', name: 'الهرم', nameEn: 'Haram', governorate: 'الجيزة', governorateEn: 'Giza', lat: 29.9870, lng: 31.1311 },
    ]
  },
  {
    id: 'alexandria',
    name: 'الإسكندرية',
    nameEn: 'Alexandria',
    capital: 'الإسكندرية',
    lat: 31.2001,
    lng: 29.9187,
    cities: [
      { id: 'alexandria-city', name: 'الإسكندرية', nameEn: 'Alexandria', governorate: 'الإسكندرية', governorateEn: 'Alexandria', lat: 31.2001, lng: 29.9187, isCapital: true },
      { id: 'borg-el-arab', name: 'برج العرب', nameEn: 'Borg El Arab', governorate: 'الإسكندرية', governorateEn: 'Alexandria', lat: 30.8568, lng: 29.5500 },
      { id: 'montazah', name: 'المنتزه', nameEn: 'Montazah', governorate: 'الإسكندرية', governorateEn: 'Alexandria', lat: 31.2837, lng: 30.0114 },
    ]
  },
  {
    id: 'port-said',
    name: 'بورسعيد',
    nameEn: 'Port Said',
    capital: 'بورسعيد',
    lat: 31.2565,
    lng: 32.2841,
    cities: [
      { id: 'port-said-city', name: 'بورسعيد', nameEn: 'Port Said', governorate: 'بورسعيد', governorateEn: 'Port Said', lat: 31.2565, lng: 32.2841, isCapital: true },
    ]
  },
  {
    id: 'suez',
    name: 'السويس',
    nameEn: 'Suez',
    capital: 'السويس',
    lat: 29.9668,
    lng: 32.5498,
    cities: [
      { id: 'suez-city', name: 'السويس', nameEn: 'Suez', governorate: 'السويس', governorateEn: 'Suez', lat: 29.9668, lng: 32.5498, isCapital: true },
    ]
  },
  {
    id: 'ismailia',
    name: 'الإسماعيلية',
    nameEn: 'Ismailia',
    capital: 'الإسماعيلية',
    lat: 30.5965,
    lng: 32.2715,
    cities: [
      { id: 'ismailia-city', name: 'الإسماعيلية', nameEn: 'Ismailia', governorate: 'الإسماعيلية', governorateEn: 'Ismailia', lat: 30.5965, lng: 32.2715, isCapital: true },
    ]
  },
  {
    id: 'damietta',
    name: 'دمياط',
    nameEn: 'Damietta',
    capital: 'دمياط',
    lat: 31.4165,
    lng: 31.8133,
    cities: [
      { id: 'damietta-city', name: 'دمياط', nameEn: 'Damietta', governorate: 'دمياط', governorateEn: 'Damietta', lat: 31.4165, lng: 31.8133, isCapital: true },
      { id: 'new-damietta', name: 'دمياط الجديدة', nameEn: 'New Damietta', governorate: 'دمياط', governorateEn: 'Damietta', lat: 31.4400, lng: 31.6833 },
    ]
  },
  {
    id: 'dakahlia',
    name: 'الدقهلية',
    nameEn: 'Dakahlia',
    capital: 'المنصورة',
    lat: 31.0409,
    lng: 31.3785,
    cities: [
      { id: 'mansoura', name: 'المنصورة', nameEn: 'Mansoura', governorate: 'الدقهلية', governorateEn: 'Dakahlia', lat: 31.0409, lng: 31.3785, isCapital: true },
      { id: 'mit-ghamr', name: 'ميت غمر', nameEn: 'Mit Ghamr', governorate: 'الدقهلية', governorateEn: 'Dakahlia', lat: 30.7167, lng: 31.2500 },
      { id: 'talkha', name: 'طلخا', nameEn: 'Talkha', governorate: 'الدقهلية', governorateEn: 'Dakahlia', lat: 31.0500, lng: 31.3667 },
    ]
  },
  {
    id: 'sharqia',
    name: 'الشرقية',
    nameEn: 'Sharqia',
    capital: 'الزقازيق',
    lat: 30.5833,
    lng: 31.5000,
    cities: [
      { id: 'zagazig', name: 'الزقازيق', nameEn: 'Zagazig', governorate: 'الشرقية', governorateEn: 'Sharqia', lat: 30.5833, lng: 31.5000, isCapital: true },
      { id: '10th-ramadan', name: 'العاشر من رمضان', nameEn: '10th of Ramadan', governorate: 'الشرقية', governorateEn: 'Sharqia', lat: 30.2969, lng: 31.7564 },
      { id: 'belbeis', name: 'بلبيس', nameEn: 'Belbeis', governorate: 'الشرقية', governorateEn: 'Sharqia', lat: 30.4236, lng: 31.5611 },
    ]
  },
  {
    id: 'qalyubia',
    name: 'القليوبية',
    nameEn: 'Qalyubia',
    capital: 'بنها',
    lat: 30.4667,
    lng: 31.1833,
    cities: [
      { id: 'banha', name: 'بنها', nameEn: 'Banha', governorate: 'القليوبية', governorateEn: 'Qalyubia', lat: 30.4667, lng: 31.1833, isCapital: true },
      { id: 'qalyub', name: 'قليوب', nameEn: 'Qalyub', governorate: 'القليوبية', governorateEn: 'Qalyubia', lat: 30.1811, lng: 31.2039 },
      { id: 'shubra-el-kheima', name: 'شبرا الخيمة', nameEn: 'Shubra El Kheima', governorate: 'القليوبية', governorateEn: 'Qalyubia', lat: 30.1281, lng: 31.2422 },
      { id: 'khanka', name: 'الخانكة', nameEn: 'Khanka', governorate: 'القليوبية', governorateEn: 'Qalyubia', lat: 30.2167, lng: 31.3667 },
      { id: 'obour', name: 'العبور', nameEn: 'Obour', governorate: 'القليوبية', governorateEn: 'Qalyubia', lat: 30.2279, lng: 31.4835 },
    ]
  },
  {
    id: 'gharbia',
    name: 'الغربية',
    nameEn: 'Gharbia',
    capital: 'طنطا',
    lat: 30.7865,
    lng: 31.0004,
    cities: [
      { id: 'tanta', name: 'طنطا', nameEn: 'Tanta', governorate: 'الغربية', governorateEn: 'Gharbia', lat: 30.7865, lng: 31.0004, isCapital: true },
      { id: 'mahalla', name: 'المحلة الكبرى', nameEn: 'Mahalla El Kubra', governorate: 'الغربية', governorateEn: 'Gharbia', lat: 30.9686, lng: 31.1650 },
      { id: 'samannoud', name: 'سمنود', nameEn: 'Samannoud', governorate: 'الغربية', governorateEn: 'Gharbia', lat: 30.9583, lng: 31.2417 },
    ]
  },
  {
    id: 'monufia',
    name: 'المنوفية',
    nameEn: 'Monufia',
    capital: 'شبين الكوم',
    lat: 30.5577,
    lng: 31.0100,
    cities: [
      { id: 'shebin-el-kom', name: 'شبين الكوم', nameEn: 'Shebin El Kom', governorate: 'المنوفية', governorateEn: 'Monufia', lat: 30.5577, lng: 31.0100, isCapital: true },
      { id: 'sadat-city', name: 'مدينة السادات', nameEn: 'Sadat City', governorate: 'المنوفية', governorateEn: 'Monufia', lat: 30.3700, lng: 30.5264 },
      { id: 'menouf', name: 'منوف', nameEn: 'Menouf', governorate: 'المنوفية', governorateEn: 'Monufia', lat: 30.4667, lng: 30.9333 },
    ]
  },
  {
    id: 'beheira',
    name: 'البحيرة',
    nameEn: 'Beheira',
    capital: 'دمنهور',
    lat: 31.0361,
    lng: 30.4694,
    cities: [
      { id: 'damanhour', name: 'دمنهور', nameEn: 'Damanhour', governorate: 'البحيرة', governorateEn: 'Beheira', lat: 31.0361, lng: 30.4694, isCapital: true },
      { id: 'kafr-el-dawwar', name: 'كفر الدوار', nameEn: 'Kafr El Dawwar', governorate: 'البحيرة', governorateEn: 'Beheira', lat: 31.1333, lng: 30.1333 },
      { id: 'rashid', name: 'رشيد', nameEn: 'Rashid (Rosetta)', governorate: 'البحيرة', governorateEn: 'Beheira', lat: 31.4042, lng: 30.4167 },
    ]
  },
  {
    id: 'kafr-el-sheikh',
    name: 'كفر الشيخ',
    nameEn: 'Kafr El Sheikh',
    capital: 'كفر الشيخ',
    lat: 31.1083,
    lng: 30.9400,
    cities: [
      { id: 'kafr-el-sheikh-city', name: 'كفر الشيخ', nameEn: 'Kafr El Sheikh', governorate: 'كفر الشيخ', governorateEn: 'Kafr El Sheikh', lat: 31.1083, lng: 30.9400, isCapital: true },
      { id: 'desouk', name: 'دسوق', nameEn: 'Desouk', governorate: 'كفر الشيخ', governorateEn: 'Kafr El Sheikh', lat: 31.1333, lng: 30.6333 },
    ]
  },
  {
    id: 'fayoum',
    name: 'الفيوم',
    nameEn: 'Fayoum',
    capital: 'الفيوم',
    lat: 29.3084,
    lng: 30.8405,
    cities: [
      { id: 'fayoum-city', name: 'الفيوم', nameEn: 'Fayoum', governorate: 'الفيوم', governorateEn: 'Fayoum', lat: 29.3084, lng: 30.8405, isCapital: true },
    ]
  },
  {
    id: 'beni-suef',
    name: 'بني سويف',
    nameEn: 'Beni Suef',
    capital: 'بني سويف',
    lat: 29.0661,
    lng: 31.0994,
    cities: [
      { id: 'beni-suef-city', name: 'بني سويف', nameEn: 'Beni Suef', governorate: 'بني سويف', governorateEn: 'Beni Suef', lat: 29.0661, lng: 31.0994, isCapital: true },
    ]
  },
  {
    id: 'minya',
    name: 'المنيا',
    nameEn: 'Minya',
    capital: 'المنيا',
    lat: 28.0871,
    lng: 30.7618,
    cities: [
      { id: 'minya-city', name: 'المنيا', nameEn: 'Minya', governorate: 'المنيا', governorateEn: 'Minya', lat: 28.0871, lng: 30.7618, isCapital: true },
      { id: 'new-minya', name: 'المنيا الجديدة', nameEn: 'New Minya', governorate: 'المنيا', governorateEn: 'Minya', lat: 28.1000, lng: 30.8200 },
    ]
  },
  {
    id: 'assiut',
    name: 'أسيوط',
    nameEn: 'Assiut',
    capital: 'أسيوط',
    lat: 27.1809,
    lng: 31.1837,
    cities: [
      { id: 'assiut-city', name: 'أسيوط', nameEn: 'Assiut', governorate: 'أسيوط', governorateEn: 'Assiut', lat: 27.1809, lng: 31.1837, isCapital: true },
      { id: 'new-assiut', name: 'أسيوط الجديدة', nameEn: 'New Assiut', governorate: 'أسيوط', governorateEn: 'Assiut', lat: 27.1500, lng: 31.2500 },
    ]
  },
  {
    id: 'sohag',
    name: 'سوهاج',
    nameEn: 'Sohag',
    capital: 'سوهاج',
    lat: 26.5569,
    lng: 31.6948,
    cities: [
      { id: 'sohag-city', name: 'سوهاج', nameEn: 'Sohag', governorate: 'سوهاج', governorateEn: 'Sohag', lat: 26.5569, lng: 31.6948, isCapital: true },
    ]
  },
  {
    id: 'qena',
    name: 'قنا',
    nameEn: 'Qena',
    capital: 'قنا',
    lat: 26.1551,
    lng: 32.7160,
    cities: [
      { id: 'qena-city', name: 'قنا', nameEn: 'Qena', governorate: 'قنا', governorateEn: 'Qena', lat: 26.1551, lng: 32.7160, isCapital: true },
      { id: 'nag-hammadi', name: 'نجع حمادي', nameEn: 'Nag Hammadi', governorate: 'قنا', governorateEn: 'Qena', lat: 26.0500, lng: 32.2500 },
    ]
  },
  {
    id: 'luxor',
    name: 'الأقصر',
    nameEn: 'Luxor',
    capital: 'الأقصر',
    lat: 25.6872,
    lng: 32.6396,
    cities: [
      { id: 'luxor-city', name: 'الأقصر', nameEn: 'Luxor', governorate: 'الأقصر', governorateEn: 'Luxor', lat: 25.6872, lng: 32.6396, isCapital: true },
    ]
  },
  {
    id: 'aswan',
    name: 'أسوان',
    nameEn: 'Aswan',
    capital: 'أسوان',
    lat: 24.0889,
    lng: 32.8998,
    cities: [
      { id: 'aswan-city', name: 'أسوان', nameEn: 'Aswan', governorate: 'أسوان', governorateEn: 'Aswan', lat: 24.0889, lng: 32.8998, isCapital: true },
    ]
  },
  {
    id: 'red-sea',
    name: 'البحر الأحمر',
    nameEn: 'Red Sea',
    capital: 'الغردقة',
    lat: 27.2579,
    lng: 33.8116,
    cities: [
      { id: 'hurghada', name: 'الغردقة', nameEn: 'Hurghada', governorate: 'البحر الأحمر', governorateEn: 'Red Sea', lat: 27.2579, lng: 33.8116, isCapital: true },
      { id: 'safaga', name: 'سفاجا', nameEn: 'Safaga', governorate: 'البحر الأحمر', governorateEn: 'Red Sea', lat: 26.7500, lng: 33.9333 },
      { id: 'marsa-alam', name: 'مرسى علم', nameEn: 'Marsa Alam', governorate: 'البحر الأحمر', governorateEn: 'Red Sea', lat: 25.0667, lng: 34.8833 },
    ]
  },
  {
    id: 'new-valley',
    name: 'الوادي الجديد',
    nameEn: 'New Valley',
    capital: 'الخارجة',
    lat: 25.4500,
    lng: 30.5500,
    cities: [
      { id: 'kharga', name: 'الخارجة', nameEn: 'Kharga', governorate: 'الوادي الجديد', governorateEn: 'New Valley', lat: 25.4500, lng: 30.5500, isCapital: true },
      { id: 'dakhla', name: 'الداخلة', nameEn: 'Dakhla', governorate: 'الوادي الجديد', governorateEn: 'New Valley', lat: 25.4833, lng: 29.0000 },
    ]
  },
  {
    id: 'matrouh',
    name: 'مطروح',
    nameEn: 'Matrouh',
    capital: 'مرسى مطروح',
    lat: 31.3525,
    lng: 27.2453,
    cities: [
      { id: 'marsa-matrouh', name: 'مرسى مطروح', nameEn: 'Marsa Matrouh', governorate: 'مطروح', governorateEn: 'Matrouh', lat: 31.3525, lng: 27.2453, isCapital: true },
      { id: 'el-alamein', name: 'العلمين', nameEn: 'El Alamein', governorate: 'مطروح', governorateEn: 'Matrouh', lat: 30.8300, lng: 28.9500 },
      { id: 'new-alamein', name: 'العلمين الجديدة', nameEn: 'New Alamein', governorate: 'مطروح', governorateEn: 'Matrouh', lat: 30.8200, lng: 28.9600 },
    ]
  },
  {
    id: 'north-sinai',
    name: 'شمال سيناء',
    nameEn: 'North Sinai',
    capital: 'العريش',
    lat: 31.1311,
    lng: 33.7981,
    cities: [
      { id: 'el-arish', name: 'العريش', nameEn: 'El Arish', governorate: 'شمال سيناء', governorateEn: 'North Sinai', lat: 31.1311, lng: 33.7981, isCapital: true },
    ]
  },
  {
    id: 'south-sinai',
    name: 'جنوب سيناء',
    nameEn: 'South Sinai',
    capital: 'الطور',
    lat: 28.2333,
    lng: 33.6167,
    cities: [
      { id: 'el-tor', name: 'الطور', nameEn: 'El Tor', governorate: 'جنوب سيناء', governorateEn: 'South Sinai', lat: 28.2333, lng: 33.6167, isCapital: true },
      { id: 'sharm-el-sheikh', name: 'شرم الشيخ', nameEn: 'Sharm El Sheikh', governorate: 'جنوب سيناء', governorateEn: 'South Sinai', lat: 27.9158, lng: 34.3300 },
      { id: 'dahab', name: 'دهب', nameEn: 'Dahab', governorate: 'جنوب سيناء', governorateEn: 'South Sinai', lat: 28.5000, lng: 34.5167 },
      { id: 'nuweiba', name: 'نويبع', nameEn: 'Nuweiba', governorate: 'جنوب سيناء', governorateEn: 'South Sinai', lat: 29.0167, lng: 34.6667 },
      { id: 'taba', name: 'طابا', nameEn: 'Taba', governorate: 'جنوب سيناء', governorateEn: 'South Sinai', lat: 29.4833, lng: 34.8833 },
    ]
  },
];

// Get all cities as a flat list
export const getAllCities = (): EgyptianCity[] => {
  return egyptianGovernorates.flatMap(gov => gov.cities);
};

// Get governorate by ID
export const getGovernorateById = (id: string): EgyptianGovernorate | undefined => {
  return egyptianGovernorates.find(gov => gov.id === id);
};

// Get city by ID
export const getCityById = (id: string): EgyptianCity | undefined => {
  return getAllCities().find(city => city.id === id);
};

// Search cities by name (Arabic or English)
export const searchCities = (query: string): EgyptianCity[] => {
  const lowercaseQuery = query.toLowerCase();
  return getAllCities().filter(city => 
    city.name.includes(query) || 
    city.nameEn.toLowerCase().includes(lowercaseQuery) ||
    city.governorate.includes(query) ||
    city.governorateEn.toLowerCase().includes(lowercaseQuery)
  );
};

// Get cities by governorate
export const getCitiesByGovernorate = (governorateId: string): EgyptianCity[] => {
  const gov = getGovernorateById(governorateId);
  return gov ? gov.cities : [];
};

// Get governorate capitals only
export const getGovernorateCapitals = (): EgyptianCity[] => {
  return getAllCities().filter(city => city.isCapital);
};

// Major industrial and commercial zones - المناطق الصناعية والاقتصادية الرئيسية
export interface IndustrialZone {
  id: string;
  name: string;
  nameEn: string;
  type: 'industrial' | 'economic' | 'free_zone' | 'tech_park' | 'logistics';
  governorate: string;
  lat: number;
  lng: number;
  description?: string;
}

export const industrialZones: IndustrialZone[] = [
  // مدينة السادس من أكتوبر والمناطق الصناعية التابعة
  { id: '6october-city', name: 'مدينة السادس من أكتوبر', nameEn: '6th of October City', type: 'industrial', governorate: 'الجيزة', lat: 29.9285, lng: 30.9188, description: 'مدينة صناعية كبرى غرب القاهرة' },
  { id: '6october-ind-1', name: 'المنطقة الصناعية الأولى - 6 أكتوبر', nameEn: '6th October Industrial Zone 1', type: 'industrial', governorate: 'الجيزة', lat: 29.9350, lng: 30.8950, description: 'المنطقة الصناعية الأولى' },
  { id: '6october-ind-2', name: 'المنطقة الصناعية الثانية - 6 أكتوبر', nameEn: '6th October Industrial Zone 2', type: 'industrial', governorate: 'الجيزة', lat: 29.9200, lng: 30.9100, description: 'المنطقة الصناعية الثانية' },
  { id: '6october-ind-3', name: 'المنطقة الصناعية الثالثة - 6 أكتوبر', nameEn: '6th October Industrial Zone 3', type: 'industrial', governorate: 'الجيزة', lat: 29.9100, lng: 30.9250, description: 'المنطقة الصناعية الثالثة' },
  { id: '6october-ind-4', name: 'المنطقة الصناعية الرابعة - 6 أكتوبر', nameEn: '6th October Industrial Zone 4', type: 'industrial', governorate: 'الجيزة', lat: 29.9000, lng: 30.9400, description: 'المنطقة الصناعية الرابعة' },
  { id: '6october-smart-village', name: 'القرية الذكية - 6 أكتوبر', nameEn: 'Smart Village - 6th October', type: 'tech_park', governorate: 'الجيزة', lat: 30.0711, lng: 31.0167, description: 'مجمع التكنولوجيا والأعمال' },
  { id: '6october-media-city', name: 'مدينة الإنتاج الإعلامي - 6 أكتوبر', nameEn: 'Media Production City', type: 'industrial', governorate: 'الجيزة', lat: 29.9667, lng: 30.9500, description: 'مجمع الإنتاج الإعلامي' },
  
  // العاشر من رمضان
  { id: '10th-ramadan-city', name: 'مدينة العاشر من رمضان', nameEn: '10th of Ramadan City', type: 'industrial', governorate: 'الشرقية', lat: 30.2969, lng: 31.7564, description: 'أكبر مدينة صناعية في مصر' },
  { id: '10th-ramadan-ind-a', name: 'المنطقة الصناعية A - العاشر', nameEn: '10th Ramadan Zone A', type: 'industrial', governorate: 'الشرقية', lat: 30.3000, lng: 31.7400, description: 'المنطقة الصناعية A' },
  { id: '10th-ramadan-ind-b', name: 'المنطقة الصناعية B - العاشر', nameEn: '10th Ramadan Zone B', type: 'industrial', governorate: 'الشرقية', lat: 30.2900, lng: 31.7600, description: 'المنطقة الصناعية B' },
  { id: '10th-ramadan-ind-c', name: 'المنطقة الصناعية C - العاشر', nameEn: '10th Ramadan Zone C', type: 'industrial', governorate: 'الشرقية', lat: 30.2850, lng: 31.7700, description: 'المنطقة الصناعية C' },
  { id: '10th-ramadan-free-zone', name: 'المنطقة الحرة العامة - العاشر من رمضان', nameEn: '10th Ramadan Free Zone', type: 'free_zone', governorate: 'الشرقية', lat: 30.3050, lng: 31.7500, description: 'المنطقة الحرة' },
  
  // مدينة السادات
  { id: 'sadat-city', name: 'مدينة السادات', nameEn: 'Sadat City', type: 'industrial', governorate: 'المنوفية', lat: 30.3700, lng: 30.5264, description: 'مدينة صناعية بالمنوفية' },
  { id: 'sadat-city-ind-1', name: 'المنطقة الصناعية الأولى - السادات', nameEn: 'Sadat Industrial Zone 1', type: 'industrial', governorate: 'المنوفية', lat: 30.3750, lng: 30.5300, description: 'المنطقة الصناعية الأولى' },
  { id: 'sadat-city-ind-2', name: 'المنطقة الصناعية الثانية - السادات', nameEn: 'Sadat Industrial Zone 2', type: 'industrial', governorate: 'المنوفية', lat: 30.3650, lng: 30.5200, description: 'المنطقة الصناعية الثانية' },
  
  // مدينة العبور
  { id: 'obour-city', name: 'مدينة العبور', nameEn: 'Obour City', type: 'industrial', governorate: 'القليوبية', lat: 30.2279, lng: 31.4835, description: 'مدينة صناعية شرق القاهرة' },
  { id: 'obour-ind-1', name: 'المنطقة الصناعية الأولى - العبور', nameEn: 'Obour Industrial Zone 1', type: 'industrial', governorate: 'القليوبية', lat: 30.2300, lng: 31.4800, description: 'المنطقة الصناعية الأولى' },
  { id: 'obour-ind-2', name: 'المنطقة الصناعية الثانية - العبور', nameEn: 'Obour Industrial Zone 2', type: 'industrial', governorate: 'القليوبية', lat: 30.2250, lng: 31.4900, description: 'المنطقة الصناعية الثانية' },
  
  // مدينة بدر
  { id: 'badr-city', name: 'مدينة بدر', nameEn: 'Badr City', type: 'industrial', governorate: 'القاهرة', lat: 30.1292, lng: 31.7200, description: 'مدينة صناعية جديدة' },
  { id: 'badr-city-ind', name: 'المنطقة الصناعية - مدينة بدر', nameEn: 'Badr City Industrial Zone', type: 'industrial', governorate: 'القاهرة', lat: 30.1300, lng: 31.7250, description: 'المنطقة الصناعية' },
  
  // برج العرب
  { id: 'borg-el-arab-city', name: 'مدينة برج العرب الجديدة', nameEn: 'New Borg El Arab City', type: 'industrial', governorate: 'الإسكندرية', lat: 30.8568, lng: 29.5500, description: 'مدينة صناعية بالإسكندرية' },
  { id: 'borg-el-arab-ind-1', name: 'المنطقة الصناعية الأولى - برج العرب', nameEn: 'Borg El Arab Zone 1', type: 'industrial', governorate: 'الإسكندرية', lat: 30.8600, lng: 29.5450, description: 'المنطقة الصناعية الأولى' },
  { id: 'borg-el-arab-ind-2', name: 'المنطقة الصناعية الثانية - برج العرب', nameEn: 'Borg El Arab Zone 2', type: 'industrial', governorate: 'الإسكندرية', lat: 30.8550, lng: 29.5550, description: 'المنطقة الصناعية الثانية' },
  { id: 'borg-el-arab-free-zone', name: 'المنطقة الحرة - برج العرب', nameEn: 'Borg El Arab Free Zone', type: 'free_zone', governorate: 'الإسكندرية', lat: 30.8500, lng: 29.5600, description: 'المنطقة الحرة العامة' },
  
  // المناطق الاقتصادية الخاصة
  { id: 'sczone-ain-sokhna', name: 'المنطقة الاقتصادية - العين السخنة', nameEn: 'SC Zone - Ain Sokhna', type: 'economic', governorate: 'السويس', lat: 29.5833, lng: 32.3333, description: 'منطقة قناة السويس الاقتصادية' },
  { id: 'sczone-port-said', name: 'المنطقة الاقتصادية - شرق بورسعيد', nameEn: 'SC Zone - East Port Said', type: 'economic', governorate: 'بورسعيد', lat: 31.2800, lng: 32.3500, description: 'منطقة قناة السويس الاقتصادية' },
  { id: 'sczone-ismailia', name: 'المنطقة الصناعية - قنطرة شرق', nameEn: 'SC Zone - East Qantara', type: 'economic', governorate: 'الإسماعيلية', lat: 30.8500, lng: 32.3000, description: 'منطقة قناة السويس الاقتصادية' },
  
  // المناطق الحرة
  { id: 'nasr-city-free-zone', name: 'المنطقة الحرة العامة - مدينة نصر', nameEn: 'Nasr City Free Zone', type: 'free_zone', governorate: 'القاهرة', lat: 30.0500, lng: 31.3700, description: 'المنطقة الحرة العامة' },
  { id: 'alexandria-free-zone', name: 'المنطقة الحرة العامة - الإسكندرية', nameEn: 'Alexandria Free Zone', type: 'free_zone', governorate: 'الإسكندرية', lat: 31.2000, lng: 29.9000, description: 'المنطقة الحرة بالإسكندرية' },
  { id: 'ismailia-free-zone', name: 'المنطقة الحرة العامة - الإسماعيلية', nameEn: 'Ismailia Free Zone', type: 'free_zone', governorate: 'الإسماعيلية', lat: 30.6000, lng: 32.2700, description: 'المنطقة الحرة بالإسماعيلية' },
  { id: 'damietta-free-zone', name: 'المنطقة الحرة العامة - دمياط', nameEn: 'Damietta Free Zone', type: 'free_zone', governorate: 'دمياط', lat: 31.4200, lng: 31.8100, description: 'المنطقة الحرة بدمياط' },
  { id: 'suez-free-zone', name: 'المنطقة الحرة العامة - السويس', nameEn: 'Suez Free Zone', type: 'free_zone', governorate: 'السويس', lat: 29.9700, lng: 32.5500, description: 'المنطقة الحرة بالسويس' },
  { id: 'port-said-free-zone', name: 'المنطقة الحرة العامة - بورسعيد', nameEn: 'Port Said Free Zone', type: 'free_zone', governorate: 'بورسعيد', lat: 31.2565, lng: 32.2841, description: 'المنطقة الحرة ببورسعيد' },
  { id: 'shebin-el-kom-free-zone', name: 'المنطقة الحرة العامة - شبين الكوم', nameEn: 'Shebin El Kom Free Zone', type: 'free_zone', governorate: 'المنوفية', lat: 30.5577, lng: 31.0100, description: 'المنطقة الحرة بشبين الكوم' },
  { id: 'qeft-free-zone', name: 'المنطقة الحرة العامة - قفط', nameEn: 'Qeft Free Zone', type: 'free_zone', governorate: 'قنا', lat: 26.0000, lng: 32.8000, description: 'المنطقة الحرة بقفط' },
  
  // المناطق الصناعية بالصعيد
  { id: 'minya-ind', name: 'المنطقة الصناعية - المنيا', nameEn: 'Minya Industrial Zone', type: 'industrial', governorate: 'المنيا', lat: 28.1000, lng: 30.7500, description: 'المنطقة الصناعية بالمنيا' },
  { id: 'assiut-ind', name: 'المنطقة الصناعية - أسيوط', nameEn: 'Assiut Industrial Zone', type: 'industrial', governorate: 'أسيوط', lat: 27.2000, lng: 31.2000, description: 'المنطقة الصناعية بأسيوط' },
  { id: 'sohag-ind', name: 'المنطقة الصناعية - سوهاج', nameEn: 'Sohag Industrial Zone', type: 'industrial', governorate: 'سوهاج', lat: 26.5600, lng: 31.7000, description: 'المنطقة الصناعية بسوهاج' },
  { id: 'qena-ind', name: 'المنطقة الصناعية - قنا', nameEn: 'Qena Industrial Zone', type: 'industrial', governorate: 'قنا', lat: 26.1600, lng: 32.7200, description: 'المنطقة الصناعية بقنا' },
  { id: 'beni-suef-ind', name: 'المنطقة الصناعية - بني سويف', nameEn: 'Beni Suef Industrial Zone', type: 'industrial', governorate: 'بني سويف', lat: 29.0700, lng: 31.1000, description: 'المنطقة الصناعية ببني سويف' },
  
  // المناطق اللوجستية
  { id: 'dry-port-6october', name: 'الميناء الجاف - 6 أكتوبر', nameEn: 'Dry Port - 6th October', type: 'logistics', governorate: 'الجيزة', lat: 29.9100, lng: 30.9300, description: 'الميناء الجاف' },
  { id: 'dry-port-10th-ramadan', name: 'الميناء الجاف - العاشر من رمضان', nameEn: 'Dry Port - 10th Ramadan', type: 'logistics', governorate: 'الشرقية', lat: 30.2800, lng: 31.7600, description: 'الميناء الجاف' },
  
  // المدن الصناعية الجديدة
  { id: 'robeiki-leather-city', name: 'مدينة الروبيكي للجلود', nameEn: 'Robeiki Leather City', type: 'industrial', governorate: 'القاهرة', lat: 30.1100, lng: 31.7400, description: 'مدينة صناعة الجلود' },
  { id: 'furniture-city-damietta', name: 'مدينة الأثاث - دمياط', nameEn: 'Furniture City - Damietta', type: 'industrial', governorate: 'دمياط', lat: 31.4300, lng: 31.7800, description: 'مدينة صناعة الأثاث' },
  { id: 'textile-city-minya', name: 'مدينة النسيج - المنيا', nameEn: 'Textile City - Minya', type: 'industrial', governorate: 'المنيا', lat: 28.0900, lng: 30.7700, description: 'مدينة صناعة النسيج' },
  { id: 'pharmaceutical-city', name: 'مدينة الدواء - الخانكة', nameEn: 'Pharmaceutical City', type: 'industrial', governorate: 'القليوبية', lat: 30.2200, lng: 31.3700, description: 'مدينة صناعة الدواء' },
  { id: 'plastics-city-badr', name: 'مدينة البلاستيك - بدر', nameEn: 'Plastics City - Badr', type: 'industrial', governorate: 'القاهرة', lat: 30.1350, lng: 31.7150, description: 'مدينة صناعة البلاستيك' },
  
  // المنطقة الصناعية بالفيوم
  { id: 'fayoum-ind', name: 'المنطقة الصناعية - الفيوم', nameEn: 'Fayoum Industrial Zone', type: 'industrial', governorate: 'الفيوم', lat: 29.3100, lng: 30.8400, description: 'المنطقة الصناعية بالفيوم' },
  { id: 'kom-oshim-ind', name: 'المنطقة الصناعية - كوم أوشيم', nameEn: 'Kom Oshim Industrial Zone', type: 'industrial', governorate: 'الفيوم', lat: 29.5300, lng: 30.9000, description: 'المنطقة الصناعية بكوم أوشيم' },
  
  // مجمعات التكنولوجيا
  { id: 'technology-park-maadi', name: 'مجمع التكنولوجيا - المعادي', nameEn: 'Technology Park - Maadi', type: 'tech_park', governorate: 'القاهرة', lat: 29.9600, lng: 31.2600, description: 'مجمع التكنولوجيا' },
  { id: 'knowledge-city', name: 'مدينة المعرفة - العاصمة الإدارية', nameEn: 'Knowledge City - New Capital', type: 'tech_park', governorate: 'القاهرة', lat: 30.0200, lng: 31.7500, description: 'مدينة المعرفة' },
];

// Get industrial zones by governorate
export const getIndustrialZonesByGovernorate = (governorate: string): IndustrialZone[] => {
  return industrialZones.filter(zone => zone.governorate === governorate);
};

// Get industrial zones by type
export const getIndustrialZonesByType = (type: IndustrialZone['type']): IndustrialZone[] => {
  return industrialZones.filter(zone => zone.type === type);
};

// Search industrial zones
export const searchIndustrialZones = (query: string): IndustrialZone[] => {
  const lowercaseQuery = query.toLowerCase();
  return industrialZones.filter(zone => 
    zone.name.includes(query) || 
    zone.nameEn.toLowerCase().includes(lowercaseQuery) ||
    zone.governorate.includes(query) ||
    (zone.description && zone.description.includes(query))
  );
};

// Combined search for cities and industrial zones
export const searchAllLocations = (query: string): (EgyptianCity | IndustrialZone)[] => {
  const cities = searchCities(query);
  const zones = searchIndustrialZones(query);
  return [...zones, ...cities]; // Industrial zones first for relevance
};

export default egyptianGovernorates;
