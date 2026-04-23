import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// World cities database - major cities per country with regions
// This provides autocomplete even when no listings exist yet
const WORLD_CITIES: Record<string, { name: string; region: string }[]> = {
  DE: [
    { name: "Berlin", region: "Berlin" },
    { name: "Hamburg", region: "Hamburg" },
    { name: "Munich", region: "Bavaria" },
    { name: "München", region: "Bavaria" },
    { name: "Cologne", region: "North Rhine-Westphalia" },
    { name: "Köln", region: "North Rhine-Westphalia" },
    { name: "Frankfurt", region: "Hesse" },
    { name: "Frankfurt am Main", region: "Hesse" },
    { name: "Stuttgart", region: "Baden-Württemberg" },
    { name: "Düsseldorf", region: "North Rhine-Westphalia" },
    { name: "Dortmund", region: "North Rhine-Westphalia" },
    { name: "Essen", region: "North Rhine-Westphalia" },
    { name: "Leipzig", region: "Saxony" },
    { name: "Bremen", region: "Bremen" },
    { name: "Dresden", region: "Saxony" },
    { name: "Hanover", region: "Lower Saxony" },
    { name: "Hannover", region: "Lower Saxony" },
    { name: "Nuremberg", region: "Bavaria" },
    { name: "Nürnberg", region: "Bavaria" },
    { name: "Duisburg", region: "North Rhine-Westphalia" },
    { name: "Bochum", region: "North Rhine-Westphalia" },
    { name: "Wuppertal", region: "North Rhine-Westphalia" },
    { name: "Bielefeld", region: "North Rhine-Westphalia" },
    { name: "Bonn", region: "North Rhine-Westphalia" },
    { name: "Münster", region: "North Rhine-Westphalia" },
    { name: "Karlsruhe", region: "Baden-Württemberg" },
    { name: "Mannheim", region: "Baden-Württemberg" },
    { name: "Augsburg", region: "Bavaria" },
    { name: "Wiesbaden", region: "Hesse" },
    { name: "Gelsenkirchen", region: "North Rhine-Westphalia" },
    { name: "Mönchengladbach", region: "North Rhine-Westphalia" },
    { name: "Braunschweig", region: "Lower Saxony" },
    { name: "Chemnitz", region: "Saxony" },
    { name: "Kiel", region: "Schleswig-Holstein" },
    { name: "Aachen", region: "North Rhine-Westphalia" },
    { name: "Halle", region: "Saxony-Anhalt" },
    { name: "Magdeburg", region: "Saxony-Anhalt" },
    { name: "Freiburg", region: "Baden-Württemberg" },
    { name: "Krefeld", region: "North Rhine-Westphalia" },
    { name: "Lübeck", region: "Schleswig-Holstein" },
    { name: "Oberhausen", region: "North Rhine-Westphalia" },
    { name: "Erfurt", region: "Thuringia" },
    { name: "Mainz", region: "Rhineland-Palatinate" },
    { name: "Rostock", region: "Mecklenburg-Vorpommern" },
    { name: "Kassel", region: "Hesse" },
    { name: "Hagen", region: "North Rhine-Westphalia" },
    { name: "Potsdam", region: "Brandenburg" },
    { name: "Saarbrücken", region: "Saarland" },
  ],
  DK: [
    { name: "Copenhagen", region: "Capital Region" },
    { name: "København", region: "Capital Region" },
    { name: "Aarhus", region: "Central Denmark" },
    { name: "Odense", region: "Southern Denmark" },
    { name: "Aalborg", region: "North Denmark" },
    { name: "Esbjerg", region: "Southern Denmark" },
    { name: "Randers", region: "Central Denmark" },
    { name: "Kolding", region: "Southern Denmark" },
    { name: "Horsens", region: "Central Denmark" },
    { name: "Vejle", region: "Southern Denmark" },
    { name: "Roskilde", region: "Zealand" },
    { name: "Herning", region: "Central Denmark" },
    { name: "Silkeborg", region: "Central Denmark" },
    { name: "Næstved", region: "Zealand" },
    { name: "Fredericia", region: "Southern Denmark" },
    { name: "Viborg", region: "Central Denmark" },
    { name: "Køge", region: "Zealand" },
    { name: "Holstebro", region: "Central Denmark" },
    { name: "Slagelse", region: "Zealand" },
    { name: "Helsingør", region: "Capital Region" },
  ],
  US: [
    { name: "New York", region: "New York" },
    { name: "Los Angeles", region: "California" },
    { name: "Chicago", region: "Illinois" },
    { name: "Houston", region: "Texas" },
    { name: "Phoenix", region: "Arizona" },
    { name: "Philadelphia", region: "Pennsylvania" },
    { name: "San Antonio", region: "Texas" },
    { name: "San Diego", region: "California" },
    { name: "Dallas", region: "Texas" },
    { name: "San Jose", region: "California" },
    { name: "Austin", region: "Texas" },
    { name: "Jacksonville", region: "Florida" },
    { name: "Fort Worth", region: "Texas" },
    { name: "Columbus", region: "Ohio" },
    { name: "Charlotte", region: "North Carolina" },
    { name: "San Francisco", region: "California" },
    { name: "Indianapolis", region: "Indiana" },
    { name: "Seattle", region: "Washington" },
    { name: "Denver", region: "Colorado" },
    { name: "Washington", region: "District of Columbia" },
    { name: "Boston", region: "Massachusetts" },
    { name: "El Paso", region: "Texas" },
    { name: "Nashville", region: "Tennessee" },
    { name: "Detroit", region: "Michigan" },
    { name: "Oklahoma City", region: "Oklahoma" },
    { name: "Portland", region: "Oregon" },
    { name: "Las Vegas", region: "Nevada" },
    { name: "Memphis", region: "Tennessee" },
    { name: "Louisville", region: "Kentucky" },
    { name: "Baltimore", region: "Maryland" },
    { name: "Milwaukee", region: "Wisconsin" },
    { name: "Albuquerque", region: "New Mexico" },
    { name: "Tucson", region: "Arizona" },
    { name: "Fresno", region: "California" },
    { name: "Sacramento", region: "California" },
    { name: "Atlanta", region: "Georgia" },
    { name: "Miami", region: "Florida" },
    { name: "Orlando", region: "Florida" },
    { name: "Tampa", region: "Florida" },
    { name: "Minneapolis", region: "Minnesota" },
  ],
  GB: [
    { name: "London", region: "England" },
    { name: "Birmingham", region: "England" },
    { name: "Manchester", region: "England" },
    { name: "Glasgow", region: "Scotland" },
    { name: "Liverpool", region: "England" },
    { name: "Leeds", region: "England" },
    { name: "Sheffield", region: "England" },
    { name: "Edinburgh", region: "Scotland" },
    { name: "Bristol", region: "England" },
    { name: "Leicester", region: "England" },
    { name: "Coventry", region: "England" },
    { name: "Bradford", region: "England" },
    { name: "Cardiff", region: "Wales" },
    { name: "Belfast", region: "Northern Ireland" },
    { name: "Nottingham", region: "England" },
    { name: "Newcastle", region: "England" },
    { name: "Southampton", region: "England" },
    { name: "Brighton", region: "England" },
    { name: "Plymouth", region: "England" },
    { name: "Reading", region: "England" },
    { name: "Aberdeen", region: "Scotland" },
    { name: "Dundee", region: "Scotland" },
    { name: "Swansea", region: "Wales" },
    { name: "Oxford", region: "England" },
    { name: "Cambridge", region: "England" },
  ],
  NL: [
    { name: "Amsterdam", region: "North Holland" },
    { name: "Rotterdam", region: "South Holland" },
    { name: "The Hague", region: "South Holland" },
    { name: "Den Haag", region: "South Holland" },
    { name: "Utrecht", region: "Utrecht" },
    { name: "Eindhoven", region: "North Brabant" },
    { name: "Tilburg", region: "North Brabant" },
    { name: "Groningen", region: "Groningen" },
    { name: "Almere", region: "Flevoland" },
    { name: "Breda", region: "North Brabant" },
    { name: "Nijmegen", region: "Gelderland" },
    { name: "Arnhem", region: "Gelderland" },
    { name: "Haarlem", region: "North Holland" },
    { name: "Enschede", region: "Overijssel" },
    { name: "Maastricht", region: "Limburg" },
    { name: "Leiden", region: "South Holland" },
    { name: "Dordrecht", region: "South Holland" },
    { name: "Zoetermeer", region: "South Holland" },
    { name: "Zwolle", region: "Overijssel" },
    { name: "Amersfoort", region: "Utrecht" },
  ],
  FR: [
    { name: "Paris", region: "Île-de-France" },
    { name: "Marseille", region: "Provence-Alpes-Côte d'Azur" },
    { name: "Lyon", region: "Auvergne-Rhône-Alpes" },
    { name: "Toulouse", region: "Occitanie" },
    { name: "Nice", region: "Provence-Alpes-Côte d'Azur" },
    { name: "Nantes", region: "Pays de la Loire" },
    { name: "Strasbourg", region: "Grand Est" },
    { name: "Montpellier", region: "Occitanie" },
    { name: "Bordeaux", region: "Nouvelle-Aquitaine" },
    { name: "Lille", region: "Hauts-de-France" },
    { name: "Rennes", region: "Brittany" },
    { name: "Reims", region: "Grand Est" },
    { name: "Saint-Étienne", region: "Auvergne-Rhône-Alpes" },
    { name: "Le Havre", region: "Normandy" },
    { name: "Toulon", region: "Provence-Alpes-Côte d'Azur" },
    { name: "Grenoble", region: "Auvergne-Rhône-Alpes" },
    { name: "Dijon", region: "Bourgogne-Franche-Comté" },
    { name: "Angers", region: "Pays de la Loire" },
    { name: "Nîmes", region: "Occitanie" },
    { name: "Cannes", region: "Provence-Alpes-Côte d'Azur" },
  ],
  ES: [
    { name: "Madrid", region: "Madrid" },
    { name: "Barcelona", region: "Catalonia" },
    { name: "Valencia", region: "Valencia" },
    { name: "Seville", region: "Andalusia" },
    { name: "Sevilla", region: "Andalusia" },
    { name: "Zaragoza", region: "Aragon" },
    { name: "Málaga", region: "Andalusia" },
    { name: "Murcia", region: "Murcia" },
    { name: "Palma", region: "Balearic Islands" },
    { name: "Las Palmas", region: "Canary Islands" },
    { name: "Bilbao", region: "Basque Country" },
    { name: "Alicante", region: "Valencia" },
    { name: "Córdoba", region: "Andalusia" },
    { name: "Valladolid", region: "Castile and León" },
    { name: "Vigo", region: "Galicia" },
    { name: "Gijón", region: "Asturias" },
    { name: "Granada", region: "Andalusia" },
    { name: "Ibiza", region: "Balearic Islands" },
    { name: "Tenerife", region: "Canary Islands" },
    { name: "Marbella", region: "Andalusia" },
  ],
  IT: [
    { name: "Rome", region: "Lazio" },
    { name: "Roma", region: "Lazio" },
    { name: "Milan", region: "Lombardy" },
    { name: "Milano", region: "Lombardy" },
    { name: "Naples", region: "Campania" },
    { name: "Napoli", region: "Campania" },
    { name: "Turin", region: "Piedmont" },
    { name: "Torino", region: "Piedmont" },
    { name: "Palermo", region: "Sicily" },
    { name: "Genoa", region: "Liguria" },
    { name: "Genova", region: "Liguria" },
    { name: "Bologna", region: "Emilia-Romagna" },
    { name: "Florence", region: "Tuscany" },
    { name: "Firenze", region: "Tuscany" },
    { name: "Bari", region: "Apulia" },
    { name: "Catania", region: "Sicily" },
    { name: "Venice", region: "Veneto" },
    { name: "Venezia", region: "Veneto" },
    { name: "Verona", region: "Veneto" },
    { name: "Messina", region: "Sicily" },
    { name: "Padua", region: "Veneto" },
    { name: "Padova", region: "Veneto" },
    { name: "Trieste", region: "Friuli-Venezia Giulia" },
    { name: "Brescia", region: "Lombardy" },
    { name: "Parma", region: "Emilia-Romagna" },
  ],
};

// Country code to name mapping
const COUNTRY_NAMES: Record<string, string> = {
  DE: "Germany",
  DK: "Denmark", 
  US: "United States",
  GB: "United Kingdom",
  NL: "Netherlands",
  FR: "France",
  ES: "Spain",
  IT: "Italy",
  SE: "Sweden",
  NO: "Norway",
  PL: "Poland",
  PT: "Portugal",
  BR: "Brazil",
  AU: "Australia",
  CA: "Canada",
  TH: "Thailand",
  AE: "UAE",
  CZ: "Czech Republic",
  CH: "Switzerland",
  AT: "Austria",
  BE: "Belgium",
  FI: "Finland",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.toLowerCase().trim() || "";
    const countryCode = searchParams.get("country")?.toUpperCase() || "";

    if (query.length < 2) {
      return NextResponse.json({ cities: [] });
    }

    const supabase = getClient();
    const countryName = COUNTRY_NAMES[countryCode] || countryCode;

    // 1. Search in existing listings first
    const { data: listings } = await supabase
      .from("listings")
      .select("city, region")
      .eq("status", "active")
      .ilike("city", `%${query}%`)
      .limit(20);

    const existingCities = new Map<string, { name: string; region: string }>();
    
    // Filter listings by country (using our mapping)
    for (const listing of listings || []) {
      if (listing.city) {
        const key = listing.city.toLowerCase();
        if (!existingCities.has(key)) {
          existingCities.set(key, {
            name: listing.city,
            region: listing.region || "",
          });
        }
      }
    }

    // 2. Search in our world cities database
    const worldCities = WORLD_CITIES[countryCode] || [];
    const matchingWorldCities = worldCities.filter(city =>
      city.name.toLowerCase().includes(query)
    );

    // 3. Combine results, prioritizing existing listings
    const results: { name: string; region: string; country: string; countryCode: string }[] = [];
    const seen = new Set<string>();

    // Add existing cities first
    for (const [, city] of existingCities) {
      const key = city.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          name: city.name,
          region: city.region,
          country: countryName,
          countryCode,
        });
      }
    }

    // Add world cities
    for (const city of matchingWorldCities) {
      const key = city.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          name: city.name,
          region: city.region,
          country: countryName,
          countryCode,
        });
      }
    }

    // Sort by relevance (exact match first, then starts with, then contains)
    results.sort((a, b) => {
      const aLower = a.name.toLowerCase();
      const bLower = b.name.toLowerCase();
      
      // Exact match
      if (aLower === query && bLower !== query) return -1;
      if (bLower === query && aLower !== query) return 1;
      
      // Starts with
      if (aLower.startsWith(query) && !bLower.startsWith(query)) return -1;
      if (bLower.startsWith(query) && !aLower.startsWith(query)) return 1;
      
      // Alphabetical
      return aLower.localeCompare(bLower);
    });

    return NextResponse.json({ cities: results.slice(0, 15) });
  } catch (err) {
    console.error("[City Autocomplete] Error:", err);
    return NextResponse.json({ error: "Failed to search cities" }, { status: 500 });
  }
}
