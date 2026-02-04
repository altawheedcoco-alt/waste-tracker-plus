// قاعدة بيانات شاملة لجميع المواقع في جمهورية مصر العربية
// Comprehensive database of all locations in Egypt

export interface EgyptLocation {
  id: string;
  name: string;
  nameEn: string;
  type: 'governorate' | 'city' | 'district' | 'village' | 'landmark' | 'industrial' | 'port' | 'airport' | 'university' | 'hospital' | 'station';
  lat: number;
  lng: number;
  governorate: string;
  population?: number;
  postalCode?: string;
  parent?: string;
}

export interface Governorate {
  id: string;
  name: string;
  nameEn: string;
  capital: string;
  lat: number;
  lng: number;
  region: 'greater_cairo' | 'lower_egypt' | 'upper_egypt' | 'canal' | 'frontier';
  population?: number;
  area?: number; // km²
}

// المحافظات الـ 27
export const EGYPT_GOVERNORATES: Governorate[] = [
  // إقليم القاهرة الكبرى
  { id: 'cairo', name: 'القاهرة', nameEn: 'Cairo', capital: 'القاهرة', lat: 30.0444, lng: 31.2357, region: 'greater_cairo', population: 10025657, area: 3085 },
  { id: 'giza', name: 'الجيزة', nameEn: 'Giza', capital: 'الجيزة', lat: 30.0131, lng: 31.2089, region: 'greater_cairo', population: 8915883, area: 13184 },
  { id: 'qalyubia', name: 'القليوبية', nameEn: 'Qalyubia', capital: 'بنها', lat: 30.4500, lng: 31.1833, region: 'greater_cairo', population: 5627420, area: 1001 },
  
  // إقليم الدلتا (الوجه البحري)
  { id: 'alexandria', name: 'الإسكندرية', nameEn: 'Alexandria', capital: 'الإسكندرية', lat: 31.2001, lng: 29.9187, region: 'lower_egypt', population: 5200000, area: 2818 },
  { id: 'beheira', name: 'البحيرة', nameEn: 'Beheira', capital: 'دمنهور', lat: 30.8500, lng: 30.0333, region: 'lower_egypt', population: 6171613, area: 10130 },
  { id: 'gharbia', name: 'الغربية', nameEn: 'Gharbia', capital: 'طنطا', lat: 30.7865, lng: 31.0004, region: 'lower_egypt', population: 5099423, area: 1942 },
  { id: 'kafr_el_sheikh', name: 'كفر الشيخ', nameEn: 'Kafr El Sheikh', capital: 'كفر الشيخ', lat: 31.1107, lng: 30.9388, region: 'lower_egypt', population: 3409353, area: 3467 },
  { id: 'dakahlia', name: 'الدقهلية', nameEn: 'Dakahlia', capital: 'المنصورة', lat: 31.0409, lng: 31.3785, region: 'lower_egypt', population: 6640002, area: 3471 },
  { id: 'damietta', name: 'دمياط', nameEn: 'Damietta', capital: 'دمياط', lat: 31.4175, lng: 31.8144, region: 'lower_egypt', population: 1535830, area: 1029 },
  { id: 'sharqia', name: 'الشرقية', nameEn: 'Sharqia', capital: 'الزقازيق', lat: 30.5877, lng: 31.5020, region: 'lower_egypt', population: 7163824, area: 4180 },
  { id: 'menoufia', name: 'المنوفية', nameEn: 'Menoufia', capital: 'شبين الكوم', lat: 30.5580, lng: 31.0100, region: 'lower_egypt', population: 4366800, area: 1532 },
  
  // إقليم القناة
  { id: 'port_said', name: 'بورسعيد', nameEn: 'Port Said', capital: 'بورسعيد', lat: 31.2653, lng: 32.3019, region: 'canal', population: 760000, area: 1345 },
  { id: 'ismailia', name: 'الإسماعيلية', nameEn: 'Ismailia', capital: 'الإسماعيلية', lat: 30.5965, lng: 32.2715, region: 'canal', population: 1364507, area: 5067 },
  { id: 'suez', name: 'السويس', nameEn: 'Suez', capital: 'السويس', lat: 29.9668, lng: 32.5498, region: 'canal', population: 728180, area: 9002 },
  
  // إقليم الصعيد (الوجه القبلي)
  { id: 'beni_suef', name: 'بني سويف', nameEn: 'Beni Suef', capital: 'بني سويف', lat: 29.0661, lng: 31.0994, region: 'upper_egypt', population: 3154250, area: 1322 },
  { id: 'fayoum', name: 'الفيوم', nameEn: 'Fayoum', capital: 'الفيوم', lat: 29.3084, lng: 30.8428, region: 'upper_egypt', population: 3596954, area: 6068 },
  { id: 'minya', name: 'المنيا', nameEn: 'Minya', capital: 'المنيا', lat: 28.1099, lng: 30.7503, region: 'upper_egypt', population: 5747026, area: 2262 },
  { id: 'assiut', name: 'أسيوط', nameEn: 'Assiut', capital: 'أسيوط', lat: 27.1809, lng: 31.1837, region: 'upper_egypt', population: 4618614, area: 1553 },
  { id: 'sohag', name: 'سوهاج', nameEn: 'Sohag', capital: 'سوهاج', lat: 26.5569, lng: 31.6948, region: 'upper_egypt', population: 5024456, area: 1547 },
  { id: 'qena', name: 'قنا', nameEn: 'Qena', capital: 'قنا', lat: 26.1551, lng: 32.7160, region: 'upper_egypt', population: 3230708, area: 1851 },
  { id: 'luxor', name: 'الأقصر', nameEn: 'Luxor', capital: 'الأقصر', lat: 25.6872, lng: 32.6396, region: 'upper_egypt', population: 1269634, area: 2960 },
  { id: 'aswan', name: 'أسوان', nameEn: 'Aswan', capital: 'أسوان', lat: 24.0889, lng: 32.8998, region: 'upper_egypt', population: 1568000, area: 62726 },
  { id: 'red_sea', name: 'البحر الأحمر', nameEn: 'Red Sea', capital: 'الغردقة', lat: 27.2579, lng: 33.8116, region: 'upper_egypt', population: 359888, area: 203685 },
  
  // المحافظات الحدودية
  { id: 'matrouh', name: 'مطروح', nameEn: 'Matrouh', capital: 'مرسى مطروح', lat: 31.3543, lng: 27.2373, region: 'frontier', population: 485358, area: 166563 },
  { id: 'new_valley', name: 'الوادي الجديد', nameEn: 'New Valley', capital: 'الخارجة', lat: 25.4390, lng: 30.5503, region: 'frontier', population: 245028, area: 440098 },
  { id: 'north_sinai', name: 'شمال سيناء', nameEn: 'North Sinai', capital: 'العريش', lat: 31.1314, lng: 33.7980, region: 'frontier', population: 450000, area: 27564 },
  { id: 'south_sinai', name: 'جنوب سيناء', nameEn: 'South Sinai', capital: 'الطور', lat: 28.2380, lng: 33.6177, region: 'frontier', population: 102018, area: 33140 },
];

// جميع المدن والمناطق التفصيلية
export const EGYPT_LOCATIONS: EgyptLocation[] = [
  // ========== محافظة القاهرة ==========
  { id: 'cairo_center', name: 'وسط القاهرة', nameEn: 'Downtown Cairo', type: 'district', lat: 30.0459, lng: 31.2243, governorate: 'cairo' },
  { id: 'cairo_nasr_city', name: 'مدينة نصر', nameEn: 'Nasr City', type: 'district', lat: 30.0511, lng: 31.3656, governorate: 'cairo' },
  { id: 'cairo_heliopolis', name: 'مصر الجديدة', nameEn: 'Heliopolis', type: 'district', lat: 30.0877, lng: 31.3234, governorate: 'cairo' },
  { id: 'cairo_maadi', name: 'المعادي', nameEn: 'Maadi', type: 'district', lat: 29.9602, lng: 31.2569, governorate: 'cairo' },
  { id: 'cairo_zamalek', name: 'الزمالك', nameEn: 'Zamalek', type: 'district', lat: 30.0666, lng: 31.2243, governorate: 'cairo' },
  { id: 'cairo_garden_city', name: 'جاردن سيتي', nameEn: 'Garden City', type: 'district', lat: 30.0366, lng: 31.2313, governorate: 'cairo' },
  { id: 'cairo_mohandessin', name: 'المهندسين', nameEn: 'Mohandessin', type: 'district', lat: 30.0561, lng: 31.2015, governorate: 'cairo' },
  { id: 'cairo_dokki', name: 'الدقي', nameEn: 'Dokki', type: 'district', lat: 30.0392, lng: 31.2118, governorate: 'cairo' },
  { id: 'cairo_agouza', name: 'العجوزة', nameEn: 'Agouza', type: 'district', lat: 30.0561, lng: 31.2118, governorate: 'cairo' },
  { id: 'cairo_shubra', name: 'شبرا', nameEn: 'Shubra', type: 'district', lat: 30.1091, lng: 31.2472, governorate: 'cairo' },
  { id: 'cairo_rod_el_farag', name: 'روض الفرج', nameEn: 'Rod El Farag', type: 'district', lat: 30.0970, lng: 31.2379, governorate: 'cairo' },
  { id: 'cairo_abbassia', name: 'العباسية', nameEn: 'Abbassia', type: 'district', lat: 30.0722, lng: 31.2833, governorate: 'cairo' },
  { id: 'cairo_sayeda_zeinab', name: 'السيدة زينب', nameEn: 'Sayeda Zeinab', type: 'district', lat: 30.0284, lng: 31.2424, governorate: 'cairo' },
  { id: 'cairo_old_cairo', name: 'مصر القديمة', nameEn: 'Old Cairo', type: 'district', lat: 30.0063, lng: 31.2305, governorate: 'cairo' },
  { id: 'cairo_ain_shams', name: 'عين شمس', nameEn: 'Ain Shams', type: 'district', lat: 30.1304, lng: 31.3238, governorate: 'cairo' },
  { id: 'cairo_matareya', name: 'المطرية', nameEn: 'Matareya', type: 'district', lat: 30.1220, lng: 31.3112, governorate: 'cairo' },
  { id: 'cairo_helwan', name: 'حلوان', nameEn: 'Helwan', type: 'city', lat: 29.8500, lng: 31.3000, governorate: 'cairo' },
  { id: 'cairo_15_may', name: 'مدينة 15 مايو', nameEn: '15th of May City', type: 'city', lat: 29.8500, lng: 31.3833, governorate: 'cairo' },
  { id: 'cairo_badr', name: 'مدينة بدر', nameEn: 'Badr City', type: 'city', lat: 30.1333, lng: 31.7167, governorate: 'cairo' },
  { id: 'cairo_new_cairo', name: 'القاهرة الجديدة', nameEn: 'New Cairo', type: 'city', lat: 30.0300, lng: 31.4700, governorate: 'cairo' },
  { id: 'cairo_fifth_settlement', name: 'التجمع الخامس', nameEn: 'Fifth Settlement', type: 'district', lat: 30.0074, lng: 31.4913, governorate: 'cairo' },
  { id: 'cairo_first_settlement', name: 'التجمع الأول', nameEn: 'First Settlement', type: 'district', lat: 30.0200, lng: 31.4500, governorate: 'cairo' },
  { id: 'cairo_third_settlement', name: 'التجمع الثالث', nameEn: 'Third Settlement', type: 'district', lat: 30.0150, lng: 31.4600, governorate: 'cairo' },
  { id: 'cairo_rehab', name: 'مدينة الرحاب', nameEn: 'Rehab City', type: 'district', lat: 30.0583, lng: 31.4917, governorate: 'cairo' },
  { id: 'cairo_madinaty', name: 'مدينتي', nameEn: 'Madinaty', type: 'district', lat: 30.1000, lng: 31.6333, governorate: 'cairo' },
  { id: 'cairo_shorouk', name: 'مدينة الشروق', nameEn: 'El Shorouk City', type: 'city', lat: 30.1167, lng: 31.6167, governorate: 'cairo' },
  { id: 'cairo_obour', name: 'مدينة العبور', nameEn: 'Obour City', type: 'city', lat: 30.2167, lng: 31.4667, governorate: 'cairo' },
  { id: 'cairo_manial', name: 'المنيل', nameEn: 'Manial', type: 'district', lat: 30.0244, lng: 31.2269, governorate: 'cairo' },
  { id: 'cairo_roda', name: 'جزيرة الروضة', nameEn: 'Roda Island', type: 'district', lat: 30.0127, lng: 31.2269, governorate: 'cairo' },
  { id: 'cairo_ghamra', name: 'غمرة', nameEn: 'Ghamra', type: 'district', lat: 30.0722, lng: 31.2611, governorate: 'cairo' },
  { id: 'cairo_ramses', name: 'رمسيس', nameEn: 'Ramses', type: 'district', lat: 30.0625, lng: 31.2467, governorate: 'cairo' },
  { id: 'cairo_tahrir', name: 'التحرير', nameEn: 'Tahrir', type: 'landmark', lat: 30.0444, lng: 31.2357, governorate: 'cairo' },
  { id: 'cairo_citadel', name: 'قلعة صلاح الدين', nameEn: 'Saladin Citadel', type: 'landmark', lat: 30.0288, lng: 31.2599, governorate: 'cairo' },
  { id: 'cairo_khan_khalili', name: 'خان الخليلي', nameEn: 'Khan El Khalili', type: 'landmark', lat: 30.0475, lng: 31.2619, governorate: 'cairo' },
  { id: 'cairo_azhar', name: 'الأزهر', nameEn: 'Al-Azhar', type: 'landmark', lat: 30.0456, lng: 31.2627, governorate: 'cairo' },
  { id: 'cairo_hussein', name: 'الحسين', nameEn: 'Hussein', type: 'district', lat: 30.0472, lng: 31.2611, governorate: 'cairo' },
  { id: 'cairo_darb_ahmar', name: 'الدرب الأحمر', nameEn: 'Darb El Ahmar', type: 'district', lat: 30.0389, lng: 31.2594, governorate: 'cairo' },
  { id: 'cairo_gamaleya', name: 'الجمالية', nameEn: 'Gamaleya', type: 'district', lat: 30.0508, lng: 31.2619, governorate: 'cairo' },
  { id: 'cairo_airport', name: 'مطار القاهرة الدولي', nameEn: 'Cairo International Airport', type: 'airport', lat: 30.1219, lng: 31.4056, governorate: 'cairo' },
  { id: 'cairo_railway_station', name: 'محطة مصر', nameEn: 'Ramses Railway Station', type: 'station', lat: 30.0620, lng: 31.2464, governorate: 'cairo' },
  { id: 'cairo_university', name: 'جامعة القاهرة', nameEn: 'Cairo University', type: 'university', lat: 30.0261, lng: 31.2089, governorate: 'cairo' },
  { id: 'cairo_ain_shams_uni', name: 'جامعة عين شمس', nameEn: 'Ain Shams University', type: 'university', lat: 30.0786, lng: 31.2833, governorate: 'cairo' },
  { id: 'cairo_azhar_uni', name: 'جامعة الأزهر', nameEn: 'Al-Azhar University', type: 'university', lat: 30.0495, lng: 31.2622, governorate: 'cairo' },
  { id: 'cairo_qasr_aini', name: 'مستشفى قصر العيني', nameEn: 'Kasr Al Ainy Hospital', type: 'hospital', lat: 30.0297, lng: 31.2311, governorate: 'cairo' },
  
  // ========== محافظة الجيزة ==========
  { id: 'giza_city', name: 'مدينة الجيزة', nameEn: 'Giza City', type: 'city', lat: 30.0131, lng: 31.2089, governorate: 'giza' },
  { id: 'giza_pyramids', name: 'الأهرامات', nameEn: 'Pyramids', type: 'landmark', lat: 29.9792, lng: 31.1342, governorate: 'giza' },
  { id: 'giza_sphinx', name: 'أبو الهول', nameEn: 'Sphinx', type: 'landmark', lat: 29.9753, lng: 31.1376, governorate: 'giza' },
  { id: 'giza_haram', name: 'الهرم', nameEn: 'Haram', type: 'district', lat: 29.9875, lng: 31.1556, governorate: 'giza' },
  { id: 'giza_faisal', name: 'فيصل', nameEn: 'Faisal', type: 'district', lat: 29.9875, lng: 31.1778, governorate: 'giza' },
  { id: 'giza_6_october', name: 'السادس من أكتوبر', nameEn: '6th of October City', type: 'city', lat: 29.9375, lng: 30.9278, governorate: 'giza' },
  { id: 'giza_sheikh_zayed', name: 'الشيخ زايد', nameEn: 'Sheikh Zayed City', type: 'city', lat: 30.0392, lng: 30.9847, governorate: 'giza' },
  { id: 'giza_smart_village', name: 'القرية الذكية', nameEn: 'Smart Village', type: 'landmark', lat: 30.0711, lng: 31.0167, governorate: 'giza' },
  { id: 'giza_dream_land', name: 'دريم لاند', nameEn: 'Dream Land', type: 'district', lat: 30.0125, lng: 31.0333, governorate: 'giza' },
  { id: 'giza_hadayek_october', name: 'حدائق أكتوبر', nameEn: 'Hadayek October', type: 'district', lat: 29.9167, lng: 30.9167, governorate: 'giza' },
  { id: 'giza_abu_rawash', name: 'أبو رواش', nameEn: 'Abu Rawash', type: 'city', lat: 30.0500, lng: 31.0800, governorate: 'giza' },
  { id: 'giza_kerdasa', name: 'كرداسة', nameEn: 'Kerdasa', type: 'city', lat: 30.0333, lng: 31.1167, governorate: 'giza' },
  { id: 'giza_imbaba', name: 'إمبابة', nameEn: 'Imbaba', type: 'district', lat: 30.0756, lng: 31.2089, governorate: 'giza' },
  { id: 'giza_boulaq_dakrour', name: 'بولاق الدكرور', nameEn: 'Boulaq El Dakrour', type: 'district', lat: 30.0292, lng: 31.1867, governorate: 'giza' },
  { id: 'giza_omraneya', name: 'العمرانية', nameEn: 'Omraneya', type: 'district', lat: 30.0125, lng: 31.2000, governorate: 'giza' },
  { id: 'giza_hawamdeya', name: 'الحوامدية', nameEn: 'Hawamdeya', type: 'city', lat: 29.9000, lng: 31.2333, governorate: 'giza' },
  { id: 'giza_badrashin', name: 'البدرشين', nameEn: 'Badrashin', type: 'city', lat: 29.8500, lng: 31.2667, governorate: 'giza' },
  { id: 'giza_saqqara', name: 'سقارة', nameEn: 'Saqqara', type: 'landmark', lat: 29.8711, lng: 31.2167, governorate: 'giza' },
  { id: 'giza_dahshur', name: 'دهشور', nameEn: 'Dahshur', type: 'landmark', lat: 29.8083, lng: 31.2083, governorate: 'giza' },
  { id: 'giza_ayat', name: 'العياط', nameEn: 'Ayat', type: 'city', lat: 29.7167, lng: 31.2500, governorate: 'giza' },
  { id: 'giza_atfih', name: 'أطفيح', nameEn: 'Atfih', type: 'city', lat: 29.5667, lng: 31.2500, governorate: 'giza' },
  { id: 'giza_osim', name: 'أوسيم', nameEn: 'Osim', type: 'city', lat: 30.1167, lng: 31.1333, governorate: 'giza' },
  { id: 'giza_manshiyet_nasser', name: 'منشأة ناصر', nameEn: 'Manshiyet Nasser', type: 'district', lat: 30.0333, lng: 31.2833, governorate: 'giza' },
  { id: 'giza_grand_museum', name: 'المتحف المصري الكبير', nameEn: 'Grand Egyptian Museum', type: 'landmark', lat: 29.9956, lng: 31.1161, governorate: 'giza' },
  { id: 'giza_media_city', name: 'مدينة الإنتاج الإعلامي', nameEn: 'Media Production City', type: 'landmark', lat: 30.0400, lng: 30.9900, governorate: 'giza' },
  
  // ========== محافظة القليوبية ==========
  { id: 'qalyubia_banha', name: 'بنها', nameEn: 'Banha', type: 'city', lat: 30.4667, lng: 31.1833, governorate: 'qalyubia' },
  { id: 'qalyubia_shubra_khema', name: 'شبرا الخيمة', nameEn: 'Shubra El Kheima', type: 'city', lat: 30.1279, lng: 31.2486, governorate: 'qalyubia' },
  { id: 'qalyubia_qalyub', name: 'قليوب', nameEn: 'Qalyub', type: 'city', lat: 30.1833, lng: 31.2000, governorate: 'qalyubia' },
  { id: 'qalyubia_khanka', name: 'الخانكة', nameEn: 'Khanka', type: 'city', lat: 30.2167, lng: 31.3500, governorate: 'qalyubia' },
  { id: 'qalyubia_qanatir_khairiya', name: 'القناطر الخيرية', nameEn: 'Qanatir Khairiya', type: 'city', lat: 30.1917, lng: 31.1333, governorate: 'qalyubia' },
  { id: 'qalyubia_shibin_qanater', name: 'شبين القناطر', nameEn: 'Shibin El Qanater', type: 'city', lat: 30.3167, lng: 31.3333, governorate: 'qalyubia' },
  { id: 'qalyubia_toukh', name: 'طوخ', nameEn: 'Toukh', type: 'city', lat: 30.3500, lng: 31.2000, governorate: 'qalyubia' },
  { id: 'qalyubia_kafr_shukr', name: 'كفر شكر', nameEn: 'Kafr Shukr', type: 'city', lat: 30.5500, lng: 31.2667, governorate: 'qalyubia' },
  { id: 'qalyubia_obour', name: 'العبور', nameEn: 'Obour', type: 'city', lat: 30.2167, lng: 31.4667, governorate: 'qalyubia' },
  { id: 'qalyubia_khosous', name: 'الخصوص', nameEn: 'Khosous', type: 'city', lat: 30.1500, lng: 31.2333, governorate: 'qalyubia' },
  
  // ========== محافظة الإسكندرية ==========
  { id: 'alex_montazah', name: 'المنتزه', nameEn: 'Montazah', type: 'district', lat: 31.2885, lng: 30.0167, governorate: 'alexandria' },
  { id: 'alex_raml_station', name: 'محطة الرمل', nameEn: 'Raml Station', type: 'district', lat: 31.2015, lng: 29.9000, governorate: 'alexandria' },
  { id: 'alex_sidi_gaber', name: 'سيدي جابر', nameEn: 'Sidi Gaber', type: 'district', lat: 31.2167, lng: 29.9333, governorate: 'alexandria' },
  { id: 'alex_cleopatra', name: 'كليوباترا', nameEn: 'Cleopatra', type: 'district', lat: 31.2333, lng: 29.9500, governorate: 'alexandria' },
  { id: 'alex_stanley', name: 'ستانلي', nameEn: 'Stanley', type: 'district', lat: 31.2378, lng: 29.9569, governorate: 'alexandria' },
  { id: 'alex_glim', name: 'جليم', nameEn: 'Glim', type: 'district', lat: 31.2278, lng: 29.9444, governorate: 'alexandria' },
  { id: 'alex_sidi_bishr', name: 'سيدي بشر', nameEn: 'Sidi Bishr', type: 'district', lat: 31.2500, lng: 29.9667, governorate: 'alexandria' },
  { id: 'alex_miami', name: 'ميامي', nameEn: 'Miami', type: 'district', lat: 31.2667, lng: 29.9833, governorate: 'alexandria' },
  { id: 'alex_mandara', name: 'المندرة', nameEn: 'Mandara', type: 'district', lat: 31.2750, lng: 30.0000, governorate: 'alexandria' },
  { id: 'alex_asafra', name: 'العصافرة', nameEn: 'Asafra', type: 'district', lat: 31.2833, lng: 30.0083, governorate: 'alexandria' },
  { id: 'alex_maamoura', name: 'المعمورة', nameEn: 'Maamoura', type: 'district', lat: 31.2833, lng: 30.0333, governorate: 'alexandria' },
  { id: 'alex_abukir', name: 'أبو قير', nameEn: 'Abu Qir', type: 'district', lat: 31.3167, lng: 30.0667, governorate: 'alexandria' },
  { id: 'alex_smouha', name: 'سموحة', nameEn: 'Smouha', type: 'district', lat: 31.2167, lng: 29.9500, governorate: 'alexandria' },
  { id: 'alex_rushdy', name: 'رشدي', nameEn: 'Rushdy', type: 'district', lat: 31.2167, lng: 29.9333, governorate: 'alexandria' },
  { id: 'alex_sporting', name: 'سبورتنج', nameEn: 'Sporting', type: 'district', lat: 31.2111, lng: 29.9278, governorate: 'alexandria' },
  { id: 'alex_ibrahimia', name: 'الإبراهيمية', nameEn: 'Ibrahimia', type: 'district', lat: 31.2167, lng: 29.9333, governorate: 'alexandria' },
  { id: 'alex_azarita', name: 'الأزاريطة', nameEn: 'Azarita', type: 'district', lat: 31.2000, lng: 29.9167, governorate: 'alexandria' },
  { id: 'alex_labban', name: 'اللبان', nameEn: 'Labban', type: 'district', lat: 31.1917, lng: 29.9083, governorate: 'alexandria' },
  { id: 'alex_moharam_bey', name: 'محرم بك', nameEn: 'Moharam Bey', type: 'district', lat: 31.1889, lng: 29.9083, governorate: 'alexandria' },
  { id: 'alex_gabbari', name: 'الجبري', nameEn: 'Gabbari', type: 'district', lat: 31.1833, lng: 29.8833, governorate: 'alexandria' },
  { id: 'alex_mina_basal', name: 'مينا البصل', nameEn: 'Mina El Basal', type: 'district', lat: 31.1833, lng: 29.8750, governorate: 'alexandria' },
  { id: 'alex_dekhela', name: 'الدخيلة', nameEn: 'Dekhela', type: 'district', lat: 31.1667, lng: 29.8333, governorate: 'alexandria' },
  { id: 'alex_agami', name: 'العجمي', nameEn: 'Agami', type: 'district', lat: 31.0833, lng: 29.7500, governorate: 'alexandria' },
  { id: 'alex_bitash', name: 'البيطاش', nameEn: 'Bitash', type: 'district', lat: 31.1000, lng: 29.7833, governorate: 'alexandria' },
  { id: 'alex_hanouville', name: 'الهانوفيل', nameEn: 'Hanouville', type: 'district', lat: 31.0750, lng: 29.7500, governorate: 'alexandria' },
  { id: 'alex_borg_arab', name: 'برج العرب', nameEn: 'Borg El Arab', type: 'city', lat: 30.8575, lng: 29.5433, governorate: 'alexandria' },
  { id: 'alex_borg_arab_new', name: 'برج العرب الجديدة', nameEn: 'New Borg El Arab', type: 'city', lat: 30.8600, lng: 29.5500, governorate: 'alexandria' },
  { id: 'alex_amreya', name: 'العامرية', nameEn: 'Amreya', type: 'city', lat: 31.0333, lng: 29.7333, governorate: 'alexandria' },
  { id: 'alex_library', name: 'مكتبة الإسكندرية', nameEn: 'Bibliotheca Alexandrina', type: 'landmark', lat: 31.2089, lng: 29.9092, governorate: 'alexandria' },
  { id: 'alex_qaitbay', name: 'قلعة قايتباي', nameEn: 'Qaitbay Citadel', type: 'landmark', lat: 31.2139, lng: 29.8856, governorate: 'alexandria' },
  { id: 'alex_corniche', name: 'كورنيش الإسكندرية', nameEn: 'Alexandria Corniche', type: 'landmark', lat: 31.2167, lng: 29.9333, governorate: 'alexandria' },
  { id: 'alex_port', name: 'ميناء الإسكندرية', nameEn: 'Alexandria Port', type: 'port', lat: 31.1978, lng: 29.8614, governorate: 'alexandria' },
  { id: 'alex_airport', name: 'مطار برج العرب الدولي', nameEn: 'Borg El Arab Airport', type: 'airport', lat: 30.9178, lng: 29.6964, governorate: 'alexandria' },
  { id: 'alex_uni', name: 'جامعة الإسكندرية', nameEn: 'Alexandria University', type: 'university', lat: 31.2067, lng: 29.9186, governorate: 'alexandria' },
  
  // ========== محافظة البحيرة ==========
  { id: 'beheira_damanhour', name: 'دمنهور', nameEn: 'Damanhour', type: 'city', lat: 31.0342, lng: 30.4686, governorate: 'beheira' },
  { id: 'beheira_kafr_dawwar', name: 'كفر الدوار', nameEn: 'Kafr El Dawwar', type: 'city', lat: 31.1333, lng: 30.1333, governorate: 'beheira' },
  { id: 'beheira_rashid', name: 'رشيد', nameEn: 'Rosetta', type: 'city', lat: 31.4047, lng: 30.4161, governorate: 'beheira' },
  { id: 'beheira_edko', name: 'إدكو', nameEn: 'Edko', type: 'city', lat: 31.3000, lng: 30.2833, governorate: 'beheira' },
  { id: 'beheira_abu_hommos', name: 'أبو حمص', nameEn: 'Abu Hommos', type: 'city', lat: 31.0667, lng: 30.3000, governorate: 'beheira' },
  { id: 'beheira_kom_hamada', name: 'كوم حمادة', nameEn: 'Kom Hamada', type: 'city', lat: 30.7833, lng: 30.6333, governorate: 'beheira' },
  { id: 'beheira_delengat', name: 'الدلنجات', nameEn: 'Delengat', type: 'city', lat: 30.8000, lng: 30.5500, governorate: 'beheira' },
  { id: 'beheira_mahmoudiya', name: 'المحمودية', nameEn: 'Mahmoudiya', type: 'city', lat: 31.1833, lng: 30.5333, governorate: 'beheira' },
  { id: 'beheira_itay_baroud', name: 'إيتاي البارود', nameEn: 'Itay El Baroud', type: 'city', lat: 30.9500, lng: 30.6667, governorate: 'beheira' },
  { id: 'beheira_housh_issa', name: 'حوش عيسى', nameEn: 'Housh Issa', type: 'city', lat: 31.0000, lng: 30.3333, governorate: 'beheira' },
  { id: 'beheira_shubrakhit', name: 'شبراخيت', nameEn: 'Shubrakhit', type: 'city', lat: 31.0667, lng: 30.5833, governorate: 'beheira' },
  { id: 'beheira_rahmaniya', name: 'الرحمانية', nameEn: 'Rahmaniya', type: 'city', lat: 31.1167, lng: 30.6333, governorate: 'beheira' },
  { id: 'beheira_nubariya', name: 'النوبارية', nameEn: 'Nubariya', type: 'city', lat: 30.6500, lng: 30.0500, governorate: 'beheira' },
  { id: 'beheira_wadi_natrun', name: 'وادي النطرون', nameEn: 'Wadi El Natrun', type: 'city', lat: 30.3500, lng: 30.3500, governorate: 'beheira' },
  
  // ========== محافظة الغربية ==========
  { id: 'gharbia_tanta', name: 'طنطا', nameEn: 'Tanta', type: 'city', lat: 30.7865, lng: 31.0004, governorate: 'gharbia' },
  { id: 'gharbia_mahalla', name: 'المحلة الكبرى', nameEn: 'Mahalla El Kobra', type: 'city', lat: 30.9667, lng: 31.1667, governorate: 'gharbia' },
  { id: 'gharbia_kafr_zayat', name: 'كفر الزيات', nameEn: 'Kafr El Zayat', type: 'city', lat: 30.8167, lng: 30.8167, governorate: 'gharbia' },
  { id: 'gharbia_samannoud', name: 'سمنود', nameEn: 'Samannoud', type: 'city', lat: 30.9667, lng: 31.2500, governorate: 'gharbia' },
  { id: 'gharbia_zefta', name: 'زفتى', nameEn: 'Zefta', type: 'city', lat: 30.7167, lng: 31.2333, governorate: 'gharbia' },
  { id: 'gharbia_santa', name: 'السنطة', nameEn: 'Santa', type: 'city', lat: 30.7833, lng: 30.9333, governorate: 'gharbia' },
  { id: 'gharbia_basyoun', name: 'بسيون', nameEn: 'Basyoun', type: 'city', lat: 30.9667, lng: 30.8667, governorate: 'gharbia' },
  { id: 'gharbia_kotour', name: 'قطور', nameEn: 'Kotour', type: 'city', lat: 30.9000, lng: 30.9667, governorate: 'gharbia' },
  { id: 'gharbia_tanta_uni', name: 'جامعة طنطا', nameEn: 'Tanta University', type: 'university', lat: 30.7888, lng: 31.0011, governorate: 'gharbia' },
  { id: 'gharbia_badawi_mosque', name: 'مسجد السيد البدوي', nameEn: 'El Sayed El Badawi Mosque', type: 'landmark', lat: 30.7875, lng: 31.0000, governorate: 'gharbia' },
  
  // ========== محافظة كفر الشيخ ==========
  { id: 'kafr_sheikh_city', name: 'كفر الشيخ', nameEn: 'Kafr El Sheikh', type: 'city', lat: 31.1107, lng: 30.9388, governorate: 'kafr_el_sheikh' },
  { id: 'kafr_sheikh_desouk', name: 'دسوق', nameEn: 'Desouk', type: 'city', lat: 31.1333, lng: 30.6500, governorate: 'kafr_el_sheikh' },
  { id: 'kafr_sheikh_fowa', name: 'فوه', nameEn: 'Fowa', type: 'city', lat: 31.2000, lng: 30.5500, governorate: 'kafr_el_sheikh' },
  { id: 'kafr_sheikh_biyala', name: 'بيلا', nameEn: 'Biyala', type: 'city', lat: 31.2000, lng: 31.0000, governorate: 'kafr_el_sheikh' },
  { id: 'kafr_sheikh_burullus', name: 'البرلس', nameEn: 'Burullus', type: 'city', lat: 31.5000, lng: 30.6500, governorate: 'kafr_el_sheikh' },
  { id: 'kafr_sheikh_metobas', name: 'مطوبس', nameEn: 'Metobas', type: 'city', lat: 31.2667, lng: 30.8000, governorate: 'kafr_el_sheikh' },
  { id: 'kafr_sheikh_hamool', name: 'الحامول', nameEn: 'Hamool', type: 'city', lat: 31.3167, lng: 31.0333, governorate: 'kafr_el_sheikh' },
  { id: 'kafr_sheikh_sidi_salem', name: 'سيدي سالم', nameEn: 'Sidi Salem', type: 'city', lat: 31.2500, lng: 30.8833, governorate: 'kafr_el_sheikh' },
  { id: 'kafr_sheikh_riyadh', name: 'الرياض', nameEn: 'Riyadh', type: 'city', lat: 31.0667, lng: 31.0167, governorate: 'kafr_el_sheikh' },
  { id: 'kafr_sheikh_qellin', name: 'قلين', nameEn: 'Qellin', type: 'city', lat: 31.0667, lng: 30.8500, governorate: 'kafr_el_sheikh' },
  
  // ========== محافظة الدقهلية ==========
  { id: 'dakahlia_mansoura', name: 'المنصورة', nameEn: 'Mansoura', type: 'city', lat: 31.0409, lng: 31.3785, governorate: 'dakahlia' },
  { id: 'dakahlia_talkha', name: 'طلخا', nameEn: 'Talkha', type: 'city', lat: 31.0667, lng: 31.3667, governorate: 'dakahlia' },
  { id: 'dakahlia_mit_ghamr', name: 'ميت غمر', nameEn: 'Mit Ghamr', type: 'city', lat: 30.7167, lng: 31.2667, governorate: 'dakahlia' },
  { id: 'dakahlia_aga', name: 'أجا', nameEn: 'Aga', type: 'city', lat: 30.8500, lng: 31.2833, governorate: 'dakahlia' },
  { id: 'dakahlia_belqas', name: 'بلقاس', nameEn: 'Belqas', type: 'city', lat: 31.2333, lng: 31.3667, governorate: 'dakahlia' },
  { id: 'dakahlia_dekernes', name: 'دكرنس', nameEn: 'Dekernes', type: 'city', lat: 31.0667, lng: 31.5500, governorate: 'dakahlia' },
  { id: 'dakahlia_manzala', name: 'المنزلة', nameEn: 'Manzala', type: 'city', lat: 31.1500, lng: 31.9333, governorate: 'dakahlia' },
  { id: 'dakahlia_sherbin', name: 'شربين', nameEn: 'Sherbin', type: 'city', lat: 31.2000, lng: 31.5000, governorate: 'dakahlia' },
  { id: 'dakahlia_sinbillawin', name: 'السنبلاوين', nameEn: 'Sinbillawin', type: 'city', lat: 30.8833, lng: 31.4167, governorate: 'dakahlia' },
  { id: 'dakahlia_mahallet_damana', name: 'محلة دمنة', nameEn: 'Mahallet Damana', type: 'city', lat: 31.1333, lng: 31.6667, governorate: 'dakahlia' },
  { id: 'dakahlia_dikirnis', name: 'دكرنس', nameEn: 'Dikirnis', type: 'city', lat: 31.0667, lng: 31.5500, governorate: 'dakahlia' },
  { id: 'dakahlia_nabaroh', name: 'نبروه', nameEn: 'Nabaroh', type: 'city', lat: 31.1333, lng: 31.3333, governorate: 'dakahlia' },
  { id: 'dakahlia_gamasa', name: 'جمصة', nameEn: 'Gamasa', type: 'city', lat: 31.4500, lng: 31.5000, governorate: 'dakahlia' },
  { id: 'dakahlia_mansoura_uni', name: 'جامعة المنصورة', nameEn: 'Mansoura University', type: 'university', lat: 31.0375, lng: 31.3614, governorate: 'dakahlia' },
  
  // ========== محافظة دمياط ==========
  { id: 'damietta_city', name: 'دمياط', nameEn: 'Damietta', type: 'city', lat: 31.4175, lng: 31.8144, governorate: 'damietta' },
  { id: 'damietta_new', name: 'دمياط الجديدة', nameEn: 'New Damietta', type: 'city', lat: 31.4500, lng: 31.6500, governorate: 'damietta' },
  { id: 'damietta_ras_bar', name: 'رأس البر', nameEn: 'Ras El Bar', type: 'city', lat: 31.5167, lng: 31.8333, governorate: 'damietta' },
  { id: 'damietta_faraskour', name: 'فارسكور', nameEn: 'Faraskour', type: 'city', lat: 31.3333, lng: 31.7167, governorate: 'damietta' },
  { id: 'damietta_kafr_saad', name: 'كفر سعد', nameEn: 'Kafr Saad', type: 'city', lat: 31.3500, lng: 31.8000, governorate: 'damietta' },
  { id: 'damietta_zarqa', name: 'الزرقا', nameEn: 'Zarqa', type: 'city', lat: 31.3833, lng: 31.8833, governorate: 'damietta' },
  { id: 'damietta_port', name: 'ميناء دمياط', nameEn: 'Damietta Port', type: 'port', lat: 31.4667, lng: 31.7500, governorate: 'damietta' },
  { id: 'damietta_furniture_city', name: 'مدينة الأثاث', nameEn: 'Furniture City', type: 'industrial', lat: 31.4200, lng: 31.8200, governorate: 'damietta' },
  
  // ========== محافظة الشرقية ==========
  { id: 'sharqia_zagazig', name: 'الزقازيق', nameEn: 'Zagazig', type: 'city', lat: 30.5877, lng: 31.5020, governorate: 'sharqia' },
  { id: 'sharqia_10_ramadan', name: 'العاشر من رمضان', nameEn: '10th of Ramadan City', type: 'city', lat: 30.2833, lng: 31.7500, governorate: 'sharqia' },
  { id: 'sharqia_belbeis', name: 'بلبيس', nameEn: 'Belbeis', type: 'city', lat: 30.4167, lng: 31.5667, governorate: 'sharqia' },
  { id: 'sharqia_abu_hammad', name: 'أبو حماد', nameEn: 'Abu Hammad', type: 'city', lat: 30.5500, lng: 31.6333, governorate: 'sharqia' },
  { id: 'sharqia_faqous', name: 'فاقوس', nameEn: 'Faqous', type: 'city', lat: 30.7333, lng: 31.8000, governorate: 'sharqia' },
  { id: 'sharqia_hihya', name: 'ههيا', nameEn: 'Hihya', type: 'city', lat: 30.6667, lng: 31.5833, governorate: 'sharqia' },
  { id: 'sharqia_minya_qamh', name: 'منيا القمح', nameEn: 'Minya El Qamh', type: 'city', lat: 30.5167, lng: 31.3500, governorate: 'sharqia' },
  { id: 'sharqia_abu_kebir', name: 'أبو كبير', nameEn: 'Abu Kebir', type: 'city', lat: 30.7167, lng: 31.6667, governorate: 'sharqia' },
  { id: 'sharqia_mashtoul', name: 'مشتول السوق', nameEn: 'Mashtoul El Souk', type: 'city', lat: 30.3667, lng: 31.4167, governorate: 'sharqia' },
  { id: 'sharqia_qenayat', name: 'القنايات', nameEn: 'Qenayat', type: 'city', lat: 30.3833, lng: 31.4833, governorate: 'sharqia' },
  { id: 'sharqia_husseiniya', name: 'الحسينية', nameEn: 'Husseiniya', type: 'city', lat: 30.8667, lng: 31.9667, governorate: 'sharqia' },
  { id: 'sharqia_diyarb_negm', name: 'ديرب نجم', nameEn: 'Diyarb Negm', type: 'city', lat: 30.7667, lng: 31.6333, governorate: 'sharqia' },
  { id: 'sharqia_kafr_saqr', name: 'كفر صقر', nameEn: 'Kafr Saqr', type: 'city', lat: 30.8000, lng: 31.6333, governorate: 'sharqia' },
  { id: 'sharqia_awlad_saqr', name: 'أولاد صقر', nameEn: 'Awlad Saqr', type: 'city', lat: 30.8167, lng: 31.7000, governorate: 'sharqia' },
  { id: 'sharqia_ibrahimiya', name: 'الإبراهيمية', nameEn: 'Ibrahimiya', type: 'city', lat: 30.6833, lng: 31.6833, governorate: 'sharqia' },
  { id: 'sharqia_san_hagar', name: 'صان الحجر', nameEn: 'San El Hagar', type: 'city', lat: 30.9833, lng: 31.8833, governorate: 'sharqia' },
  { id: 'sharqia_zagazig_uni', name: 'جامعة الزقازيق', nameEn: 'Zagazig University', type: 'university', lat: 30.5839, lng: 31.5022, governorate: 'sharqia' },
  
  // ========== محافظة المنوفية ==========
  { id: 'menoufia_shibin_kom', name: 'شبين الكوم', nameEn: 'Shibin El Kom', type: 'city', lat: 30.5580, lng: 31.0100, governorate: 'menoufia' },
  { id: 'menoufia_menouf', name: 'منوف', nameEn: 'Menouf', type: 'city', lat: 30.4667, lng: 30.9333, governorate: 'menoufia' },
  { id: 'menoufia_ashmoun', name: 'أشمون', nameEn: 'Ashmoun', type: 'city', lat: 30.3000, lng: 30.9833, governorate: 'menoufia' },
  { id: 'menoufia_sadat', name: 'مدينة السادات', nameEn: 'Sadat City', type: 'city', lat: 30.3708, lng: 30.5106, governorate: 'menoufia' },
  { id: 'menoufia_bagour', name: 'الباجور', nameEn: 'Bagour', type: 'city', lat: 30.4167, lng: 30.9667, governorate: 'menoufia' },
  { id: 'menoufia_quesna', name: 'قويسنا', nameEn: 'Quesna', type: 'city', lat: 30.5583, lng: 31.1583, governorate: 'menoufia' },
  { id: 'menoufia_berket_sab', name: 'بركة السبع', nameEn: 'Berket El Sab', type: 'city', lat: 30.6333, lng: 31.0833, governorate: 'menoufia' },
  { id: 'menoufia_tala', name: 'تلا', nameEn: 'Tala', type: 'city', lat: 30.6667, lng: 30.9333, governorate: 'menoufia' },
  { id: 'menoufia_sers_layan', name: 'سرس الليان', nameEn: 'Sers El Layan', type: 'city', lat: 30.5167, lng: 30.9667, governorate: 'menoufia' },
  { id: 'menoufia_shohada', name: 'الشهداء', nameEn: 'Shohada', type: 'city', lat: 30.6167, lng: 30.8833, governorate: 'menoufia' },
  { id: 'menoufia_uni', name: 'جامعة المنوفية', nameEn: 'Menoufia University', type: 'university', lat: 30.5575, lng: 31.0092, governorate: 'menoufia' },
  
  // ========== محافظة بورسعيد ==========
  { id: 'port_said_city', name: 'بورسعيد', nameEn: 'Port Said', type: 'city', lat: 31.2653, lng: 32.3019, governorate: 'port_said' },
  { id: 'port_said_sharq', name: 'حي الشرق', nameEn: 'East District', type: 'district', lat: 31.2589, lng: 32.2847, governorate: 'port_said' },
  { id: 'port_said_arab', name: 'حي العرب', nameEn: 'Arab District', type: 'district', lat: 31.2667, lng: 32.2833, governorate: 'port_said' },
  { id: 'port_said_manakh', name: 'حي المناخ', nameEn: 'Manakh District', type: 'district', lat: 31.2700, lng: 32.3000, governorate: 'port_said' },
  { id: 'port_said_zohour', name: 'حي الزهور', nameEn: 'Zohour District', type: 'district', lat: 31.2600, lng: 32.3200, governorate: 'port_said' },
  { id: 'port_said_dawahi', name: 'حي الضواحي', nameEn: 'Dawahi District', type: 'district', lat: 31.2500, lng: 32.3100, governorate: 'port_said' },
  { id: 'port_said_port_fouad', name: 'بور فؤاد', nameEn: 'Port Fouad', type: 'city', lat: 31.2333, lng: 32.3167, governorate: 'port_said' },
  { id: 'port_said_port', name: 'ميناء بورسعيد', nameEn: 'Port Said Port', type: 'port', lat: 31.2589, lng: 32.3019, governorate: 'port_said' },
  { id: 'port_said_suez_canal', name: 'قناة السويس', nameEn: 'Suez Canal', type: 'landmark', lat: 31.2653, lng: 32.3019, governorate: 'port_said' },
  
  // ========== محافظة الإسماعيلية ==========
  { id: 'ismailia_city', name: 'الإسماعيلية', nameEn: 'Ismailia', type: 'city', lat: 30.5965, lng: 32.2715, governorate: 'ismailia' },
  { id: 'ismailia_fayed', name: 'فايد', nameEn: 'Fayed', type: 'city', lat: 30.3167, lng: 32.4500, governorate: 'ismailia' },
  { id: 'ismailia_qantara_sharq', name: 'القنطرة شرق', nameEn: 'Qantara East', type: 'city', lat: 30.8500, lng: 32.3333, governorate: 'ismailia' },
  { id: 'ismailia_qantara_gharb', name: 'القنطرة غرب', nameEn: 'Qantara West', type: 'city', lat: 30.8500, lng: 32.3000, governorate: 'ismailia' },
  { id: 'ismailia_tal_kebir', name: 'التل الكبير', nameEn: 'Tal El Kebir', type: 'city', lat: 30.5500, lng: 31.8333, governorate: 'ismailia' },
  { id: 'ismailia_abu_sultan', name: 'أبو صلطان', nameEn: 'Abu Sultan', type: 'city', lat: 30.4833, lng: 32.1500, governorate: 'ismailia' },
  { id: 'ismailia_kassasin', name: 'القصاصين', nameEn: 'Kassasin', type: 'city', lat: 30.5333, lng: 31.9333, governorate: 'ismailia' },
  { id: 'ismailia_timsah_lake', name: 'بحيرة التمساح', nameEn: 'Timsah Lake', type: 'landmark', lat: 30.5667, lng: 32.3000, governorate: 'ismailia' },
  { id: 'ismailia_suez_canal_uni', name: 'جامعة قناة السويس', nameEn: 'Suez Canal University', type: 'university', lat: 30.6167, lng: 32.2708, governorate: 'ismailia' },
  
  // ========== محافظة السويس ==========
  { id: 'suez_city', name: 'السويس', nameEn: 'Suez', type: 'city', lat: 29.9668, lng: 32.5498, governorate: 'suez' },
  { id: 'suez_arbaein', name: 'حي الأربعين', nameEn: 'Arbaein District', type: 'district', lat: 29.9700, lng: 32.5500, governorate: 'suez' },
  { id: 'suez_suez', name: 'حي السويس', nameEn: 'Suez District', type: 'district', lat: 29.9667, lng: 32.5500, governorate: 'suez' },
  { id: 'suez_faisal', name: 'حي فيصل', nameEn: 'Faisal District', type: 'district', lat: 29.9600, lng: 32.5400, governorate: 'suez' },
  { id: 'suez_ganayen', name: 'الجناين', nameEn: 'Ganayen', type: 'city', lat: 30.0667, lng: 32.4333, governorate: 'suez' },
  { id: 'suez_ataka', name: 'عتاقة', nameEn: 'Ataka', type: 'city', lat: 29.9167, lng: 32.5167, governorate: 'suez' },
  { id: 'suez_ain_sokhna', name: 'العين السخنة', nameEn: 'Ain Sokhna', type: 'city', lat: 29.5500, lng: 32.3667, governorate: 'suez' },
  { id: 'suez_port', name: 'ميناء السويس', nameEn: 'Suez Port', type: 'port', lat: 29.9583, lng: 32.5500, governorate: 'suez' },
  { id: 'suez_sczone', name: 'المنطقة الاقتصادية لقناة السويس', nameEn: 'Suez Canal Economic Zone', type: 'industrial', lat: 29.5500, lng: 32.3667, governorate: 'suez' },
  
  // ========== محافظة بني سويف ==========
  { id: 'beni_suef_city', name: 'بني سويف', nameEn: 'Beni Suef', type: 'city', lat: 29.0661, lng: 31.0994, governorate: 'beni_suef' },
  { id: 'beni_suef_nasser', name: 'ناصر', nameEn: 'Nasser', type: 'city', lat: 28.9667, lng: 31.0167, governorate: 'beni_suef' },
  { id: 'beni_suef_ehnasya', name: 'إهناسيا', nameEn: 'Ehnasya', type: 'city', lat: 29.0833, lng: 30.9333, governorate: 'beni_suef' },
  { id: 'beni_suef_beba', name: 'ببا', nameEn: 'Beba', type: 'city', lat: 28.9333, lng: 31.0000, governorate: 'beni_suef' },
  { id: 'beni_suef_fashn', name: 'الفشن', nameEn: 'Fashn', type: 'city', lat: 28.8333, lng: 30.9167, governorate: 'beni_suef' },
  { id: 'beni_suef_wasta', name: 'الواسطى', nameEn: 'Wasta', type: 'city', lat: 29.2167, lng: 31.1833, governorate: 'beni_suef' },
  { id: 'beni_suef_samasta', name: 'سمسطا', nameEn: 'Samasta', type: 'city', lat: 28.8833, lng: 30.8333, governorate: 'beni_suef' },
  { id: 'beni_suef_new', name: 'بني سويف الجديدة', nameEn: 'New Beni Suef', type: 'city', lat: 29.0500, lng: 31.0833, governorate: 'beni_suef' },
  { id: 'beni_suef_uni', name: 'جامعة بني سويف', nameEn: 'Beni Suef University', type: 'university', lat: 29.0717, lng: 31.0967, governorate: 'beni_suef' },
  
  // ========== محافظة الفيوم ==========
  { id: 'fayoum_city', name: 'الفيوم', nameEn: 'Fayoum', type: 'city', lat: 29.3084, lng: 30.8428, governorate: 'fayoum' },
  { id: 'fayoum_ibsheway', name: 'إبشواي', nameEn: 'Ibsheway', type: 'city', lat: 29.3667, lng: 30.7000, governorate: 'fayoum' },
  { id: 'fayoum_itsa', name: 'إطسا', nameEn: 'Itsa', type: 'city', lat: 29.2833, lng: 30.7333, governorate: 'fayoum' },
  { id: 'fayoum_tamiya', name: 'طامية', nameEn: 'Tamiya', type: 'city', lat: 29.5000, lng: 30.9500, governorate: 'fayoum' },
  { id: 'fayoum_senoures', name: 'سنورس', nameEn: 'Senoures', type: 'city', lat: 29.4167, lng: 30.8833, governorate: 'fayoum' },
  { id: 'fayoum_youssef_seddik', name: 'يوسف الصديق', nameEn: 'Youssef El Seddik', type: 'city', lat: 29.4667, lng: 30.7500, governorate: 'fayoum' },
  { id: 'fayoum_new', name: 'الفيوم الجديدة', nameEn: 'New Fayoum', type: 'city', lat: 29.3200, lng: 30.8500, governorate: 'fayoum' },
  { id: 'fayoum_qarun_lake', name: 'بحيرة قارون', nameEn: 'Qarun Lake', type: 'landmark', lat: 29.4667, lng: 30.5833, governorate: 'fayoum' },
  { id: 'fayoum_wadi_rayan', name: 'وادي الريان', nameEn: 'Wadi El Rayan', type: 'landmark', lat: 29.2500, lng: 30.4333, governorate: 'fayoum' },
  { id: 'fayoum_uni', name: 'جامعة الفيوم', nameEn: 'Fayoum University', type: 'university', lat: 29.3092, lng: 30.8417, governorate: 'fayoum' },
  
  // ========== محافظة المنيا ==========
  { id: 'minya_city', name: 'المنيا', nameEn: 'Minya', type: 'city', lat: 28.1099, lng: 30.7503, governorate: 'minya' },
  { id: 'minya_mallawi', name: 'ملوي', nameEn: 'Mallawi', type: 'city', lat: 27.7333, lng: 30.8500, governorate: 'minya' },
  { id: 'minya_samalout', name: 'سمالوط', nameEn: 'Samalout', type: 'city', lat: 28.3167, lng: 30.7167, governorate: 'minya' },
  { id: 'minya_maghagha', name: 'مغاغة', nameEn: 'Maghagha', type: 'city', lat: 28.6500, lng: 30.8500, governorate: 'minya' },
  { id: 'minya_beni_mazar', name: 'بني مزار', nameEn: 'Beni Mazar', type: 'city', lat: 28.5000, lng: 30.8000, governorate: 'minya' },
  { id: 'minya_matai', name: 'مطاي', nameEn: 'Matai', type: 'city', lat: 28.4167, lng: 30.7833, governorate: 'minya' },
  { id: 'minya_abu_qirqas', name: 'أبو قرقاص', nameEn: 'Abu Qirqas', type: 'city', lat: 27.9333, lng: 30.8333, governorate: 'minya' },
  { id: 'minya_dayr_mawas', name: 'دير مواس', nameEn: 'Dayr Mawas', type: 'city', lat: 27.6333, lng: 30.8500, governorate: 'minya' },
  { id: 'minya_adwa', name: 'العدوة', nameEn: 'Adwa', type: 'city', lat: 28.5667, lng: 30.8167, governorate: 'minya' },
  { id: 'minya_new', name: 'المنيا الجديدة', nameEn: 'New Minya', type: 'city', lat: 28.1167, lng: 30.7500, governorate: 'minya' },
  { id: 'minya_tel_el_amarna', name: 'تل العمارنة', nameEn: 'Tel El Amarna', type: 'landmark', lat: 27.6500, lng: 30.9000, governorate: 'minya' },
  { id: 'minya_uni', name: 'جامعة المنيا', nameEn: 'Minya University', type: 'university', lat: 28.1083, lng: 30.7500, governorate: 'minya' },
  
  // ========== محافظة أسيوط ==========
  { id: 'assiut_city', name: 'أسيوط', nameEn: 'Assiut', type: 'city', lat: 27.1809, lng: 31.1837, governorate: 'assiut' },
  { id: 'assiut_manfalout', name: 'منفلوط', nameEn: 'Manfalout', type: 'city', lat: 27.3167, lng: 30.9667, governorate: 'assiut' },
  { id: 'assiut_qusiya', name: 'القوصية', nameEn: 'Qusiya', type: 'city', lat: 27.4333, lng: 30.8333, governorate: 'assiut' },
  { id: 'assiut_dayrout', name: 'ديروط', nameEn: 'Dayrout', type: 'city', lat: 27.5500, lng: 30.8167, governorate: 'assiut' },
  { id: 'assiut_abnob', name: 'أبنوب', nameEn: 'Abnob', type: 'city', lat: 27.2667, lng: 31.1500, governorate: 'assiut' },
  { id: 'assiut_fath', name: 'الفتح', nameEn: 'Fath', type: 'city', lat: 27.0500, lng: 31.2333, governorate: 'assiut' },
  { id: 'assiut_badari', name: 'البداري', nameEn: 'Badari', type: 'city', lat: 26.9833, lng: 31.4167, governorate: 'assiut' },
  { id: 'assiut_sahel_selim', name: 'ساحل سليم', nameEn: 'Sahel Selim', type: 'city', lat: 27.1167, lng: 31.1500, governorate: 'assiut' },
  { id: 'assiut_ghanayem', name: 'الغنايم', nameEn: 'Ghanayem', type: 'city', lat: 27.0667, lng: 31.2833, governorate: 'assiut' },
  { id: 'assiut_sidfa', name: 'صدفا', nameEn: 'Sidfa', type: 'city', lat: 26.9333, lng: 31.4167, governorate: 'assiut' },
  { id: 'assiut_new', name: 'أسيوط الجديدة', nameEn: 'New Assiut', type: 'city', lat: 27.1833, lng: 31.2000, governorate: 'assiut' },
  { id: 'assiut_uni', name: 'جامعة أسيوط', nameEn: 'Assiut University', type: 'university', lat: 27.1956, lng: 31.1556, governorate: 'assiut' },
  { id: 'assiut_barrage', name: 'قناطر أسيوط', nameEn: 'Assiut Barrage', type: 'landmark', lat: 27.2000, lng: 31.1833, governorate: 'assiut' },
  
  // ========== محافظة سوهاج ==========
  { id: 'sohag_city', name: 'سوهاج', nameEn: 'Sohag', type: 'city', lat: 26.5569, lng: 31.6948, governorate: 'sohag' },
  { id: 'sohag_akhmim', name: 'أخميم', nameEn: 'Akhmim', type: 'city', lat: 26.5667, lng: 31.7500, governorate: 'sohag' },
  { id: 'sohag_girga', name: 'جرجا', nameEn: 'Girga', type: 'city', lat: 26.3333, lng: 31.9000, governorate: 'sohag' },
  { id: 'sohag_tahta', name: 'طهطا', nameEn: 'Tahta', type: 'city', lat: 26.7667, lng: 31.5000, governorate: 'sohag' },
  { id: 'sohag_temay', name: 'المنشأة', nameEn: 'Temay El Amdid', type: 'city', lat: 26.7000, lng: 31.5500, governorate: 'sohag' },
  { id: 'sohag_balyana', name: 'البلينا', nameEn: 'Balyana', type: 'city', lat: 26.2333, lng: 32.0000, governorate: 'sohag' },
  { id: 'sohag_maragha', name: 'المراغة', nameEn: 'Maragha', type: 'city', lat: 26.6667, lng: 31.6333, governorate: 'sohag' },
  { id: 'sohag_dar_salam', name: 'دار السلام', nameEn: 'Dar El Salam', type: 'city', lat: 26.3833, lng: 31.8333, governorate: 'sohag' },
  { id: 'sohag_sakolta', name: 'ساقلتة', nameEn: 'Sakolta', type: 'city', lat: 26.4833, lng: 31.7167, governorate: 'sohag' },
  { id: 'sohag_new', name: 'سوهاج الجديدة', nameEn: 'New Sohag', type: 'city', lat: 26.5500, lng: 31.7000, governorate: 'sohag' },
  { id: 'sohag_abydos', name: 'أبيدوس', nameEn: 'Abydos', type: 'landmark', lat: 26.1833, lng: 31.9167, governorate: 'sohag' },
  { id: 'sohag_uni', name: 'جامعة سوهاج', nameEn: 'Sohag University', type: 'university', lat: 26.5558, lng: 31.6944, governorate: 'sohag' },
  
  // ========== محافظة قنا ==========
  { id: 'qena_city', name: 'قنا', nameEn: 'Qena', type: 'city', lat: 26.1551, lng: 32.7160, governorate: 'qena' },
  { id: 'qena_nag_hammadi', name: 'نجع حمادي', nameEn: 'Nag Hammadi', type: 'city', lat: 26.0500, lng: 32.2500, governorate: 'qena' },
  { id: 'qena_qift', name: 'قفط', nameEn: 'Qift', type: 'city', lat: 26.0000, lng: 32.8167, governorate: 'qena' },
  { id: 'qena_qus', name: 'قوص', nameEn: 'Qus', type: 'city', lat: 25.9000, lng: 32.7667, governorate: 'qena' },
  { id: 'qena_dishna', name: 'دشنا', nameEn: 'Dishna', type: 'city', lat: 26.1167, lng: 32.4667, governorate: 'qena' },
  { id: 'qena_wakf', name: 'الوقف', nameEn: 'Wakf', type: 'city', lat: 26.1667, lng: 32.4500, governorate: 'qena' },
  { id: 'qena_abu_tesht', name: 'أبو تشت', nameEn: 'Abu Tesht', type: 'city', lat: 26.0667, lng: 32.0333, governorate: 'qena' },
  { id: 'qena_farshut', name: 'فرشوط', nameEn: 'Farshut', type: 'city', lat: 26.0667, lng: 32.1500, governorate: 'qena' },
  { id: 'qena_new', name: 'قنا الجديدة', nameEn: 'New Qena', type: 'city', lat: 26.1600, lng: 32.7200, governorate: 'qena' },
  { id: 'qena_dendera', name: 'دندرة', nameEn: 'Dendera', type: 'landmark', lat: 26.1417, lng: 32.6694, governorate: 'qena' },
  { id: 'qena_aluminum', name: 'مصنع الألومنيوم نجع حمادي', nameEn: 'Nag Hammadi Aluminum Factory', type: 'industrial', lat: 26.0500, lng: 32.2333, governorate: 'qena' },
  { id: 'qena_uni', name: 'جامعة جنوب الوادي', nameEn: 'South Valley University', type: 'university', lat: 26.1600, lng: 32.7175, governorate: 'qena' },
  
  // ========== محافظة الأقصر ==========
  { id: 'luxor_city', name: 'الأقصر', nameEn: 'Luxor', type: 'city', lat: 25.6872, lng: 32.6396, governorate: 'luxor' },
  { id: 'luxor_esna', name: 'إسنا', nameEn: 'Esna', type: 'city', lat: 25.2833, lng: 32.5500, governorate: 'luxor' },
  { id: 'luxor_armant', name: 'أرمنت', nameEn: 'Armant', type: 'city', lat: 25.6167, lng: 32.5333, governorate: 'luxor' },
  { id: 'luxor_qurna', name: 'القرنة', nameEn: 'Qurna', type: 'city', lat: 25.7333, lng: 32.6000, governorate: 'luxor' },
  { id: 'luxor_toud', name: 'الطود', nameEn: 'Toud', type: 'city', lat: 25.5333, lng: 32.5333, governorate: 'luxor' },
  { id: 'luxor_new', name: 'الأقصر الجديدة', nameEn: 'New Luxor', type: 'city', lat: 25.7000, lng: 32.6500, governorate: 'luxor' },
  { id: 'luxor_karnak', name: 'معبد الكرنك', nameEn: 'Karnak Temple', type: 'landmark', lat: 25.7186, lng: 32.6573, governorate: 'luxor' },
  { id: 'luxor_temple', name: 'معبد الأقصر', nameEn: 'Luxor Temple', type: 'landmark', lat: 25.6995, lng: 32.6390, governorate: 'luxor' },
  { id: 'luxor_valley_kings', name: 'وادي الملوك', nameEn: 'Valley of the Kings', type: 'landmark', lat: 25.7402, lng: 32.6014, governorate: 'luxor' },
  { id: 'luxor_valley_queens', name: 'وادي الملكات', nameEn: 'Valley of the Queens', type: 'landmark', lat: 25.7311, lng: 32.5886, governorate: 'luxor' },
  { id: 'luxor_hatshepsut', name: 'معبد حتشبسوت', nameEn: 'Hatshepsut Temple', type: 'landmark', lat: 25.7380, lng: 32.6067, governorate: 'luxor' },
  { id: 'luxor_memnon', name: 'تمثالي ممنون', nameEn: 'Colossi of Memnon', type: 'landmark', lat: 25.7197, lng: 32.6114, governorate: 'luxor' },
  { id: 'luxor_airport', name: 'مطار الأقصر الدولي', nameEn: 'Luxor International Airport', type: 'airport', lat: 25.6747, lng: 32.7067, governorate: 'luxor' },
  
  // ========== محافظة أسوان ==========
  { id: 'aswan_city', name: 'أسوان', nameEn: 'Aswan', type: 'city', lat: 24.0889, lng: 32.8998, governorate: 'aswan' },
  { id: 'aswan_edfu', name: 'إدفو', nameEn: 'Edfu', type: 'city', lat: 24.9833, lng: 32.8667, governorate: 'aswan' },
  { id: 'aswan_kom_ombo', name: 'كوم أمبو', nameEn: 'Kom Ombo', type: 'city', lat: 24.4667, lng: 32.9333, governorate: 'aswan' },
  { id: 'aswan_daraw', name: 'دراو', nameEn: 'Daraw', type: 'city', lat: 24.4167, lng: 32.9333, governorate: 'aswan' },
  { id: 'aswan_nasr_nuba', name: 'نصر النوبة', nameEn: 'Nasr El Nuba', type: 'city', lat: 23.9333, lng: 32.8833, governorate: 'aswan' },
  { id: 'aswan_abu_simbel', name: 'أبو سمبل', nameEn: 'Abu Simbel', type: 'city', lat: 22.3372, lng: 31.6258, governorate: 'aswan' },
  { id: 'aswan_new', name: 'أسوان الجديدة', nameEn: 'New Aswan', type: 'city', lat: 24.1000, lng: 32.9000, governorate: 'aswan' },
  { id: 'aswan_high_dam', name: 'السد العالي', nameEn: 'Aswan High Dam', type: 'landmark', lat: 23.9708, lng: 32.8789, governorate: 'aswan' },
  { id: 'aswan_philae', name: 'معبد فيلة', nameEn: 'Philae Temple', type: 'landmark', lat: 24.0244, lng: 32.8844, governorate: 'aswan' },
  { id: 'aswan_abu_simbel_temple', name: 'معبد أبو سمبل', nameEn: 'Abu Simbel Temple', type: 'landmark', lat: 22.3364, lng: 31.6256, governorate: 'aswan' },
  { id: 'aswan_elephantine', name: 'جزيرة إلفنتين', nameEn: 'Elephantine Island', type: 'landmark', lat: 24.0833, lng: 32.8833, governorate: 'aswan' },
  { id: 'aswan_unfinished_obelisk', name: 'المسلة الناقصة', nameEn: 'Unfinished Obelisk', type: 'landmark', lat: 24.0742, lng: 32.9019, governorate: 'aswan' },
  { id: 'aswan_nasser_lake', name: 'بحيرة ناصر', nameEn: 'Lake Nasser', type: 'landmark', lat: 23.0000, lng: 32.5000, governorate: 'aswan' },
  { id: 'aswan_airport', name: 'مطار أسوان الدولي', nameEn: 'Aswan International Airport', type: 'airport', lat: 23.9647, lng: 32.8200, governorate: 'aswan' },
  { id: 'aswan_uni', name: 'جامعة أسوان', nameEn: 'Aswan University', type: 'university', lat: 24.0917, lng: 32.9000, governorate: 'aswan' },
  
  // ========== محافظة البحر الأحمر ==========
  { id: 'red_sea_hurghada', name: 'الغردقة', nameEn: 'Hurghada', type: 'city', lat: 27.2579, lng: 33.8116, governorate: 'red_sea' },
  { id: 'red_sea_safaga', name: 'سفاجا', nameEn: 'Safaga', type: 'city', lat: 26.7500, lng: 33.9333, governorate: 'red_sea' },
  { id: 'red_sea_quseir', name: 'القصير', nameEn: 'Quseir', type: 'city', lat: 26.1000, lng: 34.2833, governorate: 'red_sea' },
  { id: 'red_sea_marsa_alam', name: 'مرسى علم', nameEn: 'Marsa Alam', type: 'city', lat: 25.0667, lng: 34.8833, governorate: 'red_sea' },
  { id: 'red_sea_shalatin', name: 'الشلاتين', nameEn: 'Shalatin', type: 'city', lat: 23.1333, lng: 35.4667, governorate: 'red_sea' },
  { id: 'red_sea_halayeb', name: 'حلايب', nameEn: 'Halayeb', type: 'city', lat: 22.2167, lng: 36.6500, governorate: 'red_sea' },
  { id: 'red_sea_ras_ghareb', name: 'رأس غارب', nameEn: 'Ras Ghareb', type: 'city', lat: 28.3500, lng: 33.0833, governorate: 'red_sea' },
  { id: 'red_sea_zaafarana', name: 'الزعفرانة', nameEn: 'Zaafarana', type: 'city', lat: 29.1333, lng: 32.6667, governorate: 'red_sea' },
  { id: 'red_sea_el_gouna', name: 'الجونة', nameEn: 'El Gouna', type: 'city', lat: 27.3956, lng: 33.6797, governorate: 'red_sea' },
  { id: 'red_sea_makadi', name: 'مكادي باي', nameEn: 'Makadi Bay', type: 'district', lat: 27.0000, lng: 33.8833, governorate: 'red_sea' },
  { id: 'red_sea_soma_bay', name: 'سوما باي', nameEn: 'Soma Bay', type: 'district', lat: 26.8667, lng: 33.9333, governorate: 'red_sea' },
  { id: 'red_sea_hurghada_airport', name: 'مطار الغردقة الدولي', nameEn: 'Hurghada International Airport', type: 'airport', lat: 27.1783, lng: 33.8000, governorate: 'red_sea' },
  { id: 'red_sea_marsa_alam_airport', name: 'مطار مرسى علم الدولي', nameEn: 'Marsa Alam International Airport', type: 'airport', lat: 25.5569, lng: 34.5836, governorate: 'red_sea' },
  
  // ========== محافظة مطروح ==========
  { id: 'matrouh_city', name: 'مرسى مطروح', nameEn: 'Marsa Matrouh', type: 'city', lat: 31.3543, lng: 27.2373, governorate: 'matrouh' },
  { id: 'matrouh_siwa', name: 'سيوة', nameEn: 'Siwa Oasis', type: 'city', lat: 29.2028, lng: 25.5197, governorate: 'matrouh' },
  { id: 'matrouh_el_alamein', name: 'العلمين', nameEn: 'El Alamein', type: 'city', lat: 30.8333, lng: 28.9500, governorate: 'matrouh' },
  { id: 'matrouh_el_alamein_new', name: 'العلمين الجديدة', nameEn: 'New El Alamein', type: 'city', lat: 30.8000, lng: 28.9667, governorate: 'matrouh' },
  { id: 'matrouh_dabaa', name: 'الضبعة', nameEn: 'Dabaa', type: 'city', lat: 31.0500, lng: 28.4333, governorate: 'matrouh' },
  { id: 'matrouh_hammam', name: 'الحمام', nameEn: 'El Hammam', type: 'city', lat: 31.0333, lng: 29.1833, governorate: 'matrouh' },
  { id: 'matrouh_sidi_barrani', name: 'سيدي براني', nameEn: 'Sidi Barrani', type: 'city', lat: 31.6167, lng: 25.9167, governorate: 'matrouh' },
  { id: 'matrouh_salloum', name: 'السلوم', nameEn: 'Salloum', type: 'city', lat: 31.5500, lng: 25.1833, governorate: 'matrouh' },
  { id: 'matrouh_fuka', name: 'فوكة', nameEn: 'Fuka', type: 'city', lat: 31.0667, lng: 27.9333, governorate: 'matrouh' },
  { id: 'matrouh_ras_hikma', name: 'رأس الحكمة', nameEn: 'Ras El Hikma', type: 'city', lat: 31.1333, lng: 27.4667, governorate: 'matrouh' },
  { id: 'matrouh_sidi_abdel_rahman', name: 'سيدي عبد الرحمن', nameEn: 'Sidi Abdel Rahman', type: 'city', lat: 30.9500, lng: 28.7333, governorate: 'matrouh' },
  { id: 'matrouh_cleopatra_beach', name: 'شاطئ كليوباترا', nameEn: 'Cleopatra Beach', type: 'landmark', lat: 31.3500, lng: 27.2500, governorate: 'matrouh' },
  { id: 'matrouh_alamein_memorial', name: 'مقبرة العلمين', nameEn: 'El Alamein War Cemetery', type: 'landmark', lat: 30.8383, lng: 28.9478, governorate: 'matrouh' },
  { id: 'matrouh_airport', name: 'مطار مرسى مطروح', nameEn: 'Marsa Matrouh Airport', type: 'airport', lat: 31.3253, lng: 27.2217, governorate: 'matrouh' },
  { id: 'matrouh_alamein_airport', name: 'مطار العلمين الدولي', nameEn: 'Alamein International Airport', type: 'airport', lat: 30.9241, lng: 29.1906, governorate: 'matrouh' },
  
  // ========== محافظة الوادي الجديد ==========
  { id: 'new_valley_kharga', name: 'الخارجة', nameEn: 'Kharga', type: 'city', lat: 25.4390, lng: 30.5503, governorate: 'new_valley' },
  { id: 'new_valley_dakhla', name: 'الداخلة', nameEn: 'Dakhla', type: 'city', lat: 25.4833, lng: 29.0000, governorate: 'new_valley' },
  { id: 'new_valley_farafra', name: 'الفرافرة', nameEn: 'Farafra', type: 'city', lat: 27.0567, lng: 27.9694, governorate: 'new_valley' },
  { id: 'new_valley_baris', name: 'باريس', nameEn: 'Baris', type: 'city', lat: 24.7500, lng: 30.6167, governorate: 'new_valley' },
  { id: 'new_valley_balat', name: 'بلاط', nameEn: 'Balat', type: 'city', lat: 25.5333, lng: 29.3000, governorate: 'new_valley' },
  { id: 'new_valley_mut', name: 'موط', nameEn: 'Mut', type: 'city', lat: 25.4833, lng: 28.9833, governorate: 'new_valley' },
  { id: 'new_valley_white_desert', name: 'الصحراء البيضاء', nameEn: 'White Desert', type: 'landmark', lat: 27.2500, lng: 28.0000, governorate: 'new_valley' },
  { id: 'new_valley_black_desert', name: 'الصحراء السوداء', nameEn: 'Black Desert', type: 'landmark', lat: 27.2833, lng: 28.5500, governorate: 'new_valley' },
  { id: 'new_valley_crystal_mountain', name: 'الجبل الكريستالي', nameEn: 'Crystal Mountain', type: 'landmark', lat: 27.2667, lng: 28.0167, governorate: 'new_valley' },
  
  // ========== محافظة شمال سيناء ==========
  { id: 'north_sinai_arish', name: 'العريش', nameEn: 'Arish', type: 'city', lat: 31.1314, lng: 33.7980, governorate: 'north_sinai' },
  { id: 'north_sinai_rafah', name: 'رفح', nameEn: 'Rafah', type: 'city', lat: 31.2833, lng: 34.2167, governorate: 'north_sinai' },
  { id: 'north_sinai_sheikh_zuweid', name: 'الشيخ زويد', nameEn: 'Sheikh Zuweid', type: 'city', lat: 31.2167, lng: 34.1333, governorate: 'north_sinai' },
  { id: 'north_sinai_bir_abd', name: 'بئر العبد', nameEn: 'Bir El Abd', type: 'city', lat: 31.0000, lng: 33.0333, governorate: 'north_sinai' },
  { id: 'north_sinai_hasana', name: 'الحسنة', nameEn: 'Hasana', type: 'city', lat: 30.4500, lng: 33.7833, governorate: 'north_sinai' },
  { id: 'north_sinai_nakhl', name: 'نخل', nameEn: 'Nakhl', type: 'city', lat: 29.9333, lng: 33.7667, governorate: 'north_sinai' },
  { id: 'north_sinai_airport', name: 'مطار العريش الدولي', nameEn: 'El Arish International Airport', type: 'airport', lat: 31.0731, lng: 33.8356, governorate: 'north_sinai' },
  
  // ========== محافظة جنوب سيناء ==========
  { id: 'south_sinai_tor', name: 'الطور', nameEn: 'El Tor', type: 'city', lat: 28.2380, lng: 33.6177, governorate: 'south_sinai' },
  { id: 'south_sinai_sharm', name: 'شرم الشيخ', nameEn: 'Sharm El Sheikh', type: 'city', lat: 27.9158, lng: 34.3300, governorate: 'south_sinai' },
  { id: 'south_sinai_dahab', name: 'دهب', nameEn: 'Dahab', type: 'city', lat: 28.4958, lng: 34.5089, governorate: 'south_sinai' },
  { id: 'south_sinai_nuweiba', name: 'نويبع', nameEn: 'Nuweiba', type: 'city', lat: 29.0250, lng: 34.6700, governorate: 'south_sinai' },
  { id: 'south_sinai_taba', name: 'طابا', nameEn: 'Taba', type: 'city', lat: 29.4917, lng: 34.8883, governorate: 'south_sinai' },
  { id: 'south_sinai_saint_catherine', name: 'سانت كاترين', nameEn: 'Saint Catherine', type: 'city', lat: 28.5608, lng: 33.9400, governorate: 'south_sinai' },
  { id: 'south_sinai_abu_zenima', name: 'أبو زنيمة', nameEn: 'Abu Zenima', type: 'city', lat: 29.0333, lng: 33.1000, governorate: 'south_sinai' },
  { id: 'south_sinai_ras_sudr', name: 'رأس سدر', nameEn: 'Ras Sudr', type: 'city', lat: 29.5833, lng: 32.7167, governorate: 'south_sinai' },
  { id: 'south_sinai_mount_sinai', name: 'جبل موسى', nameEn: 'Mount Sinai', type: 'landmark', lat: 28.5394, lng: 33.9753, governorate: 'south_sinai' },
  { id: 'south_sinai_monastery', name: 'دير سانت كاترين', nameEn: 'Saint Catherine Monastery', type: 'landmark', lat: 28.5558, lng: 33.9756, governorate: 'south_sinai' },
  { id: 'south_sinai_naama_bay', name: 'خليج نعمة', nameEn: 'Naama Bay', type: 'district', lat: 27.9083, lng: 34.3250, governorate: 'south_sinai' },
  { id: 'south_sinai_ras_mohamed', name: 'محمية رأس محمد', nameEn: 'Ras Mohamed National Park', type: 'landmark', lat: 27.7333, lng: 34.2500, governorate: 'south_sinai' },
  { id: 'south_sinai_blue_hole', name: 'الحفرة الزرقاء', nameEn: 'Blue Hole', type: 'landmark', lat: 28.5708, lng: 34.5386, governorate: 'south_sinai' },
  { id: 'south_sinai_sharm_airport', name: 'مطار شرم الشيخ الدولي', nameEn: 'Sharm El Sheikh International Airport', type: 'airport', lat: 27.9773, lng: 34.3951, governorate: 'south_sinai' },
  { id: 'south_sinai_taba_airport', name: 'مطار طابا الدولي', nameEn: 'Taba International Airport', type: 'airport', lat: 29.5878, lng: 34.7781, governorate: 'south_sinai' },
];

// دالة للبحث في المواقع
export function searchEgyptLocations(query: string): EgyptLocation[] {
  const normalizedQuery = query.toLowerCase().trim();
  const words = normalizedQuery.split(/\s+/);
  
  return EGYPT_LOCATIONS.filter(location => {
    const searchableText = `${location.name} ${location.nameEn} ${location.governorate}`.toLowerCase();
    return words.some(word => searchableText.includes(word));
  }).slice(0, 50);
}

// دالة للحصول على مواقع محافظة معينة
export function getLocationsByGovernorate(governorateId: string): EgyptLocation[] {
  return EGYPT_LOCATIONS.filter(loc => loc.governorate === governorateId);
}

// دالة للحصول على مواقع حسب النوع
export function getLocationsByType(type: EgyptLocation['type']): EgyptLocation[] {
  return EGYPT_LOCATIONS.filter(loc => loc.type === type);
}

// دالة للحصول على محافظة بالاسم
export function getGovernorateByName(name: string): Governorate | undefined {
  const normalizedName = name.toLowerCase().trim();
  return EGYPT_GOVERNORATES.find(gov => 
    gov.name.toLowerCase().includes(normalizedName) || 
    gov.nameEn.toLowerCase().includes(normalizedName)
  );
}

// إحصائيات
export const EGYPT_STATS = {
  totalGovernorates: EGYPT_GOVERNORATES.length,
  totalLocations: EGYPT_LOCATIONS.length,
  totalCities: EGYPT_LOCATIONS.filter(l => l.type === 'city').length,
  totalDistricts: EGYPT_LOCATIONS.filter(l => l.type === 'district').length,
  totalLandmarks: EGYPT_LOCATIONS.filter(l => l.type === 'landmark').length,
  totalAirports: EGYPT_LOCATIONS.filter(l => l.type === 'airport').length,
  totalUniversities: EGYPT_LOCATIONS.filter(l => l.type === 'university').length,
  totalPorts: EGYPT_LOCATIONS.filter(l => l.type === 'port').length,
  totalIndustrial: EGYPT_LOCATIONS.filter(l => l.type === 'industrial').length,
};

export default {
  governorates: EGYPT_GOVERNORATES,
  locations: EGYPT_LOCATIONS,
  stats: EGYPT_STATS,
  searchLocations: searchEgyptLocations,
  getLocationsByGovernorate,
  getLocationsByType,
  getGovernorateByName,
};
