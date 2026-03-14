export type Locale = "en" | "da" | "de" | "fr" | "es" | "it" | "pt" | "nl" | "sv" | "no" | "ar" | "th" | "ru" | "pl"

export const LANGUAGES: Record<Locale, { name: string; flagCode: string; dir?: "rtl" }> = {
  en: { name: "English",    flagCode: "gb" },
  da: { name: "Dansk",      flagCode: "dk" },
  de: { name: "Deutsch",    flagCode: "de" },
  fr: { name: "Français",   flagCode: "fr" },
  es: { name: "Español",    flagCode: "es" },
  it: { name: "Italiano",   flagCode: "it" },
  pt: { name: "Português",  flagCode: "br" },
  nl: { name: "Nederlands", flagCode: "nl" },
  sv: { name: "Svenska",    flagCode: "se" },
  no: { name: "Norsk",      flagCode: "no" },
  ar: { name: "العربية",    flagCode: "sa", dir: "rtl" },
  th: { name: "ภาษาไทย",   flagCode: "th" },
  ru: { name: "Русский",    flagCode: "ru" },
  pl: { name: "Polski",     flagCode: "pl" },
}

export type TranslationKeys = {
  // Navbar
  nav_home: string
  nav_support: string
  nav_post_ad: string
  nav_login: string
  nav_create_account: string
  nav_dashboard: string
  nav_my_account: string

  // Homepage
  hero_title: string
  hero_subtitle: string
  hero_cta_start: string
  hero_cta_learn: string
  premium_listings: string
  latest_listings: string
  search_placeholder: string
  filter_all_countries: string
  filter_all_categories: string
  filter_all_genders: string
  filter_search_btn: string
  filter_clear: string

  // Ad card
  ad_verified: string
  ad_voice: string
  ad_video: string
  ad_yrs: string

  // Footer
  footer_tagline: string
  footer_categories: string
  footer_locations: string
  footer_support: string
  footer_company: string
  footer_faq: string
  footer_contact: string
  footer_safety: string
  footer_terms: string
  footer_report: string
  footer_about: string
  footer_press: string
  footer_advertise: string
  footer_privacy: string
  footer_cookies: string
  footer_copyright: string
  footer_adults_only: string

  // Auth
  auth_login_title: string
  auth_login_subtitle: string
  auth_email: string
  auth_password: string
  auth_forgot_password: string
  auth_login_btn: string
  auth_no_account: string
  auth_create_account: string
  auth_register_title: string
  auth_choose_type: string
  auth_provider: string
  auth_provider_desc: string
  auth_customer: string
  auth_customer_desc: string
  auth_continue: string
  auth_confirm_password: string
  auth_have_account: string
  auth_sign_in: string

  // Dashboard
  dash_overview: string
  dash_my_listings: string
  dash_create_listing: string
  dash_messages: string
  dash_profile: string
  dash_sign_out: string
  dash_active_listings: string
  dash_views_today: string
  dash_new_messages: string
  dash_quick_actions: string
  dash_upgrade_premium: string

  // Premium
  premium_title: string
  premium_subtitle: string
  premium_most_popular: string
  premium_per_month: string
  premium_choose: string
  premium_test_mode: string

  // Listing form
  listing_title: string
  listing_category: string
  listing_gender: string
  listing_age: string
  listing_location: string
  listing_about: string
  listing_services: string
  listing_languages: string
  listing_prices: string
  listing_contact: string
  listing_photos: string
  listing_submit: string
  listing_preview: string
  listing_step1: string
  listing_step2: string
  listing_step3: string
}

const en: TranslationKeys = {
  nav_home: "Home", nav_support: "Support", nav_post_ad: "Post an Ad",
  nav_login: "Login", nav_create_account: "Create Account", nav_dashboard: "Dashboard", nav_my_account: "My Account",
  hero_title: "The Premier Adult Advertising Platform",
  hero_subtitle: "Connect with 5000+ active users worldwide",
  hero_cta_start: "Get Started", hero_cta_learn: "Learn More",
  premium_listings: "\u2B50 Premium Listings", latest_listings: "Latest Listings",
  search_placeholder: "Search by city, name, service...",
  filter_all_countries: "\uD83C\uDF0D All countries", filter_all_categories: "\uD83D\uDCC1 All categories",
  filter_all_genders: "\uD83D\uDC64 All", filter_search_btn: "\uD83D\uDD0D Search", filter_clear: "\u2715 Clear",
  ad_verified: "\u2713 Verified", ad_voice: "\uD83C\uDF99\uFE0F Voice message available", ad_video: "\u25B6 Video", ad_yrs: "yrs",
  footer_tagline: "The Premier Adult Advertising Platform",
  footer_categories: "Categories", footer_locations: "Locations", footer_support: "Support", footer_company: "Company",
  footer_faq: "FAQ", footer_contact: "Contact Us", footer_safety: "Safety Tips",
  footer_terms: "Terms & Rules", footer_report: "Report Abuse",
  footer_about: "About Us", footer_press: "Press", footer_advertise: "Advertise",
  footer_privacy: "Privacy Policy", footer_cookies: "Cookie Policy",
  footer_copyright: "\u00A9 2026 RedLightAd.com \u2014 The World's Premier Adult Advertising Platform. All rights reserved.",
  footer_adults_only: "\uD83D\uDD1E Adults Only \u2014 18+",
  auth_login_title: "Welcome back", auth_login_subtitle: "Sign in to your account",
  auth_email: "Email", auth_password: "Password", auth_forgot_password: "Forgot password?",
  auth_login_btn: "Sign in", auth_no_account: "Don't have an account?", auth_create_account: "Create account",
  auth_register_title: "Create account", auth_choose_type: "Choose your account type",
  auth_provider: "Provider", auth_provider_desc: "Create and manage your listings",
  auth_customer: "Customer", auth_customer_desc: "Find and contact providers",
  auth_continue: "Continue", auth_confirm_password: "Confirm password",
  auth_have_account: "Already have an account?", auth_sign_in: "Sign in",
  dash_overview: "Overview", dash_my_listings: "My Listings", dash_create_listing: "Create Listing",
  dash_messages: "Messages", dash_profile: "Profile Settings", dash_sign_out: "Sign out",
  dash_active_listings: "Active listings", dash_views_today: "Views today", dash_new_messages: "New messages",
  dash_quick_actions: "Quick actions", dash_upgrade_premium: "\uD83D\uDC51 Upgrade to Premium",
  premium_title: "Choose your Premium plan", premium_subtitle: "Reach more customers and get more visibility",
  premium_most_popular: "MOST POPULAR", premium_per_month: "/month", premium_choose: "Choose",
  premium_test_mode: "Secure payment via Stripe \u2022 Test mode active \u2022 Use card 4242 4242 4242 4242",
  listing_title: "Listing title", listing_category: "Category", listing_gender: "Gender",
  listing_age: "Age", listing_location: "Location", listing_about: "About me",
  listing_services: "Services", listing_languages: "Languages", listing_prices: "Prices",
  listing_contact: "Contact", listing_photos: "Photos", listing_submit: "Publish listing",
  listing_preview: "Preview", listing_step1: "Basic info", listing_step2: "Details", listing_step3: "Contact & Photos",
}

const da: TranslationKeys = {
  nav_home: "Forside", nav_support: "Support", nav_post_ad: "Opret annonce",
  nav_login: "Log ind", nav_create_account: "Opret konto", nav_dashboard: "Dashboard", nav_my_account: "Min konto",
  hero_title: "Den F\u00F8rende Voksen Annonce Platform",
  hero_subtitle: "Forbind med 5000+ aktive brugere verden over",
  hero_cta_start: "Kom i gang", hero_cta_learn: "L\u00E6s mere",
  premium_listings: "\u2B50 Premium Annoncer", latest_listings: "Seneste Annoncer",
  search_placeholder: "S\u00F8g efter by, navn, service...",
  filter_all_countries: "\uD83C\uDF0D Alle lande", filter_all_categories: "\uD83D\uDCC1 Alle kategorier",
  filter_all_genders: "\uD83D\uDC64 Alle", filter_search_btn: "\uD83D\uDD0D S\u00F8g", filter_clear: "\u2715 Ryd",
  ad_verified: "\u2713 Verificeret", ad_voice: "\uD83C\uDF99\uFE0F Stemmebesked tilg\u00E6ngelig", ad_video: "\u25B6 Video", ad_yrs: "\u00E5r",
  footer_tagline: "Den F\u00F8rende Voksen Annonce Platform",
  footer_categories: "Kategorier", footer_locations: "Lokationer", footer_support: "Support", footer_company: "Virksomhed",
  footer_faq: "FAQ", footer_contact: "Kontakt os", footer_safety: "Sikkerhedstips",
  footer_terms: "Vilk\u00E5r & Regler", footer_report: "Anmeld misbrug",
  footer_about: "Om os", footer_press: "Presse", footer_advertise: "Annoncer",
  footer_privacy: "Privatlivspolitik", footer_cookies: "Cookiepolitik",
  footer_copyright: "\u00A9 2026 RedLightAd.com \u2014 Verdens F\u00F8rende Voksen Annonce Platform. Alle rettigheder forbeholdes.",
  footer_adults_only: "\uD83D\uDD1E Kun voksne \u2014 18+",
  auth_login_title: "Velkommen tilbage", auth_login_subtitle: "Log ind p\u00E5 din konto",
  auth_email: "Email", auth_password: "Kodeord", auth_forgot_password: "Glemt kodeord?",
  auth_login_btn: "Log ind", auth_no_account: "Har du ikke en konto?", auth_create_account: "Opret konto",
  auth_register_title: "Opret konto", auth_choose_type: "V\u00E6lg din kontotype",
  auth_provider: "Udbyder", auth_provider_desc: "Opret og administrer dine annoncer",
  auth_customer: "Kunde", auth_customer_desc: "Find og kontakt udbydere",
  auth_continue: "Forts\u00E6t", auth_confirm_password: "Bekr\u00E6ft kodeord",
  auth_have_account: "Har du allerede en konto?", auth_sign_in: "Log ind",
  dash_overview: "Oversigt", dash_my_listings: "Mine annoncer", dash_create_listing: "Opret annonce",
  dash_messages: "Beskeder", dash_profile: "Profil indstillinger", dash_sign_out: "Log ud",
  dash_active_listings: "Aktive annoncer", dash_views_today: "Visninger i dag", dash_new_messages: "Nye beskeder",
  dash_quick_actions: "Hurtige handlinger", dash_upgrade_premium: "\uD83D\uDC51 Opgrader til Premium",
  premium_title: "V\u00E6lg din Premium pakke", premium_subtitle: "N\u00E5 flere kunder og f\u00E5 mere synlighed",
  premium_most_popular: "MEST POPUL\u00C6R", premium_per_month: "/m\u00E5ned", premium_choose: "V\u00E6lg",
  premium_test_mode: "Sikker betaling via Stripe \u2022 Test mode aktiv \u2022 Brug kort 4242 4242 4242 4242",
  listing_title: "Annonce titel", listing_category: "Kategori", listing_gender: "K\u00F8n",
  listing_age: "Alder", listing_location: "Lokation", listing_about: "Om mig",
  listing_services: "Services", listing_languages: "Sprog", listing_prices: "Priser",
  listing_contact: "Kontakt", listing_photos: "Billeder", listing_submit: "Udgiv annonce",
  listing_preview: "Forh\u00E5ndsvisning", listing_step1: "Basis info", listing_step2: "Detaljer", listing_step3: "Kontakt & Billeder",
}

const de: TranslationKeys = {
  nav_home: "Startseite", nav_support: "Support", nav_post_ad: "Anzeige schalten",
  nav_login: "Anmelden", nav_create_account: "Konto erstellen", nav_dashboard: "Dashboard", nav_my_account: "Mein Konto",
  hero_title: "Die f\u00FChrende Plattform f\u00FCr Erwachsenenanzeigen",
  hero_subtitle: "Verbinde dich mit 5000+ aktiven Nutzern weltweit",
  hero_cta_start: "Loslegen", hero_cta_learn: "Mehr erfahren",
  premium_listings: "\u2B50 Premium-Anzeigen", latest_listings: "Neueste Anzeigen",
  search_placeholder: "Nach Stadt, Name, Service suchen...",
  filter_all_countries: "\uD83C\uDF0D Alle L\u00E4nder", filter_all_categories: "\uD83D\uDCC1 Alle Kategorien",
  filter_all_genders: "\uD83D\uDC64 Alle", filter_search_btn: "\uD83D\uDD0D Suchen", filter_clear: "\u2715 L\u00F6schen",
  ad_verified: "\u2713 Verifiziert", ad_voice: "\uD83C\uDF99\uFE0F Sprachnachricht verf\u00FCgbar", ad_video: "\u25B6 Video", ad_yrs: "J.",
  footer_tagline: "Die f\u00FChrende Plattform f\u00FCr Erwachsenenanzeigen",
  footer_categories: "Kategorien", footer_locations: "Standorte", footer_support: "Support", footer_company: "Unternehmen",
  footer_faq: "FAQ", footer_contact: "Kontakt", footer_safety: "Sicherheitstipps",
  footer_terms: "AGB & Regeln", footer_report: "Missbrauch melden",
  footer_about: "\u00DCber uns", footer_press: "Presse", footer_advertise: "Werbung",
  footer_privacy: "Datenschutz", footer_cookies: "Cookie-Richtlinie",
  footer_copyright: "\u00A9 2026 RedLightAd.com \u2014 Die weltweit f\u00FChrende Plattform. Alle Rechte vorbehalten.",
  footer_adults_only: "\uD83D\uDD1E Nur f\u00FCr Erwachsene \u2014 18+",
  auth_login_title: "Willkommen zur\u00FCck", auth_login_subtitle: "Melde dich bei deinem Konto an",
  auth_email: "E-Mail", auth_password: "Passwort", auth_forgot_password: "Passwort vergessen?",
  auth_login_btn: "Anmelden", auth_no_account: "Noch kein Konto?", auth_create_account: "Konto erstellen",
  auth_register_title: "Konto erstellen", auth_choose_type: "Kontotyp w\u00E4hlen",
  auth_provider: "Anbieter", auth_provider_desc: "Anzeigen erstellen und verwalten",
  auth_customer: "Kunde", auth_customer_desc: "Anbieter finden und kontaktieren",
  auth_continue: "Weiter", auth_confirm_password: "Passwort best\u00E4tigen",
  auth_have_account: "Bereits ein Konto?", auth_sign_in: "Anmelden",
  dash_overview: "\u00DCbersicht", dash_my_listings: "Meine Anzeigen", dash_create_listing: "Anzeige erstellen",
  dash_messages: "Nachrichten", dash_profile: "Profileinstellungen", dash_sign_out: "Abmelden",
  dash_active_listings: "Aktive Anzeigen", dash_views_today: "Aufrufe heute", dash_new_messages: "Neue Nachrichten",
  dash_quick_actions: "Schnellaktionen", dash_upgrade_premium: "\uD83D\uDC51 Auf Premium upgraden",
  premium_title: "Premium-Plan w\u00E4hlen", premium_subtitle: "Mehr Kunden erreichen, mehr Sichtbarkeit",
  premium_most_popular: "BELIEBTESTE", premium_per_month: "/Monat", premium_choose: "W\u00E4hlen",
  premium_test_mode: "Sichere Zahlung via Stripe \u2022 Testmodus aktiv",
  listing_title: "Anzeigentitel", listing_category: "Kategorie", listing_gender: "Geschlecht",
  listing_age: "Alter", listing_location: "Standort", listing_about: "\u00DCber mich",
  listing_services: "Services", listing_languages: "Sprachen", listing_prices: "Preise",
  listing_contact: "Kontakt", listing_photos: "Fotos", listing_submit: "Anzeige ver\u00F6ffentlichen",
  listing_preview: "Vorschau", listing_step1: "Basisinfo", listing_step2: "Details", listing_step3: "Kontakt & Fotos",
}

const fr: TranslationKeys = {
  nav_home: "Accueil", nav_support: "Support", nav_post_ad: "Publier une annonce",
  nav_login: "Connexion", nav_create_account: "Cr\u00E9er un compte", nav_dashboard: "Tableau de bord", nav_my_account: "Mon compte",
  hero_title: "La premi\u00E8re plateforme publicitaire pour adultes",
  hero_subtitle: "Connectez-vous avec 5000+ utilisateurs actifs dans le monde",
  hero_cta_start: "Commencer", hero_cta_learn: "En savoir plus",
  premium_listings: "\u2B50 Annonces Premium", latest_listings: "Derni\u00E8res annonces",
  search_placeholder: "Rechercher par ville, nom, service...",
  filter_all_countries: "\uD83C\uDF0D Tous les pays", filter_all_categories: "\uD83D\uDCC1 Toutes cat\u00E9gories",
  filter_all_genders: "\uD83D\uDC64 Tous", filter_search_btn: "\uD83D\uDD0D Rechercher", filter_clear: "\u2715 Effacer",
  ad_verified: "\u2713 V\u00E9rifi\u00E9", ad_voice: "\uD83C\uDF99\uFE0F Message vocal disponible", ad_video: "\u25B6 Vid\u00E9o", ad_yrs: "ans",
  footer_tagline: "La premi\u00E8re plateforme publicitaire pour adultes",
  footer_categories: "Cat\u00E9gories", footer_locations: "Lieux", footer_support: "Support", footer_company: "Entreprise",
  footer_faq: "FAQ", footer_contact: "Contactez-nous", footer_safety: "Conseils de s\u00E9curit\u00E9",
  footer_terms: "CGU & R\u00E8gles", footer_report: "Signaler un abus",
  footer_about: "\u00C0 propos", footer_press: "Presse", footer_advertise: "Publicit\u00E9",
  footer_privacy: "Confidentialit\u00E9", footer_cookies: "Politique des cookies",
  footer_copyright: "\u00A9 2026 RedLightAd.com \u2014 Tous droits r\u00E9serv\u00E9s.",
  footer_adults_only: "\uD83D\uDD1E Adultes uniquement \u2014 18+",
  auth_login_title: "Bon retour", auth_login_subtitle: "Connectez-vous \u00E0 votre compte",
  auth_email: "E-mail", auth_password: "Mot de passe", auth_forgot_password: "Mot de passe oubli\u00E9 ?",
  auth_login_btn: "Se connecter", auth_no_account: "Pas de compte ?", auth_create_account: "Cr\u00E9er un compte",
  auth_register_title: "Cr\u00E9er un compte", auth_choose_type: "Choisissez votre type de compte",
  auth_provider: "Prestataire", auth_provider_desc: "Cr\u00E9er et g\u00E9rer vos annonces",
  auth_customer: "Client", auth_customer_desc: "Trouver et contacter des prestataires",
  auth_continue: "Continuer", auth_confirm_password: "Confirmer le mot de passe",
  auth_have_account: "D\u00E9j\u00E0 un compte ?", auth_sign_in: "Se connecter",
  dash_overview: "Aper\u00E7u", dash_my_listings: "Mes annonces", dash_create_listing: "Cr\u00E9er annonce",
  dash_messages: "Messages", dash_profile: "Param\u00E8tres du profil", dash_sign_out: "D\u00E9connexion",
  dash_active_listings: "Annonces actives", dash_views_today: "Vues aujourd'hui", dash_new_messages: "Nouveaux messages",
  dash_quick_actions: "Actions rapides", dash_upgrade_premium: "\uD83D\uDC51 Passer \u00E0 Premium",
  premium_title: "Choisissez votre plan Premium", premium_subtitle: "Atteignez plus de clients",
  premium_most_popular: "PLUS POPULAIRE", premium_per_month: "/mois", premium_choose: "Choisir",
  premium_test_mode: "Paiement s\u00E9curis\u00E9 via Stripe \u2022 Mode test actif",
  listing_title: "Titre de l'annonce", listing_category: "Cat\u00E9gorie", listing_gender: "Genre",
  listing_age: "\u00C2ge", listing_location: "Lieu", listing_about: "\u00C0 propos de moi",
  listing_services: "Services", listing_languages: "Langues", listing_prices: "Tarifs",
  listing_contact: "Contact", listing_photos: "Photos", listing_submit: "Publier l'annonce",
  listing_preview: "Aper\u00E7u", listing_step1: "Info de base", listing_step2: "D\u00E9tails", listing_step3: "Contact & Photos",
}

const makeSimple = (overrides: Partial<TranslationKeys>): TranslationKeys => ({ ...en, ...overrides })

const es = makeSimple({
  nav_home: "Inicio", nav_support: "Soporte", nav_post_ad: "Publicar anuncio",
  nav_login: "Iniciar sesi\u00F3n", nav_create_account: "Crear cuenta", nav_dashboard: "Panel", nav_my_account: "Mi cuenta",
  hero_title: "La principal plataforma de anuncios para adultos",
  hero_subtitle: "Con\u00E9ctate con 5000+ usuarios activos en todo el mundo",
  hero_cta_start: "Empezar", hero_cta_learn: "Saber m\u00E1s",
  premium_listings: "\u2B50 Anuncios Premium", latest_listings: "\u00DAltimos anuncios",
  search_placeholder: "Buscar por ciudad, nombre, servicio...",
  filter_all_countries: "\uD83C\uDF0D Todos los pa\u00EDses", filter_all_categories: "\uD83D\uDCC1 Todas las categor\u00EDas",
  filter_search_btn: "\uD83D\uDD0D Buscar", filter_clear: "\u2715 Limpiar",
  ad_verified: "\u2713 Verificado", ad_yrs: "a\u00F1os",
  footer_tagline: "La principal plataforma de anuncios para adultos",
  footer_adults_only: "\uD83D\uDD1E Solo adultos \u2014 18+",
  footer_copyright: "\u00A9 2026 RedLightAd.com \u2014 Todos los derechos reservados.",
  auth_login_title: "Bienvenido de nuevo", auth_login_btn: "Iniciar sesi\u00F3n",
  auth_forgot_password: "\u00BFOlvidaste tu contrase\u00F1a?",
})

const nl = makeSimple({
  nav_home: "Home", nav_post_ad: "Advertentie plaatsen",
  nav_login: "Inloggen", nav_create_account: "Account aanmaken",
  hero_title: "Het toonaangevende volwassen advertentieplatform",
  hero_subtitle: "Verbind met 5000+ actieve gebruikers wereldwijd",
  footer_adults_only: "\uD83D\uDD1E Alleen volwassenen \u2014 18+",
  footer_copyright: "\u00A9 2026 RedLightAd.com \u2014 Alle rechten voorbehouden.",
  auth_login_title: "Welkom terug", auth_login_btn: "Inloggen",
})

const sv = makeSimple({
  nav_home: "Hem", nav_post_ad: "L\u00E4gg upp annons",
  nav_login: "Logga in", nav_create_account: "Skapa konto",
  hero_title: "Den ledande plattformen f\u00F6r vuxenannonser",
  hero_subtitle: "Anslut med 5000+ aktiva anv\u00E4ndare v\u00E4rlden \u00F6ver",
  footer_adults_only: "\uD83D\uDD1E Endast vuxna \u2014 18+",
  footer_copyright: "\u00A9 2026 RedLightAd.com \u2014 Alla r\u00E4ttigheter f\u00F6rbeh\u00E5llna.",
  auth_login_title: "V\u00E4lkommen tillbaka", auth_login_btn: "Logga in",
})

const no = makeSimple({
  nav_home: "Hjem", nav_post_ad: "Legg ut annonse",
  nav_login: "Logg inn", nav_create_account: "Opprett konto",
  hero_title: "Den ledende plattformen for voksne annonser",
  hero_subtitle: "Koble til 5000+ aktive brukere verden over",
  footer_adults_only: "\uD83D\uDD1E Kun voksne \u2014 18+",
  footer_copyright: "\u00A9 2026 RedLightAd.com \u2014 Alle rettigheter forbeholdt.",
  auth_login_title: "Velkommen tilbake", auth_login_btn: "Logg inn",
})

const ar = makeSimple({
  nav_home: "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629", nav_post_ad: "\u0646\u0634\u0631 \u0625\u0639\u0644\u0627\u0646",
  nav_login: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644", nav_create_account: "\u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628",
  hero_title: "\u0627\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0631\u0627\u0626\u062F\u0629 \u0644\u0644\u0625\u0639\u0644\u0627\u0646\u0627\u062A \u0644\u0644\u0628\u0627\u0644\u063A\u064A\u0646",
  hero_subtitle: "\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0623\u0643\u062B\u0631 \u0645\u0646 5000 \u0645\u0633\u062A\u062E\u062F\u0645 \u0646\u0634\u0637 \u062D\u0648\u0644 \u0627\u0644\u0639\u0627\u0644\u0645",
  filter_search_btn: "\uD83D\uDD0D \u0628\u062D\u062B", filter_clear: "\u2715 \u0645\u0633\u062D",
  footer_adults_only: "\uD83D\uDD1E \u0644\u0644\u0628\u0627\u0644\u063A\u064A\u0646 \u0641\u0642\u0637 \u2014 +18",
  footer_copyright: "\u00A9 2026 RedLightAd.com \u2014 \u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0642 \u0645\u062D\u0641\u0648\u0638\u0629.",
  auth_login_title: "\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0639\u0648\u062F\u062A\u0643", auth_login_btn: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644",
})

const th = makeSimple({
  nav_home: "\u0E2B\u0E19\u0E49\u0E32\u0E2B\u0E25\u0E31\u0E01", nav_post_ad: "\u0E25\u0E07\u0E42\u0E06\u0E29\u0E13\u0E32",
  nav_login: "\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A", nav_create_account: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E1A\u0E31\u0E0D\u0E0A\u0E35",
  hero_title: "\u0E41\u0E1E\u0E25\u0E15\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E42\u0E06\u0E29\u0E13\u0E32\u0E1C\u0E39\u0E49\u0E43\u0E2B\u0E0D\u0E48\u0E0A\u0E31\u0E49\u0E19\u0E19\u0E33",
  hero_subtitle: "\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D\u0E01\u0E31\u0E1A\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 5,000 \u0E23\u0E32\u0E22\u0E17\u0E31\u0E48\u0E27\u0E42\u0E25\u0E01",
  footer_adults_only: "\uD83D\uDD1E \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E1C\u0E39\u0E49\u0E43\u0E2B\u0E0D\u0E48\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 \u2014 18+",
  auth_login_title: "\u0E22\u0E34\u0E19\u0E14\u0E35\u0E15\u0E49\u0E2D\u0E19\u0E23\u0E31\u0E1A\u0E01\u0E25\u0E31\u0E1A", auth_login_btn: "\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A",
})

const ru = makeSimple({
  nav_home: "\u0413\u043B\u0430\u0432\u043D\u0430\u044F", nav_post_ad: "\u0420\u0430\u0437\u043C\u0435\u0441\u0442\u0438\u0442\u044C \u043E\u0431\u044A\u044F\u0432\u043B\u0435\u043D\u0438\u0435",
  nav_login: "\u0412\u043E\u0439\u0442\u0438", nav_create_account: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0430\u043A\u043A\u0430\u0443\u043D\u0442",
  hero_title: "\u0412\u0435\u0434\u0443\u0449\u0430\u044F \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430 \u043E\u0431\u044A\u044F\u0432\u043B\u0435\u043D\u0438\u0439 \u0434\u043B\u044F \u0432\u0437\u0440\u043E\u0441\u043B\u044B\u0445",
  hero_subtitle: "\u0421\u0432\u044F\u0437\u044B\u0432\u0430\u0439\u0442\u0435\u0441\u044C \u0441 5000+ \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u043C\u0438 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F\u043C\u0438 \u043F\u043E \u0432\u0441\u0435\u043C\u0443 \u043C\u0438\u0440\u0443",
  filter_search_btn: "\uD83D\uDD0D \u041F\u043E\u0438\u0441\u043A", filter_clear: "\u2715 \u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C",
  footer_adults_only: "\uD83D\uDD1E \u0422\u043E\u043B\u044C\u043A\u043E \u0434\u043B\u044F \u0432\u0437\u0440\u043E\u0441\u043B\u044B\u0445 \u2014 18+",
  footer_copyright: "\u00A9 2026 RedLightAd.com \u2014 \u0412\u0441\u0435 \u043F\u0440\u0430\u0432\u0430 \u0437\u0430\u0449\u0438\u0449\u0435\u043D\u044B.",
  auth_login_title: "\u0421 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0435\u043D\u0438\u0435\u043C", auth_login_btn: "\u0412\u043E\u0439\u0442\u0438",
  auth_forgot_password: "\u0417\u0430\u0431\u044B\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C?",
})

const pl = makeSimple({
  nav_home: "Strona g\u0142\u00F3wna", nav_post_ad: "Dodaj og\u0142oszenie",
  nav_login: "Zaloguj si\u0119", nav_create_account: "Utw\u00F3rz konto",
  hero_title: "Wiod\u0105ca platforma og\u0142osze\u0144 dla doros\u0142ych",
  hero_subtitle: "Po\u0142\u0105cz si\u0119 z ponad 5000 aktywnymi u\u017Cytkownikami na ca\u0142ym \u015Bwiecie",
  filter_search_btn: "\uD83D\uDD0D Szukaj", filter_clear: "\u2715 Wyczy\u015B\u0107",
  footer_adults_only: "\uD83D\uDD1E Tylko dla doros\u0142ych \u2014 18+",
  footer_copyright: "\u00A9 2026 RedLightAd.com \u2014 Wszelkie prawa zastrze\u017Cone.",
  auth_login_title: "Witaj ponownie", auth_login_btn: "Zaloguj si\u0119",
})

const it = makeSimple({
  nav_home: "Home", nav_post_ad: "Pubblica annuncio",
  nav_login: "Accedi", nav_create_account: "Crea account",
  nav_dashboard: "Dashboard", nav_support: "Supporto",
  hero_title: "La piattaforma leader per annunci per adulti",
  hero_subtitle: "Connettiti con oltre 5000 utenti attivi in tutto il mondo",
  search_placeholder: "Cerca profili, città o parole chiave...",
  filter_all_countries: "Tutti i paesi", filter_all_categories: "Tutte le categorie",
  filter_all_genders: "Tutti i generi", filter_search_btn: "🔍 Cerca", filter_clear: "✕ Cancella",
  footer_adults_only: "🔞 Solo adulti — 18+",
  footer_copyright: "© 2026 RedLightAd.com — Tutti i diritti riservati.",
  auth_login_title: "Bentornato", auth_login_btn: "Accedi",
})

const pt = makeSimple({
  nav_home: "Início", nav_post_ad: "Publicar anúncio",
  nav_login: "Entrar", nav_create_account: "Criar conta",
  nav_dashboard: "Painel", nav_support: "Suporte",
  hero_title: "A plataforma líder de anúncios para adultos",
  hero_subtitle: "Conecte-se com mais de 5000 usuários ativos em todo o mundo",
  search_placeholder: "Buscar perfis, cidade ou palavra-chave...",
  filter_all_countries: "Todos os países", filter_all_categories: "Todas as categorias",
  filter_all_genders: "Todos os gêneros", filter_search_btn: "🔍 Buscar", filter_clear: "✕ Limpar",
  footer_adults_only: "🔞 Somente adultos — 18+",
  footer_copyright: "© 2026 RedLightAd.com — Todos os direitos reservados.",
  auth_login_title: "Bem-vindo de volta", auth_login_btn: "Entrar",
})

export const translations: Record<Locale, TranslationKeys> = {
  en, da, de, fr, es, it, pt, nl, sv, no, ar, th, ru, pl,
}
