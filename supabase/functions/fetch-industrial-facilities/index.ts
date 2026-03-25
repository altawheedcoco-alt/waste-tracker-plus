import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Egyptian cities with coordinates for Google Places search
const EGYPTIAN_CITIES = [
  { name: "القاهرة", lat: 30.0444, lng: 31.2357 },
  { name: "الجيزة", lat: 30.0131, lng: 31.2089 },
  { name: "السادس من أكتوبر", lat: 29.9375, lng: 30.9278 },
  { name: "العاشر من رمضان", lat: 30.2833, lng: 31.7500 },
  { name: "الإسكندرية", lat: 31.2001, lng: 29.9187 },
  { name: "برج العرب", lat: 30.8575, lng: 29.5433 },
  { name: "السويس", lat: 29.9833, lng: 32.5500 },
  { name: "بورسعيد", lat: 31.2653, lng: 32.3019 },
  { name: "الإسماعيلية", lat: 30.5965, lng: 32.2715 },
  { name: "المنصورة", lat: 31.0409, lng: 31.3785 },
  { name: "طنطا", lat: 30.7865, lng: 31.0004 },
  { name: "المحلة الكبرى", lat: 30.9667, lng: 31.1667 },
  { name: "دمياط", lat: 31.4175, lng: 31.8144 },
  { name: "أسيوط", lat: 27.1809, lng: 31.1837 },
  { name: "سوهاج", lat: 26.5569, lng: 31.6948 },
  { name: "قنا", lat: 26.1551, lng: 32.7160 },
  { name: "أسوان", lat: 24.0889, lng: 32.8998 },
  { name: "الأقصر", lat: 25.6872, lng: 32.6396 },
  { name: "بني سويف", lat: 29.0661, lng: 31.0994 },
  { name: "المنيا", lat: 28.1099, lng: 30.7503 },
  { name: "الفيوم", lat: 29.3084, lng: 30.8428 },
  { name: "شبين الكوم", lat: 30.5580, lng: 31.0100 },
  { name: "بنها", lat: 30.4667, lng: 31.1833 },
  { name: "الزقازيق", lat: 30.5877, lng: 31.5020 },
  { name: "كفر الشيخ", lat: 31.1107, lng: 30.9388 },
  { name: "مرسى مطروح", lat: 31.3543, lng: 27.2373 },
  { name: "العريش", lat: 31.1314, lng: 33.7980 },
  { name: "حلوان", lat: 29.8500, lng: 31.3000 },
  { name: "شبرا الخيمة", lat: 30.1279, lng: 31.2486 },
  { name: "العبور", lat: 30.2167, lng: 31.4667 },
];

const INDUSTRIAL_KEYWORDS = [
  "مصنع",
  "مصانع",
  "منطقة صناعية",
  "ورشة",
  "مخزن",
  "تدوير",
  "إعادة تدوير",
  "factory",
  "industrial",
  "recycling",
  "manufacturing",
  "workshop",
];

async function searchGooglePlaces(
  apiKey: string,
  lat: number,
  lng: number,
  keyword: string,
  radius: number = 25000
): Promise<any[]> {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&language=ar&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Google Places API error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error(`Google Places API status: ${data.status}`, data.error_message);
      return [];
    }
    
    return data.results || [];
  } catch (error) {
    console.error(`Error searching Google Places:`, error);
    return [];
  }
}

function determineFacilityType(types: string[], name: string): string {
  const nameLower = name.toLowerCase();
  const nameAr = name;
  
  if (types.includes("factory") || nameLower.includes("factory") || nameAr.includes("مصنع")) {
    return "factory";
  }
  if (nameAr.includes("تدوير") || nameLower.includes("recycl")) {
    return "recycling";
  }
  if (nameAr.includes("منطقة صناعية") || nameLower.includes("industrial zone") || nameLower.includes("industrial area")) {
    return "zone";
  }
  if (nameAr.includes("ورشة") || nameLower.includes("workshop")) {
    return "workshop";
  }
  if (types.includes("warehouse") || nameAr.includes("مخزن")) {
    return "warehouse";
  }
  
  return "factory";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleApiKey = Deno.env.get("VITE_GOOGLE_MAPS_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Fetching industrial facilities from Google Places API...");

    const facilities: any[] = [];
    const seenPlaceIds = new Set<string>();

    if (googleApiKey) {
      console.log("Using Google Places API...");
      
      // Search each city with multiple keywords
      for (const city of EGYPTIAN_CITIES) {
        console.log(`Searching in ${city.name}...`);
        
        for (const keyword of INDUSTRIAL_KEYWORDS.slice(0, 5)) {
          const results = await searchGooglePlaces(googleApiKey, city.lat, city.lng, keyword);
          
          for (const place of results) {
            if (seenPlaceIds.has(place.place_id)) continue;
            seenPlaceIds.add(place.place_id);
            
            const facilityType = determineFacilityType(place.types || [], place.name);
            
            facilities.push({
              name: place.name,
              name_ar: place.name,
              facility_type: facilityType,
              address: place.vicinity || "",
              city: city.name,
              governorate: city.name,
              latitude: place.geometry?.location?.lat,
              longitude: place.geometry?.location?.lng,
              source_id: `google-${place.place_id}`,
              tags: { 
                types: place.types,
                rating: place.rating,
                user_ratings_total: place.user_ratings_total,
                business_status: place.business_status,
                source: "google_places"
              },
              is_verified: true,
            });
          }
          
          // Rate limiting - Google allows 10 QPS
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }
      
      console.log(`Found ${facilities.length} facilities from Google Places`);
      
    } else {
      console.log("No Google API key found, using local data only...");
    }

    // Add local Egyptian industrial data
    const localData = [
      { name: 'المنطقة الصناعية بالسادس من أكتوبر', name_ar: 'المنطقة الصناعية بالسادس من أكتوبر', facility_type: 'zone', city: 'السادس من أكتوبر', governorate: 'الجيزة', latitude: 29.9375, longitude: 30.9278, source_id: 'local-1', is_verified: true, tags: { source: 'local' } },
      { name: 'المنطقة الصناعية بالعاشر من رمضان', name_ar: 'المنطقة الصناعية بالعاشر من رمضان', facility_type: 'zone', city: 'العاشر من رمضان', governorate: 'الشرقية', latitude: 30.2833, longitude: 31.7500, source_id: 'local-2', is_verified: true, tags: { source: 'local' } },
      { name: 'المنطقة الصناعية ببرج العرب', name_ar: 'المنطقة الصناعية ببرج العرب', facility_type: 'zone', city: 'برج العرب', governorate: 'الإسكندرية', latitude: 30.8575, longitude: 29.5433, source_id: 'local-3', is_verified: true, tags: { source: 'local' } },
      { name: 'المنطقة الصناعية بالسويس', name_ar: 'المنطقة الصناعية بالسويس', facility_type: 'zone', city: 'السويس', governorate: 'السويس', latitude: 29.9833, longitude: 32.5500, source_id: 'local-4', is_verified: true, tags: { source: 'local' } },
      { name: 'المنطقة الصناعية ببنها', name_ar: 'المنطقة الصناعية ببنها', facility_type: 'zone', city: 'بنها', governorate: 'القليوبية', latitude: 30.4667, longitude: 31.1833, source_id: 'local-5', is_verified: true, tags: { source: 'local' } },
      { name: 'مصنع التوحيد للأخشاب - السادس من أكتوبر', name_ar: 'مصنع التوحيد للأخشاب - السادس من أكتوبر', facility_type: 'factory', city: 'السادس من أكتوبر', governorate: 'الجيزة', latitude: 29.9450, longitude: 30.9320, source_id: 'local-tawhid-wood', is_verified: true, tags: { source: 'local' } },
      { name: 'مصنع حديد عز - السادس من أكتوبر', name_ar: 'مصنع حديد عز - السادس من أكتوبر', facility_type: 'factory', city: 'السادس من أكتوبر', governorate: 'الجيزة', latitude: 29.9600, longitude: 30.9100, source_id: 'local-11', is_verified: true, tags: { source: 'local' } },
      { name: 'مصنع السكر والصناعات التكاملية - الحوامدية', name_ar: 'مصنع السكر والصناعات التكاملية - الحوامدية', facility_type: 'factory', city: 'الحوامدية', governorate: 'الجيزة', latitude: 29.9000, longitude: 31.2333, source_id: 'local-12', is_verified: true, tags: { source: 'local' } },
      { name: 'مصنع الأسمنت - السويس', name_ar: 'مصنع الأسمنت - السويس', facility_type: 'factory', city: 'السويس', governorate: 'السويس', latitude: 29.9667, longitude: 32.5333, source_id: 'local-13', is_verified: true, tags: { source: 'local' } },
      { name: 'مصانع النسيج - المحلة الكبرى', name_ar: 'مصانع النسيج - المحلة الكبرى', facility_type: 'factory', city: 'المحلة الكبرى', governorate: 'الغربية', latitude: 30.9750, longitude: 31.1667, source_id: 'local-15', is_verified: true, tags: { source: 'local' } },
      { name: 'مصنع الألومنيوم - نجع حمادي', name_ar: 'مصنع الألومنيوم - نجع حمادي', facility_type: 'factory', city: 'نجع حمادي', governorate: 'قنا', latitude: 26.0500, longitude: 32.2333, source_id: 'local-20', is_verified: true, tags: { source: 'local' } },
      { name: 'مصنع الحديد والصلب - حلوان', name_ar: 'مصنع الحديد والصلب - حلوان', facility_type: 'factory', city: 'حلوان', governorate: 'القاهرة', latitude: 29.8500, longitude: 31.3000, source_id: 'local-21', is_verified: true, tags: { source: 'local' } },
      { name: 'محطة تدوير النفايات - السادس من أكتوبر', name_ar: 'محطة تدوير النفايات - السادس من أكتوبر', facility_type: 'recycling', city: 'السادس من أكتوبر', governorate: 'الجيزة', latitude: 29.9200, longitude: 30.9000, source_id: 'local-28', is_verified: true, tags: { source: 'local' } },
      { name: 'مصنع تدوير البلاستيك - برج العرب', name_ar: 'مصنع تدوير البلاستيك - برج العرب', facility_type: 'recycling', city: 'برج العرب', governorate: 'الإسكندرية', latitude: 30.8600, longitude: 29.5500, source_id: 'local-29', is_verified: true, tags: { source: 'local' } },
      { name: 'مصنع تدوير الورق - العبور', name_ar: 'مصنع تدوير الورق - العبور', facility_type: 'recycling', city: 'العبور', governorate: 'القليوبية', latitude: 30.2167, longitude: 31.4667, source_id: 'local-31', is_verified: true, tags: { source: 'local' } },
    ];

    // Combine all facilities
    const allFacilities = [...facilities, ...localData];

    console.log(`Processing ${allFacilities.length} total facilities...`);

    // Insert in batches
    const batchSize = 100;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < allFacilities.length; i += batchSize) {
      const batch = allFacilities.slice(i, i + batchSize);
      
      const { data: result, error } = await supabase
        .from("industrial_facilities")
        .upsert(batch, { 
          onConflict: "source_id",
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error(`Batch ${i / batchSize + 1} error:`, error);
        errors += batch.length;
      } else {
        inserted += result?.length || 0;
      }
    }

    // Get total count
    const { count } = await supabase
      .from("industrial_facilities")
      .select("*", { count: "exact", head: true });

    return new Response(
      JSON.stringify({
        success: true,
        message: `تم جلب وتخزين ${inserted} منشأة صناعية من Google Maps`,
        stats: {
          source: "google_places",
          fetched: allFacilities.length,
          inserted: inserted,
          errors: errors,
          total_in_db: count,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
