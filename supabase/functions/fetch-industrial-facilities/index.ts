import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Egyptian governorates bounding boxes for better coverage
const EGYPT_REGIONS = [
  { name: "القاهرة الكبرى", bbox: "30.7,29.7,32.0,30.5" },
  { name: "الإسكندرية", bbox: "29.0,30.8,30.5,31.4" },
  { name: "الدلتا", bbox: "30.5,30.5,32.5,31.6" },
  { name: "السويس والإسماعيلية", bbox: "32.0,29.5,33.0,31.0" },
  { name: "الصعيد", bbox: "30.5,24.0,33.0,29.0" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Fetching industrial facilities from OpenStreetMap...");

    // Overpass API query for industrial facilities in Egypt
    const overpassQuery = `
      [out:json][timeout:120];
      area["name:en"="Egypt"]->.egypt;
      (
        node["industrial"](area.egypt);
        way["industrial"](area.egypt);
        node["landuse"="industrial"](area.egypt);
        way["landuse"="industrial"](area.egypt);
        node["man_made"="works"](area.egypt);
        way["man_made"="works"](area.egypt);
        node["building"="industrial"](area.egypt);
        way["building"="industrial"](area.egypt);
        node["craft"](area.egypt);
        way["craft"](area.egypt);
        node["amenity"="recycling"](area.egypt);
        way["amenity"="recycling"](area.egypt);
      );
      out center tags;
    `;

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.elements?.length || 0} facilities from OSM`);

    const facilities: any[] = [];
    
    for (const element of data.elements || []) {
      const lat = element.lat || element.center?.lat;
      const lon = element.lon || element.center?.lon;
      
      if (!lat || !lon) continue;

      const tags = element.tags || {};
      const name = tags.name || tags["name:ar"] || tags["name:en"] || 
                   tags.operator || tags.brand || 
                   `منشأة صناعية ${element.id}`;
      
      // Determine facility type
      let facilityType = "factory";
      if (tags.amenity === "recycling") facilityType = "recycling";
      else if (tags.landuse === "industrial") facilityType = "zone";
      else if (tags.craft) facilityType = "workshop";
      else if (tags["man_made"] === "works") facilityType = "plant";

      // Get city/governorate from address tags
      const city = tags["addr:city"] || tags["addr:suburb"] || tags.place || "";
      const governorate = tags["addr:governorate"] || tags["addr:state"] || "";
      const address = [
        tags["addr:street"],
        tags["addr:housenumber"],
        city,
        governorate
      ].filter(Boolean).join("، ") || "";

      facilities.push({
        name: name,
        name_ar: tags["name:ar"] || name,
        facility_type: facilityType,
        address: address,
        city: city,
        governorate: governorate,
        latitude: lat,
        longitude: lon,
        osm_id: `${element.type}/${element.id}`,
        tags: tags,
        is_verified: false,
      });
    }

    console.log(`Processing ${facilities.length} valid facilities...`);

    // Insert in batches
    const batchSize = 100;
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < facilities.length; i += batchSize) {
      const batch = facilities.slice(i, i + batchSize);
      
      const { data: result, error } = await supabase
        .from("industrial_facilities")
        .upsert(batch, { 
          onConflict: "osm_id",
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

    // Also insert our local Egyptian industrial data
    const localData = [
      { name: 'المنطقة الصناعية بالسادس من أكتوبر', name_ar: 'المنطقة الصناعية بالسادس من أكتوبر', facility_type: 'zone', city: 'السادس من أكتوبر', governorate: 'الجيزة', latitude: 29.9375, longitude: 30.9278, osm_id: 'local-1', is_verified: true },
      { name: 'المنطقة الصناعية بالعاشر من رمضان', name_ar: 'المنطقة الصناعية بالعاشر من رمضان', facility_type: 'zone', city: 'العاشر من رمضان', governorate: 'الشرقية', latitude: 30.2833, longitude: 31.7500, osm_id: 'local-2', is_verified: true },
      { name: 'المنطقة الصناعية ببرج العرب', name_ar: 'المنطقة الصناعية ببرج العرب', facility_type: 'zone', city: 'برج العرب', governorate: 'الإسكندرية', latitude: 30.8575, longitude: 29.5433, osm_id: 'local-3', is_verified: true },
      { name: 'المنطقة الصناعية بالسويس', name_ar: 'المنطقة الصناعية بالسويس', facility_type: 'zone', city: 'السويس', governorate: 'السويس', latitude: 29.9833, longitude: 32.5500, osm_id: 'local-4', is_verified: true },
      { name: 'المنطقة الصناعية ببنها', name_ar: 'المنطقة الصناعية ببنها', facility_type: 'zone', city: 'بنها', governorate: 'القليوبية', latitude: 30.4667, longitude: 31.1833, osm_id: 'local-5', is_verified: true },
      { name: 'المنطقة الصناعية بالسادات', name_ar: 'المنطقة الصناعية بالسادات', facility_type: 'zone', city: 'مدينة السادات', governorate: 'المنوفية', latitude: 30.3708, longitude: 30.5106, osm_id: 'local-6', is_verified: true },
      { name: 'المنطقة الصناعية بقويسنا', name_ar: 'المنطقة الصناعية بقويسنا', facility_type: 'zone', city: 'قويسنا', governorate: 'المنوفية', latitude: 30.5583, longitude: 31.1583, osm_id: 'local-7', is_verified: true },
      { name: 'المنطقة الصناعية بطنطا', name_ar: 'المنطقة الصناعية بطنطا', facility_type: 'zone', city: 'طنطا', governorate: 'الغربية', latitude: 30.7833, longitude: 31.0000, osm_id: 'local-8', is_verified: true },
      { name: 'المنطقة الصناعية بدمياط', name_ar: 'المنطقة الصناعية بدمياط', facility_type: 'zone', city: 'دمياط', governorate: 'دمياط', latitude: 31.4175, longitude: 31.8144, osm_id: 'local-9', is_verified: true },
      { name: 'المنطقة الصناعية بالمحلة الكبرى', name_ar: 'المنطقة الصناعية بالمحلة الكبرى', facility_type: 'zone', city: 'المحلة الكبرى', governorate: 'الغربية', latitude: 30.9667, longitude: 31.1667, osm_id: 'local-10', is_verified: true },
      { name: 'مصنع حديد عز - السادس من أكتوبر', name_ar: 'مصنع حديد عز - السادس من أكتوبر', facility_type: 'factory', city: 'السادس من أكتوبر', governorate: 'الجيزة', latitude: 29.9600, longitude: 30.9100, osm_id: 'local-11', is_verified: true },
      { name: 'مصنع السكر والصناعات التكاملية - الحوامدية', name_ar: 'مصنع السكر والصناعات التكاملية - الحوامدية', facility_type: 'factory', city: 'الحوامدية', governorate: 'الجيزة', latitude: 29.9000, longitude: 31.2333, osm_id: 'local-12', is_verified: true },
      { name: 'مصنع الأسمنت - السويس', name_ar: 'مصنع الأسمنت - السويس', facility_type: 'factory', city: 'السويس', governorate: 'السويس', latitude: 29.9667, longitude: 32.5333, osm_id: 'local-13', is_verified: true },
      { name: 'مصنع الأسمنت - طرة', name_ar: 'مصنع الأسمنت - طرة', facility_type: 'factory', city: 'طرة', governorate: 'القاهرة', latitude: 29.9333, longitude: 31.2833, osm_id: 'local-14', is_verified: true },
      { name: 'مصانع النسيج - المحلة الكبرى', name_ar: 'مصانع النسيج - المحلة الكبرى', facility_type: 'factory', city: 'المحلة الكبرى', governorate: 'الغربية', latitude: 30.9750, longitude: 31.1667, osm_id: 'local-15', is_verified: true },
      { name: 'مصنع السيراميك - السويس', name_ar: 'مصنع السيراميك - السويس', facility_type: 'factory', city: 'السويس', governorate: 'السويس', latitude: 29.9500, longitude: 32.5500, osm_id: 'local-16', is_verified: true },
      { name: 'مصنع الزجاج - أبو رواش', name_ar: 'مصنع الزجاج - أبو رواش', facility_type: 'factory', city: 'أبو رواش', governorate: 'الجيزة', latitude: 30.0500, longitude: 31.1000, osm_id: 'local-17', is_verified: true },
      { name: 'مصنع البلاستيك - العاشر من رمضان', name_ar: 'مصنع البلاستيك - العاشر من رمضان', facility_type: 'factory', city: 'العاشر من رمضان', governorate: 'الشرقية', latitude: 30.2900, longitude: 31.7600, osm_id: 'local-18', is_verified: true },
      { name: 'مصانع الغزل والنسيج - كفر الدوار', name_ar: 'مصانع الغزل والنسيج - كفر الدوار', facility_type: 'factory', city: 'كفر الدوار', governorate: 'البحيرة', latitude: 31.1333, longitude: 30.1333, osm_id: 'local-19', is_verified: true },
      { name: 'مصنع الألومنيوم - نجع حمادي', name_ar: 'مصنع الألومنيوم - نجع حمادي', facility_type: 'factory', city: 'نجع حمادي', governorate: 'قنا', latitude: 26.0500, longitude: 32.2333, osm_id: 'local-20', is_verified: true },
      { name: 'مصنع الحديد والصلب - حلوان', name_ar: 'مصنع الحديد والصلب - حلوان', facility_type: 'factory', city: 'حلوان', governorate: 'القاهرة', latitude: 29.8500, longitude: 31.3000, osm_id: 'local-21', is_verified: true },
      { name: 'مصنع الأسمدة - طلخا', name_ar: 'مصنع الأسمدة - طلخا', facility_type: 'factory', city: 'طلخا', governorate: 'الدقهلية', latitude: 31.0667, longitude: 31.3667, osm_id: 'local-22', is_verified: true },
      { name: 'مصانع البترول - مسطرد', name_ar: 'مصانع البترول - مسطرد', facility_type: 'factory', city: 'مسطرد', governorate: 'القليوبية', latitude: 30.1333, longitude: 31.2833, osm_id: 'local-23', is_verified: true },
      { name: 'مصنع الورق - قنا', name_ar: 'مصنع الورق - قنا', facility_type: 'factory', city: 'قنا', governorate: 'قنا', latitude: 26.1667, longitude: 32.7167, osm_id: 'local-24', is_verified: true },
      { name: 'مجمع الصناعات الغذائية - أبو رواش', name_ar: 'مجمع الصناعات الغذائية - أبو رواش', facility_type: 'factory', city: 'أبو رواش', governorate: 'الجيزة', latitude: 30.0600, longitude: 31.0900, osm_id: 'local-25', is_verified: true },
      { name: 'مصنع التوحيد للأخشاب - السادس من أكتوبر', name_ar: 'مصنع التوحيد للأخشاب - السادس من أكتوبر', facility_type: 'factory', city: 'السادس من أكتوبر', governorate: 'الجيزة', latitude: 29.9375, longitude: 30.9278, osm_id: 'local-26', is_verified: true },
      { name: 'مدفن صحي - العاشر من رمضان', name_ar: 'مدفن صحي - العاشر من رمضان', facility_type: 'recycling', city: 'العاشر من رمضان', governorate: 'الشرقية', latitude: 30.3000, longitude: 31.7700, osm_id: 'local-27', is_verified: true },
      { name: 'محطة تدوير النفايات - السادس من أكتوبر', name_ar: 'محطة تدوير النفايات - السادس من أكتوبر', facility_type: 'recycling', city: 'السادس من أكتوبر', governorate: 'الجيزة', latitude: 29.9200, longitude: 30.9000, osm_id: 'local-28', is_verified: true },
      { name: 'مصنع تدوير البلاستيك - برج العرب', name_ar: 'مصنع تدوير البلاستيك - برج العرب', facility_type: 'recycling', city: 'برج العرب', governorate: 'الإسكندرية', latitude: 30.8600, longitude: 29.5500, osm_id: 'local-29', is_verified: true },
      { name: 'محطة معالجة النفايات - أبو رواش', name_ar: 'محطة معالجة النفايات - أبو رواش', facility_type: 'recycling', city: 'أبو رواش', governorate: 'الجيزة', latitude: 30.0400, longitude: 31.0800, osm_id: 'local-30', is_verified: true },
      { name: 'مصنع تدوير الورق - العبور', name_ar: 'مصنع تدوير الورق - العبور', facility_type: 'recycling', city: 'العبور', governorate: 'القليوبية', latitude: 30.2167, longitude: 31.4667, osm_id: 'local-31', is_verified: true },
    ];

    const { error: localError } = await supabase
      .from("industrial_facilities")
      .upsert(localData, { onConflict: "osm_id" });

    if (localError) {
      console.error("Error inserting local data:", localError);
    } else {
      inserted += localData.length;
    }

    // Get total count
    const { count } = await supabase
      .from("industrial_facilities")
      .select("*", { count: "exact", head: true });

    return new Response(
      JSON.stringify({
        success: true,
        message: `تم جلب وتخزين ${inserted} منشأة صناعية`,
        stats: {
          fetched: facilities.length,
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
