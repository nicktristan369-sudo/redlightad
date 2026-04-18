# 📱 SMS Bridge Android App

Forbinder dine fysiske Android-telefoner til Agency SMS Management System.

---

## 🚀 Quick Setup (5 minutter)

### Step 1: Kør database migration

Gå til Supabase dashboard → SQL Editor og kør:

```sql
-- Kopier indholdet fra /supabase_agency_schema.sql
```

### Step 2: Byg APK

På din Mac/PC med Android Studio:

```bash
cd android-sms-bridge
./gradlew assembleDebug
```

APK findes i: `app/build/outputs/apk/debug/app-debug.apk`

### Step 3: Installer på telefoner

1. Overfør APK til hver telefon (USB, Bluetooth, eller download)
2. Åbn APK og installer (tillad "ukendte kilder")
3. Giv ALLE tilladelser når du bliver spurgt

### Step 4: Forbind til server

1. **Admin Panel**: Gå til `/admin/agency`
2. **Opret telefon**: Klik "Add Phone" og udfyld persona
3. **Kopier Phone ID**: Det UUID der vises
4. **I appen**: Indtast:
   - Server URL: `https://redlightad.com`
   - Phone ID: (UUID fra admin panel)
5. Klik **Connect**

### Step 5: Start service

1. Slå "Background Service" til
2. Klik "Disable Battery Optimization"
3. Telefonen er nu online! ✅

---

## 📋 Tilladelser der kræves

| Tilladelse | Hvad den bruges til |
|------------|---------------------|
| `RECEIVE_SMS` | Modtage indgående SMS |
| `READ_SMS` | Læse SMS indhold |
| `SEND_SMS` | Sende AI-svar |
| `READ_PHONE_STATE` | Telefon info |
| `INTERNET` | Kommunikere med server |
| `FOREGROUND_SERVICE` | Køre i baggrunden |
| `RECEIVE_BOOT_COMPLETED` | Starte automatisk efter genstart |

---

## 🔧 Fejlfinding

### "Telefon vises som offline"

1. Check at appen kører (notifikation i statusbar)
2. Check internetforbindelse
3. Genstart appen
4. Check at Battery Optimization er slået fra

### "SMS kommer ikke igennem"

1. Check SMS-tilladelser er givet
2. Check at service er startet (grøn status)
3. Se logcat for fejl: `adb logcat | grep SmsReceiver`

### "AI svarer ikke"

1. Check at AI er aktiveret i admin panel
2. Check at samtalen er i "AI handling" mode
3. Check at der er OpenAI API key konfigureret på serveren

### App lukker i baggrunden

1. Slå Battery Optimization fra for appen
2. På Xiaomi/Huawei: Gå til batteriiindstillinger og tillad baggrundskørsel
3. Lås appen i recent apps

---

## 🏗️ Byg selv (development)

### Requirements

- Android Studio Hedgehog (2023.1.1) eller nyere
- JDK 17
- Android SDK 34

### Build

```bash
# Debug build
./gradlew assembleDebug

# Release build (kræver signing key)
./gradlew assembleRelease
```

### Test

```bash
# Installer på tilsluttet telefon
./gradlew installDebug

# Se logs
adb logcat | grep -E "SmsReceiver|BridgeService|ApiService"
```

---

## 📁 Projekt Struktur

```
app/src/main/
├── java/com/redlightad/smsbridge/
│   ├── SMSBridgeApp.kt      # Application class, preferences
│   ├── MainActivity.kt       # Setup UI
│   ├── SmsReceiver.kt        # BroadcastReceiver for SMS
│   ├── SmsSender.kt          # Send SMS
│   ├── BridgeService.kt      # Background service
│   ├── BootReceiver.kt       # Auto-start efter boot
│   └── ApiService.kt         # HTTP API calls
├── res/
│   ├── layout/
│   │   └── activity_main.xml # Setup screen
│   └── values/
│       └── themes.xml        # Dark theme
└── AndroidManifest.xml       # Permissions & components
```

---

## 🔒 Sikkerhed

- Alle API-kald bruger HTTPS
- Phone ID er et UUID (svært at gætte)
- Beskeder sendes krypteret over netværket
- Ingen SMS gemmes lokalt på telefonen
- API key bruges til ekstra autentificering

---

## 📞 Sådan virker det

```
[Kunde sender SMS]
       ↓
[Android modtager SMS]
       ↓
[SmsReceiver.kt fanger beskeden]
       ↓
[Sender til server via API]
       ↓
[Server gemmer + AI genererer svar]
       ↓
[BridgeService henter svar efter delay]
       ↓
[SmsSender.kt sender SMS til kunde]
```

---

## 💡 Tips

1. **Brug billige taletidskort** - AI sender mange SMS
2. **Hold telefonerne opladede** - Brug USB hub
3. **Stabil WiFi** - Undgå mobildata for at spare
4. **Test først** - Send test-SMS før du går live
5. **Monitor admin panel** - Se at beskeder kommer igennem

---

## 🆘 Support

Hvis noget ikke virker:

1. Check at telefonen viser "Connected & Active"
2. Check admin panel at telefonen er online
3. Send test-SMS og se om den dukker op
4. Check server logs for fejl

God fornøjelse! 🚀
