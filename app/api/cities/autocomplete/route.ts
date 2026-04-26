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
  // GERMANY
  DE: [
    { name: "Berlin", region: "Berlin" },
    { name: "Hamburg", region: "Hamburg" },
    { name: "Munich", region: "Bavaria" },
    { name: "München", region: "Bavaria" },
    { name: "Cologne", region: "North Rhine-Westphalia" },
    { name: "Köln", region: "North Rhine-Westphalia" },
    { name: "Frankfurt", region: "Hesse" },
    { name: "Stuttgart", region: "Baden-Württemberg" },
    { name: "Düsseldorf", region: "North Rhine-Westphalia" },
    { name: "Leipzig", region: "Saxony" },
    { name: "Dresden", region: "Saxony" },
    { name: "Hannover", region: "Lower Saxony" },
    { name: "Nürnberg", region: "Bavaria" },
    { name: "Bremen", region: "Bremen" },
  ],
  // DENMARK
  DK: [
    { name: "Copenhagen", region: "Capital Region" },
    { name: "København", region: "Capital Region" },
    { name: "Aarhus", region: "Central Denmark" },
    { name: "Odense", region: "Southern Denmark" },
    { name: "Aalborg", region: "North Denmark" },
    { name: "Esbjerg", region: "Southern Denmark" },
    { name: "Randers", region: "Central Denmark" },
    { name: "Kolding", region: "Southern Denmark" },
    { name: "Vejle", region: "Southern Denmark" },
    { name: "Roskilde", region: "Zealand" },
  ],
  // ALBANIA
  AL: [
    { name: "Tirana", region: "Tirana" },
    { name: "Durrës", region: "Durrës" },
    { name: "Vlorë", region: "Vlorë" },
    { name: "Shkodër", region: "Shkodër" },
    { name: "Elbasan", region: "Elbasan" },
    { name: "Korçë", region: "Korçë" },
    { name: "Fier", region: "Fier" },
    { name: "Berat", region: "Berat" },
    { name: "Lushnjë", region: "Fier" },
    { name: "Pogradec", region: "Korçë" },
    { name: "Kavajë", region: "Tirana" },
    { name: "Gjirokastër", region: "Gjirokastër" },
    { name: "Sarandë", region: "Vlorë" },
  ],
  // SWEDEN  
  SE: [
    { name: "Stockholm", region: "Stockholm" },
    { name: "Gothenburg", region: "Västra Götaland" },
    { name: "Göteborg", region: "Västra Götaland" },
    { name: "Malmö", region: "Skåne" },
    { name: "Uppsala", region: "Uppsala" },
    { name: "Linköping", region: "Östergötland" },
    { name: "Västerås", region: "Västmanland" },
    { name: "Örebro", region: "Örebro" },
    { name: "Norrköping", region: "Östergötland" },
    { name: "Helsingborg", region: "Skåne" },
    { name: "Jönköping", region: "Jönköping" },
    { name: "Umeå", region: "Västerbotten" },
    { name: "Lund", region: "Skåne" },
    { name: "Borås", region: "Västra Götaland" },
    { name: "Sundsvall", region: "Västernorrland" },
  ],
  // SWITZERLAND
  CH: [
    { name: "Zurich", region: "Zurich" },
    { name: "Zürich", region: "Zurich" },
    { name: "Geneva", region: "Geneva" },
    { name: "Genève", region: "Geneva" },
    { name: "Basel", region: "Basel-Stadt" },
    { name: "Bern", region: "Bern" },
    { name: "Lausanne", region: "Vaud" },
    { name: "Winterthur", region: "Zurich" },
    { name: "Lucerne", region: "Lucerne" },
    { name: "Luzern", region: "Lucerne" },
    { name: "St. Gallen", region: "St. Gallen" },
    { name: "Lugano", region: "Ticino" },
    { name: "Biel", region: "Bern" },
    { name: "Thun", region: "Bern" },
    { name: "Interlaken", region: "Bern" },
  ],
  // POLAND
  PL: [
    { name: "Warsaw", region: "Masovian" },
    { name: "Warszawa", region: "Masovian" },
    { name: "Kraków", region: "Lesser Poland" },
    { name: "Krakow", region: "Lesser Poland" },
    { name: "Łódź", region: "Łódź" },
    { name: "Wrocław", region: "Lower Silesian" },
    { name: "Poznań", region: "Greater Poland" },
    { name: "Gdańsk", region: "Pomeranian" },
    { name: "Szczecin", region: "West Pomeranian" },
    { name: "Bydgoszcz", region: "Kuyavian-Pomeranian" },
    { name: "Lublin", region: "Lublin" },
    { name: "Białystok", region: "Podlaskie" },
    { name: "Katowice", region: "Silesian" },
    { name: "Gdynia", region: "Pomeranian" },
    { name: "Sopot", region: "Pomeranian" },
  ],
  // FINLAND
  FI: [
    { name: "Helsinki", region: "Uusimaa" },
    { name: "Espoo", region: "Uusimaa" },
    { name: "Tampere", region: "Pirkanmaa" },
    { name: "Vantaa", region: "Uusimaa" },
    { name: "Oulu", region: "North Ostrobothnia" },
    { name: "Turku", region: "Southwest Finland" },
    { name: "Jyväskylä", region: "Central Finland" },
    { name: "Lahti", region: "Päijänne Tavastia" },
    { name: "Kuopio", region: "North Savo" },
    { name: "Pori", region: "Satakunta" },
    { name: "Joensuu", region: "North Karelia" },
    { name: "Lappeenranta", region: "South Karelia" },
    { name: "Rovaniemi", region: "Lapland" },
  ],
  // LATVIA
  LV: [
    { name: "Riga", region: "Riga" },
    { name: "Daugavpils", region: "Latgale" },
    { name: "Liepāja", region: "Kurzeme" },
    { name: "Jelgava", region: "Zemgale" },
    { name: "Jūrmala", region: "Riga" },
    { name: "Ventspils", region: "Kurzeme" },
    { name: "Rēzekne", region: "Latgale" },
    { name: "Valmiera", region: "Vidzeme" },
    { name: "Jēkabpils", region: "Zemgale" },
    { name: "Ogre", region: "Riga" },
  ],
  // MOLDOVA
  MD: [
    { name: "Chișinău", region: "Chișinău" },
    { name: "Chisinau", region: "Chișinău" },
    { name: "Tiraspol", region: "Transnistria" },
    { name: "Bălți", region: "Bălți" },
    { name: "Bender", region: "Transnistria" },
    { name: "Rîbnița", region: "Transnistria" },
    { name: "Cahul", region: "Cahul" },
    { name: "Ungheni", region: "Ungheni" },
    { name: "Soroca", region: "Soroca" },
    { name: "Orhei", region: "Orhei" },
  ],
  // SPAIN
  ES: [
    { name: "Madrid", region: "Madrid" },
    { name: "Barcelona", region: "Catalonia" },
    { name: "Valencia", region: "Valencia" },
    { name: "Seville", region: "Andalusia" },
    { name: "Sevilla", region: "Andalusia" },
    { name: "Málaga", region: "Andalusia" },
    { name: "Bilbao", region: "Basque Country" },
    { name: "Alicante", region: "Valencia" },
    { name: "Granada", region: "Andalusia" },
    { name: "Ibiza", region: "Balearic Islands" },
    { name: "Palma", region: "Balearic Islands" },
    { name: "Marbella", region: "Andalusia" },
    { name: "Tenerife", region: "Canary Islands" },
    { name: "Las Palmas", region: "Canary Islands" },
  ],
  // NORWAY
  NO: [
    { name: "Oslo", region: "Oslo" },
    { name: "Bergen", region: "Vestland" },
    { name: "Trondheim", region: "Trøndelag" },
    { name: "Stavanger", region: "Rogaland" },
    { name: "Drammen", region: "Viken" },
    { name: "Fredrikstad", region: "Viken" },
    { name: "Kristiansand", region: "Agder" },
    { name: "Sandnes", region: "Rogaland" },
    { name: "Tromsø", region: "Troms og Finnmark" },
    { name: "Sarpsborg", region: "Viken" },
    { name: "Bodø", region: "Nordland" },
    { name: "Ålesund", region: "Møre og Romsdal" },
  ],
  // AUSTRIA
  AT: [
    { name: "Vienna", region: "Vienna" },
    { name: "Wien", region: "Vienna" },
    { name: "Graz", region: "Styria" },
    { name: "Linz", region: "Upper Austria" },
    { name: "Salzburg", region: "Salzburg" },
    { name: "Innsbruck", region: "Tyrol" },
    { name: "Klagenfurt", region: "Carinthia" },
    { name: "Villach", region: "Carinthia" },
    { name: "Wels", region: "Upper Austria" },
    { name: "St. Pölten", region: "Lower Austria" },
    { name: "Dornbirn", region: "Vorarlberg" },
    { name: "Bregenz", region: "Vorarlberg" },
  ],
  // BELGIUM
  BE: [
    { name: "Brussels", region: "Brussels" },
    { name: "Bruxelles", region: "Brussels" },
    { name: "Antwerp", region: "Flanders" },
    { name: "Antwerpen", region: "Flanders" },
    { name: "Ghent", region: "Flanders" },
    { name: "Gent", region: "Flanders" },
    { name: "Charleroi", region: "Wallonia" },
    { name: "Liège", region: "Wallonia" },
    { name: "Bruges", region: "Flanders" },
    { name: "Brugge", region: "Flanders" },
    { name: "Namur", region: "Wallonia" },
    { name: "Leuven", region: "Flanders" },
    { name: "Mons", region: "Wallonia" },
  ],
  // CZECH REPUBLIC
  CZ: [
    { name: "Prague", region: "Prague" },
    { name: "Praha", region: "Prague" },
    { name: "Brno", region: "South Moravian" },
    { name: "Ostrava", region: "Moravian-Silesian" },
    { name: "Plzeň", region: "Plzeň" },
    { name: "Liberec", region: "Liberec" },
    { name: "Olomouc", region: "Olomouc" },
    { name: "České Budějovice", region: "South Bohemian" },
    { name: "Hradec Králové", region: "Hradec Králové" },
    { name: "Ústí nad Labem", region: "Ústí nad Labem" },
    { name: "Pardubice", region: "Pardubice" },
    { name: "Karlovy Vary", region: "Karlovy Vary" },
  ],
  // PORTUGAL
  PT: [
    { name: "Lisbon", region: "Lisbon" },
    { name: "Lisboa", region: "Lisbon" },
    { name: "Porto", region: "Norte" },
    { name: "Amadora", region: "Lisbon" },
    { name: "Braga", region: "Norte" },
    { name: "Coimbra", region: "Centro" },
    { name: "Funchal", region: "Madeira" },
    { name: "Setúbal", region: "Setúbal" },
    { name: "Almada", region: "Setúbal" },
    { name: "Faro", region: "Algarve" },
    { name: "Albufeira", region: "Algarve" },
    { name: "Lagos", region: "Algarve" },
    { name: "Cascais", region: "Lisbon" },
    { name: "Sintra", region: "Lisbon" },
  ],
  // GREECE
  GR: [
    { name: "Athens", region: "Attica" },
    { name: "Athína", region: "Attica" },
    { name: "Thessaloniki", region: "Central Macedonia" },
    { name: "Patras", region: "Western Greece" },
    { name: "Heraklion", region: "Crete" },
    { name: "Larissa", region: "Thessaly" },
    { name: "Volos", region: "Thessaly" },
    { name: "Rhodes", region: "South Aegean" },
    { name: "Ioannina", region: "Epirus" },
    { name: "Chania", region: "Crete" },
    { name: "Mykonos", region: "South Aegean" },
    { name: "Santorini", region: "South Aegean" },
    { name: "Corfu", region: "Ionian Islands" },
  ],
  // HUNGARY
  HU: [
    { name: "Budapest", region: "Budapest" },
    { name: "Debrecen", region: "Hajdú-Bihar" },
    { name: "Szeged", region: "Csongrád-Csanád" },
    { name: "Miskolc", region: "Borsod-Abaúj-Zemplén" },
    { name: "Pécs", region: "Baranya" },
    { name: "Győr", region: "Győr-Moson-Sopron" },
    { name: "Nyíregyháza", region: "Szabolcs-Szatmár-Bereg" },
    { name: "Kecskemét", region: "Bács-Kiskun" },
    { name: "Székesfehérvár", region: "Fejér" },
    { name: "Sopron", region: "Győr-Moson-Sopron" },
  ],
  // ROMANIA
  RO: [
    { name: "Bucharest", region: "Bucharest" },
    { name: "București", region: "Bucharest" },
    { name: "Cluj-Napoca", region: "Cluj" },
    { name: "Timișoara", region: "Timiș" },
    { name: "Iași", region: "Iași" },
    { name: "Constanța", region: "Constanța" },
    { name: "Craiova", region: "Dolj" },
    { name: "Brașov", region: "Brașov" },
    { name: "Galați", region: "Galați" },
    { name: "Ploiești", region: "Prahova" },
    { name: "Oradea", region: "Bihor" },
    { name: "Sibiu", region: "Sibiu" },
  ],
  // BULGARIA
  BG: [
    { name: "Sofia", region: "Sofia" },
    { name: "Plovdiv", region: "Plovdiv" },
    { name: "Varna", region: "Varna" },
    { name: "Burgas", region: "Burgas" },
    { name: "Ruse", region: "Ruse" },
    { name: "Stara Zagora", region: "Stara Zagora" },
    { name: "Pleven", region: "Pleven" },
    { name: "Sliven", region: "Sliven" },
    { name: "Dobrich", region: "Dobrich" },
    { name: "Sunny Beach", region: "Burgas" },
  ],
  // CROATIA
  HR: [
    { name: "Zagreb", region: "Zagreb" },
    { name: "Split", region: "Split-Dalmatia" },
    { name: "Rijeka", region: "Primorje-Gorski Kotar" },
    { name: "Osijek", region: "Osijek-Baranja" },
    { name: "Zadar", region: "Zadar" },
    { name: "Dubrovnik", region: "Dubrovnik-Neretva" },
    { name: "Pula", region: "Istria" },
    { name: "Slavonski Brod", region: "Brod-Posavina" },
    { name: "Karlovac", region: "Karlovac" },
    { name: "Rovinj", region: "Istria" },
  ],
  // SERBIA
  RS: [
    { name: "Belgrade", region: "Belgrade" },
    { name: "Beograd", region: "Belgrade" },
    { name: "Novi Sad", region: "Vojvodina" },
    { name: "Niš", region: "Nišava" },
    { name: "Kragujevac", region: "Šumadija" },
    { name: "Subotica", region: "Vojvodina" },
    { name: "Zrenjanin", region: "Vojvodina" },
    { name: "Pančevo", region: "Vojvodina" },
    { name: "Čačak", region: "Moravica" },
    { name: "Novi Pazar", region: "Raška" },
  ],
  // UKRAINE
  UA: [
    { name: "Kyiv", region: "Kyiv" },
    { name: "Kiev", region: "Kyiv" },
    { name: "Kharkiv", region: "Kharkiv" },
    { name: "Odesa", region: "Odesa" },
    { name: "Dnipro", region: "Dnipropetrovsk" },
    { name: "Lviv", region: "Lviv" },
    { name: "Zaporizhzhia", region: "Zaporizhzhia" },
    { name: "Vinnytsia", region: "Vinnytsia" },
    { name: "Mykolaiv", region: "Mykolaiv" },
    { name: "Chernihiv", region: "Chernihiv" },
  ],
  // TURKEY
  TR: [
    { name: "Istanbul", region: "Istanbul" },
    { name: "Ankara", region: "Ankara" },
    { name: "Izmir", region: "Izmir" },
    { name: "Bursa", region: "Bursa" },
    { name: "Antalya", region: "Antalya" },
    { name: "Adana", region: "Adana" },
    { name: "Konya", region: "Konya" },
    { name: "Gaziantep", region: "Gaziantep" },
    { name: "Mersin", region: "Mersin" },
    { name: "Bodrum", region: "Muğla" },
    { name: "Fethiye", region: "Muğla" },
    { name: "Marmaris", region: "Muğla" },
    { name: "Alanya", region: "Antalya" },
  ],
  // THAILAND
  TH: [
    { name: "Bangkok", region: "Bangkok" },
    { name: "Pattaya", region: "Chonburi" },
    { name: "Chiang Mai", region: "Chiang Mai" },
    { name: "Phuket", region: "Phuket" },
    { name: "Nonthaburi", region: "Nonthaburi" },
    { name: "Hat Yai", region: "Songkhla" },
    { name: "Khon Kaen", region: "Khon Kaen" },
    { name: "Krabi", region: "Krabi" },
    { name: "Koh Samui", region: "Surat Thani" },
    { name: "Hua Hin", region: "Prachuap Khiri Khan" },
  ],
  // UAE
  AE: [
    { name: "Dubai", region: "Dubai" },
    { name: "Abu Dhabi", region: "Abu Dhabi" },
    { name: "Sharjah", region: "Sharjah" },
    { name: "Ajman", region: "Ajman" },
    { name: "Ras Al Khaimah", region: "Ras Al Khaimah" },
    { name: "Fujairah", region: "Fujairah" },
    { name: "Al Ain", region: "Abu Dhabi" },
  ],
  // AUSTRALIA
  AU: [
    { name: "Sydney", region: "New South Wales" },
    { name: "Melbourne", region: "Victoria" },
    { name: "Brisbane", region: "Queensland" },
    { name: "Perth", region: "Western Australia" },
    { name: "Adelaide", region: "South Australia" },
    { name: "Gold Coast", region: "Queensland" },
    { name: "Canberra", region: "Australian Capital Territory" },
    { name: "Newcastle", region: "New South Wales" },
    { name: "Hobart", region: "Tasmania" },
    { name: "Darwin", region: "Northern Territory" },
    { name: "Cairns", region: "Queensland" },
  ],
  // CANADA
  CA: [
    { name: "Toronto", region: "Ontario" },
    { name: "Montreal", region: "Quebec" },
    { name: "Montréal", region: "Quebec" },
    { name: "Vancouver", region: "British Columbia" },
    { name: "Calgary", region: "Alberta" },
    { name: "Edmonton", region: "Alberta" },
    { name: "Ottawa", region: "Ontario" },
    { name: "Winnipeg", region: "Manitoba" },
    { name: "Quebec City", region: "Quebec" },
    { name: "Hamilton", region: "Ontario" },
    { name: "Victoria", region: "British Columbia" },
  ],
  // BRAZIL
  BR: [
    { name: "São Paulo", region: "São Paulo" },
    { name: "Rio de Janeiro", region: "Rio de Janeiro" },
    { name: "Brasília", region: "Distrito Federal" },
    { name: "Salvador", region: "Bahia" },
    { name: "Fortaleza", region: "Ceará" },
    { name: "Belo Horizonte", region: "Minas Gerais" },
    { name: "Manaus", region: "Amazonas" },
    { name: "Curitiba", region: "Paraná" },
    { name: "Recife", region: "Pernambuco" },
    { name: "Porto Alegre", region: "Rio Grande do Sul" },
  ],
  // UNITED STATES
  US: [
    { name: "New York", region: "New York" },
    { name: "Los Angeles", region: "California" },
    { name: "Chicago", region: "Illinois" },
    { name: "Houston", region: "Texas" },
    { name: "Phoenix", region: "Arizona" },
    { name: "San Francisco", region: "California" },
    { name: "Miami", region: "Florida" },
    { name: "Las Vegas", region: "Nevada" },
    { name: "Seattle", region: "Washington" },
    { name: "Boston", region: "Massachusetts" },
    { name: "Atlanta", region: "Georgia" },
    { name: "Dallas", region: "Texas" },
    { name: "Denver", region: "Colorado" },
    { name: "San Diego", region: "California" },
    { name: "Orlando", region: "Florida" },
  ],
  // UNITED KINGDOM
  GB: [
    { name: "London", region: "England" },
    { name: "Birmingham", region: "England" },
    { name: "Manchester", region: "England" },
    { name: "Glasgow", region: "Scotland" },
    { name: "Liverpool", region: "England" },
    { name: "Leeds", region: "England" },
    { name: "Edinburgh", region: "Scotland" },
    { name: "Bristol", region: "England" },
    { name: "Cardiff", region: "Wales" },
    { name: "Belfast", region: "Northern Ireland" },
    { name: "Newcastle", region: "England" },
    { name: "Brighton", region: "England" },
    { name: "Cambridge", region: "England" },
    { name: "Oxford", region: "England" },
  ],
  // NETHERLANDS
  NL: [
    { name: "Amsterdam", region: "North Holland" },
    { name: "Rotterdam", region: "South Holland" },
    { name: "The Hague", region: "South Holland" },
    { name: "Den Haag", region: "South Holland" },
    { name: "Utrecht", region: "Utrecht" },
    { name: "Eindhoven", region: "North Brabant" },
    { name: "Groningen", region: "Groningen" },
    { name: "Maastricht", region: "Limburg" },
    { name: "Haarlem", region: "North Holland" },
    { name: "Arnhem", region: "Gelderland" },
  ],
  // FRANCE
  FR: [
    { name: "Paris", region: "Île-de-France" },
    { name: "Marseille", region: "Provence-Alpes-Côte d'Azur" },
    { name: "Lyon", region: "Auvergne-Rhône-Alpes" },
    { name: "Toulouse", region: "Occitanie" },
    { name: "Nice", region: "Provence-Alpes-Côte d'Azur" },
    { name: "Nantes", region: "Pays de la Loire" },
    { name: "Strasbourg", region: "Grand Est" },
    { name: "Bordeaux", region: "Nouvelle-Aquitaine" },
    { name: "Lille", region: "Hauts-de-France" },
    { name: "Cannes", region: "Provence-Alpes-Côte d'Azur" },
    { name: "Monaco", region: "Monaco" },
  ],
  // ITALY
  IT: [
    { name: "Rome", region: "Lazio" },
    { name: "Roma", region: "Lazio" },
    { name: "Milan", region: "Lombardy" },
    { name: "Milano", region: "Lombardy" },
    { name: "Naples", region: "Campania" },
    { name: "Turin", region: "Piedmont" },
    { name: "Florence", region: "Tuscany" },
    { name: "Firenze", region: "Tuscany" },
    { name: "Venice", region: "Veneto" },
    { name: "Venezia", region: "Veneto" },
    { name: "Bologna", region: "Emilia-Romagna" },
    { name: "Verona", region: "Veneto" },
  ],
  // RUSSIA
  RU: [
    { name: "Moscow", region: "Moscow" },
    { name: "Москва", region: "Moscow" },
    { name: "Saint Petersburg", region: "Saint Petersburg" },
    { name: "Санкт-Петербург", region: "Saint Petersburg" },
    { name: "Novosibirsk", region: "Novosibirsk Oblast" },
    { name: "Yekaterinburg", region: "Sverdlovsk Oblast" },
    { name: "Kazan", region: "Tatarstan" },
    { name: "Nizhny Novgorod", region: "Nizhny Novgorod Oblast" },
    { name: "Sochi", region: "Krasnodar Krai" },
  ],
  // JAPAN
  JP: [
    { name: "Tokyo", region: "Tokyo" },
    { name: "Osaka", region: "Osaka" },
    { name: "Kyoto", region: "Kyoto" },
    { name: "Yokohama", region: "Kanagawa" },
    { name: "Nagoya", region: "Aichi" },
    { name: "Sapporo", region: "Hokkaido" },
    { name: "Fukuoka", region: "Fukuoka" },
    { name: "Kobe", region: "Hyogo" },
    { name: "Hiroshima", region: "Hiroshima" },
    { name: "Okinawa", region: "Okinawa" },
  ],
  // SOUTH KOREA
  KR: [
    { name: "Seoul", region: "Seoul" },
    { name: "Busan", region: "Busan" },
    { name: "Incheon", region: "Incheon" },
    { name: "Daegu", region: "Daegu" },
    { name: "Daejeon", region: "Daejeon" },
    { name: "Gwangju", region: "Gwangju" },
    { name: "Suwon", region: "Gyeonggi" },
    { name: "Jeju", region: "Jeju" },
  ],
  // CHINA
  CN: [
    { name: "Shanghai", region: "Shanghai" },
    { name: "Beijing", region: "Beijing" },
    { name: "Shenzhen", region: "Guangdong" },
    { name: "Guangzhou", region: "Guangdong" },
    { name: "Chengdu", region: "Sichuan" },
    { name: "Hangzhou", region: "Zhejiang" },
    { name: "Hong Kong", region: "Hong Kong" },
    { name: "Macau", region: "Macau" },
    { name: "Xi'an", region: "Shaanxi" },
    { name: "Nanjing", region: "Jiangsu" },
  ],
  // SINGAPORE
  SG: [
    { name: "Singapore", region: "Singapore" },
    { name: "Sentosa", region: "Singapore" },
    { name: "Orchard", region: "Singapore" },
    { name: "Marina Bay", region: "Singapore" },
  ],
  // INDONESIA
  ID: [
    { name: "Jakarta", region: "Jakarta" },
    { name: "Bali", region: "Bali" },
    { name: "Surabaya", region: "East Java" },
    { name: "Bandung", region: "West Java" },
    { name: "Medan", region: "North Sumatra" },
    { name: "Yogyakarta", region: "Yogyakarta" },
    { name: "Denpasar", region: "Bali" },
    { name: "Ubud", region: "Bali" },
  ],
  // MALAYSIA
  MY: [
    { name: "Kuala Lumpur", region: "Kuala Lumpur" },
    { name: "George Town", region: "Penang" },
    { name: "Johor Bahru", region: "Johor" },
    { name: "Ipoh", region: "Perak" },
    { name: "Malacca", region: "Malacca" },
    { name: "Langkawi", region: "Kedah" },
    { name: "Kota Kinabalu", region: "Sabah" },
  ],
  // PHILIPPINES
  PH: [
    { name: "Manila", region: "Metro Manila" },
    { name: "Cebu City", region: "Cebu" },
    { name: "Davao City", region: "Davao del Sur" },
    { name: "Quezon City", region: "Metro Manila" },
    { name: "Makati", region: "Metro Manila" },
    { name: "Boracay", region: "Aklan" },
    { name: "Baguio", region: "Benguet" },
  ],
  // INDIA
  IN: [
    { name: "Mumbai", region: "Maharashtra" },
    { name: "Delhi", region: "Delhi" },
    { name: "Bangalore", region: "Karnataka" },
    { name: "Bengaluru", region: "Karnataka" },
    { name: "Hyderabad", region: "Telangana" },
    { name: "Chennai", region: "Tamil Nadu" },
    { name: "Kolkata", region: "West Bengal" },
    { name: "Pune", region: "Maharashtra" },
    { name: "Goa", region: "Goa" },
    { name: "Jaipur", region: "Rajasthan" },
  ],
  // MEXICO
  MX: [
    { name: "Mexico City", region: "Mexico City" },
    { name: "Cancún", region: "Quintana Roo" },
    { name: "Guadalajara", region: "Jalisco" },
    { name: "Monterrey", region: "Nuevo León" },
    { name: "Tijuana", region: "Baja California" },
    { name: "Playa del Carmen", region: "Quintana Roo" },
    { name: "Puerto Vallarta", region: "Jalisco" },
    { name: "Los Cabos", region: "Baja California Sur" },
  ],
  // ARGENTINA
  AR: [
    { name: "Buenos Aires", region: "Buenos Aires" },
    { name: "Córdoba", region: "Córdoba" },
    { name: "Rosario", region: "Santa Fe" },
    { name: "Mendoza", region: "Mendoza" },
    { name: "Mar del Plata", region: "Buenos Aires" },
    { name: "Bariloche", region: "Río Negro" },
  ],
  // COLOMBIA
  CO: [
    { name: "Bogotá", region: "Cundinamarca" },
    { name: "Medellín", region: "Antioquia" },
    { name: "Cali", region: "Valle del Cauca" },
    { name: "Barranquilla", region: "Atlántico" },
    { name: "Cartagena", region: "Bolívar" },
    { name: "Santa Marta", region: "Magdalena" },
  ],
  // SOUTH AFRICA
  ZA: [
    { name: "Johannesburg", region: "Gauteng" },
    { name: "Cape Town", region: "Western Cape" },
    { name: "Durban", region: "KwaZulu-Natal" },
    { name: "Pretoria", region: "Gauteng" },
    { name: "Port Elizabeth", region: "Eastern Cape" },
    { name: "Bloemfontein", region: "Free State" },
  ],
  // EGYPT
  EG: [
    { name: "Cairo", region: "Cairo" },
    { name: "Alexandria", region: "Alexandria" },
    { name: "Giza", region: "Giza" },
    { name: "Sharm El Sheikh", region: "South Sinai" },
    { name: "Hurghada", region: "Red Sea" },
    { name: "Luxor", region: "Luxor" },
  ],
  // MOROCCO
  MA: [
    { name: "Casablanca", region: "Casablanca-Settat" },
    { name: "Marrakech", region: "Marrakech-Safi" },
    { name: "Fes", region: "Fès-Meknès" },
    { name: "Rabat", region: "Rabat-Salé-Kénitra" },
    { name: "Tangier", region: "Tanger-Tétouan-Al Hoceïma" },
    { name: "Agadir", region: "Souss-Massa" },
  ],
  // ISRAEL
  IL: [
    { name: "Tel Aviv", region: "Tel Aviv" },
    { name: "Jerusalem", region: "Jerusalem" },
    { name: "Haifa", region: "Haifa" },
    { name: "Eilat", region: "Southern" },
    { name: "Netanya", region: "Central" },
    { name: "Beer Sheva", region: "Southern" },
  ],
  // IRELAND
  IE: [
    { name: "Dublin", region: "Leinster" },
    { name: "Cork", region: "Munster" },
    { name: "Galway", region: "Connacht" },
    { name: "Limerick", region: "Munster" },
    { name: "Waterford", region: "Munster" },
    { name: "Killarney", region: "Munster" },
  ],
  // SLOVENIA
  SI: [
    { name: "Ljubljana", region: "Central Slovenia" },
    { name: "Maribor", region: "Drava" },
    { name: "Celje", region: "Savinjska" },
    { name: "Kranj", region: "Upper Carniola" },
    { name: "Koper", region: "Coastal–Karst" },
    { name: "Bled", region: "Upper Carniola" },
  ],
  // SLOVAKIA
  SK: [
    { name: "Bratislava", region: "Bratislava" },
    { name: "Košice", region: "Košice" },
    { name: "Prešov", region: "Prešov" },
    { name: "Žilina", region: "Žilina" },
    { name: "Nitra", region: "Nitra" },
    { name: "Banská Bystrica", region: "Banská Bystrica" },
  ],
  // LITHUANIA
  LT: [
    { name: "Vilnius", region: "Vilnius" },
    { name: "Kaunas", region: "Kaunas" },
    { name: "Klaipėda", region: "Klaipėda" },
    { name: "Šiauliai", region: "Šiauliai" },
    { name: "Panevėžys", region: "Panevėžys" },
  ],
  // ESTONIA
  EE: [
    { name: "Tallinn", region: "Harju" },
    { name: "Tartu", region: "Tartu" },
    { name: "Narva", region: "Ida-Viru" },
    { name: "Pärnu", region: "Pärnu" },
    { name: "Kohtla-Järve", region: "Ida-Viru" },
  ],
  // MONTENEGRO
  ME: [
    { name: "Podgorica", region: "Podgorica" },
    { name: "Budva", region: "Budva" },
    { name: "Kotor", region: "Kotor" },
    { name: "Tivat", region: "Tivat" },
    { name: "Herceg Novi", region: "Herceg Novi" },
    { name: "Bar", region: "Bar" },
  ],
  // NORTH MACEDONIA
  MK: [
    { name: "Skopje", region: "Skopje" },
    { name: "Bitola", region: "Pelagonia" },
    { name: "Kumanovo", region: "Northeastern" },
    { name: "Prilep", region: "Pelagonia" },
    { name: "Ohrid", region: "Southwestern" },
  ],
  // BOSNIA
  BA: [
    { name: "Sarajevo", region: "Sarajevo" },
    { name: "Banja Luka", region: "Republika Srpska" },
    { name: "Tuzla", region: "Tuzla" },
    { name: "Zenica", region: "Zenica-Doboj" },
    { name: "Mostar", region: "Herzegovina-Neretva" },
  ],
  // KOSOVO
  XK: [
    { name: "Pristina", region: "Pristina" },
    { name: "Prizren", region: "Prizren" },
    { name: "Peja", region: "Peja" },
    { name: "Mitrovica", region: "Mitrovica" },
    { name: "Gjakova", region: "Gjakova" },
  ],
  // CYPRUS
  CY: [
    { name: "Nicosia", region: "Nicosia" },
    { name: "Limassol", region: "Limassol" },
    { name: "Larnaca", region: "Larnaca" },
    { name: "Paphos", region: "Paphos" },
    { name: "Ayia Napa", region: "Famagusta" },
  ],
  // MALTA
  MT: [
    { name: "Valletta", region: "Valletta" },
    { name: "Sliema", region: "Northern Harbour" },
    { name: "St. Julian's", region: "Northern Harbour" },
    { name: "Mdina", region: "Northern" },
    { name: "Gozo", region: "Gozo" },
  ],
  // LUXEMBOURG
  LU: [
    { name: "Luxembourg City", region: "Luxembourg" },
    { name: "Esch-sur-Alzette", region: "Luxembourg" },
    { name: "Differdange", region: "Luxembourg" },
    { name: "Dudelange", region: "Luxembourg" },
  ],
  // ICELAND
  IS: [
    { name: "Reykjavik", region: "Capital Region" },
    { name: "Reykjavík", region: "Capital Region" },
    { name: "Akureyri", region: "Northeastern" },
    { name: "Keflavík", region: "Southern Peninsula" },
  ],
  // NEW ZEALAND
  NZ: [
    { name: "Auckland", region: "Auckland" },
    { name: "Wellington", region: "Wellington" },
    { name: "Christchurch", region: "Canterbury" },
    { name: "Hamilton", region: "Waikato" },
    { name: "Queenstown", region: "Otago" },
    { name: "Dunedin", region: "Otago" },
  ],
};

// Country code to name mapping
const COUNTRY_NAMES: Record<string, string> = {
  AL: "Albania",
  AT: "Austria",
  AU: "Australia",
  AE: "UAE",
  AR: "Argentina",
  BA: "Bosnia and Herzegovina",
  BE: "Belgium",
  BG: "Bulgaria",
  BR: "Brazil",
  CA: "Canada",
  CH: "Switzerland",
  CN: "China",
  CO: "Colombia",
  CY: "Cyprus",
  CZ: "Czech Republic",
  DE: "Germany",
  DK: "Denmark",
  EE: "Estonia",
  EG: "Egypt",
  ES: "Spain",
  FI: "Finland",
  FR: "France",
  GB: "United Kingdom",
  GR: "Greece",
  HR: "Croatia",
  HU: "Hungary",
  ID: "Indonesia",
  IE: "Ireland",
  IL: "Israel",
  IN: "India",
  IS: "Iceland",
  IT: "Italy",
  JP: "Japan",
  KR: "South Korea",
  LT: "Lithuania",
  LU: "Luxembourg",
  LV: "Latvia",
  MA: "Morocco",
  MD: "Moldova",
  ME: "Montenegro",
  MK: "North Macedonia",
  MT: "Malta",
  MX: "Mexico",
  MY: "Malaysia",
  NL: "Netherlands",
  NO: "Norway",
  NZ: "New Zealand",
  PH: "Philippines",
  PL: "Poland",
  PT: "Portugal",
  RO: "Romania",
  RS: "Serbia",
  RU: "Russia",
  SE: "Sweden",
  SG: "Singapore",
  SI: "Slovenia",
  SK: "Slovakia",
  TH: "Thailand",
  TR: "Turkey",
  UA: "Ukraine",
  US: "United States",
  XK: "Kosovo",
  ZA: "South Africa",
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
