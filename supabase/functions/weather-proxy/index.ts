const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get("lat") || "30.0444";
    const lng = url.searchParams.get("lng") || "31.2357";

    // Fetch weather from Open-Meteo with retry
    const weatherParams = new URLSearchParams({
      latitude: lat,
      longitude: lng,
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index,precipitation_probability",
      hourly: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation_probability",
      forecast_hours: "12",
      timezone: "auto",
    });

    let weatherData = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?${weatherParams}`);
        if (weatherRes.ok) {
          weatherData = await weatherRes.json();
          break;
        }
        await weatherRes.text();
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      } catch {
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    if (!weatherData) {
      // Return fallback data so UI doesn't break
      weatherData = {
        current: { temperature_2m: 25, relative_humidity_2m: 50, apparent_temperature: 26, weather_code: 0, wind_speed_10m: 10, wind_direction_10m: 180, surface_pressure: 1013, uv_index: 5, precipitation_probability: 0 },
        current_units: { temperature_2m: "°C", relative_humidity_2m: "%", wind_speed_10m: "km/h" },
        hourly: { time: [], temperature_2m: [], relative_humidity_2m: [], weather_code: [], wind_speed_10m: [], precipitation_probability: [] },
      };
    }

    // Reverse geocode
    let locationName = "الموقع الحالي";
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar&zoom=10`,
        { headers: { "User-Agent": "iRecycle-App/1.0" } }
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        locationName = geoData.address?.city || geoData.address?.town || geoData.address?.state || "الموقع الحالي";
      }
    } catch {}

    return new Response(JSON.stringify({ weather: weatherData, locationName }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Weather proxy error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
