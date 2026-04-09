# PhoneControl — Opsætningsvejledning

Fjernstyring af Android-telefoner via browser. Virker fra hvorsomhelst i verden.

---

## Systemkrav (server)

- Ubuntu/Debian Linux (VPS anbefales — fx DigitalOcean, Hetzner, Linode)
- Node.js 18+
- `adb` (Android Debug Bridge)
- `ffmpeg`

---

## Trin 1: Klargør din server

```bash
# Installer afhængigheder
sudo apt update
sudo apt install -y android-tools-adb ffmpeg nodejs npm

# Upload projektet til serveren (eller klon det)
# Installer Node-pakker
cd phonecontrol
npm install

# Start serveren
npm start
# → Åbn http://DIN-SERVER-IP:3000 i browseren
```

---

## Trin 2: Opsæt ADB over WiFi på telefonerne

**Gøres én gang per telefon — inden de pakkes ind til Danmark.**

### Android 11 og nyere (nemmest):

1. Gå til **Indstillinger → Om telefonen**
2. Tryk 7 gange på "Buildnummer" → "Du er nu udvikler!"
3. Gå til **Indstillinger → Udviklermuligheder**
4. Aktiver **"Trådløs fejlretning"**
5. Tryk på "Trådløs fejlretning" → **"Par enhed med parringskode"**
6. Noter IP-adressen og porten der vises

```bash
# Par telefonen med serveren
adb pair <TELEFON-IP>:<PARRINGSPORT>
# Indtast parringskoden når du bliver bedt om det

# Derefter — tilslut til den permanente ADB-port
adb connect <TELEFON-IP>:5555
```

### Android 10 og ældre:

```bash
# Tilslut telefonen via USB første gang
adb tcpip 5555
adb connect <TELEFON-IP>:5555
# Fjern USB-kablet — det virker nu over WiFi
```

---

## Trin 3: Gør forbindelsen tilgængelig over internet

Telefonerne i Danmark skal kunne nå serveren (eller omvendt).

### Mulighed A: Telefoner bag router i Danmark

Sæt port-forwarding op på routeren:
- Ekstern port: 5555, 5556, 5557, osv. (én per telefon)
- Intern IP: telefonens lokale IP
- Protokol: TCP

Tilslut derefter fra dashboard:
```
IP: DIN-OFFENTLIGE-IP-I-DANMARK
Port: 5555
```

### Mulighed B: Raspberry Pi / PC i Danmark (anbefalet)

Installer ADB på en Raspberry Pi tilsluttet telefonerne via USB eller lokal WiFi.
Opret en SSH-tunnel fra Pi'en til serveren:

```bash
# Kør på Pi'en i Danmark
ssh -R 5555:localhost:5555 bruger@DIN-SERVER-IP -N
# Gentag for port 5556, 5557, osv. (én tunnel per telefon)
```

Tilslut derefter fra dashboard:
```
IP: 127.0.0.1
Port: 5555
```

### Mulighed C: WireGuard VPN (mest stabil)

Opsæt en WireGuard VPN-server, og forbind telefonerne som peers.
Telefonerne vil da have private IP-adresser tilgængelige fra serveren.

---

## Brug af dashboardet

1. Åbn `http://DIN-SERVER-IP:3000` i browseren
2. Klik **"+ Tilslut telefon"** og indtast IP + port
3. Telefonens skærm streames live
4. Klik på skærmen for at tappe
5. Brug **HOME / BACK / RECENTS**-knapperne under skærmen
6. Skriv tekst i bunden og send til én eller alle telefoner
7. Klik ⛶ for fuldskærmsvisning

---

## Fejlfinding

```bash
# Vis tilsluttede enheder
adb devices

# Test stream manuelt (skal give output)
adb -s DEVICE_ID exec-out screenrecord --output-format=h264 - | ffmpeg -i - -frames:v 1 test.jpg

# Vis serverlog
npm start 2>&1 | tee server.log
```

---

## Sikkerhed

⚠️ **Dashboardet er ikke passwordbeskyttet som standard.**

Til produktion anbefales:

```bash
# Beskyt med Nginx + Basic Auth
sudo apt install nginx apache2-utils
htpasswd -c /etc/nginx/.htpasswd dit-brugernavn
```

Eller kør bag en VPN og giv kun adgang til betroede IP-adresser.
