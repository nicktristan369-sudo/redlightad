export interface Country {
  code: string
  name: string
  flag: string
  region: string
}

export const SUPPORTED_COUNTRIES: Country[] = [
  // Europe
  { code: "dk", name: "Denmark", flag: "🇩🇰", region: "Europe" },
  { code: "se", name: "Sweden", flag: "🇸🇪", region: "Europe" },
  { code: "no", name: "Norway", flag: "🇳🇴", region: "Europe" },
  { code: "fi", name: "Finland", flag: "🇫🇮", region: "Europe" },
  { code: "de", name: "Germany", flag: "🇩🇪", region: "Europe" },
  { code: "nl", name: "Netherlands", flag: "🇳🇱", region: "Europe" },
  { code: "gb", name: "United Kingdom", flag: "🇬🇧", region: "Europe" },
  { code: "fr", name: "France", flag: "🇫🇷", region: "Europe" },
  { code: "es", name: "Spain", flag: "🇪🇸", region: "Europe" },
  { code: "it", name: "Italy", flag: "🇮🇹", region: "Europe" },
  { code: "ch", name: "Switzerland", flag: "🇨🇭", region: "Europe" },
  { code: "at", name: "Austria", flag: "🇦🇹", region: "Europe" },
  { code: "be", name: "Belgium", flag: "🇧🇪", region: "Europe" },
  { code: "pl", name: "Poland", flag: "🇵🇱", region: "Europe" },
  { code: "cz", name: "Czech Republic", flag: "🇨🇿", region: "Europe" },
  { code: "hu", name: "Hungary", flag: "🇭🇺", region: "Europe" },
  // Asia
  { code: "th", name: "Thailand", flag: "🇹🇭", region: "Asia" },
  { code: "ae", name: "UAE", flag: "🇦🇪", region: "Asia" },
  { code: "sg", name: "Singapore", flag: "🇸🇬", region: "Asia" },
  { code: "jp", name: "Japan", flag: "🇯🇵", region: "Asia" },
  { code: "hk", name: "Hong Kong", flag: "🇭🇰", region: "Asia" },
  { code: "my", name: "Malaysia", flag: "🇲🇾", region: "Asia" },
  { code: "ph", name: "Philippines", flag: "🇵🇭", region: "Asia" },
  { code: "vn", name: "Vietnam", flag: "🇻🇳", region: "Asia" },
  { code: "id", name: "Indonesia", flag: "🇮🇩", region: "Asia" },
  { code: "in", name: "India", flag: "🇮🇳", region: "Asia" },
  // Americas
  { code: "us", name: "USA", flag: "🇺🇸", region: "Americas" },
  { code: "ca", name: "Canada", flag: "🇨🇦", region: "Americas" },
  { code: "mx", name: "Mexico", flag: "🇲🇽", region: "Americas" },
  { code: "br", name: "Brazil", flag: "🇧🇷", region: "Americas" },
  { code: "ar", name: "Argentina", flag: "🇦🇷", region: "Americas" },
  // Africa & Oceania
  { code: "au", name: "Australia", flag: "🇦🇺", region: "Oceania" },
  { code: "nz", name: "New Zealand", flag: "🇳🇿", region: "Oceania" },
  { code: "za", name: "South Africa", flag: "🇿🇦", region: "Africa" },
]

export const POPULAR_COUNTRY_CODES = ["dk", "us", "gb", "de", "th", "ae", "fr", "nl", "se"]

export const SUPPORTED_CODES = new Set(SUPPORTED_COUNTRIES.map(c => c.code))

export function getCountry(code: string): Country | undefined {
  return SUPPORTED_COUNTRIES.find(c => c.code === code.toLowerCase())
}

/**
 * Build a Supabase OR-filter string covering all country variants:
 * ISO code (dk/DK) + full name (Denmark) + lowercase name (denmark)
 * Input can be ISO code ("dk") or full name ("Denmark")
 */
export function buildCountryOrFilter(input: string): string {
  const byCode = SUPPORTED_COUNTRIES.find(c => c.code === input.toLowerCase())
  const byName = SUPPORTED_COUNTRIES.find(c => c.name.toLowerCase() === input.toLowerCase())
  const c = byCode ?? byName

  const variants = c
    ? [c.name, c.name.toLowerCase(), c.code.toUpperCase(), c.code.toLowerCase()]
    : [input, input.toLowerCase(), input.toUpperCase(), input.toUpperCase().slice(0, 2)]

  return [...new Set(variants.filter(Boolean))]
    .map(v => `country.eq.${v}`)
    .join(",")
}

/**
 * Returns an array of all country DB variants for use with Supabase .in()
 * Input: ISO code ("dk") or full name ("Denmark")
 */
export function getCountryVariants(input: string): string[] {
  const byCode = SUPPORTED_COUNTRIES.find(c => c.code === input.toLowerCase())
  const byName = SUPPORTED_COUNTRIES.find(c => c.name.toLowerCase() === input.toLowerCase())
  const c = byCode ?? byName

  const variants = c
    ? [c.name, c.name.toLowerCase(), c.code.toUpperCase(), c.code.toLowerCase()]
    : [input, input.toLowerCase(), input.toUpperCase()]

  return [...new Set(variants.filter(Boolean))]
}

export function getCountryByName(name: string): Country | undefined {
  return SUPPORTED_COUNTRIES.find(c => c.name.toLowerCase() === name.toLowerCase())
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

// ── Full country list (hardcoded) ──────────────────────────────────────
export interface CountryEntry { name: string; code: string }

export const COUNTRIES: { europe: CountryEntry[]; worldwide: CountryEntry[] } = {
  europe: [
    { name: "Albania", code: "al" },
    { name: "Andorra", code: "ad" },
    { name: "Armenia", code: "am" },
    { name: "Austria", code: "at" },
    { name: "Belarus", code: "by" },
    { name: "Belgium", code: "be" },
    { name: "Bosnia Herzegovina", code: "ba" },
    { name: "Bulgaria", code: "bg" },
    { name: "Croatia", code: "hr" },
    { name: "Cyprus", code: "cy" },
    { name: "Czech Republic", code: "cz" },
    { name: "Denmark", code: "dk" },
    { name: "Estonia", code: "ee" },
    { name: "Finland", code: "fi" },
    { name: "France", code: "fr" },
    { name: "Georgia", code: "ge" },
    { name: "Germany", code: "de" },
    { name: "Greece", code: "gr" },
    { name: "Hungary", code: "hu" },
    { name: "Iceland", code: "is" },
    { name: "Ireland", code: "ie" },
    { name: "Italy", code: "it" },
    { name: "Kosovo", code: "xk" },
    { name: "Latvia", code: "lv" },
    { name: "Liechtenstein", code: "li" },
    { name: "Lithuania", code: "lt" },
    { name: "Luxembourg", code: "lu" },
    { name: "Malta", code: "mt" },
    { name: "Moldova", code: "md" },
    { name: "Monaco", code: "mc" },
    { name: "Montenegro", code: "me" },
    { name: "Netherlands", code: "nl" },
    { name: "North Macedonia", code: "mk" },
    { name: "Norway", code: "no" },
    { name: "Poland", code: "pl" },
    { name: "Portugal", code: "pt" },
    { name: "Romania", code: "ro" },
    { name: "Russia", code: "ru" },
    { name: "Serbia", code: "rs" },
    { name: "Slovakia", code: "sk" },
    { name: "Slovenia", code: "si" },
    { name: "Spain", code: "es" },
    { name: "Sweden", code: "se" },
    { name: "Switzerland", code: "ch" },
    { name: "Turkey", code: "tr" },
    { name: "UK", code: "uk" },
    { name: "Ukraine", code: "ua" },
  ],
  worldwide: [
    { name: "Algeria", code: "dz" },
    { name: "Angola", code: "ao" },
    { name: "Argentina", code: "ar" },
    { name: "Australia", code: "au" },
    { name: "Azerbaijan", code: "az" },
    { name: "Bahrain", code: "bh" },
    { name: "Bangladesh", code: "bd" },
    { name: "Brazil", code: "br" },
    { name: "Cambodia", code: "kh" },
    { name: "Cameroon", code: "cm" },
    { name: "Canada", code: "ca" },
    { name: "Chile", code: "cl" },
    { name: "China", code: "cn" },
    { name: "Colombia", code: "co" },
    { name: "Costa Rica", code: "cr" },
    { name: "Ecuador", code: "ec" },
    { name: "Egypt", code: "eg" },
    { name: "Ghana", code: "gh" },
    { name: "India", code: "in" },
    { name: "Indonesia", code: "id" },
    { name: "Israel", code: "il" },
    { name: "Ivory Coast", code: "ci" },
    { name: "Jamaica", code: "jm" },
    { name: "Japan", code: "jp" },
    { name: "Jordan", code: "jo" },
    { name: "Kazakhstan", code: "kz" },
    { name: "Kenya", code: "ke" },
    { name: "Kuwait", code: "kw" },
    { name: "Lebanon", code: "lb" },
    { name: "Malaysia", code: "my" },
    { name: "Mexico", code: "mx" },
    { name: "Morocco", code: "ma" },
    { name: "Nepal", code: "np" },
    { name: "New Zealand", code: "nz" },
    { name: "Nigeria", code: "ng" },
    { name: "Oman", code: "om" },
    { name: "Pakistan", code: "pk" },
    { name: "Panama", code: "pa" },
    { name: "Peru", code: "pe" },
    { name: "Philippines", code: "ph" },
    { name: "Qatar", code: "qa" },
    { name: "Saudi Arabia", code: "sa" },
    { name: "Senegal", code: "sn" },
    { name: "Singapore", code: "sg" },
    { name: "South Africa", code: "za" },
    { name: "South Korea", code: "kr" },
    { name: "Sri Lanka", code: "lk" },
    { name: "Taiwan", code: "tw" },
    { name: "Thailand", code: "th" },
    { name: "Tunisia", code: "tn" },
    { name: "UAE", code: "ae" },
    { name: "Uganda", code: "ug" },
    { name: "USA", code: "us" },
    { name: "Uzbekistan", code: "uz" },
  ],
}

// All countries flat + extended SUPPORTED_CODES
export const ALL_COUNTRIES: CountryEntry[] = [...COUNTRIES.europe, ...COUNTRIES.worldwide]
export const ALL_COUNTRY_CODES = new Set(ALL_COUNTRIES.map(c => c.code))
export const EXTENDED_SUPPORTED_CODES = new Set([...SUPPORTED_CODES, ...ALL_COUNTRY_CODES])

export function getCountryEntryByName(name: string): CountryEntry | undefined {
  return ALL_COUNTRIES.find(c => c.name.toLowerCase() === name.toLowerCase())
}

export function getCountryEntryByCode(code: string): CountryEntry | undefined {
  return ALL_COUNTRIES.find(c => c.code === code.toLowerCase())
}

// Emoji flag from 2-letter ISO code
export function codeToEmoji(code: string): string {
  const c = code.toUpperCase()
  if (c.length !== 2) return "🌍"
  return String.fromCodePoint(...[...c].map(ch => 0x1F1E6 - 65 + ch.charCodeAt(0)))
}

// ── Hardcoded cities per country ───────────────────────────────────────
export const COUNTRY_CITIES: Record<string, string[]> = {
  dk: ["Copenhagen","Aarhus","Odense","Aalborg","Esbjerg","Randers","Kolding","Horsens","Vejle","Roskilde"],
  se: ["Stockholm","Gothenburg","Malmö","Uppsala","Västerås","Örebro","Linköping","Helsingborg","Jönköping","Norrköping"],
  no: ["Oslo","Bergen","Trondheim","Stavanger","Drammen","Fredrikstad","Kristiansand","Sandnes","Tromsø","Sarpsborg"],
  fi: ["Helsinki","Espoo","Tampere","Vantaa","Oulu","Turku","Jyväskylä","Lahti","Kuopio","Pori"],
  de: ["Berlin","Hamburg","Munich","Cologne","Frankfurt","Stuttgart","Düsseldorf","Leipzig","Dortmund","Essen","Bremen","Dresden","Hanover","Nuremberg","Duisburg"],
  uk: ["London","Manchester","Birmingham","Glasgow","Leeds","Liverpool","Edinburgh","Bristol","Sheffield","Cardiff","Belfast","Newcastle","Nottingham","Leicester"],
  fr: ["Paris","Marseille","Lyon","Toulouse","Nice","Nantes","Strasbourg","Montpellier","Bordeaux","Lille","Rennes","Cannes"],
  es: ["Madrid","Barcelona","Valencia","Seville","Zaragoza","Málaga","Murcia","Palma","Las Palmas","Bilbao","Alicante","Ibiza","Marbella"],
  it: ["Rome","Milan","Naples","Turin","Palermo","Genoa","Bologna","Florence","Venice","Verona","Rimini"],
  nl: ["Amsterdam","Rotterdam","The Hague","Utrecht","Eindhoven","Groningen","Tilburg","Almere","Breda"],
  be: ["Brussels","Antwerp","Ghent","Charleroi","Liège","Bruges","Namur"],
  ch: ["Zurich","Geneva","Basel","Bern","Lausanne","Lucerne","St. Gallen","Lugano"],
  at: ["Vienna","Graz","Linz","Salzburg","Innsbruck","Klagenfurt"],
  pl: ["Warsaw","Kraków","Łódź","Wrocław","Poznań","Gdańsk","Szczecin","Katowice","Lublin"],
  cz: ["Prague","Brno","Ostrava","Plzeň","Liberec","Olomouc"],
  hu: ["Budapest","Debrecen","Miskolc","Szeged","Pécs","Győr"],
  ro: ["Bucharest","Cluj-Napoca","Timișoara","Iași","Constanța","Brașov"],
  bg: ["Sofia","Plovdiv","Varna","Burgas","Ruse","Sunny Beach"],
  hr: ["Zagreb","Split","Rijeka","Osijek","Zadar","Dubrovnik","Pula"],
  gr: ["Athens","Thessaloniki","Patras","Heraklion","Larissa","Rhodes","Mykonos","Santorini"],
  pt: ["Lisbon","Porto","Faro","Braga","Setúbal","Coimbra","Albufeira"],
  tr: ["Istanbul","Ankara","Izmir","Antalya","Bursa","Adana","Gaziantep","Alanya"],
  ru: ["Moscow","Saint Petersburg","Novosibirsk","Yekaterinburg","Kazan","Sochi"],
  ua: ["Kyiv","Kharkiv","Odessa","Dnipro","Lviv","Zaporizhzhia"],
  rs: ["Belgrade","Novi Sad","Niš","Subotica","Kragujevac"],
  al: ["Tirana","Durrës","Vlorë","Shkodër","Sarandë"],
  ae: ["Dubai","Abu Dhabi","Sharjah","Ajman","Ras Al Khaimah"],
  sa: ["Riyadh","Jeddah","Mecca","Medina","Dammam","Khobar"],
  th: ["Bangkok","Pattaya","Phuket","Chiang Mai","Koh Samui"],
  jp: ["Tokyo","Osaka","Kyoto","Nagoya","Sapporo","Fukuoka","Yokohama"],
  us: ["New York","Los Angeles","Miami","Las Vegas","Chicago","Houston","Phoenix","San Francisco"],
  ca: ["Toronto","Vancouver","Montreal","Calgary","Ottawa","Edmonton"],
  au: ["Sydney","Melbourne","Brisbane","Perth","Adelaide","Gold Coast"],
  br: ["São Paulo","Rio de Janeiro","Brasília","Salvador","Fortaleza","Manaus"],
  mx: ["Mexico City","Cancún","Guadalajara","Monterrey","Tijuana","Playa del Carmen"],
  cn: ["Beijing","Shanghai","Guangzhou","Shenzhen","Chengdu","Hong Kong"],
  in: ["Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Kolkata","Goa"],
  eg: ["Cairo","Alexandria","Luxor","Hurghada","Sharm El Sheikh"],
  ma: ["Casablanca","Marrakech","Rabat","Fes","Agadir","Tangier"],
  ph: ["Manila","Cebu","Davao","Angeles","Makati"],
  id: ["Jakarta","Bali","Surabaya","Bandung","Medan"],
  my: ["Kuala Lumpur","Penang","Johor Bahru","Kota Kinabalu"],
  sg: ["Singapore"],
  il: ["Tel Aviv","Jerusalem","Haifa","Eilat"],
  lb: ["Beirut","Jounieh","Byblos"],
  za: ["Johannesburg","Cape Town","Durban","Pretoria"],
  ng: ["Lagos","Abuja","Port Harcourt","Kano"],
  ke: ["Nairobi","Mombasa","Kisumu"],
  gh: ["Accra","Kumasi","Takoradi"],
  ar: ["Buenos Aires","Córdoba","Rosario","Mendoza","Mar del Plata"],
  cl: ["Santiago","Valparaíso","Concepción","Antofagasta"],
  co: ["Bogotá","Medellín","Cali","Cartagena","Barranquilla"],
  pe: ["Lima","Cusco","Arequipa","Trujillo"],
  tw: ["Taipei","Kaohsiung","Taichung","Tainan"],
  kr: ["Seoul","Busan","Incheon","Daegu","Daejeon"],
  kz: ["Almaty","Nur-Sultan","Shymkent"],
  uz: ["Tashkent","Samarkand","Bukhara"],
  by: ["Minsk","Gomel","Mogilev","Vitebsk"],
  lv: ["Riga","Daugavpils","Liepāja"],
  lt: ["Vilnius","Kaunas","Klaipėda"],
  ee: ["Tallinn","Tartu","Narva"],
  sk: ["Bratislava","Košice","Prešov","Žilina"],
  si: ["Ljubljana","Maribor","Celje","Koper"],
  ba: ["Sarajevo","Banja Luka","Mostar","Tuzla"],
  mk: ["Skopje","Bitola","Kumanovo"],
  me: ["Podgorica","Budva","Bar","Kotor"],
  am: ["Yerevan","Gyumri","Vanadzor"],
  ge: ["Tbilisi","Batumi","Kutaisi"],
  az: ["Baku","Ganja","Sumqayit"],
  qa: ["Doha","Al Rayyan"],
  kw: ["Kuwait City","Salmiya","Hawalli"],
  bh: ["Manama","Muharraq","Riffa"],
  om: ["Muscat","Salalah","Sohar"],
  jo: ["Amman","Aqaba","Irbid","Zarqa"],
  lk: ["Colombo","Kandy","Galle","Negombo"],
  np: ["Kathmandu","Pokhara","Lalitpur"],
  bd: ["Dhaka","Chittagong","Sylhet"],
  pk: ["Karachi","Lahore","Islamabad","Faisalabad"],
  kh: ["Phnom Penh","Siem Reap","Sihanoukville"],
  vn: ["Ho Chi Minh City","Hanoi","Da Nang","Nha Trang"],
  nz: ["Auckland","Wellington","Christchurch","Queenstown"],
  cr: ["San José","Tamarindo","Jacó","Liberia"],
  pa: ["Panama City","Colón","David"],
  ec: ["Quito","Guayaquil","Cuenca"],
  tn: ["Tunis","Sfax","Sousse","Hammamet"],
  dz: ["Algiers","Oran","Constantine"],
  sn: ["Dakar","Saint-Louis","Thiès"],
  cm: ["Douala","Yaoundé","Bafoussam"],
  ao: ["Luanda","Huambo","Benguela"],
  ug: ["Kampala","Entebbe","Jinja"],
}
