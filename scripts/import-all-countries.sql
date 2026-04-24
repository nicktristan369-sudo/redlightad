-- ============================================================================
-- REDLIGHTAD - FULD GLOBAL IMPORT
-- Netherlands, UK, USA, France, Spain, Italy, + alle andre lande
-- ============================================================================

-- ============================================================================
-- DEL 1: FLERE LANDE (som mangler)
-- ============================================================================

INSERT INTO geo_countries (iso_code, iso3_code, name, name_local, domain, continent, population) VALUES
  ('GL', 'GRL', 'Greenland', 'Kalaallit Nunaat', '.gl', 'NA', 56000),
  ('IS', 'ISL', 'Iceland', 'Ísland', '.is', 'EU', 370000),
  ('LU', 'LUX', 'Luxembourg', 'Lëtzebuerg', '.lu', 'EU', 640000),
  ('MT', 'MLT', 'Malta', 'Malta', '.mt', 'EU', 520000),
  ('CY', 'CYP', 'Cyprus', 'Κύπρος', '.cy', 'EU', 1200000),
  ('MC', 'MCO', 'Monaco', 'Monaco', '.mc', 'EU', 39000),
  ('AD', 'AND', 'Andorra', 'Andorra', '.ad', 'EU', 77000),
  ('LI', 'LIE', 'Liechtenstein', 'Liechtenstein', '.li', 'EU', 39000),
  ('SM', 'SMR', 'San Marino', 'San Marino', '.sm', 'EU', 34000),
  ('VA', 'VAT', 'Vatican City', 'Città del Vaticano', '.va', 'EU', 800),
  ('FO', 'FRO', 'Faroe Islands', 'Føroyar', '.fo', 'EU', 53000),
  ('SG', 'SGP', 'Singapore', 'Singapore', '.sg', 'AS', 5900000),
  ('HK', 'HKG', 'Hong Kong', '香港', '.hk', 'AS', 7500000),
  ('MY', 'MYS', 'Malaysia', 'Malaysia', '.my', 'AS', 32000000),
  ('ID', 'IDN', 'Indonesia', 'Indonesia', '.id', 'AS', 273000000),
  ('PH', 'PHL', 'Philippines', 'Pilipinas', '.ph', 'AS', 110000000),
  ('VN', 'VNM', 'Vietnam', 'Việt Nam', '.vn', 'AS', 98000000),
  ('KR', 'KOR', 'South Korea', '대한민국', '.kr', 'AS', 52000000),
  ('TW', 'TWN', 'Taiwan', '台灣', '.tw', 'AS', 24000000),
  ('NZ', 'NZL', 'New Zealand', 'New Zealand', '.nz', 'OC', 5000000),
  ('ZA', 'ZAF', 'South Africa', 'South Africa', '.za', 'AF', 60000000),
  ('EG', 'EGY', 'Egypt', 'مصر', '.eg', 'AF', 102000000),
  ('MA', 'MAR', 'Morocco', 'المغرب', '.ma', 'AF', 37000000),
  ('NG', 'NGA', 'Nigeria', 'Nigeria', '.ng', 'AF', 211000000),
  ('KE', 'KEN', 'Kenya', 'Kenya', '.ke', 'AF', 54000000),
  ('CL', 'CHL', 'Chile', 'Chile', '.cl', 'SA', 19000000),
  ('PE', 'PER', 'Peru', 'Perú', '.pe', 'SA', 33000000),
  ('VE', 'VEN', 'Venezuela', 'Venezuela', '.ve', 'SA', 28000000),
  ('EC', 'ECU', 'Ecuador', 'Ecuador', '.ec', 'SA', 18000000),
  ('UY', 'URY', 'Uruguay', 'Uruguay', '.uy', 'SA', 3500000),
  ('PY', 'PRY', 'Paraguay', 'Paraguay', '.py', 'SA', 7000000),
  ('BO', 'BOL', 'Bolivia', 'Bolivia', '.bo', 'SA', 12000000),
  ('CR', 'CRI', 'Costa Rica', 'Costa Rica', '.cr', 'NA', 5100000),
  ('PA', 'PAN', 'Panama', 'Panamá', '.pa', 'NA', 4400000),
  ('DO', 'DOM', 'Dominican Republic', 'República Dominicana', '.do', 'NA', 11000000),
  ('PR', 'PRI', 'Puerto Rico', 'Puerto Rico', '.pr', 'NA', 3200000),
  ('JM', 'JAM', 'Jamaica', 'Jamaica', '.jm', 'NA', 3000000),
  ('CU', 'CUB', 'Cuba', 'Cuba', '.cu', 'NA', 11000000),
  ('IL', 'ISR', 'Israel', 'ישראל', '.il', 'AS', 9200000),
  ('SA', 'SAU', 'Saudi Arabia', 'السعودية', '.sa', 'AS', 35000000),
  ('QA', 'QAT', 'Qatar', 'قطر', '.qa', 'AS', 2900000),
  ('KW', 'KWT', 'Kuwait', 'الكويت', '.kw', 'AS', 4300000),
  ('BH', 'BHR', 'Bahrain', 'البحرين', '.bh', 'AS', 1700000),
  ('OM', 'OMN', 'Oman', 'عُمان', '.om', 'AS', 5100000),
  ('LB', 'LBN', 'Lebanon', 'لبنان', '.lb', 'AS', 6800000),
  ('JO', 'JOR', 'Jordan', 'الأردن', '.jo', 'AS', 10200000),
  ('PK', 'PAK', 'Pakistan', 'پاکستان', '.pk', 'AS', 220000000),
  ('BD', 'BGD', 'Bangladesh', 'বাংলাদেশ', '.bd', 'AS', 165000000),
  ('LK', 'LKA', 'Sri Lanka', 'ශ්‍රී ලංකාව', '.lk', 'AS', 22000000),
  ('NP', 'NPL', 'Nepal', 'नेपाल', '.np', 'AS', 30000000),
  ('UA', 'UKR', 'Ukraine', 'Україна', '.ua', 'EU', 44000000),
  ('BY', 'BLR', 'Belarus', 'Беларусь', '.by', 'EU', 9400000),
  ('MD', 'MDA', 'Moldova', 'Moldova', '.md', 'EU', 2600000),
  ('RS', 'SRB', 'Serbia', 'Србија', '.rs', 'EU', 6900000),
  ('BA', 'BIH', 'Bosnia and Herzegovina', 'Bosna i Hercegovina', '.ba', 'EU', 3300000),
  ('ME', 'MNE', 'Montenegro', 'Crna Gora', '.me', 'EU', 620000),
  ('MK', 'MKD', 'North Macedonia', 'Северна Македонија', '.mk', 'EU', 2100000),
  ('AL', 'ALB', 'Albania', 'Shqipëri', '.al', 'EU', 2900000),
  ('XK', 'XKX', 'Kosovo', 'Kosovë', '.xk', 'EU', 1800000)
ON CONFLICT (iso_code) DO UPDATE SET
  name = EXCLUDED.name,
  name_local = EXCLUDED.name_local,
  population = EXCLUDED.population,
  updated_at = NOW();

-- ============================================================================
-- DEL 2: NETHERLANDS REGIONER
-- ============================================================================

INSERT INTO geo_regions (geoname_id, country_id, name, ascii_name, admin1_code) VALUES
  (2749879, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), 'North Holland', 'Noord-Holland', '07'),
  (2743698, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), 'South Holland', 'Zuid-Holland', '11'),
  (2745909, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), 'Utrecht', 'Utrecht', '09'),
  (2756253, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), 'Gelderland', 'Gelderland', '03'),
  (2751596, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), 'North Brabant', 'Noord-Brabant', '06'),
  (2751875, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), 'Limburg', 'Limburg', '05'),
  (2755812, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), 'Groningen', 'Groningen', '04'),
  (2755634, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), 'Friesland', 'Friesland', '02'),
  (2748838, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), 'Overijssel', 'Overijssel', '08'),
  (2759794, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), 'Drenthe', 'Drenthe', '01'),
  (2750324, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), 'Zeeland', 'Zeeland', '10'),
  (2759995, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), 'Flevoland', 'Flevoland', '16')
ON CONFLICT (geoname_id) DO NOTHING;

-- ============================================================================
-- DEL 3: NETHERLANDS BYER
-- ============================================================================

INSERT INTO geo_cities (geoname_id, country_id, region_id, name, ascii_name, latitude, longitude, population, is_capital, is_major_city, feature_code) VALUES
  (2759794, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), (SELECT id FROM geo_regions WHERE admin1_code = '07' AND country_id = (SELECT id FROM geo_countries WHERE iso_code = 'NL')), 'Amsterdam', 'Amsterdam', 52.37403, 4.88969, 872680, TRUE, TRUE, 'PPLC'),
  (2747891, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), (SELECT id FROM geo_regions WHERE admin1_code = '11' AND country_id = (SELECT id FROM geo_countries WHERE iso_code = 'NL')), 'Rotterdam', 'Rotterdam', 51.92250, 4.47917, 651446, FALSE, TRUE, 'PPL'),
  (2747373, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), (SELECT id FROM geo_regions WHERE admin1_code = '11' AND country_id = (SELECT id FROM geo_countries WHERE iso_code = 'NL')), 'The Hague', 'The Hague', 52.07667, 4.29861, 545838, FALSE, TRUE, 'PPLA'),
  (2745912, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), (SELECT id FROM geo_regions WHERE admin1_code = '09' AND country_id = (SELECT id FROM geo_countries WHERE iso_code = 'NL')), 'Utrecht', 'Utrecht', 52.09083, 5.12222, 357179, FALSE, TRUE, 'PPLA'),
  (2756253, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), (SELECT id FROM geo_regions WHERE admin1_code = '06' AND country_id = (SELECT id FROM geo_countries WHERE iso_code = 'NL')), 'Eindhoven', 'Eindhoven', 51.44083, 5.47778, 231642, FALSE, TRUE, 'PPL'),
  (2757783, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), (SELECT id FROM geo_regions WHERE admin1_code = '06' AND country_id = (SELECT id FROM geo_countries WHERE iso_code = 'NL')), 'Tilburg', 'Tilburg', 51.55551, 5.09130, 217259, FALSE, TRUE, 'PPL'),
  (2755251, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), (SELECT id FROM geo_regions WHERE admin1_code = '04' AND country_id = (SELECT id FROM geo_countries WHERE iso_code = 'NL')), 'Groningen', 'Groningen', 53.21917, 6.56667, 202810, FALSE, TRUE, 'PPLA'),
  (2759661, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), (SELECT id FROM geo_regions WHERE admin1_code = '16' AND country_id = (SELECT id FROM geo_countries WHERE iso_code = 'NL')), 'Almere', 'Almere', 52.35000, 5.26250, 203990, FALSE, TRUE, 'PPL'),
  (2758401, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), (SELECT id FROM geo_regions WHERE admin1_code = '06' AND country_id = (SELECT id FROM geo_countries WHERE iso_code = 'NL')), 'Breda', 'Breda', 51.58656, 4.77596, 183873, FALSE, TRUE, 'PPL'),
  (2750896, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), (SELECT id FROM geo_regions WHERE admin1_code = '03' AND country_id = (SELECT id FROM geo_countries WHERE iso_code = 'NL')), 'Nijmegen', 'Nijmegen', 51.84250, 5.85278, 176731, FALSE, TRUE, 'PPL'),
  (2759879, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), (SELECT id FROM geo_regions WHERE admin1_code = '03' AND country_id = (SELECT id FROM geo_countries WHERE iso_code = 'NL')), 'Arnhem', 'Arnhem', 51.98500, 5.89861, 159265, FALSE, TRUE, 'PPLA'),
  (2755003, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), (SELECT id FROM geo_regions WHERE admin1_code = '07' AND country_id = (SELECT id FROM geo_countries WHERE iso_code = 'NL')), 'Haarlem', 'Haarlem', 52.38084, 4.63683, 160374, FALSE, TRUE, 'PPLA'),
  (2756071, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), (SELECT id FROM geo_regions WHERE admin1_code = '08' AND country_id = (SELECT id FROM geo_countries WHERE iso_code = 'NL')), 'Enschede', 'Enschede', 52.21833, 6.89583, 158986, FALSE, TRUE, 'PPL'),
  (2751283, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), (SELECT id FROM geo_regions WHERE admin1_code = '05' AND country_id = (SELECT id FROM geo_countries WHERE iso_code = 'NL')), 'Maastricht', 'Maastricht', 50.84833, 5.68889, 122378, FALSE, TRUE, 'PPLA'),
  (2751738, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), (SELECT id FROM geo_regions WHERE admin1_code = '11' AND country_id = (SELECT id FROM geo_countries WHERE iso_code = 'NL')), 'Leiden', 'Leiden', 52.16000, 4.49306, 124899, FALSE, TRUE, 'PPL'),
  (2757220, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), (SELECT id FROM geo_regions WHERE admin1_code = '11' AND country_id = (SELECT id FROM geo_countries WHERE iso_code = 'NL')), 'Dordrecht', 'Dordrecht', 51.81000, 4.67361, 118824, FALSE, TRUE, 'PPL'),
  (2745673, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), (SELECT id FROM geo_regions WHERE admin1_code = '11' AND country_id = (SELECT id FROM geo_countries WHERE iso_code = 'NL')), 'Zoetermeer', 'Zoetermeer', 52.05750, 4.49306, 124695, FALSE, TRUE, 'PPL'),
  (2745387, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), (SELECT id FROM geo_regions WHERE admin1_code = '08' AND country_id = (SELECT id FROM geo_countries WHERE iso_code = 'NL')), 'Zwolle', 'Zwolle', 52.51250, 6.09444, 127497, FALSE, TRUE, 'PPLA'),
  (2759706, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), (SELECT id FROM geo_regions WHERE admin1_code = '09' AND country_id = (SELECT id FROM geo_countries WHERE iso_code = 'NL')), 'Amersfoort', 'Amersfoort', 52.15500, 5.38750, 155226, FALSE, TRUE, 'PPL'),
  (2758723, (SELECT id FROM geo_countries WHERE iso_code = 'NL'), (SELECT id FROM geo_regions WHERE admin1_code = '06' AND country_id = (SELECT id FROM geo_countries WHERE iso_code = 'NL')), 'Den Bosch', 'Den Bosch', 51.69083, 5.30417, 154205, FALSE, TRUE, 'PPLA')
ON CONFLICT (geoname_id) DO UPDATE SET name = EXCLUDED.name, population = EXCLUDED.population;
