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
  // ── Navbar ──────────────────────────────────────────────────────────────────
  nav_home: string
  nav_support: string
  nav_post_ad: string
  nav_login: string
  nav_create_account: string
  nav_dashboard: string
  nav_my_account: string

  // ── Homepage ─────────────────────────────────────────────────────────────────
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

  // ── Ad card ──────────────────────────────────────────────────────────────────
  ad_verified: string
  ad_voice: string
  ad_video: string
  ad_yrs: string

  // ── Footer ───────────────────────────────────────────────────────────────────
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

  // ── Auth ─────────────────────────────────────────────────────────────────────
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

  // ── Dashboard ────────────────────────────────────────────────────────────────
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

  // ── Premium ──────────────────────────────────────────────────────────────────
  premium_title: string
  premium_subtitle: string
  premium_most_popular: string
  premium_per_month: string
  premium_choose: string
  premium_test_mode: string

  // ── Listing form ─────────────────────────────────────────────────────────────
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
  // Profile page
  contact_info: string
  contact_phone: string
  contact_show: string
  contact_call: string
  profile_info: string
  about_me: string
  watch_videos: string
  view_profile: string
  listing_preview: string
  listing_step1: string
  listing_step2: string
  listing_step3: string

  // ── Common UI ────────────────────────────────────────────────────────────────
  common_save: string
  common_cancel: string
  common_close: string
  common_back: string
  common_loading: string
  common_error: string
  common_send: string
  common_edit: string
  common_add: string
  common_search: string
  common_or: string

  // ── Messages / Chat ──────────────────────────────────────────────────────────
  msg_title: string
  msg_subtitle: string
  msg_no_convos: string
  msg_no_convos_sub: string
  msg_find_profile: string
  msg_loading: string
  msg_no_messages: string
  msg_placeholder: string
  msg_send_title: string
  msg_sent: string
  msg_sent_sub: string
  msg_send_new: string
  msg_login_required: string
  msg_login_sub: string
  msg_anonymous: string
  msg_create_free: string
  msg_login_link: string
  msg_cmd_enter: string
  msg_view_profile: string

  // ── Chat page (provider dashboard) ───────────────────────────────────────────
  chat_back: string
  chat_view_profile: string
  chat_no_messages: string
  chat_placeholder: string

  // ── Customer profile ─────────────────────────────────────────────────────────
  prof_title: string
  prof_subtitle: string
  prof_avatar: string
  prof_upload: string
  prof_upload_hint: string
  prof_basic_info: string
  prof_username: string
  prof_username_note: string
  prof_username_placeholder: string
  prof_gender: string
  prof_age: string
  prof_nationality: string
  prof_nationality_placeholder: string
  prof_height: string
  prof_weight: string
  prof_smoker: string
  prof_tattoos: string
  prof_penis_size: string
  prof_languages: string
  prof_preferences: string
  prof_bio: string
  prof_bio_placeholder: string
  prof_kinks_title: string
  prof_kink_bio: string
  prof_kink_bio_placeholder: string
  prof_media_title: string
  prof_media_sub: string
  prof_media_add: string
  prof_media_hint: string
  prof_privacy_note: string
  prof_save: string
  prof_saving: string
  prof_saved: string
  prof_view: string
  prof_not_disclosed: string

  // ── Gender options ───────────────────────────────────────────────────────────
  gender_select: string
  gender_male: string
  gender_female: string
  gender_trans: string
  gender_other: string

  // ── Smoker options ───────────────────────────────────────────────────────────
  smoker_select: string
  smoker_no: string
  smoker_yes: string
  smoker_occasionally: string

  // ── Tattoo options ───────────────────────────────────────────────────────────
  tattoo_select: string
  tattoo_none: string
  tattoo_few: string
  tattoo_many: string

  // ── Penis size options ───────────────────────────────────────────────────────
  penis_select: string
  penis_small: string
  penis_medium: string
  penis_large: string
  penis_xlarge: string

  // ── Profile preview modal ────────────────────────────────────────────────────
  preview_header: string
  preview_speaks: string
  preview_interests: string
  preview_about: string
  preview_media: string
  preview_close: string
  preview_edit: string
  preview_verified: string
  preview_created: string
  preview_anon: string
  preview_height_label: string
  preview_weight_label: string
  preview_smoker_label: string
  preview_tattoo_label: string

  // ── Verification ─────────────────────────────────────────────────────────────
  verified_badge: string

  // ── Filters (extended) ───────────────────────────────────────────────────────
  filter_age_range: string
  filter_price_range: string
  filter_verified_only: string
  filter_with_video: string
  filter_apply: string
}

// ─────────────────────────────────────────────────────────────────────────────
// English (base / default)
// ─────────────────────────────────────────────────────────────────────────────
const en: TranslationKeys = {
  // Navbar
  nav_home: "Home", nav_support: "Support", nav_post_ad: "Post an Ad",
  nav_login: "Login", nav_create_account: "Create Account", nav_dashboard: "Dashboard", nav_my_account: "My Account",
  // Homepage
  hero_title: "The Premier Adult Advertising Platform",
  hero_subtitle: "Connect with 5000+ active users worldwide",
  hero_cta_start: "Get Started", hero_cta_learn: "Learn More",
  premium_listings: "⭐ Premium Listings", latest_listings: "Latest Listings",
  search_placeholder: "Search by city, name, service...",
  filter_all_countries: "All countries", filter_all_categories: "All categories",
  filter_all_genders: "All", filter_search_btn: "Search", filter_clear: "Clear",
  // Ad card
  ad_verified: "✓ Verified", ad_voice: "🎙️ Voice message available", ad_video: "▶ Video", ad_yrs: "yrs",
  // Footer
  footer_tagline: "The Premier Adult Advertising Platform",
  footer_categories: "Categories", footer_locations: "Locations", footer_support: "Support", footer_company: "Company",
  footer_faq: "FAQ", footer_contact: "Contact Us", footer_safety: "Safety Tips",
  footer_terms: "Terms & Rules", footer_report: "Report Abuse",
  footer_about: "About Us", footer_press: "Press", footer_advertise: "Advertise",
  footer_privacy: "Privacy Policy", footer_cookies: "Cookie Policy",
  footer_copyright: "© 2026 RedLightAd.com — The World's Premier Adult Advertising Platform. All rights reserved.",
  footer_adults_only: "🔞 Adults Only — 18+",
  // Auth
  auth_login_title: "Welcome back", auth_login_subtitle: "Sign in to your account",
  auth_email: "Email", auth_password: "Password", auth_forgot_password: "Forgot password?",
  auth_login_btn: "Sign in", auth_no_account: "Don't have an account?", auth_create_account: "Create account",
  auth_register_title: "Create account", auth_choose_type: "Choose your account type",
  auth_provider: "Provider", auth_provider_desc: "Create and manage your listings",
  auth_customer: "Customer", auth_customer_desc: "Find and contact providers",
  auth_continue: "Continue", auth_confirm_password: "Confirm password",
  auth_have_account: "Already have an account?", auth_sign_in: "Sign in",
  // Dashboard
  dash_overview: "Overview", dash_my_listings: "My Listings", dash_create_listing: "Create Listing",
  dash_messages: "Messages", dash_profile: "Profile Settings", dash_sign_out: "Sign out",
  dash_active_listings: "Active listings", dash_views_today: "Views today", dash_new_messages: "New messages",
  dash_quick_actions: "Quick actions", dash_upgrade_premium: "👑 Upgrade to Premium",
  // Premium
  premium_title: "Choose your Premium plan", premium_subtitle: "Reach more customers and get more visibility",
  premium_most_popular: "MOST POPULAR", premium_per_month: "/month", premium_choose: "Choose",
  premium_test_mode: "Secure payment via Stripe • Test mode active • Use card 4242 4242 4242 4242",
  // Listing form
  listing_title: "Listing title", listing_category: "Category", listing_gender: "Gender",
  listing_age: "Age", listing_location: "Location", listing_about: "About me",
  listing_services: "Services", listing_languages: "Languages", listing_prices: "Prices",
  listing_contact: "Contact", listing_photos: "Photos", listing_submit: "Publish listing",
  listing_preview: "Preview", listing_step1: "Basic info", listing_step2: "Details", listing_step3: "Contact & Photos",
  contact_info: "Contact Info",
  contact_phone: "Phone",
  contact_show: "Show",
  contact_call: "Call",
  profile_info: "Profile Info",
  about_me: "About me",
  watch_videos: "Watch my videos →",
  view_profile: "View profile",
  // Common UI
  common_save: "Save", common_cancel: "Cancel", common_close: "Close",
  common_back: "Back", common_loading: "Loading...", common_error: "Error",
  common_send: "Send", common_edit: "Edit", common_add: "Add",
  common_search: "Search", common_or: "or",
  // Messages / Chat
  msg_title: "Messages",
  msg_subtitle: "Private conversations — only visible to you and the profile",
  msg_no_convos: "No conversations yet",
  msg_no_convos_sub: "Contact a profile to start a private conversation",
  msg_find_profile: "Find a profile",
  msg_loading: "Loading messages...",
  msg_no_messages: "No messages yet",
  msg_placeholder: "Write your message…",
  msg_send_title: "Send message",
  msg_sent: "Message sent!",
  msg_sent_sub: "You'll receive a reply in your inbox",
  msg_send_new: "Send new message",
  msg_login_required: "Sign in to send messages",
  msg_login_sub: "Platform messages are 100% anonymous — only your username is shown",
  msg_anonymous: "🔒 100% anonymous — only your username is shown",
  msg_create_free: "Create free account",
  msg_login_link: "Sign in",
  msg_cmd_enter: "Cmd+Enter to send",
  msg_view_profile: "View customer profile →",
  // Chat page (provider dashboard)
  chat_back: "Back",
  chat_view_profile: "View customer profile →",
  chat_no_messages: "No messages yet",
  chat_placeholder: "Write a message...",
  // Customer profile
  prof_title: "My profile",
  prof_subtitle: "Only visible to profiles you've contacted",
  prof_avatar: "Profile picture",
  prof_upload: "Upload image",
  prof_upload_hint: "JPG or PNG, max 5MB",
  prof_basic_info: "Basic info",
  prof_username: "Username *",
  prof_username_note: "Visible on reviews — not in messages",
  prof_username_placeholder: "your_username",
  prof_gender: "Gender",
  prof_age: "Age",
  prof_nationality: "Nationality",
  prof_nationality_placeholder: "e.g. Danish, Polish...",
  prof_height: "Height (cm)",
  prof_weight: "Weight (kg)",
  prof_smoker: "Smoker",
  prof_tattoos: "Tattoos",
  prof_penis_size: "Penis size",
  prof_languages: "Languages",
  prof_preferences: "About me & preferences",
  prof_bio: "Bio (optional)",
  prof_bio_placeholder: "Tell us a bit about yourself...",
  prof_kinks_title: "What turns you on",
  prof_kink_bio: "Describe what turns you on (visible to profiles you contact)",
  prof_kink_bio_placeholder: "Describe your preferences and fantasies...",
  prof_media_title: "My photos & videos",
  prof_media_sub: "Visible to profiles you've contacted",
  prof_media_add: "Add",
  prof_media_hint: "Photos and videos — max 10",
  prof_privacy_note: "⚠️ Reviews: If you write a review, your username will be shown publicly. You'll be warned before submitting.",
  prof_save: "Save profile",
  prof_saving: "Saving...",
  prof_saved: "✓ Profile saved!",
  prof_view: "View your profile",
  prof_not_disclosed: "Not disclosed",
  // Gender options
  gender_select: "Select...",
  gender_male: "Male",
  gender_female: "Female",
  gender_trans: "Trans",
  gender_other: "Other",
  // Smoker options
  smoker_select: "Select...",
  smoker_no: "Non-smoker",
  smoker_yes: "Smoker",
  smoker_occasionally: "Occasionally",
  // Tattoo options
  tattoo_select: "Select...",
  tattoo_none: "None",
  tattoo_few: "A few",
  tattoo_many: "Many",
  // Penis size options
  penis_select: "Select...",
  penis_small: "Under 14 cm",
  penis_medium: "14–18 cm",
  penis_large: "18–22 cm",
  penis_xlarge: "Over 22 cm",
  // Profile preview modal
  preview_header: "Preview — this is how others see your profile",
  preview_speaks: "Speaks",
  preview_interests: "Interests",
  preview_about: "About me",
  preview_media: "Photos & videos",
  preview_close: "Close",
  preview_edit: "Edit profile",
  preview_verified: "Verified by RedLightAD",
  preview_created: "Profile created",
  preview_anon: "Anonymous",
  preview_height_label: "cm tall",
  preview_weight_label: "weight",
  preview_smoker_label: "smoker",
  preview_tattoo_label: "tattoos",
  // Verification
  verified_badge: "✓ Verified by RedLightAD",
  // Filters extended
  filter_age_range: "Age range",
  filter_price_range: "Price range",
  filter_verified_only: "Verified only",
  filter_with_video: "With video",
  filter_apply: "Apply filters",
}

// ─────────────────────────────────────────────────────────────────────────────
// Danish
// ─────────────────────────────────────────────────────────────────────────────
const da: TranslationKeys = {
  // Navbar
  nav_home: "Forside", nav_support: "Support", nav_post_ad: "Opret annonce",
  nav_login: "Log ind", nav_create_account: "Opret konto", nav_dashboard: "Dashboard", nav_my_account: "Min konto",
  // Homepage
  hero_title: "Den Førende Voksen Annonce Platform",
  hero_subtitle: "Forbind med 5000+ aktive brugere verden over",
  hero_cta_start: "Kom i gang", hero_cta_learn: "Læs mere",
  premium_listings: "⭐ Premium Annoncer", latest_listings: "Seneste Annoncer",
  search_placeholder: "Søg efter by, navn, service...",
  filter_all_countries: "Alle lande", filter_all_categories: "Alle kategorier",
  filter_all_genders: "Alle", filter_search_btn: "Søg", filter_clear: "Ryd",
  // Ad card
  ad_verified: "✓ Verificeret", ad_voice: "🎙️ Stemmebesked tilgængelig", ad_video: "▶ Video", ad_yrs: "år",
  // Footer
  footer_tagline: "Den Førende Voksen Annonce Platform",
  footer_categories: "Kategorier", footer_locations: "Lokationer", footer_support: "Support", footer_company: "Virksomhed",
  footer_faq: "FAQ", footer_contact: "Kontakt os", footer_safety: "Sikkerhedstips",
  footer_terms: "Vilkår & Regler", footer_report: "Anmeld misbrug",
  footer_about: "Om os", footer_press: "Presse", footer_advertise: "Annoncer",
  footer_privacy: "Privatlivspolitik", footer_cookies: "Cookiepolitik",
  footer_copyright: "© 2026 RedLightAd.com — Verdens Førende Voksen Annonce Platform. Alle rettigheder forbeholdes.",
  footer_adults_only: "🔞 Kun voksne — 18+",
  // Auth
  auth_login_title: "Velkommen tilbage", auth_login_subtitle: "Log ind på din konto",
  auth_email: "Email", auth_password: "Kodeord", auth_forgot_password: "Glemt kodeord?",
  auth_login_btn: "Log ind", auth_no_account: "Har du ikke en konto?", auth_create_account: "Opret konto",
  auth_register_title: "Opret konto", auth_choose_type: "Vælg din kontotype",
  auth_provider: "Udbyder", auth_provider_desc: "Opret og administrer dine annoncer",
  auth_customer: "Kunde", auth_customer_desc: "Find og kontakt udbydere",
  auth_continue: "Fortsæt", auth_confirm_password: "Bekræft kodeord",
  auth_have_account: "Har du allerede en konto?", auth_sign_in: "Log ind",
  // Dashboard
  dash_overview: "Oversigt", dash_my_listings: "Mine annoncer", dash_create_listing: "Opret annonce",
  dash_messages: "Beskeder", dash_profile: "Profil indstillinger", dash_sign_out: "Log ud",
  dash_active_listings: "Aktive annoncer", dash_views_today: "Visninger i dag", dash_new_messages: "Nye beskeder",
  dash_quick_actions: "Hurtige handlinger", dash_upgrade_premium: "👑 Opgrader til Premium",
  // Premium
  premium_title: "Vælg din Premium pakke", premium_subtitle: "Nå flere kunder og få mere synlighed",
  premium_most_popular: "MEST POPULÆR", premium_per_month: "/måned", premium_choose: "Vælg",
  premium_test_mode: "Sikker betaling via Stripe • Test mode aktiv • Brug kort 4242 4242 4242 4242",
  // Listing form
  listing_title: "Annonce titel", listing_category: "Kategori", listing_gender: "Køn",
  listing_age: "Alder", listing_location: "Lokation", listing_about: "Om mig",
  listing_services: "Services", listing_languages: "Sprog", listing_prices: "Priser",
  listing_contact: "Kontakt", listing_photos: "Billeder", listing_submit: "Udgiv annonce",
  listing_preview: "Forhåndsvisning", listing_step1: "Basis info", listing_step2: "Detaljer", listing_step3: "Kontakt & Billeder",
  contact_info: "Kontaktinfo",
  contact_phone: "Telefon",
  contact_show: "Vis",
  contact_call: "Ring",
  profile_info: "Profilinfo",
  about_me: "Om mig",
  watch_videos: "Se mine videoer →",
  view_profile: "Se profil",
  // Common UI
  common_save: "Gem", common_cancel: "Annuller", common_close: "Luk",
  common_back: "Tilbage", common_loading: "Indlæser...", common_error: "Fejl",
  common_send: "Send", common_edit: "Rediger", common_add: "Tilføj",
  common_search: "Søg", common_or: "eller",
  // Messages / Chat
  msg_title: "Beskeder",
  msg_subtitle: "Private samtaler — kun synlige for dig og profilen",
  msg_no_convos: "Ingen samtaler endnu",
  msg_no_convos_sub: "Kontakt en profil for at starte en privat samtale",
  msg_find_profile: "Find en profil",
  msg_loading: "Indlæser beskeder...",
  msg_no_messages: "Ingen beskeder endnu",
  msg_placeholder: "Skriv din besked…",
  msg_send_title: "Send besked",
  msg_sent: "Besked sendt!",
  msg_sent_sub: "Du får svar i din indbakke",
  msg_send_new: "Send ny besked",
  msg_login_required: "Log ind for at sende beskeder",
  msg_login_sub: "Platform beskeder er 100% anonyme — kun dit brugernavn vises",
  msg_anonymous: "🔒 100% anonymt — kun dit brugernavn vises",
  msg_create_free: "Opret gratis konto",
  msg_login_link: "Log ind",
  msg_cmd_enter: "Cmd+Enter sender",
  msg_view_profile: "Se kundeprofil →",
  // Chat page
  chat_back: "Tilbage",
  chat_view_profile: "Se kundeprofil →",
  chat_no_messages: "Ingen beskeder endnu",
  chat_placeholder: "Skriv en besked...",
  // Customer profile
  prof_title: "Min profil",
  prof_subtitle: "Kun synlig for profiler du har kontaktet",
  prof_avatar: "Profilbillede",
  prof_upload: "Upload billede",
  prof_upload_hint: "JPG eller PNG, maks 5MB",
  prof_basic_info: "Grundoplysninger",
  prof_username: "Brugernavn *",
  prof_username_note: "Synligt ved anmeldelser — ikke ved beskeder",
  prof_username_placeholder: "dit_brugernavn",
  prof_gender: "Køn",
  prof_age: "Alder",
  prof_nationality: "Nationalitet",
  prof_nationality_placeholder: "f.eks. Dansk, Polsk...",
  prof_height: "Højde (cm)",
  prof_weight: "Vægt (kg)",
  prof_smoker: "Ryger",
  prof_tattoos: "Tatoveringer",
  prof_penis_size: "Peniss størrelse",
  prof_languages: "Sprog",
  prof_preferences: "Om mig & præferencer",
  prof_bio: "Bio (valgfrit)",
  prof_bio_placeholder: "Fortæl lidt om dig selv...",
  prof_kinks_title: "Hvad tænder du på",
  prof_kink_bio: "Beskriv hvad du tænder på (synligt for profiler du kontakter)",
  prof_kink_bio_placeholder: "Beskriv dine præferencer og fantasier...",
  prof_media_title: "Mine billeder & videoer",
  prof_media_sub: "Synlige for profiler du har kontaktet",
  prof_media_add: "Tilføj",
  prof_media_hint: "Billeder og videoer — maks 10 stk",
  prof_privacy_note: "⚠️ Anmeldelser: Hvis du skriver en anmeldelse, vises dit brugernavn offentligt. Du vil blive advaret inden du indsender.",
  prof_save: "Gem profil",
  prof_saving: "Gemmer...",
  prof_saved: "✓ Profil gemt!",
  prof_view: "Vis din profil",
  prof_not_disclosed: "Ikke oplyst",
  // Gender options
  gender_select: "Vælg...",
  gender_male: "Mand",
  gender_female: "Dame",
  gender_trans: "Trans",
  gender_other: "Andet",
  // Smoker options
  smoker_select: "Vælg...",
  smoker_no: "Ryger ikke",
  smoker_yes: "Ryger",
  smoker_occasionally: "Lejlighedsvis",
  // Tattoo options
  tattoo_select: "Vælg...",
  tattoo_none: "Ingen",
  tattoo_few: "Et par",
  tattoo_many: "Mange",
  // Penis size options
  penis_select: "Vælg...",
  penis_small: "Under 14 cm",
  penis_medium: "14–18 cm",
  penis_large: "18–22 cm",
  penis_xlarge: "Over 22 cm",
  // Profile preview modal
  preview_header: "Forhåndsvisning — sådan ser andre din profil",
  preview_speaks: "Taler",
  preview_interests: "Interesser",
  preview_about: "Om mig",
  preview_media: "Billeder & videoer",
  preview_close: "Luk",
  preview_edit: "Rediger profil",
  preview_verified: "Verificeret af RedLightAD",
  preview_created: "Profil oprettet",
  preview_anon: "Anonym",
  preview_height_label: "cm høj",
  preview_weight_label: "vægt",
  preview_smoker_label: "ryger",
  preview_tattoo_label: "tatoveringer",
  // Verification
  verified_badge: "✓ Verificeret af RedLightAD",
  // Filters extended
  filter_age_range: "Aldersgruppe",
  filter_price_range: "Prisinterval",
  filter_verified_only: "Kun verificerede",
  filter_with_video: "Med video",
  filter_apply: "Anvend filtre",
}

// ─────────────────────────────────────────────────────────────────────────────
// German
// ─────────────────────────────────────────────────────────────────────────────
const de: TranslationKeys = {
  nav_home: "Startseite", nav_support: "Support", nav_post_ad: "Anzeige schalten",
  nav_login: "Anmelden", nav_create_account: "Konto erstellen", nav_dashboard: "Dashboard", nav_my_account: "Mein Konto",
  hero_title: "Die führende Plattform für Erwachsenenanzeigen",
  hero_subtitle: "Verbinde dich mit 5000+ aktiven Nutzern weltweit",
  hero_cta_start: "Loslegen", hero_cta_learn: "Mehr erfahren",
  premium_listings: "⭐ Premium-Anzeigen", latest_listings: "Neueste Anzeigen",
  search_placeholder: "Nach Stadt, Name, Service suchen...",
  filter_all_countries: "Alle Länder", filter_all_categories: "Alle Kategorien",
  filter_all_genders: "Alle", filter_search_btn: "Suchen", filter_clear: "Löschen",
  ad_verified: "✓ Verifiziert", ad_voice: "🎙️ Sprachnachricht verfügbar", ad_video: "▶ Video", ad_yrs: "J.",
  footer_tagline: "Die führende Plattform für Erwachsenenanzeigen",
  footer_categories: "Kategorien", footer_locations: "Standorte", footer_support: "Support", footer_company: "Unternehmen",
  footer_faq: "FAQ", footer_contact: "Kontakt", footer_safety: "Sicherheitstipps",
  footer_terms: "AGB & Regeln", footer_report: "Missbrauch melden",
  footer_about: "Über uns", footer_press: "Presse", footer_advertise: "Werbung",
  footer_privacy: "Datenschutz", footer_cookies: "Cookie-Richtlinie",
  footer_copyright: "© 2026 RedLightAd.com — Die weltweit führende Plattform. Alle Rechte vorbehalten.",
  footer_adults_only: "🔞 Nur für Erwachsene — 18+",
  auth_login_title: "Willkommen zurück", auth_login_subtitle: "Melde dich bei deinem Konto an",
  auth_email: "E-Mail", auth_password: "Passwort", auth_forgot_password: "Passwort vergessen?",
  auth_login_btn: "Anmelden", auth_no_account: "Noch kein Konto?", auth_create_account: "Konto erstellen",
  auth_register_title: "Konto erstellen", auth_choose_type: "Kontotyp wählen",
  auth_provider: "Anbieter", auth_provider_desc: "Anzeigen erstellen und verwalten",
  auth_customer: "Kunde", auth_customer_desc: "Anbieter finden und kontaktieren",
  auth_continue: "Weiter", auth_confirm_password: "Passwort bestätigen",
  auth_have_account: "Bereits ein Konto?", auth_sign_in: "Anmelden",
  dash_overview: "Übersicht", dash_my_listings: "Meine Anzeigen", dash_create_listing: "Anzeige erstellen",
  dash_messages: "Nachrichten", dash_profile: "Profileinstellungen", dash_sign_out: "Abmelden",
  dash_active_listings: "Aktive Anzeigen", dash_views_today: "Aufrufe heute", dash_new_messages: "Neue Nachrichten",
  dash_quick_actions: "Schnellaktionen", dash_upgrade_premium: "👑 Auf Premium upgraden",
  premium_title: "Premium-Plan wählen", premium_subtitle: "Mehr Kunden erreichen, mehr Sichtbarkeit",
  premium_most_popular: "BELIEBTESTE", premium_per_month: "/Monat", premium_choose: "Wählen",
  premium_test_mode: "Sichere Zahlung via Stripe • Testmodus aktiv",
  listing_title: "Anzeigentitel", listing_category: "Kategorie", listing_gender: "Geschlecht",
  listing_age: "Alter", listing_location: "Standort", listing_about: "Über mich",
  listing_services: "Services", listing_languages: "Sprachen", listing_prices: "Preise",
  listing_contact: "Kontakt", listing_photos: "Fotos", listing_submit: "Anzeige veröffentlichen",
  listing_preview: "Vorschau", listing_step1: "Basisinfo", listing_step2: "Details", listing_step3: "Kontakt & Fotos",
  common_save: "Speichern", common_cancel: "Abbrechen", common_close: "Schließen",
  common_back: "Zurück", common_loading: "Laden...", common_error: "Fehler",
  common_send: "Senden", common_edit: "Bearbeiten", common_add: "Hinzufügen",
  common_search: "Suchen", common_or: "oder",
  msg_title: "Nachrichten",
  msg_subtitle: "Private Gespräche — nur für dich und das Profil sichtbar",
  msg_no_convos: "Noch keine Gespräche",
  msg_no_convos_sub: "Kontaktiere ein Profil, um ein privates Gespräch zu starten",
  msg_find_profile: "Profil finden",
  msg_loading: "Nachrichten werden geladen...",
  msg_no_messages: "Noch keine Nachrichten",
  msg_placeholder: "Schreibe deine Nachricht…",
  msg_send_title: "Nachricht senden",
  msg_sent: "Nachricht gesendet!",
  msg_sent_sub: "Du erhältst eine Antwort in deinem Posteingang",
  msg_send_new: "Neue Nachricht senden",
  msg_login_required: "Anmelden um Nachrichten zu senden",
  msg_login_sub: "Plattformnachrichten sind 100% anonym — nur dein Benutzername wird angezeigt",
  msg_anonymous: "🔒 100% anonym — nur dein Benutzername wird angezeigt",
  msg_create_free: "Kostenloses Konto erstellen",
  msg_login_link: "Anmelden",
  msg_cmd_enter: "Cmd+Enter sendet",
  msg_view_profile: "Kundenprofil ansehen →",
  chat_back: "Zurück",
  chat_view_profile: "Kundenprofil ansehen →",
  chat_no_messages: "Noch keine Nachrichten",
  chat_placeholder: "Nachricht schreiben...",
  prof_title: "Mein Profil",
  prof_subtitle: "Nur für Profile sichtbar, die du kontaktiert hast",
  prof_avatar: "Profilbild",
  prof_upload: "Bild hochladen",
  prof_upload_hint: "JPG oder PNG, max. 5 MB",
  prof_basic_info: "Grundinformationen",
  prof_username: "Benutzername *",
  prof_username_note: "Sichtbar bei Bewertungen — nicht in Nachrichten",
  prof_username_placeholder: "dein_benutzername",
  prof_gender: "Geschlecht",
  prof_age: "Alter",
  prof_nationality: "Nationalität",
  prof_nationality_placeholder: "z.B. Deutsch, Polnisch...",
  prof_height: "Größe (cm)",
  prof_weight: "Gewicht (kg)",
  prof_smoker: "Raucher",
  prof_tattoos: "Tätowierungen",
  prof_penis_size: "Penisgröße",
  prof_languages: "Sprachen",
  prof_preferences: "Über mich & Vorlieben",
  prof_bio: "Bio (optional)",
  prof_bio_placeholder: "Erzähl etwas über dich...",
  prof_kinks_title: "Was erregt dich",
  prof_kink_bio: "Beschreibe was dich erregt (sichtbar für Profile, die du kontaktierst)",
  prof_kink_bio_placeholder: "Beschreibe deine Vorlieben und Fantasien...",
  prof_media_title: "Meine Fotos & Videos",
  prof_media_sub: "Sichtbar für Profile, die du kontaktiert hast",
  prof_media_add: "Hinzufügen",
  prof_media_hint: "Fotos und Videos — max. 10",
  prof_privacy_note: "⚠️ Bewertungen: Wenn du eine Bewertung schreibst, wird dein Benutzername öffentlich angezeigt.",
  prof_save: "Profil speichern",
  prof_saving: "Speichert...",
  prof_saved: "✓ Profil gespeichert!",
  prof_view: "Profil anzeigen",
  prof_not_disclosed: "Keine Angabe",
  gender_select: "Wählen...", gender_male: "Mann", gender_female: "Frau", gender_trans: "Trans", gender_other: "Andere",
  smoker_select: "Wählen...", smoker_no: "Nichtraucher", smoker_yes: "Raucher", smoker_occasionally: "Gelegentlich",
  tattoo_select: "Wählen...", tattoo_none: "Keine", tattoo_few: "Einige", tattoo_many: "Viele",
  penis_select: "Wählen...", penis_small: "Unter 14 cm", penis_medium: "14–18 cm", penis_large: "18–22 cm", penis_xlarge: "Über 22 cm",
  preview_header: "Vorschau — so sehen andere dein Profil",
  preview_speaks: "Spricht", preview_interests: "Interessen", preview_about: "Über mich",
  preview_media: "Fotos & Videos", preview_close: "Schließen", preview_edit: "Profil bearbeiten",
  preview_verified: "Von RedLightAD verifiziert", preview_created: "Profil erstellt",
  preview_anon: "Anonym", preview_height_label: "cm groß", preview_weight_label: "Gewicht",
  preview_smoker_label: "Raucher", preview_tattoo_label: "Tätowierungen",
  verified_badge: "✓ Von RedLightAD verifiziert",
  filter_age_range: "Altersgruppe", filter_price_range: "Preisbereich",
  filter_verified_only: "Nur verifiziert", filter_with_video: "Mit Video", filter_apply: "Filter anwenden",
  contact_info: "Kontaktinfo",
  contact_phone: "Telefon",
  contact_show: "Anzeigen",
  contact_call: "Anrufen",
  profile_info: "Profilinfo",
  about_me: "Über mich",
  watch_videos: "Meine Videos →",
  view_profile: "Profil ansehen",
}

// ─────────────────────────────────────────────────────────────────────────────
// French
// ─────────────────────────────────────────────────────────────────────────────
const fr: TranslationKeys = {
  nav_home: "Accueil", nav_support: "Support", nav_post_ad: "Publier une annonce",
  nav_login: "Connexion", nav_create_account: "Créer un compte", nav_dashboard: "Tableau de bord", nav_my_account: "Mon compte",
  hero_title: "La première plateforme publicitaire pour adultes",
  hero_subtitle: "Connectez-vous avec 5000+ utilisateurs actifs dans le monde",
  hero_cta_start: "Commencer", hero_cta_learn: "En savoir plus",
  premium_listings: "⭐ Annonces Premium", latest_listings: "Dernières annonces",
  search_placeholder: "Rechercher par ville, nom, service...",
  filter_all_countries: "Tous les pays", filter_all_categories: "Toutes catégories",
  filter_all_genders: "Tous", filter_search_btn: "Rechercher", filter_clear: "Effacer",
  ad_verified: "✓ Vérifié", ad_voice: "🎙️ Message vocal disponible", ad_video: "▶ Vidéo", ad_yrs: "ans",
  footer_tagline: "La première plateforme publicitaire pour adultes",
  footer_categories: "Catégories", footer_locations: "Lieux", footer_support: "Support", footer_company: "Entreprise",
  footer_faq: "FAQ", footer_contact: "Contactez-nous", footer_safety: "Conseils de sécurité",
  footer_terms: "CGU & Règles", footer_report: "Signaler un abus",
  footer_about: "À propos", footer_press: "Presse", footer_advertise: "Publicité",
  footer_privacy: "Confidentialité", footer_cookies: "Politique des cookies",
  footer_copyright: "© 2026 RedLightAd.com — Tous droits réservés.",
  footer_adults_only: "🔞 Adultes uniquement — 18+",
  auth_login_title: "Bon retour", auth_login_subtitle: "Connectez-vous à votre compte",
  auth_email: "E-mail", auth_password: "Mot de passe", auth_forgot_password: "Mot de passe oublié ?",
  auth_login_btn: "Se connecter", auth_no_account: "Pas de compte ?", auth_create_account: "Créer un compte",
  auth_register_title: "Créer un compte", auth_choose_type: "Choisissez votre type de compte",
  auth_provider: "Prestataire", auth_provider_desc: "Créer et gérer vos annonces",
  auth_customer: "Client", auth_customer_desc: "Trouver et contacter des prestataires",
  auth_continue: "Continuer", auth_confirm_password: "Confirmer le mot de passe",
  auth_have_account: "Déjà un compte ?", auth_sign_in: "Se connecter",
  dash_overview: "Aperçu", dash_my_listings: "Mes annonces", dash_create_listing: "Créer annonce",
  dash_messages: "Messages", dash_profile: "Paramètres du profil", dash_sign_out: "Déconnexion",
  dash_active_listings: "Annonces actives", dash_views_today: "Vues aujourd'hui", dash_new_messages: "Nouveaux messages",
  dash_quick_actions: "Actions rapides", dash_upgrade_premium: "👑 Passer à Premium",
  premium_title: "Choisissez votre plan Premium", premium_subtitle: "Atteignez plus de clients",
  premium_most_popular: "PLUS POPULAIRE", premium_per_month: "/mois", premium_choose: "Choisir",
  premium_test_mode: "Paiement sécurisé via Stripe • Mode test actif",
  listing_title: "Titre de l'annonce", listing_category: "Catégorie", listing_gender: "Genre",
  listing_age: "Âge", listing_location: "Lieu", listing_about: "À propos de moi",
  listing_services: "Services", listing_languages: "Langues", listing_prices: "Tarifs",
  listing_contact: "Contact", listing_photos: "Photos", listing_submit: "Publier l'annonce",
  listing_preview: "Aperçu", listing_step1: "Info de base", listing_step2: "Détails", listing_step3: "Contact & Photos",
  contact_info: "Contact",
  contact_phone: "Téléphone",
  contact_show: "Afficher",
  contact_call: "Appeler",
  profile_info: "Profil",
  about_me: "À propos",
  watch_videos: "Voir mes vidéos →",
  view_profile: "Voir le profil",
  common_save: "Enregistrer", common_cancel: "Annuler", common_close: "Fermer",
  common_back: "Retour", common_loading: "Chargement...", common_error: "Erreur",
  common_send: "Envoyer", common_edit: "Modifier", common_add: "Ajouter",
  common_search: "Rechercher", common_or: "ou",
  msg_title: "Messages",
  msg_subtitle: "Conversations privées — visibles uniquement par vous et le profil",
  msg_no_convos: "Aucune conversation pour l'instant",
  msg_no_convos_sub: "Contactez un profil pour démarrer une conversation privée",
  msg_find_profile: "Trouver un profil",
  msg_loading: "Chargement des messages...",
  msg_no_messages: "Aucun message pour l'instant",
  msg_placeholder: "Écrivez votre message…",
  msg_send_title: "Envoyer un message",
  msg_sent: "Message envoyé !",
  msg_sent_sub: "Vous recevrez une réponse dans votre boîte de réception",
  msg_send_new: "Envoyer un nouveau message",
  msg_login_required: "Connectez-vous pour envoyer des messages",
  msg_login_sub: "Les messages sont 100% anonymes — seul votre pseudo est affiché",
  msg_anonymous: "🔒 100% anonyme — seul votre pseudo est affiché",
  msg_create_free: "Créer un compte gratuit",
  msg_login_link: "Se connecter",
  msg_cmd_enter: "Cmd+Entrée pour envoyer",
  msg_view_profile: "Voir le profil client →",
  chat_back: "Retour",
  chat_view_profile: "Voir le profil client →",
  chat_no_messages: "Aucun message pour l'instant",
  chat_placeholder: "Écrire un message...",
  prof_title: "Mon profil",
  prof_subtitle: "Visible uniquement par les profils que vous avez contactés",
  prof_avatar: "Photo de profil",
  prof_upload: "Télécharger une image",
  prof_upload_hint: "JPG ou PNG, max 5 Mo",
  prof_basic_info: "Informations de base",
  prof_username: "Nom d'utilisateur *",
  prof_username_note: "Visible sur les avis — pas dans les messages",
  prof_username_placeholder: "votre_pseudo",
  prof_gender: "Genre",
  prof_age: "Âge",
  prof_nationality: "Nationalité",
  prof_nationality_placeholder: "ex. Français, Polonais...",
  prof_height: "Taille (cm)",
  prof_weight: "Poids (kg)",
  prof_smoker: "Fumeur",
  prof_tattoos: "Tatouages",
  prof_penis_size: "Taille du pénis",
  prof_languages: "Langues",
  prof_preferences: "À propos de moi & préférences",
  prof_bio: "Bio (optionnel)",
  prof_bio_placeholder: "Parlez-nous un peu de vous...",
  prof_kinks_title: "Ce qui vous excite",
  prof_kink_bio: "Décrivez ce qui vous excite (visible pour les profils que vous contactez)",
  prof_kink_bio_placeholder: "Décrivez vos préférences et fantasmes...",
  prof_media_title: "Mes photos & vidéos",
  prof_media_sub: "Visibles par les profils que vous avez contactés",
  prof_media_add: "Ajouter",
  prof_media_hint: "Photos et vidéos — max 10",
  prof_privacy_note: "⚠️ Avis : Si vous écrivez un avis, votre pseudo sera affiché publiquement.",
  prof_save: "Enregistrer le profil",
  prof_saving: "Enregistrement...",
  prof_saved: "✓ Profil enregistré !",
  prof_view: "Voir votre profil",
  prof_not_disclosed: "Non renseigné",
  gender_select: "Choisir...", gender_male: "Homme", gender_female: "Femme", gender_trans: "Trans", gender_other: "Autre",
  smoker_select: "Choisir...", smoker_no: "Non-fumeur", smoker_yes: "Fumeur", smoker_occasionally: "Occasionnellement",
  tattoo_select: "Choisir...", tattoo_none: "Aucun", tattoo_few: "Quelques-uns", tattoo_many: "Beaucoup",
  penis_select: "Choisir...", penis_small: "Moins de 14 cm", penis_medium: "14–18 cm", penis_large: "18–22 cm", penis_xlarge: "Plus de 22 cm",
  preview_header: "Aperçu — comment les autres voient votre profil",
  preview_speaks: "Parle", preview_interests: "Intérêts", preview_about: "À propos",
  preview_media: "Photos & vidéos", preview_close: "Fermer", preview_edit: "Modifier le profil",
  preview_verified: "Vérifié par RedLightAD", preview_created: "Profil créé",
  preview_anon: "Anonyme", preview_height_label: "cm", preview_weight_label: "poids",
  preview_smoker_label: "fumeur", preview_tattoo_label: "tatouages",
  verified_badge: "✓ Vérifié par RedLightAD",
  filter_age_range: "Tranche d'âge", filter_price_range: "Fourchette de prix",
  filter_verified_only: "Vérifiés seulement", filter_with_video: "Avec vidéo", filter_apply: "Appliquer les filtres",
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: builds a locale from English defaults + overrides
// ─────────────────────────────────────────────────────────────────────────────
const makeSimple = (overrides: Partial<TranslationKeys>): TranslationKeys => ({ ...en, ...overrides })

// ─────────────────────────────────────────────────────────────────────────────
// Spanish
// ─────────────────────────────────────────────────────────────────────────────
const es = makeSimple({
  nav_home: "Inicio", nav_support: "Soporte", nav_post_ad: "Publicar anuncio",
  nav_login: "Iniciar sesión", nav_create_account: "Crear cuenta", nav_dashboard: "Panel", nav_my_account: "Mi cuenta",
  hero_title: "La principal plataforma de anuncios para adultos",
  hero_subtitle: "Conéctate con 5000+ usuarios activos en todo el mundo",
  hero_cta_start: "Empezar", hero_cta_learn: "Saber más",
  premium_listings: "⭐ Anuncios Premium", latest_listings: "Últimos anuncios",
  search_placeholder: "Buscar por ciudad, nombre, servicio...",
  filter_all_countries: "Todos los países", filter_all_categories: "Todas las categorías",
  filter_search_btn: "Buscar", filter_clear: "Limpiar",
  ad_verified: "✓ Verificado", ad_yrs: "años",
  footer_tagline: "La principal plataforma de anuncios para adultos",
  footer_adults_only: "🔞 Solo adultos — 18+",
  footer_copyright: "© 2026 RedLightAd.com — Todos los derechos reservados.",
  auth_login_title: "Bienvenido de nuevo", auth_login_subtitle: "Inicia sesión en tu cuenta",
  auth_email: "Correo electrónico", auth_password: "Contraseña",
  auth_forgot_password: "¿Olvidaste tu contraseña?",
  auth_login_btn: "Iniciar sesión", auth_no_account: "¿No tienes cuenta?", auth_create_account: "Crear cuenta",
  auth_continue: "Continuar", auth_confirm_password: "Confirmar contraseña",
  auth_have_account: "¿Ya tienes cuenta?", auth_sign_in: "Iniciar sesión",
  dash_overview: "Resumen", dash_messages: "Mensajes", dash_profile: "Configuración de perfil", dash_sign_out: "Cerrar sesión",
  common_save: "Guardar", common_cancel: "Cancelar", common_close: "Cerrar",
  common_back: "Volver", common_loading: "Cargando...", common_error: "Error",
  common_send: "Enviar", common_edit: "Editar", common_add: "Agregar", common_or: "o",
  msg_title: "Mensajes",
  msg_subtitle: "Conversaciones privadas — solo visibles para ti y el perfil",
  msg_no_convos: "Aún no hay conversaciones",
  msg_no_convos_sub: "Contacta un perfil para iniciar una conversación privada",
  msg_find_profile: "Encontrar un perfil",
  msg_no_messages: "Aún no hay mensajes",
  msg_placeholder: "Escribe tu mensaje…",
  msg_send_title: "Enviar mensaje",
  msg_sent: "¡Mensaje enviado!",
  msg_sent_sub: "Recibirás una respuesta en tu bandeja de entrada",
  msg_send_new: "Enviar nuevo mensaje",
  msg_login_required: "Inicia sesión para enviar mensajes",
  msg_login_sub: "Los mensajes son 100% anónimos — solo se muestra tu nombre de usuario",
  msg_anonymous: "🔒 100% anónimo — solo se muestra tu nombre de usuario",
  msg_create_free: "Crear cuenta gratis",
  msg_login_link: "Iniciar sesión",
  chat_back: "Volver", chat_no_messages: "Aún no hay mensajes",
  chat_placeholder: "Escribe un mensaje...",
  prof_title: "Mi perfil",
  prof_subtitle: "Solo visible para los perfiles que has contactado",
  prof_avatar: "Foto de perfil", prof_upload: "Subir imagen", prof_upload_hint: "JPG o PNG, máx. 5 MB",
  prof_basic_info: "Información básica", prof_username: "Nombre de usuario *",
  prof_username_note: "Visible en reseñas — no en mensajes",
  prof_username_placeholder: "tu_usuario",
  prof_gender: "Género", prof_age: "Edad", prof_nationality: "Nacionalidad",
  prof_nationality_placeholder: "ej. Español, Polaco...",
  prof_height: "Altura (cm)", prof_weight: "Peso (kg)", prof_smoker: "Fumador",
  prof_tattoos: "Tatuajes", prof_penis_size: "Tamaño del pene", prof_languages: "Idiomas",
  prof_preferences: "Sobre mí y preferencias", prof_bio: "Bio (opcional)",
  prof_bio_placeholder: "Cuéntanos algo sobre ti...",
  prof_kinks_title: "Lo que te excita",
  prof_kink_bio: "Describe lo que te excita (visible para perfiles que contactas)",
  prof_kink_bio_placeholder: "Describe tus preferencias y fantasías...",
  prof_media_title: "Mis fotos y videos", prof_media_sub: "Visibles para perfiles que has contactado",
  prof_media_add: "Agregar", prof_media_hint: "Fotos y videos — máx. 10",
  prof_privacy_note: "⚠️ Reseñas: Si escribes una reseña, tu nombre de usuario se mostrará públicamente.",
  prof_save: "Guardar perfil", prof_saving: "Guardando...", prof_saved: "✓ ¡Perfil guardado!",
  prof_view: "Ver tu perfil", prof_not_disclosed: "No especificado",
  gender_select: "Seleccionar...", gender_male: "Hombre", gender_female: "Mujer", gender_trans: "Trans", gender_other: "Otro",
  smoker_select: "Seleccionar...", smoker_no: "No fumador", smoker_yes: "Fumador", smoker_occasionally: "Ocasionalmente",
  tattoo_select: "Seleccionar...", tattoo_none: "Ninguno", tattoo_few: "Algunos", tattoo_many: "Muchos",
  penis_select: "Seleccionar...", penis_small: "Menos de 14 cm", penis_medium: "14–18 cm", penis_large: "18–22 cm", penis_xlarge: "Más de 22 cm",
  preview_header: "Vista previa — así ven otros tu perfil",
  preview_speaks: "Habla", preview_interests: "Intereses", preview_about: "Sobre mí",
  preview_media: "Fotos y videos", preview_close: "Cerrar", preview_edit: "Editar perfil",
  preview_verified: "Verificado por RedLightAD", preview_created: "Perfil creado",
  preview_anon: "Anónimo", preview_height_label: "cm", preview_weight_label: "peso",
  preview_smoker_label: "fumador", preview_tattoo_label: "tatuajes",
  verified_badge: "✓ Verificado por RedLightAD",
  filter_age_range: "Rango de edad", filter_price_range: "Rango de precio",
  filter_verified_only: "Solo verificados", filter_with_video: "Con video", filter_apply: "Aplicar filtros",
  contact_info: "Contacto",
  contact_phone: "Teléfono",
  contact_show: "Mostrar",
  contact_call: "Llamar",
  profile_info: "Perfil",
  about_me: "Sobre mí",
  watch_videos: "Ver mis vídeos →",
  view_profile: "Ver perfil",
})

// ─────────────────────────────────────────────────────────────────────────────
// Italian
// ─────────────────────────────────────────────────────────────────────────────
const it = makeSimple({
  nav_home: "Home", nav_support: "Supporto", nav_post_ad: "Pubblica annuncio",
  nav_login: "Accedi", nav_create_account: "Crea account",
  nav_dashboard: "Dashboard", nav_my_account: "Il mio account",
  hero_title: "La piattaforma leader per annunci per adulti",
  hero_subtitle: "Connettiti con oltre 5000 utenti attivi in tutto il mondo",
  hero_cta_start: "Inizia", hero_cta_learn: "Scopri di più",
  search_placeholder: "Cerca per città, nome, servizio...",
  filter_all_countries: "Tutti i paesi", filter_all_categories: "Tutte le categorie",
  filter_all_genders: "Tutti", filter_search_btn: "Cerca", filter_clear: "Cancella",
  footer_adults_only: "🔞 Solo adulti — 18+",
  footer_copyright: "© 2026 RedLightAd.com — Tutti i diritti riservati.",
  auth_login_title: "Bentornato", auth_login_subtitle: "Accedi al tuo account",
  auth_login_btn: "Accedi", auth_forgot_password: "Password dimenticata?",
  auth_no_account: "Non hai un account?", auth_create_account: "Crea account",
  auth_continue: "Continua", auth_have_account: "Hai già un account?", auth_sign_in: "Accedi",
  dash_messages: "Messaggi", dash_profile: "Impostazioni profilo", dash_sign_out: "Esci",
  common_save: "Salva", common_cancel: "Annulla", common_close: "Chiudi",
  common_back: "Indietro", common_loading: "Caricamento...", common_error: "Errore",
  common_send: "Invia", common_edit: "Modifica", common_add: "Aggiungi", common_or: "o",
  msg_title: "Messaggi",
  msg_subtitle: "Conversazioni private — visibili solo a te e al profilo",
  msg_no_convos: "Nessuna conversazione ancora",
  msg_no_convos_sub: "Contatta un profilo per avviare una conversazione privata",
  msg_find_profile: "Trova un profilo",
  msg_no_messages: "Nessun messaggio ancora",
  msg_placeholder: "Scrivi il tuo messaggio…",
  msg_send_title: "Invia messaggio",
  msg_sent: "Messaggio inviato!",
  msg_sent_sub: "Riceverai una risposta nella tua casella di posta",
  msg_send_new: "Invia nuovo messaggio",
  msg_login_required: "Accedi per inviare messaggi",
  msg_login_sub: "I messaggi sono 100% anonimi — viene mostrato solo il tuo username",
  msg_anonymous: "🔒 100% anonimo — viene mostrato solo il tuo username",
  msg_create_free: "Crea account gratuito",
  msg_login_link: "Accedi",
  chat_back: "Indietro", chat_no_messages: "Nessun messaggio ancora",
  chat_placeholder: "Scrivi un messaggio...",
  prof_title: "Il mio profilo",
  prof_subtitle: "Visibile solo ai profili che hai contattato",
  prof_avatar: "Foto profilo", prof_upload: "Carica immagine", prof_upload_hint: "JPG o PNG, max 5 MB",
  prof_basic_info: "Informazioni di base", prof_username: "Nome utente *",
  prof_username_note: "Visibile nelle recensioni — non nei messaggi",
  prof_username_placeholder: "tuo_username",
  prof_gender: "Genere", prof_age: "Età", prof_nationality: "Nazionalità",
  prof_nationality_placeholder: "es. Italiano, Polacco...",
  prof_height: "Altezza (cm)", prof_weight: "Peso (kg)", prof_smoker: "Fumatore",
  prof_tattoos: "Tatuaggi", prof_penis_size: "Dimensione del pene",
  prof_languages: "Lingue", prof_preferences: "Su di me e preferenze",
  prof_bio: "Bio (opzionale)", prof_bio_placeholder: "Raccontaci qualcosa di te...",
  prof_kinks_title: "Cosa ti eccita",
  prof_kink_bio: "Descrivi cosa ti eccita (visibile ai profili che contatti)",
  prof_kink_bio_placeholder: "Descrivi le tue preferenze e fantasie...",
  prof_media_title: "Le mie foto e video", prof_media_sub: "Visibili ai profili che hai contattato",
  prof_media_add: "Aggiungi", prof_media_hint: "Foto e video — max 10",
  prof_privacy_note: "⚠️ Recensioni: Se scrivi una recensione, il tuo username sarà mostrato pubblicamente.",
  prof_save: "Salva profilo", prof_saving: "Salvataggio...", prof_saved: "✓ Profilo salvato!",
  prof_view: "Visualizza il tuo profilo", prof_not_disclosed: "Non specificato",
  gender_select: "Seleziona...", gender_male: "Uomo", gender_female: "Donna", gender_trans: "Trans", gender_other: "Altro",
  smoker_select: "Seleziona...", smoker_no: "Non fumatore", smoker_yes: "Fumatore", smoker_occasionally: "Occasionalmente",
  tattoo_select: "Seleziona...", tattoo_none: "Nessuno", tattoo_few: "Qualcuno", tattoo_many: "Molti",
  penis_select: "Seleziona...", penis_small: "Meno di 14 cm", penis_medium: "14–18 cm", penis_large: "18–22 cm", penis_xlarge: "Più di 22 cm",
  preview_header: "Anteprima — come gli altri vedono il tuo profilo",
  preview_speaks: "Parla", preview_interests: "Interessi", preview_about: "Su di me",
  preview_media: "Foto e video", preview_close: "Chiudi", preview_edit: "Modifica profilo",
  preview_verified: "Verificato da RedLightAD", preview_created: "Profilo creato",
  preview_anon: "Anonimo", preview_height_label: "cm", preview_weight_label: "peso",
  preview_smoker_label: "fumatore", preview_tattoo_label: "tatuaggi",
  verified_badge: "✓ Verificato da RedLightAD",
  filter_age_range: "Fascia d'età", filter_price_range: "Fascia di prezzo",
  filter_verified_only: "Solo verificati", filter_with_video: "Con video", filter_apply: "Applica filtri",
  contact_info: "Contatti",
  contact_phone: "Telefono",
  contact_show: "Mostra",
  contact_call: "Chiama",
  profile_info: "Profilo",
  about_me: "Su di me",
  watch_videos: "Guarda i miei video →",
  view_profile: "Vedi profilo",
})

// ─────────────────────────────────────────────────────────────────────────────
// Portuguese
// ─────────────────────────────────────────────────────────────────────────────
const pt = makeSimple({
  nav_home: "Início", nav_support: "Suporte", nav_post_ad: "Publicar anúncio",
  nav_login: "Entrar", nav_create_account: "Criar conta",
  nav_dashboard: "Painel", nav_my_account: "Minha conta",
  hero_title: "A plataforma líder de anúncios para adultos",
  hero_subtitle: "Conecte-se com mais de 5000 usuários ativos em todo o mundo",
  hero_cta_start: "Começar", hero_cta_learn: "Saiba mais",
  search_placeholder: "Buscar por cidade, nome, serviço...",
  filter_all_countries: "Todos os países", filter_all_categories: "Todas as categorias",
  filter_all_genders: "Todos", filter_search_btn: "Buscar", filter_clear: "Limpar",
  footer_adults_only: "🔞 Somente adultos — 18+",
  footer_copyright: "© 2026 RedLightAd.com — Todos os direitos reservados.",
  auth_login_title: "Bem-vindo de volta", auth_login_subtitle: "Entre na sua conta",
  auth_login_btn: "Entrar", auth_forgot_password: "Esqueceu a senha?",
  auth_no_account: "Não tem conta?", auth_create_account: "Criar conta",
  auth_continue: "Continuar", auth_have_account: "Já tem conta?", auth_sign_in: "Entrar",
  dash_messages: "Mensagens", dash_profile: "Configurações do perfil", dash_sign_out: "Sair",
  common_save: "Salvar", common_cancel: "Cancelar", common_close: "Fechar",
  common_back: "Voltar", common_loading: "Carregando...", common_error: "Erro",
  common_send: "Enviar", common_edit: "Editar", common_add: "Adicionar", common_or: "ou",
  msg_title: "Mensagens",
  msg_subtitle: "Conversas privadas — visíveis apenas para você e o perfil",
  msg_no_convos: "Ainda sem conversas",
  msg_no_convos_sub: "Contate um perfil para iniciar uma conversa privada",
  msg_find_profile: "Encontrar um perfil",
  msg_no_messages: "Ainda sem mensagens",
  msg_placeholder: "Escreva sua mensagem…",
  msg_send_title: "Enviar mensagem",
  msg_sent: "Mensagem enviada!",
  msg_sent_sub: "Você receberá uma resposta na sua caixa de entrada",
  msg_send_new: "Enviar nova mensagem",
  msg_login_required: "Entre para enviar mensagens",
  msg_login_sub: "Mensagens são 100% anônimas — apenas seu nome de usuário é exibido",
  msg_anonymous: "🔒 100% anônimo — apenas seu nome de usuário é exibido",
  msg_create_free: "Criar conta grátis",
  msg_login_link: "Entrar",
  chat_back: "Voltar", chat_no_messages: "Ainda sem mensagens",
  chat_placeholder: "Escreva uma mensagem...",
  prof_title: "Meu perfil",
  prof_subtitle: "Visível apenas para os perfis que você contatou",
  prof_avatar: "Foto de perfil", prof_upload: "Enviar imagem", prof_upload_hint: "JPG ou PNG, máx. 5 MB",
  prof_basic_info: "Informações básicas", prof_username: "Nome de usuário *",
  prof_username_note: "Visível em avaliações — não em mensagens",
  prof_username_placeholder: "seu_usuario",
  prof_gender: "Gênero", prof_age: "Idade", prof_nationality: "Nacionalidade",
  prof_nationality_placeholder: "ex. Brasileiro, Polonês...",
  prof_height: "Altura (cm)", prof_weight: "Peso (kg)", prof_smoker: "Fumante",
  prof_tattoos: "Tatuagens", prof_penis_size: "Tamanho do pênis",
  prof_languages: "Idiomas", prof_preferences: "Sobre mim e preferências",
  prof_bio: "Bio (opcional)", prof_bio_placeholder: "Nos conte um pouco sobre você...",
  prof_kinks_title: "O que te excita",
  prof_kink_bio: "Descreva o que te excita (visível para perfis que você contata)",
  prof_kink_bio_placeholder: "Descreva suas preferências e fantasias...",
  prof_media_title: "Minhas fotos e vídeos", prof_media_sub: "Visíveis para perfis que você contatou",
  prof_media_add: "Adicionar", prof_media_hint: "Fotos e vídeos — máx. 10",
  prof_privacy_note: "⚠️ Avaliações: Se você escrever uma avaliação, seu nome de usuário será exibido publicamente.",
  prof_save: "Salvar perfil", prof_saving: "Salvando...", prof_saved: "✓ Perfil salvo!",
  prof_view: "Ver seu perfil", prof_not_disclosed: "Não informado",
  gender_select: "Selecionar...", gender_male: "Homem", gender_female: "Mulher", gender_trans: "Trans", gender_other: "Outro",
  smoker_select: "Selecionar...", smoker_no: "Não fumante", smoker_yes: "Fumante", smoker_occasionally: "Ocasionalmente",
  tattoo_select: "Selecionar...", tattoo_none: "Nenhum", tattoo_few: "Alguns", tattoo_many: "Muitos",
  penis_select: "Selecionar...", penis_small: "Menos de 14 cm", penis_medium: "14–18 cm", penis_large: "18–22 cm", penis_xlarge: "Mais de 22 cm",
  preview_header: "Pré-visualização — como outros veem seu perfil",
  preview_speaks: "Fala", preview_interests: "Interesses", preview_about: "Sobre mim",
  preview_media: "Fotos e vídeos", preview_close: "Fechar", preview_edit: "Editar perfil",
  preview_verified: "Verificado pelo RedLightAD", preview_created: "Perfil criado",
  preview_anon: "Anônimo", preview_height_label: "cm", preview_weight_label: "peso",
  preview_smoker_label: "fumante", preview_tattoo_label: "tatuagens",
  verified_badge: "✓ Verificado pelo RedLightAD",
  filter_age_range: "Faixa etária", filter_price_range: "Faixa de preço",
  filter_verified_only: "Apenas verificados", filter_with_video: "Com vídeo", filter_apply: "Aplicar filtros",
  contact_info: "Contato",
  contact_phone: "Telefone",
  contact_show: "Mostrar",
  contact_call: "Ligar",
  profile_info: "Perfil",
  about_me: "Sobre mim",
  watch_videos: "Ver meus vídeos →",
  view_profile: "Ver perfil",
})

// ─────────────────────────────────────────────────────────────────────────────
// Dutch
// ─────────────────────────────────────────────────────────────────────────────
const nl = makeSimple({
  nav_home: "Home", nav_support: "Support", nav_post_ad: "Advertentie plaatsen",
  nav_login: "Inloggen", nav_create_account: "Account aanmaken",
  nav_dashboard: "Dashboard", nav_my_account: "Mijn account",
  hero_title: "Het toonaangevende volwassen advertentieplatform",
  hero_subtitle: "Verbind met 5000+ actieve gebruikers wereldwijd",
  hero_cta_start: "Aan de slag", hero_cta_learn: "Meer info",
  search_placeholder: "Zoek op stad, naam, service...",
  filter_all_countries: "Alle landen", filter_all_categories: "Alle categorieën",
  filter_all_genders: "Alle", filter_search_btn: "Zoeken", filter_clear: "Wissen",
  footer_adults_only: "🔞 Alleen volwassenen — 18+",
  footer_copyright: "© 2026 RedLightAd.com — Alle rechten voorbehouden.",
  auth_login_title: "Welkom terug", auth_login_subtitle: "Log in op je account",
  auth_login_btn: "Inloggen", auth_forgot_password: "Wachtwoord vergeten?",
  auth_no_account: "Geen account?", auth_create_account: "Account aanmaken",
  auth_continue: "Doorgaan", auth_have_account: "Al een account?", auth_sign_in: "Inloggen",
  dash_messages: "Berichten", dash_profile: "Profielinstellingen", dash_sign_out: "Uitloggen",
  common_save: "Opslaan", common_cancel: "Annuleren", common_close: "Sluiten",
  common_back: "Terug", common_loading: "Laden...", common_error: "Fout",
  common_send: "Verzenden", common_edit: "Bewerken", common_add: "Toevoegen", common_or: "of",
  msg_title: "Berichten",
  msg_subtitle: "Privégesprekken — alleen zichtbaar voor jou en het profiel",
  msg_no_convos: "Nog geen gesprekken",
  msg_no_convos_sub: "Neem contact op met een profiel om een privégesprek te starten",
  msg_find_profile: "Profiel vinden",
  msg_no_messages: "Nog geen berichten",
  msg_placeholder: "Schrijf je bericht…",
  msg_send_title: "Bericht sturen",
  msg_sent: "Bericht verzonden!",
  msg_sent_sub: "Je ontvangt een antwoord in je inbox",
  msg_send_new: "Nieuw bericht sturen",
  msg_login_required: "Log in om berichten te sturen",
  msg_login_sub: "Platformberichten zijn 100% anoniem — alleen je gebruikersnaam wordt getoond",
  msg_anonymous: "🔒 100% anoniem — alleen je gebruikersnaam wordt getoond",
  msg_create_free: "Gratis account aanmaken",
  msg_login_link: "Inloggen",
  chat_back: "Terug", chat_no_messages: "Nog geen berichten",
  chat_placeholder: "Schrijf een bericht...",
  prof_title: "Mijn profiel",
  prof_subtitle: "Alleen zichtbaar voor profielen die je hebt gecontacteerd",
  prof_avatar: "Profielfoto", prof_upload: "Afbeelding uploaden", prof_upload_hint: "JPG of PNG, max. 5 MB",
  prof_basic_info: "Basisinformatie", prof_username: "Gebruikersnaam *",
  prof_username_note: "Zichtbaar bij beoordelingen — niet in berichten",
  prof_username_placeholder: "jouw_gebruikersnaam",
  prof_gender: "Geslacht", prof_age: "Leeftijd", prof_nationality: "Nationaliteit",
  prof_nationality_placeholder: "bijv. Nederlands, Pools...",
  prof_height: "Lengte (cm)", prof_weight: "Gewicht (kg)", prof_smoker: "Roker",
  prof_tattoos: "Tatoeages", prof_penis_size: "Penisgrootte",
  prof_languages: "Talen", prof_preferences: "Over mij & voorkeuren",
  prof_bio: "Bio (optioneel)", prof_bio_placeholder: "Vertel iets over jezelf...",
  prof_kinks_title: "Wat jou opwindt",
  prof_kink_bio: "Beschrijf wat jou opwindt (zichtbaar voor profielen die je contacteert)",
  prof_kink_bio_placeholder: "Beschrijf je voorkeuren en fantasieën...",
  prof_media_title: "Mijn foto's en video's", prof_media_sub: "Zichtbaar voor profielen die je hebt gecontacteerd",
  prof_media_add: "Toevoegen", prof_media_hint: "Foto's en video's — max. 10",
  prof_privacy_note: "⚠️ Beoordelingen: Als je een beoordeling schrijft, wordt je gebruikersnaam openbaar weergegeven.",
  prof_save: "Profiel opslaan", prof_saving: "Opslaan...", prof_saved: "✓ Profiel opgeslagen!",
  prof_view: "Bekijk jouw profiel", prof_not_disclosed: "Niet vermeld",
  gender_select: "Selecteren...", gender_male: "Man", gender_female: "Vrouw", gender_trans: "Trans", gender_other: "Anders",
  smoker_select: "Selecteren...", smoker_no: "Niet-roker", smoker_yes: "Roker", smoker_occasionally: "Soms",
  tattoo_select: "Selecteren...", tattoo_none: "Geen", tattoo_few: "Enkele", tattoo_many: "Veel",
  penis_select: "Selecteren...", penis_small: "Onder 14 cm", penis_medium: "14–18 cm", penis_large: "18–22 cm", penis_xlarge: "Boven 22 cm",
  preview_header: "Voorbeeld — zo zien anderen jouw profiel",
  preview_speaks: "Spreekt", preview_interests: "Interesses", preview_about: "Over mij",
  preview_media: "Foto's en video's", preview_close: "Sluiten", preview_edit: "Profiel bewerken",
  preview_verified: "Geverifieerd door RedLightAD", preview_created: "Profiel aangemaakt",
  preview_anon: "Anoniem", preview_height_label: "cm lang", preview_weight_label: "gewicht",
  preview_smoker_label: "roker", preview_tattoo_label: "tatoeages",
  verified_badge: "✓ Geverifieerd door RedLightAD",
  filter_age_range: "Leeftijdsgroep", filter_price_range: "Prijsbereik",
  filter_verified_only: "Alleen geverifieerd", filter_with_video: "Met video", filter_apply: "Filters toepassen",
  contact_info: "Contact",
  contact_phone: "Telefoon",
  contact_show: "Tonen",
  contact_call: "Bellen",
  profile_info: "Profiel",
  about_me: "Over mij",
  watch_videos: "Mijn video's →",
  view_profile: "Profiel bekijken",
})

// ─────────────────────────────────────────────────────────────────────────────
// Swedish
// ─────────────────────────────────────────────────────────────────────────────
const sv = makeSimple({
  nav_home: "Hem", nav_support: "Support", nav_post_ad: "Lägg upp annons",
  nav_login: "Logga in", nav_create_account: "Skapa konto",
  nav_dashboard: "Instrumentpanel", nav_my_account: "Mitt konto",
  hero_title: "Den ledande plattformen för vuxenannonser",
  hero_subtitle: "Anslut med 5000+ aktiva användare världen över",
  hero_cta_start: "Kom igång", hero_cta_learn: "Läs mer",
  search_placeholder: "Sök på stad, namn, tjänst...",
  filter_all_countries: "Alla länder", filter_all_categories: "Alla kategorier",
  filter_all_genders: "Alla", filter_search_btn: "Sök", filter_clear: "Rensa",
  footer_adults_only: "🔞 Endast vuxna — 18+",
  footer_copyright: "© 2026 RedLightAd.com — Alla rättigheter förbehållna.",
  auth_login_title: "Välkommen tillbaka", auth_login_subtitle: "Logga in på ditt konto",
  auth_login_btn: "Logga in", auth_forgot_password: "Glömt lösenord?",
  auth_no_account: "Har du inget konto?", auth_create_account: "Skapa konto",
  auth_continue: "Fortsätt", auth_have_account: "Har du redan ett konto?", auth_sign_in: "Logga in",
  dash_messages: "Meddelanden", dash_profile: "Profilinställningar", dash_sign_out: "Logga ut",
  common_save: "Spara", common_cancel: "Avbryt", common_close: "Stäng",
  common_back: "Tillbaka", common_loading: "Laddar...", common_error: "Fel",
  common_send: "Skicka", common_edit: "Redigera", common_add: "Lägg till", common_or: "eller",
  msg_title: "Meddelanden",
  msg_subtitle: "Privata konversationer — synliga bara för dig och profilen",
  msg_no_convos: "Inga konversationer ännu",
  msg_no_convos_sub: "Kontakta en profil för att starta en privat konversation",
  msg_find_profile: "Hitta en profil",
  msg_no_messages: "Inga meddelanden ännu",
  msg_placeholder: "Skriv ditt meddelande…",
  msg_send_title: "Skicka meddelande",
  msg_sent: "Meddelande skickat!",
  msg_sent_sub: "Du får svar i din inkorg",
  msg_send_new: "Skicka nytt meddelande",
  msg_login_required: "Logga in för att skicka meddelanden",
  msg_login_sub: "Plattformsmeddelanden är 100% anonyma — bara ditt användarnamn visas",
  msg_anonymous: "🔒 100% anonymt — bara ditt användarnamn visas",
  msg_create_free: "Skapa gratis konto",
  msg_login_link: "Logga in",
  chat_back: "Tillbaka", chat_no_messages: "Inga meddelanden ännu",
  chat_placeholder: "Skriv ett meddelande...",
  prof_title: "Min profil",
  prof_subtitle: "Synlig bara för profiler du har kontaktat",
  prof_avatar: "Profilbild", prof_upload: "Ladda upp bild", prof_upload_hint: "JPG eller PNG, max 5 MB",
  prof_basic_info: "Grundinformation", prof_username: "Användarnamn *",
  prof_username_note: "Synligt i recensioner — inte i meddelanden",
  prof_username_placeholder: "ditt_användarnamn",
  prof_gender: "Kön", prof_age: "Ålder", prof_nationality: "Nationalitet",
  prof_nationality_placeholder: "t.ex. Svensk, Polsk...",
  prof_height: "Längd (cm)", prof_weight: "Vikt (kg)", prof_smoker: "Rökare",
  prof_tattoos: "Tatueringar", prof_penis_size: "Penisstorlek",
  prof_languages: "Språk", prof_preferences: "Om mig & preferenser",
  prof_bio: "Bio (valfritt)", prof_bio_placeholder: "Berätta lite om dig själv...",
  prof_kinks_title: "Vad tänder dig",
  prof_kink_bio: "Beskriv vad som tänder dig (synligt för profiler du kontaktar)",
  prof_kink_bio_placeholder: "Beskriv dina preferenser och fantasier...",
  prof_media_title: "Mina foton och videor", prof_media_sub: "Synliga för profiler du har kontaktat",
  prof_media_add: "Lägg till", prof_media_hint: "Foton och videor — max 10",
  prof_privacy_note: "⚠️ Recensioner: Om du skriver en recension visas ditt användarnamn offentligt.",
  prof_save: "Spara profil", prof_saving: "Sparar...", prof_saved: "✓ Profil sparad!",
  prof_view: "Visa din profil", prof_not_disclosed: "Ej angett",
  gender_select: "Välj...", gender_male: "Man", gender_female: "Kvinna", gender_trans: "Trans", gender_other: "Annat",
  smoker_select: "Välj...", smoker_no: "Icke-rökare", smoker_yes: "Rökare", smoker_occasionally: "Ibland",
  tattoo_select: "Välj...", tattoo_none: "Inga", tattoo_few: "Några", tattoo_many: "Många",
  penis_select: "Välj...", penis_small: "Under 14 cm", penis_medium: "14–18 cm", penis_large: "18–22 cm", penis_xlarge: "Över 22 cm",
  preview_header: "Förhandsgranskning — så ser andra din profil",
  preview_speaks: "Talar", preview_interests: "Intressen", preview_about: "Om mig",
  preview_media: "Foton och videor", preview_close: "Stäng", preview_edit: "Redigera profil",
  preview_verified: "Verifierad av RedLightAD", preview_created: "Profil skapad",
  preview_anon: "Anonym", preview_height_label: "cm lång", preview_weight_label: "vikt",
  preview_smoker_label: "rökare", preview_tattoo_label: "tatueringar",
  verified_badge: "✓ Verifierad av RedLightAD",
  filter_age_range: "Åldersgrupp", filter_price_range: "Prisintervall",
  filter_verified_only: "Endast verifierade", filter_with_video: "Med video", filter_apply: "Tillämpa filter",
  contact_info: "Kontaktinfo",
  contact_phone: "Telefon",
  contact_show: "Visa",
  contact_call: "Ring",
  profile_info: "Profilinfo",
  about_me: "Om mig",
  watch_videos: "Se videor →",
  view_profile: "Se profil",
})

// ─────────────────────────────────────────────────────────────────────────────
// Norwegian
// ─────────────────────────────────────────────────────────────────────────────
const no = makeSimple({
  nav_home: "Hjem", nav_support: "Support", nav_post_ad: "Legg ut annonse",
  nav_login: "Logg inn", nav_create_account: "Opprett konto",
  nav_dashboard: "Instrumentbord", nav_my_account: "Min konto",
  hero_title: "Den ledende plattformen for voksne annonser",
  hero_subtitle: "Koble til 5000+ aktive brukere verden over",
  hero_cta_start: "Kom i gang", hero_cta_learn: "Les mer",
  search_placeholder: "Søk etter by, navn, tjeneste...",
  filter_all_countries: "Alle land", filter_all_categories: "Alle kategorier",
  filter_all_genders: "Alle", filter_search_btn: "Søk", filter_clear: "Tøm",
  footer_adults_only: "🔞 Kun voksne — 18+",
  footer_copyright: "© 2026 RedLightAd.com — Alle rettigheter forbeholdt.",
  auth_login_title: "Velkommen tilbake", auth_login_subtitle: "Logg inn på kontoen din",
  auth_login_btn: "Logg inn", auth_forgot_password: "Glemt passord?",
  auth_no_account: "Har du ikke konto?", auth_create_account: "Opprett konto",
  auth_continue: "Fortsett", auth_have_account: "Har du allerede konto?", auth_sign_in: "Logg inn",
  dash_messages: "Meldinger", dash_profile: "Profilinnstillinger", dash_sign_out: "Logg ut",
  common_save: "Lagre", common_cancel: "Avbryt", common_close: "Lukk",
  common_back: "Tilbake", common_loading: "Laster...", common_error: "Feil",
  common_send: "Send", common_edit: "Rediger", common_add: "Legg til", common_or: "eller",
  msg_title: "Meldinger",
  msg_subtitle: "Private samtaler — bare synlige for deg og profilen",
  msg_no_convos: "Ingen samtaler ennå",
  msg_no_convos_sub: "Kontakt en profil for å starte en privat samtale",
  msg_find_profile: "Finn en profil",
  msg_no_messages: "Ingen meldinger ennå",
  msg_placeholder: "Skriv meldingen din…",
  msg_send_title: "Send melding",
  msg_sent: "Melding sendt!",
  msg_sent_sub: "Du vil motta svar i innboksen din",
  msg_send_new: "Send ny melding",
  msg_login_required: "Logg inn for å sende meldinger",
  msg_login_sub: "Plattformmeldinger er 100% anonyme — bare brukernavnet ditt vises",
  msg_anonymous: "🔒 100% anonymt — bare brukernavnet ditt vises",
  msg_create_free: "Opprett gratis konto",
  msg_login_link: "Logg inn",
  chat_back: "Tilbake", chat_no_messages: "Ingen meldinger ennå",
  chat_placeholder: "Skriv en melding...",
  prof_title: "Min profil",
  prof_subtitle: "Bare synlig for profiler du har kontaktet",
  prof_avatar: "Profilbilde", prof_upload: "Last opp bilde", prof_upload_hint: "JPG eller PNG, maks 5 MB",
  prof_basic_info: "Grunnleggende info", prof_username: "Brukernavn *",
  prof_username_note: "Synlig i anmeldelser — ikke i meldinger",
  prof_username_placeholder: "ditt_brukernavn",
  prof_gender: "Kjønn", prof_age: "Alder", prof_nationality: "Nasjonalitet",
  prof_nationality_placeholder: "f.eks. Norsk, Polsk...",
  prof_height: "Høyde (cm)", prof_weight: "Vekt (kg)", prof_smoker: "Røyker",
  prof_tattoos: "Tatoveringer", prof_penis_size: "Penisstørrelse",
  prof_languages: "Språk", prof_preferences: "Om meg & preferanser",
  prof_bio: "Bio (valgfritt)", prof_bio_placeholder: "Fortell litt om deg selv...",
  prof_kinks_title: "Hva tent du på",
  prof_kink_bio: "Beskriv hva som tenner deg (synlig for profiler du kontakter)",
  prof_kink_bio_placeholder: "Beskriv dine preferanser og fantasier...",
  prof_media_title: "Mine bilder og videoer", prof_media_sub: "Synlige for profiler du har kontaktet",
  prof_media_add: "Legg til", prof_media_hint: "Bilder og videoer — maks 10",
  prof_privacy_note: "⚠️ Anmeldelser: Hvis du skriver en anmeldelse, vises brukernavnet ditt offentlig.",
  prof_save: "Lagre profil", prof_saving: "Lagrer...", prof_saved: "✓ Profil lagret!",
  prof_view: "Vis din profil", prof_not_disclosed: "Ikke oppgitt",
  gender_select: "Velg...", gender_male: "Mann", gender_female: "Dame", gender_trans: "Trans", gender_other: "Annet",
  smoker_select: "Velg...", smoker_no: "Ikke-røyker", smoker_yes: "Røyker", smoker_occasionally: "Av og til",
  tattoo_select: "Velg...", tattoo_none: "Ingen", tattoo_few: "Noen", tattoo_many: "Mange",
  penis_select: "Velg...", penis_small: "Under 14 cm", penis_medium: "14–18 cm", penis_large: "18–22 cm", penis_xlarge: "Over 22 cm",
  preview_header: "Forhåndsvisning — slik ser andre profilen din",
  preview_speaks: "Snakker", preview_interests: "Interesser", preview_about: "Om meg",
  preview_media: "Bilder og videoer", preview_close: "Lukk", preview_edit: "Rediger profil",
  preview_verified: "Verifisert av RedLightAD", preview_created: "Profil opprettet",
  preview_anon: "Anonym", preview_height_label: "cm høy", preview_weight_label: "vekt",
  preview_smoker_label: "røyker", preview_tattoo_label: "tatoveringer",
  verified_badge: "✓ Verifisert av RedLightAD",
  filter_age_range: "Aldersgruppe", filter_price_range: "Prisintervall",
  filter_verified_only: "Kun verifiserte", filter_with_video: "Med video", filter_apply: "Bruk filtre",
  contact_info: "Kontaktinfo",
  contact_phone: "Telefon",
  contact_show: "Vis",
  contact_call: "Ring",
  profile_info: "Profilinfo",
  about_me: "Om meg",
  watch_videos: "Se videoer →",
  view_profile: "Se profil",
})

// ─────────────────────────────────────────────────────────────────────────────
// Arabic (RTL)
// ─────────────────────────────────────────────────────────────────────────────
const ar = makeSimple({
  nav_home: "الرئيسية", nav_support: "الدعم", nav_post_ad: "نشر إعلان",
  nav_login: "تسجيل الدخول", nav_create_account: "إنشاء حساب",
  nav_dashboard: "لوحة التحكم", nav_my_account: "حسابي",
  hero_title: "المنصة الرائدة للإعلانات للبالغين",
  hero_subtitle: "تواصل مع أكثر من 5000 مستخدم نشط حول العالم",
  hero_cta_start: "ابدأ الآن", hero_cta_learn: "اعرف المزيد",
  search_placeholder: "ابحث بالمدينة أو الاسم أو الخدمة...",
  filter_all_countries: "جميع الدول", filter_all_categories: "جميع الفئات",
  filter_all_genders: "الكل", filter_search_btn: "بحث", filter_clear: "مسح",
  footer_adults_only: "🔞 للبالغين فقط — +18",
  footer_copyright: "© 2026 RedLightAd.com — جميع الحقوق محفوظة.",
  auth_login_title: "مرحباً بعودتك", auth_login_subtitle: "سجّل الدخول إلى حسابك",
  auth_email: "البريد الإلكتروني", auth_password: "كلمة المرور",
  auth_forgot_password: "نسيت كلمة المرور؟",
  auth_login_btn: "تسجيل الدخول", auth_no_account: "ليس لديك حساب؟", auth_create_account: "إنشاء حساب",
  auth_continue: "متابعة", auth_have_account: "لديك حساب بالفعل؟", auth_sign_in: "تسجيل الدخول",
  dash_messages: "الرسائل", dash_profile: "إعدادات الملف الشخصي", dash_sign_out: "تسجيل الخروج",
  common_save: "حفظ", common_cancel: "إلغاء", common_close: "إغلاق",
  common_back: "رجوع", common_loading: "جارٍ التحميل...", common_error: "خطأ",
  common_send: "إرسال", common_edit: "تعديل", common_add: "إضافة", common_or: "أو",
  msg_title: "الرسائل",
  msg_subtitle: "محادثات خاصة — مرئية فقط لك وللملف الشخصي",
  msg_no_convos: "لا توجد محادثات بعد",
  msg_no_convos_sub: "تواصل مع ملف شخصي لبدء محادثة خاصة",
  msg_find_profile: "ابحث عن ملف شخصي",
  msg_no_messages: "لا توجد رسائل بعد",
  msg_placeholder: "اكتب رسالتك…",
  msg_send_title: "إرسال رسالة",
  msg_sent: "تم إرسال الرسالة!",
  msg_sent_sub: "ستتلقى ردًّا في صندوق الوارد",
  msg_send_new: "إرسال رسالة جديدة",
  msg_login_required: "سجّل الدخول لإرسال الرسائل",
  msg_login_sub: "رسائل المنصة مجهولة 100% — يُعرض اسم المستخدم فقط",
  msg_anonymous: "🔒 مجهول 100% — يُعرض اسم المستخدم فقط",
  msg_create_free: "إنشاء حساب مجاني",
  msg_login_link: "تسجيل الدخول",
  chat_back: "رجوع", chat_no_messages: "لا توجد رسائل بعد",
  chat_placeholder: "اكتب رسالة...",
  prof_title: "ملفي الشخصي",
  prof_subtitle: "مرئي فقط للملفات الشخصية التي تواصلت معها",
  prof_avatar: "صورة الملف الشخصي", prof_upload: "رفع صورة", prof_upload_hint: "JPG أو PNG، بحد أقصى 5 MB",
  prof_basic_info: "المعلومات الأساسية", prof_username: "اسم المستخدم *",
  prof_username_note: "مرئي في التقييمات — ليس في الرسائل",
  prof_username_placeholder: "اسم_المستخدم",
  prof_gender: "الجنس", prof_age: "العمر", prof_nationality: "الجنسية",
  prof_nationality_placeholder: "مثال: سعودي، مصري...",
  prof_height: "الطول (سم)", prof_weight: "الوزن (كغ)", prof_smoker: "مدخّن",
  prof_tattoos: "الوشوم", prof_penis_size: "حجم القضيب",
  prof_languages: "اللغات", prof_preferences: "عني وتفضيلاتي",
  prof_bio: "نبذة (اختياري)", prof_bio_placeholder: "أخبرنا قليلاً عن نفسك...",
  prof_kinks_title: "ما يثيرك",
  prof_kink_bio: "صف ما يثيرك (مرئي للملفات الشخصية التي تتواصل معها)",
  prof_kink_bio_placeholder: "صف تفضيلاتك وخيالاتك...",
  prof_media_title: "صوري ومقاطع الفيديو", prof_media_sub: "مرئية للملفات الشخصية التي تواصلت معها",
  prof_media_add: "إضافة", prof_media_hint: "صور ومقاطع فيديو — بحد أقصى 10",
  prof_privacy_note: "⚠️ التقييمات: إذا كتبت تقييمًا، سيُعرض اسم المستخدم علنًا.",
  prof_save: "حفظ الملف الشخصي", prof_saving: "جارٍ الحفظ...", prof_saved: "✓ تم حفظ الملف الشخصي!",
  prof_view: "عرض ملفك الشخصي", prof_not_disclosed: "غير مُحدد",
  gender_select: "اختر...", gender_male: "ذكر", gender_female: "أنثى", gender_trans: "ترانس", gender_other: "آخر",
  smoker_select: "اختر...", smoker_no: "غير مدخّن", smoker_yes: "مدخّن", smoker_occasionally: "أحيانًا",
  tattoo_select: "اختر...", tattoo_none: "لا يوجد", tattoo_few: "بعض", tattoo_many: "كثير",
  penis_select: "اختر...", penis_small: "أقل من 14 سم", penis_medium: "14–18 سم", penis_large: "18–22 سم", penis_xlarge: "أكثر من 22 سم",
  preview_header: "معاينة — هكذا يرى الآخرون ملفك الشخصي",
  preview_speaks: "يتحدث", preview_interests: "الاهتمامات", preview_about: "عني",
  preview_media: "الصور والفيديو", preview_close: "إغلاق", preview_edit: "تعديل الملف",
  preview_verified: "موثّق من RedLightAD", preview_created: "أُنشئ الملف الشخصي",
  preview_anon: "مجهول", preview_height_label: "سم", preview_weight_label: "الوزن",
  preview_smoker_label: "مدخّن", preview_tattoo_label: "وشوم",
  verified_badge: "✓ موثّق من RedLightAD",
  filter_age_range: "الفئة العمرية", filter_price_range: "نطاق السعر",
  filter_verified_only: "الموثّقون فقط", filter_with_video: "مع فيديو", filter_apply: "تطبيق الفلاتر",
  contact_info: "معلومات الاتصال",
  contact_phone: "هاتف",
  contact_show: "إظهار",
  contact_call: "اتصال",
  profile_info: "معلومات الملف",
  about_me: "عني",
  watch_videos: "شاهد مقاطع الفيديو →",
  view_profile: "عرض الملف",
})

// ─────────────────────────────────────────────────────────────────────────────
// Thai
// ─────────────────────────────────────────────────────────────────────────────
const th = makeSimple({
  nav_home: "หน้าหลัก", nav_support: "ช่วยเหลือ", nav_post_ad: "ลงโฆษณา",
  nav_login: "เข้าสู่ระบบ", nav_create_account: "สร้างบัญชี",
  nav_dashboard: "แดชบอร์ด", nav_my_account: "บัญชีของฉัน",
  hero_title: "แพลตฟอร์มโฆษณาผู้ใหญ่ชั้นนำ",
  hero_subtitle: "เชื่อมต่อกับผู้ใช้งานมากกว่า 5,000 รายทั่วโลก",
  hero_cta_start: "เริ่มต้น", hero_cta_learn: "เรียนรู้เพิ่มเติม",
  search_placeholder: "ค้นหาโดยเมือง ชื่อ บริการ...",
  filter_all_countries: "ทุกประเทศ", filter_all_categories: "ทุกหมวดหมู่",
  filter_all_genders: "ทั้งหมด", filter_search_btn: "ค้นหา", filter_clear: "ล้าง",
  footer_adults_only: "🔞 สำหรับผู้ใหญ่เท่านั้น — 18+",
  footer_copyright: "© 2026 RedLightAd.com — สงวนลิขสิทธิ์ทั้งหมด",
  auth_login_title: "ยินดีต้อนรับกลับ", auth_login_subtitle: "เข้าสู่บัญชีของคุณ",
  auth_login_btn: "เข้าสู่ระบบ", auth_forgot_password: "ลืมรหัสผ่าน?",
  auth_no_account: "ยังไม่มีบัญชี?", auth_create_account: "สร้างบัญชี",
  auth_continue: "ต่อไป", auth_have_account: "มีบัญชีอยู่แล้ว?", auth_sign_in: "เข้าสู่ระบบ",
  dash_messages: "ข้อความ", dash_profile: "ตั้งค่าโปรไฟล์", dash_sign_out: "ออกจากระบบ",
  common_save: "บันทึก", common_cancel: "ยกเลิก", common_close: "ปิด",
  common_back: "กลับ", common_loading: "กำลังโหลด...", common_error: "ข้อผิดพลาด",
  common_send: "ส่ง", common_edit: "แก้ไข", common_add: "เพิ่ม", common_or: "หรือ",
  msg_title: "ข้อความ",
  msg_subtitle: "การสนทนาส่วนตัว — มองเห็นได้เฉพาะคุณและโปรไฟล์",
  msg_no_convos: "ยังไม่มีการสนทนา",
  msg_no_convos_sub: "ติดต่อโปรไฟล์เพื่อเริ่มการสนทนาส่วนตัว",
  msg_find_profile: "ค้นหาโปรไฟล์",
  msg_no_messages: "ยังไม่มีข้อความ",
  msg_placeholder: "เขียนข้อความของคุณ…",
  msg_send_title: "ส่งข้อความ",
  msg_sent: "ส่งข้อความแล้ว!",
  msg_sent_sub: "คุณจะได้รับการตอบกลับในกล่องข้อความ",
  msg_send_new: "ส่งข้อความใหม่",
  msg_login_required: "เข้าสู่ระบบเพื่อส่งข้อความ",
  msg_login_sub: "ข้อความในแพลตฟอร์มไม่ระบุชื่อ 100% — แสดงเพียงชื่อผู้ใช้ของคุณ",
  msg_anonymous: "🔒 ไม่ระบุชื่อ 100% — แสดงเพียงชื่อผู้ใช้ของคุณ",
  msg_create_free: "สร้างบัญชีฟรี",
  msg_login_link: "เข้าสู่ระบบ",
  chat_back: "กลับ", chat_no_messages: "ยังไม่มีข้อความ",
  chat_placeholder: "เขียนข้อความ...",
  prof_title: "โปรไฟล์ของฉัน",
  prof_subtitle: "มองเห็นได้เฉพาะโปรไฟล์ที่คุณติดต่อ",
  prof_avatar: "รูปโปรไฟล์", prof_upload: "อัปโหลดรูปภาพ", prof_upload_hint: "JPG หรือ PNG สูงสุด 5 MB",
  prof_basic_info: "ข้อมูลพื้นฐาน", prof_username: "ชื่อผู้ใช้ *",
  prof_username_note: "แสดงในรีวิว — ไม่แสดงในข้อความ",
  prof_username_placeholder: "ชื่อผู้ใช้_ของคุณ",
  prof_gender: "เพศ", prof_age: "อายุ", prof_nationality: "สัญชาติ",
  prof_nationality_placeholder: "เช่น ไทย โปแลนด์...",
  prof_height: "ส่วนสูง (ซม.)", prof_weight: "น้ำหนัก (กก.)", prof_smoker: "สูบบุหรี่",
  prof_tattoos: "รอยสัก", prof_penis_size: "ขนาดอวัยวะเพศ",
  prof_languages: "ภาษา", prof_preferences: "เกี่ยวกับฉัน & ความชอบ",
  prof_bio: "ประวัติย่อ (ไม่บังคับ)", prof_bio_placeholder: "เล่าเรื่องราวของคุณสักเล็กน้อย...",
  prof_kinks_title: "สิ่งที่คุณชื่นชอบ",
  prof_kink_bio: "อธิบายสิ่งที่คุณชื่นชอบ (มองเห็นได้สำหรับโปรไฟล์ที่คุณติดต่อ)",
  prof_kink_bio_placeholder: "อธิบายความชอบและจินตนาการของคุณ...",
  prof_media_title: "รูปภาพและวิดีโอของฉัน", prof_media_sub: "มองเห็นได้สำหรับโปรไฟล์ที่คุณติดต่อ",
  prof_media_add: "เพิ่ม", prof_media_hint: "รูปภาพและวิดีโอ — สูงสุด 10",
  prof_privacy_note: "⚠️ รีวิว: หากคุณเขียนรีวิว ชื่อผู้ใช้จะแสดงต่อสาธารณะ",
  prof_save: "บันทึกโปรไฟล์", prof_saving: "กำลังบันทึก...", prof_saved: "✓ บันทึกโปรไฟล์แล้ว!",
  prof_view: "ดูโปรไฟล์ของคุณ", prof_not_disclosed: "ไม่ระบุ",
  gender_select: "เลือก...", gender_male: "ชาย", gender_female: "หญิง", gender_trans: "ทรานส์", gender_other: "อื่นๆ",
  smoker_select: "เลือก...", smoker_no: "ไม่สูบบุหรี่", smoker_yes: "สูบบุหรี่", smoker_occasionally: "บางครั้ง",
  tattoo_select: "เลือก...", tattoo_none: "ไม่มี", tattoo_few: "บางส่วน", tattoo_many: "มาก",
  penis_select: "เลือก...", penis_small: "น้อยกว่า 14 ซม.", penis_medium: "14–18 ซม.", penis_large: "18–22 ซม.", penis_xlarge: "มากกว่า 22 ซม.",
  preview_header: "ตัวอย่าง — นี่คือวิธีที่คนอื่นเห็นโปรไฟล์ของคุณ",
  preview_speaks: "พูด", preview_interests: "ความสนใจ", preview_about: "เกี่ยวกับฉัน",
  preview_media: "รูปภาพและวิดีโอ", preview_close: "ปิด", preview_edit: "แก้ไขโปรไฟล์",
  preview_verified: "ยืนยันโดย RedLightAD", preview_created: "สร้างโปรไฟล์",
  preview_anon: "ไม่ระบุชื่อ", preview_height_label: "ซม.", preview_weight_label: "น้ำหนัก",
  preview_smoker_label: "สูบบุหรี่", preview_tattoo_label: "รอยสัก",
  verified_badge: "✓ ยืนยันโดย RedLightAD",
  filter_age_range: "ช่วงอายุ", filter_price_range: "ช่วงราคา",
  filter_verified_only: "เฉพาะที่ยืนยันแล้ว", filter_with_video: "มีวิดีโอ", filter_apply: "ใช้ตัวกรอง",
  contact_info: "ข้อมูลติดต่อ",
  contact_phone: "โทรศัพท์",
  contact_show: "แสดง",
  contact_call: "โทร",
  profile_info: "ข้อมูลโปรไฟล์",
  about_me: "เกี่ยวกับฉัน",
  watch_videos: "ดูวิดีโอของฉัน →",
  view_profile: "ดูโปรไฟล์",
})

// ─────────────────────────────────────────────────────────────────────────────
// Russian
// ─────────────────────────────────────────────────────────────────────────────
const ru = makeSimple({
  nav_home: "Главная", nav_support: "Поддержка", nav_post_ad: "Разместить объявление",
  nav_login: "Войти", nav_create_account: "Создать аккаунт",
  nav_dashboard: "Панель управления", nav_my_account: "Мой аккаунт",
  hero_title: "Ведущая платформа объявлений для взрослых",
  hero_subtitle: "Связывайтесь с 5000+ активными пользователями по всему миру",
  hero_cta_start: "Начать", hero_cta_learn: "Узнать больше",
  search_placeholder: "Поиск по городу, имени, услуге...",
  filter_all_countries: "Все страны", filter_all_categories: "Все категории",
  filter_all_genders: "Все", filter_search_btn: "Поиск", filter_clear: "Очистить",
  footer_adults_only: "🔞 Только для взрослых — 18+",
  footer_copyright: "© 2026 RedLightAd.com — Все права защищены.",
  auth_login_title: "С возвращением", auth_login_subtitle: "Войдите в свой аккаунт",
  auth_email: "Эл. почта", auth_password: "Пароль",
  auth_forgot_password: "Забыли пароль?",
  auth_login_btn: "Войти", auth_no_account: "Нет аккаунта?", auth_create_account: "Создать аккаунт",
  auth_continue: "Продолжить", auth_have_account: "Уже есть аккаунт?", auth_sign_in: "Войти",
  dash_messages: "Сообщения", dash_profile: "Настройки профиля", dash_sign_out: "Выйти",
  common_save: "Сохранить", common_cancel: "Отмена", common_close: "Закрыть",
  common_back: "Назад", common_loading: "Загрузка...", common_error: "Ошибка",
  common_send: "Отправить", common_edit: "Редактировать", common_add: "Добавить", common_or: "или",
  msg_title: "Сообщения",
  msg_subtitle: "Личные переписки — видны только вам и профилю",
  msg_no_convos: "Пока нет переписок",
  msg_no_convos_sub: "Свяжитесь с профилем, чтобы начать личную переписку",
  msg_find_profile: "Найти профиль",
  msg_no_messages: "Пока нет сообщений",
  msg_placeholder: "Напишите ваше сообщение…",
  msg_send_title: "Отправить сообщение",
  msg_sent: "Сообщение отправлено!",
  msg_sent_sub: "Вы получите ответ в вашем почтовом ящике",
  msg_send_new: "Отправить новое сообщение",
  msg_login_required: "Войдите, чтобы отправлять сообщения",
  msg_login_sub: "Сообщения платформы 100% анонимны — показывается только ваш никнейм",
  msg_anonymous: "🔒 100% анонимно — показывается только ваш никнейм",
  msg_create_free: "Создать бесплатный аккаунт",
  msg_login_link: "Войти",
  chat_back: "Назад", chat_no_messages: "Пока нет сообщений",
  chat_placeholder: "Напишите сообщение...",
  prof_title: "Мой профиль",
  prof_subtitle: "Виден только профилям, с которыми вы связывались",
  prof_avatar: "Фото профиля", prof_upload: "Загрузить фото", prof_upload_hint: "JPG или PNG, макс. 5 МБ",
  prof_basic_info: "Основная информация", prof_username: "Имя пользователя *",
  prof_username_note: "Виден в отзывах — не в сообщениях",
  prof_username_placeholder: "ваш_никнейм",
  prof_gender: "Пол", prof_age: "Возраст", prof_nationality: "Национальность",
  prof_nationality_placeholder: "напр. Русский, Польский...",
  prof_height: "Рост (см)", prof_weight: "Вес (кг)", prof_smoker: "Курящий",
  prof_tattoos: "Татуировки", prof_penis_size: "Размер члена",
  prof_languages: "Языки", prof_preferences: "О себе и предпочтения",
  prof_bio: "Биография (необязательно)", prof_bio_placeholder: "Расскажите немного о себе...",
  prof_kinks_title: "Что вас возбуждает",
  prof_kink_bio: "Опишите что вас возбуждает (видно профилям, с которыми вы контактируете)",
  prof_kink_bio_placeholder: "Опишите ваши предпочтения и фантазии...",
  prof_media_title: "Мои фото и видео", prof_media_sub: "Видны профилям, с которыми вы связывались",
  prof_media_add: "Добавить", prof_media_hint: "Фото и видео — макс. 10",
  prof_privacy_note: "⚠️ Отзывы: Если вы пишете отзыв, ваш никнейм будет показан публично.",
  prof_save: "Сохранить профиль", prof_saving: "Сохранение...", prof_saved: "✓ Профиль сохранён!",
  prof_view: "Посмотреть свой профиль", prof_not_disclosed: "Не указано",
  gender_select: "Выбрать...", gender_male: "Мужчина", gender_female: "Женщина", gender_trans: "Транс", gender_other: "Другое",
  smoker_select: "Выбрать...", smoker_no: "Не курю", smoker_yes: "Курю", smoker_occasionally: "Иногда",
  tattoo_select: "Выбрать...", tattoo_none: "Нет", tattoo_few: "Несколько", tattoo_many: "Много",
  penis_select: "Выбрать...", penis_small: "До 14 см", penis_medium: "14–18 см", penis_large: "18–22 см", penis_xlarge: "Более 22 см",
  preview_header: "Предварительный просмотр — так другие видят ваш профиль",
  preview_speaks: "Говорит", preview_interests: "Интересы", preview_about: "О себе",
  preview_media: "Фото и видео", preview_close: "Закрыть", preview_edit: "Редактировать профиль",
  preview_verified: "Подтверждён RedLightAD", preview_created: "Профиль создан",
  preview_anon: "Аноним", preview_height_label: "см", preview_weight_label: "вес",
  preview_smoker_label: "курящий", preview_tattoo_label: "татуировки",
  verified_badge: "✓ Подтверждён RedLightAD",
  filter_age_range: "Возрастная группа", filter_price_range: "Ценовой диапазон",
  filter_verified_only: "Только подтверждённые", filter_with_video: "С видео", filter_apply: "Применить фильтры",
  contact_info: "Контакты",
  contact_phone: "Телефон",
  contact_show: "Показать",
  contact_call: "Позвонить",
  profile_info: "Профиль",
  about_me: "Обо мне",
  watch_videos: "Смотреть мои видео →",
  view_profile: "Смотреть профиль",
})

// ─────────────────────────────────────────────────────────────────────────────
// Polish
// ─────────────────────────────────────────────────────────────────────────────
const pl = makeSimple({
  nav_home: "Strona główna", nav_support: "Wsparcie", nav_post_ad: "Dodaj ogłoszenie",
  nav_login: "Zaloguj się", nav_create_account: "Utwórz konto",
  nav_dashboard: "Panel", nav_my_account: "Moje konto",
  hero_title: "Wiodąca platforma ogłoszeń dla dorosłych",
  hero_subtitle: "Połącz się z ponad 5000 aktywnymi użytkownikami na całym świecie",
  hero_cta_start: "Zacznij", hero_cta_learn: "Dowiedz się więcej",
  search_placeholder: "Szukaj po mieście, nazwie, usłudze...",
  filter_all_countries: "Wszystkie kraje", filter_all_categories: "Wszystkie kategorie",
  filter_all_genders: "Wszystkie", filter_search_btn: "Szukaj", filter_clear: "Wyczyść",
  footer_adults_only: "🔞 Tylko dla dorosłych — 18+",
  footer_copyright: "© 2026 RedLightAd.com — Wszelkie prawa zastrzeżone.",
  auth_login_title: "Witaj ponownie", auth_login_subtitle: "Zaloguj się na swoje konto",
  auth_email: "E-mail", auth_password: "Hasło",
  auth_forgot_password: "Zapomniałeś hasła?",
  auth_login_btn: "Zaloguj się", auth_no_account: "Nie masz konta?", auth_create_account: "Utwórz konto",
  auth_continue: "Kontynuuj", auth_have_account: "Masz już konto?", auth_sign_in: "Zaloguj się",
  dash_messages: "Wiadomości", dash_profile: "Ustawienia profilu", dash_sign_out: "Wyloguj się",
  common_save: "Zapisz", common_cancel: "Anuluj", common_close: "Zamknij",
  common_back: "Wstecz", common_loading: "Ładowanie...", common_error: "Błąd",
  common_send: "Wyślij", common_edit: "Edytuj", common_add: "Dodaj", common_or: "lub",
  msg_title: "Wiadomości",
  msg_subtitle: "Prywatne rozmowy — widoczne tylko dla ciebie i profilu",
  msg_no_convos: "Brak rozmów",
  msg_no_convos_sub: "Skontaktuj się z profilem, aby rozpocząć prywatną rozmowę",
  msg_find_profile: "Znajdź profil",
  msg_no_messages: "Brak wiadomości",
  msg_placeholder: "Napisz swoją wiadomość…",
  msg_send_title: "Wyślij wiadomość",
  msg_sent: "Wiadomość wysłana!",
  msg_sent_sub: "Odpowiedź otrzymasz w skrzynce odbiorczej",
  msg_send_new: "Wyślij nową wiadomość",
  msg_login_required: "Zaloguj się, aby wysyłać wiadomości",
  msg_login_sub: "Wiadomości platformy są w 100% anonimowe — wyświetlana jest tylko twoja nazwa użytkownika",
  msg_anonymous: "🔒 100% anonimowo — wyświetlana jest tylko twoja nazwa użytkownika",
  msg_create_free: "Utwórz darmowe konto",
  msg_login_link: "Zaloguj się",
  chat_back: "Wstecz", chat_no_messages: "Brak wiadomości",
  chat_placeholder: "Napisz wiadomość...",
  prof_title: "Mój profil",
  prof_subtitle: "Widoczny tylko dla profili, z którymi się kontaktowałeś",
  prof_avatar: "Zdjęcie profilowe", prof_upload: "Prześlij zdjęcie", prof_upload_hint: "JPG lub PNG, maks. 5 MB",
  prof_basic_info: "Podstawowe informacje", prof_username: "Nazwa użytkownika *",
  prof_username_note: "Widoczna w recenzjach — nie w wiadomościach",
  prof_username_placeholder: "twoja_nazwa",
  prof_gender: "Płeć", prof_age: "Wiek", prof_nationality: "Narodowość",
  prof_nationality_placeholder: "np. Polak, Duńczyk...",
  prof_height: "Wzrost (cm)", prof_weight: "Waga (kg)", prof_smoker: "Palacz",
  prof_tattoos: "Tatuaże", prof_penis_size: "Rozmiar penisa",
  prof_languages: "Języki", prof_preferences: "O mnie i preferencje",
  prof_bio: "Bio (opcjonalnie)", prof_bio_placeholder: "Opowiedz trochę o sobie...",
  prof_kinks_title: "Co cię podniecá",
  prof_kink_bio: "Opisz co cię podniecá (widoczne dla profili, z którymi się kontaktujesz)",
  prof_kink_bio_placeholder: "Opisz swoje preferencje i fantazje...",
  prof_media_title: "Moje zdjęcia i filmy", prof_media_sub: "Widoczne dla profili, z którymi się kontaktowałeś",
  prof_media_add: "Dodaj", prof_media_hint: "Zdjęcia i filmy — maks. 10",
  prof_privacy_note: "⚠️ Recenzje: Jeśli napiszesz recenzję, twoja nazwa użytkownika będzie wyświetlona publicznie.",
  prof_save: "Zapisz profil", prof_saving: "Zapisywanie...", prof_saved: "✓ Profil zapisany!",
  prof_view: "Zobacz swój profil", prof_not_disclosed: "Nie podano",
  gender_select: "Wybierz...", gender_male: "Mężczyzna", gender_female: "Kobieta", gender_trans: "Trans", gender_other: "Inne",
  smoker_select: "Wybierz...", smoker_no: "Niepalący", smoker_yes: "Palący", smoker_occasionally: "Okazjonalnie",
  tattoo_select: "Wybierz...", tattoo_none: "Brak", tattoo_few: "Kilka", tattoo_many: "Dużo",
  penis_select: "Wybierz...", penis_small: "Poniżej 14 cm", penis_medium: "14–18 cm", penis_large: "18–22 cm", penis_xlarge: "Powyżej 22 cm",
  preview_header: "Podgląd — tak inni widzą twój profil",
  preview_speaks: "Mówi", preview_interests: "Zainteresowania", preview_about: "O mnie",
  preview_media: "Zdjęcia i filmy", preview_close: "Zamknij", preview_edit: "Edytuj profil",
  preview_verified: "Zweryfikowany przez RedLightAD", preview_created: "Profil utworzony",
  preview_anon: "Anonimowy", preview_height_label: "cm wzrostu", preview_weight_label: "waga",
  preview_smoker_label: "palacz", preview_tattoo_label: "tatuaże",
  verified_badge: "✓ Zweryfikowany przez RedLightAD",
  filter_age_range: "Przedział wiekowy", filter_price_range: "Przedział cenowy",
  filter_verified_only: "Tylko zweryfikowani", filter_with_video: "Z filmem", filter_apply: "Zastosuj filtry",
  contact_info: "Kontakt",
  contact_phone: "Telefon",
  contact_show: "Pokaż",
  contact_call: "Zadzwoń",
  profile_info: "Profil",
  about_me: "O mnie",
  watch_videos: "Zobacz moje filmy →",
  view_profile: "Zobacz profil",
})

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────
export const translations: Record<Locale, TranslationKeys> = {
  en, da, de, fr, es, it, pt, nl, sv, no, ar, th, ru, pl,
}