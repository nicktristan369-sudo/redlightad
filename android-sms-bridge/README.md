# SMS Bridge Android App

Denne app forbinder dine fysiske Android-telefoner til Agency SMS Management System.

## Funktioner

- 📨 Modtager SMS og sender til serveren
- 📤 Modtager svar fra serveren og sender som SMS
- 🔄 Realtime synkronisering
- 🔋 Kører i baggrunden
- 📶 Viser online/offline status
- 🔔 Push notifikationer

## Installation

### 1. Installer appen på hver telefon

Download APK fra: `https://redlightad.com/downloads/sms-bridge.apk`

Eller byg selv:
```bash
cd android-sms-bridge
./gradlew assembleRelease
```

### 2. Giv tilladelser

Appen kræver:
- **SMS tilladelser** (læse og sende)
- **Notifikationer**
- **Kør i baggrunden**
- **Internet adgang**

### 3. Tilslut til server

1. Åbn appen
2. Scan QR-kode fra admin panel, ELLER
3. Indtast manuelt:
   - Server URL: `https://redlightad.com`
   - Phone ID: (fra admin panel)
   - API Key: (fra admin panel)

### 4. Test forbindelse

Send en test-SMS til telefonen og verificer at den vises i admin panel.

---

## Teknisk Setup

### API Endpoints

```
POST /api/agency/sms/inbound
- Modtager indgående SMS fra app
- Body: { phone_id, from_number, message, timestamp }

GET /api/agency/sms/outbound?phone_id=xxx
- Henter ventende udgående SMS
- Returns: [{ id, to_number, message }]

POST /api/agency/sms/sent
- Bekræfter SMS er sendt
- Body: { message_id, status }

POST /api/agency/phone/heartbeat
- Sender status til server (hvert 30 sek)
- Body: { phone_id, battery_level, signal_strength }
```

### App Struktur

```
app/
├── src/main/
│   ├── java/com/redlightad/smsbridge/
│   │   ├── MainActivity.kt
│   │   ├── SmsReceiver.kt        # BroadcastReceiver for SMS
│   │   ├── SmsSender.kt          # Sender SMS
│   │   ├── ApiService.kt         # HTTP requests
│   │   ├── WebSocketService.kt   # Realtime connection
│   │   └── HeartbeatService.kt   # Background service
│   └── AndroidManifest.xml
```

---

## Fejlfinding

### SMS kommer ikke igennem
1. Check at appen har SMS-tilladelser
2. Check internet forbindelse
3. Se logs i appen

### Telefon vises som offline
1. Check at appen kører i baggrunden
2. Check at battery optimization er slået fra for appen
3. Genstart appen

### AI svarer ikke
1. Check at AI er aktiveret for telefonen i admin panel
2. Check at der er defineret svar-regler

---

## Sikkerhed

- Alle API-kald bruger HTTPS
- Phone ID + API Key autentificering
- Beskeder krypteres i transit
- Ingen data gemmes lokalt på telefonen

---

## Support

Kontakt admin hvis du har problemer med opsætningen.
