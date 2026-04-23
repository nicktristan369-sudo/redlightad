import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// Region definitions for large countries
const COUNTRY_REGIONS: Record<string, { name: string; keywords: string[] }[]> = {
  DE: [
    { name: "Bavaria", keywords: ["munich", "münchen", "nuremberg", "nürnberg", "augsburg", "regensburg", "würzburg"] },
    { name: "Berlin", keywords: ["berlin"] },
    { name: "Hamburg", keywords: ["hamburg"] },
    { name: "North Rhine-Westphalia", keywords: ["cologne", "köln", "düsseldorf", "dortmund", "essen", "duisburg", "bochum", "wuppertal", "bonn", "münster", "aachen"] },
    { name: "Baden-Württemberg", keywords: ["stuttgart", "karlsruhe", "mannheim", "freiburg", "heidelberg", "ulm"] },
    { name: "Hesse", keywords: ["frankfurt", "wiesbaden", "kassel", "darmstadt", "offenbach"] },
    { name: "Saxony", keywords: ["dresden", "leipzig", "chemnitz"] },
    { name: "Lower Saxony", keywords: ["hanover", "hannover", "braunschweig", "oldenburg", "osnabrück", "göttingen", "wolfsburg"] },
    { name: "Schleswig-Holstein", keywords: ["kiel", "lübeck", "flensburg"] },
    { name: "Brandenburg", keywords: ["potsdam", "cottbus"] },
    { name: "Bremen", keywords: ["bremen", "bremerhaven"] },
  ],
  US: [
    { name: "California", keywords: ["los angeles", "san francisco", "san diego", "san jose", "sacramento", "oakland", "fresno", "long beach"] },
    { name: "New York", keywords: ["new york", "nyc", "manhattan", "brooklyn", "queens", "bronx", "buffalo", "albany"] },
    { name: "Texas", keywords: ["houston", "dallas", "austin", "san antonio", "fort worth", "el paso"] },
    { name: "Florida", keywords: ["miami", "orlando", "tampa", "jacksonville", "fort lauderdale"] },
    { name: "Illinois", keywords: ["chicago", "aurora", "naperville"] },
    { name: "Nevada", keywords: ["las vegas", "reno", "henderson"] },
    { name: "Arizona", keywords: ["phoenix", "tucson", "scottsdale", "mesa"] },
    { name: "Georgia", keywords: ["atlanta", "savannah", "augusta"] },
    { name: "Pennsylvania", keywords: ["philadelphia", "pittsburgh", "allentown"] },
    { name: "Massachusetts", keywords: ["boston", "cambridge", "worcester"] },
    { name: "Washington", keywords: ["seattle", "tacoma", "spokane"] },
    { name: "Colorado", keywords: ["denver", "colorado springs", "boulder"] },
  ],
  BR: [
    { name: "São Paulo", keywords: ["são paulo", "sao paulo", "campinas", "santos"] },
    { name: "Rio de Janeiro", keywords: ["rio de janeiro", "niterói", "niteroi"] },
    { name: "Minas Gerais", keywords: ["belo horizonte", "uberlândia"] },
    { name: "Bahia", keywords: ["salvador", "feira de santana"] },
    { name: "Paraná", keywords: ["curitiba", "londrina"] },
    { name: "Rio Grande do Sul", keywords: ["porto alegre", "caxias do sul"] },
  ],
  GB: [
    { name: "England", keywords: ["london", "manchester", "birmingham", "liverpool", "leeds", "sheffield", "bristol", "newcastle", "nottingham", "southampton", "brighton", "leicester", "coventry", "reading"] },
    { name: "Scotland", keywords: ["edinburgh", "glasgow", "aberdeen", "dundee"] },
    { name: "Wales", keywords: ["cardiff", "swansea", "newport"] },
    { name: "Northern Ireland", keywords: ["belfast", "derry"] },
  ],
  FR: [
    { name: "Île-de-France", keywords: ["paris", "versailles", "boulogne"] },
    { name: "Provence-Alpes-Côte d'Azur", keywords: ["marseille", "nice", "cannes", "toulon", "avignon"] },
    { name: "Auvergne-Rhône-Alpes", keywords: ["lyon", "grenoble", "saint-étienne"] },
    { name: "Nouvelle-Aquitaine", keywords: ["bordeaux", "limoges"] },
    { name: "Occitanie", keywords: ["toulouse", "montpellier", "nîmes"] },
  ],
  ES: [
    { name: "Catalonia", keywords: ["barcelona", "tarragona", "girona", "lleida"] },
    { name: "Madrid", keywords: ["madrid"] },
    { name: "Andalusia", keywords: ["seville", "sevilla", "málaga", "malaga", "granada", "córdoba", "cordoba"] },
    { name: "Valencia", keywords: ["valencia", "alicante"] },
    { name: "Basque Country", keywords: ["bilbao", "san sebastián", "san sebastian", "vitoria"] },
    { name: "Balearic Islands", keywords: ["palma", "ibiza", "mallorca"] },
    { name: "Canary Islands", keywords: ["las palmas", "tenerife", "santa cruz"] },
  ],
  IT: [
    { name: "Lombardy", keywords: ["milan", "milano", "bergamo", "brescia"] },
    { name: "Lazio", keywords: ["rome", "roma"] },
    { name: "Veneto", keywords: ["venice", "venezia", "verona", "padova", "padua"] },
    { name: "Tuscany", keywords: ["florence", "firenze", "pisa", "siena"] },
    { name: "Campania", keywords: ["naples", "napoli", "salerno"] },
    { name: "Piedmont", keywords: ["turin", "torino"] },
    { name: "Emilia-Romagna", keywords: ["bologna", "parma", "modena", "rimini"] },
    { name: "Sicily", keywords: ["palermo", "catania", "messina"] },
  ],
  AU: [
    { name: "New South Wales", keywords: ["sydney", "newcastle", "wollongong"] },
    { name: "Victoria", keywords: ["melbourne", "geelong"] },
    { name: "Queensland", keywords: ["brisbane", "gold coast", "cairns", "townsville"] },
    { name: "Western Australia", keywords: ["perth", "fremantle"] },
    { name: "South Australia", keywords: ["adelaide"] },
  ],
  CA: [
    { name: "Ontario", keywords: ["toronto", "ottawa", "mississauga", "hamilton", "london"] },
    { name: "Quebec", keywords: ["montreal", "québec", "quebec city", "laval"] },
    { name: "British Columbia", keywords: ["vancouver", "victoria", "surrey"] },
    { name: "Alberta", keywords: ["calgary", "edmonton"] },
  ],
  NL: [
    { name: "North Holland", keywords: ["amsterdam", "haarlem", "alkmaar"] },
    { name: "South Holland", keywords: ["rotterdam", "the hague", "den haag", "leiden", "delft"] },
    { name: "Utrecht", keywords: ["utrecht"] },
    { name: "North Brabant", keywords: ["eindhoven", "tilburg", "breda"] },
  ],
};

function getRegionForCity(city: string, countryCode: string): string | null {
  const regions = COUNTRY_REGIONS[countryCode.toUpperCase()];
  if (!regions) return null;
  
  const cityLower = city.toLowerCase();
  for (const region of regions) {
    if (region.keywords.some(k => cityLower.includes(k) || k.includes(cityLower))) {
      return region.name;
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countryParam = searchParams.get("country") || "";
    
    const supabase = getClient();

    // Get all unique cities with counts for active listings
    const { data: listings, error } = await supabase
      .from("listings")
      .select("city, region, country")
      .eq("status", "active");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Country code to name mapping for filtering
    const COUNTRY_CODE_TO_NAMES: Record<string, string[]> = {
      'DE': ['germany', 'deutschland', 'de'],
      'US': ['united states', 'usa', 'us', 'america'],
      'GB': ['united kingdom', 'uk', 'gb', 'england', 'britain'],
      'FR': ['france', 'fr'],
      'ES': ['spain', 'españa', 'es'],
      'IT': ['italy', 'italia', 'it'],
      'NL': ['netherlands', 'nederland', 'nl', 'holland'],
      'DK': ['denmark', 'danmark', 'dk'],
      'SE': ['sweden', 'sverige', 'se'],
      'NO': ['norway', 'norge', 'no'],
      'PL': ['poland', 'polska', 'pl'],
      'PT': ['portugal', 'pt'],
      'BR': ['brazil', 'brasil', 'br'],
      'AU': ['australia', 'au'],
      'CA': ['canada', 'ca'],
      'TH': ['thailand', 'th'],
      'AE': ['uae', 'united arab emirates', 'ae'],
      'CZ': ['czech republic', 'czechia', 'cz'],
      'CH': ['switzerland', 'schweiz', 'ch'],
      'AT': ['austria', 'österreich', 'at'],
      'BE': ['belgium', 'belgique', 'be'],
      'FI': ['finland', 'fi'],
    };

    // Filter by country if specified
    const countryCode = countryParam.toUpperCase();
    const countryVariants = COUNTRY_CODE_TO_NAMES[countryCode] || [countryParam.toLowerCase()];
    
    const filteredListings = countryParam
      ? listings?.filter(l => {
          if (!l.country) return false;
          const listingCountry = l.country.toLowerCase().trim();
          // Only exact matches or full word matches (not substring like 'de' in 'denmark')
          const matches = countryVariants.some(v => {
            if (listingCountry === v) return true;
            // Check if it's a word boundary match (e.g., 'germany' matches but 'de' in 'denmark' doesn't)
            if (v.length <= 2) {
              // For short codes, require exact match only
              return listingCountry === v;
            }
            return listingCountry.includes(v);
          });
          return matches;
        })
      : listings;

    // Debug log
    console.log(`[Locations API] country=${countryParam}, variants=${countryVariants.join(',')}, total=${listings?.length}, filtered=${filteredListings?.length}`);

    // Count cities
    const cityCounts: Record<string, { count: number; region?: string }> = {};
    for (const listing of filteredListings || []) {
      if (listing.city) {
        const cityName = listing.city.trim();
        if (!cityCounts[cityName]) {
          const region = listing.region || getRegionForCity(cityName, countryParam.toUpperCase());
          cityCounts[cityName] = { count: 0, region: region || undefined };
        }
        cityCounts[cityName].count++;
      }
    }

    // Build cities array sorted by count
    const cities = Object.entries(cityCounts)
      .map(([name, data]) => ({ name, count: data.count, region: data.region }))
      .sort((a, b) => b.count - a.count);

    // Get top 10 cities
    const topCities = cities.slice(0, 10);

    // Group by regions
    const regionMap: Record<string, { name: string; cities: typeof cities }> = {};
    for (const city of cities) {
      const regionName = city.region || "Other";
      if (!regionMap[regionName]) {
        regionMap[regionName] = { name: regionName, cities: [] };
      }
      regionMap[regionName].cities.push(city);
    }

    // Sort regions by total count
    const regions = Object.values(regionMap)
      .map(r => ({
        ...r,
        totalCount: r.cities.reduce((sum, c) => sum + c.count, 0),
      }))
      .sort((a, b) => b.totalCount - a.totalCount)
      .map(({ totalCount, ...r }) => r);

    return NextResponse.json({
      country: countryParam,
      countryCode: countryParam.toUpperCase(),
      topCities,
      regions,
      totalCities: cities.length,
      totalListings: filteredListings?.length || 0,
    });
  } catch (err) {
    console.error("[Locations API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
  }
}
