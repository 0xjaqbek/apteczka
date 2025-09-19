# 🚑 Apteczka Karetki - PWA dla zarządzania lekami w karetkach

Progressive Web App do zarządzania inwentarzem leków i sprzętu medycznego w karetkach pogotowia.

## ✨ Funkcjonalności

- **Autoryzacja użytkowników** - Firebase Authentication z interfejsem w języku polskim
- **Zarządzanie karetkami** - Tworzenie i dołączanie do karetek z unikalnym ID
- **System ról** - Administratorzy i członkowie z różnymi uprawnieniami
- **Inwentarz** - Dodawanie, edycja i śledzenie leków z datami ważności
- **Powiadomienia** - Ostrzeżenia o zbliżających się terminach ważności
- **Historia aktywności** - Śledzenie wszystkich zmian z informacją o autorze
- **Kody QR** - Łatwe dołączanie do karetki przez skanowanie QR
- **Ciemny motyw** - Nowoczesny design medyczny
- **PWA** - Instalacja jako aplikacja na urządzeniach mobilnych
- **Responsywny design** - Optymalizacja dla urządzeń mobilnych i desktop

## 🛠️ Technologie

- **Vue 3** - Framework frontend
- **Vite** - Build tool i dev server
- **Pinia** - State management
- **Firebase** - Authentication, Firestore, Hosting
- **Vue Router** - Routing
- **QRCode.js** - Generowanie kodów QR
- **PWA** - Service Worker, Web App Manifest

## 🚀 Instalacja i konfiguracja

### 1. Klonowanie repozytorium

```bash
git clone <repository-url>
cd leki
```

### 2. Instalacja zależności

```bash
npm install
```

### 3. Konfiguracja Firebase

1. Utwórz nowy projekt w [Firebase Console](https://console.firebase.google.com)
2. Włącz Authentication (Email/Password)
3. Utwórz bazę danych Firestore
4. Dodaj aplikację webową i skopiuj konfigurację
5. **WAŻNE**: Zaktualizuj `src/stores/superAdmin.js` i `firestore.rules` ze swoim adresem email jako Super Admin
6. Zaktualizuj `src/services/firebase.js` z właściwymi danymi:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
}
```

### 4. Reguły bezpieczeństwa Firestore

Skopiuj zawartość z `firestore.rules` do reguł bezpieczeństwa w Firebase Console.

### 5. Uruchomienie w trybie deweloperskim

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem `http://localhost:5173`

### 6. Budowanie dla produkcji

```bash
npm run build
```

### 7. Deploy na Firebase Hosting

```bash
# Zainstaluj Firebase CLI
npm install -g firebase-tools

# Zaloguj się do Firebase
firebase login

# Zainicjalizuj projekt (wybierz Hosting)
firebase init

# Deploy
npm run deploy
```

## 📱 Ikony PWA

Umieść ikony aplikacji w folderze `public/icons/` w następujących rozmiarach:
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

## 🔒 Bezpieczeństwo

- Reguły Firestore zapewniają dostęp tylko członkom karetki
- Administratorzy mogą zarządzać inwentarzem i członkami
- Wszyscy użytkownicy mogą przeglądać dane i dodawać wpisy do historii
- Twórca karetki automatycznie staje się administratorem

## 🎯 Struktura bazy danych

### Kolekcje:

- `users/` - Profile użytkowników
- `ambulances/` - Dane karetek
- `ambulances/{id}/inventory/` - Inwentarz karetki
- `ambulances/{id}/activities/` - Historia aktywności

## 🔄 Praca z wieloma karetkami

Aplikacja została zaprojektowana z myślą o pracownikach pogotowia, którzy mogą pracować w różnych karetkach podczas różnych zmian:

### 👤 Role użytkowników:
- **Twórca** - pierwsza osoba tworząca karetkę (pełne uprawnienia)
- **Administrator** - może zarządzać inwentarzem i członkami (nadawane przez twórcę/innych adminów)
- **Członek** - może przeglądać i aktualizować status przedmiotów

### 📱 Typowy workflow:
1. **Rozpoczęcie zmiany** - Zeskanuj kod QR karetki lub wprowadź ID aby dołączyć
2. **Praca w zespole** - Sprawdzaj inwentarz, oznaczaj użyte leki
3. **Przełączanie karetek** - Jeśli pracujesz w kilku karetkach, przełączaj się między nimi
4. **Powiadomienia** - Otrzymuj alerty o wygasających lekach we wszystkich Twoich karetkach

## 🌟 Funkcjonalności dla użytkowników

### Dla wszystkich członków:
- **Multi-ambulance access** - Dostęp do wielu karetek jednocześnie
- Przeglądanie inwentarza wszystkich karetek
- Oznaczanie przedmiotów jako użyte
- Przeglądanie historii aktywności
- Otrzymywanie powiadomień o wygasających przedmiotach
- Szybkie przełączanie między karetkami

### Dla administratorów:
- Wszystkie uprawnienia członka +
- Dodawanie/edycja/usuwanie przedmiotów z inwentarza
- Zarządzanie członkami karetki
- Nadawanie uprawnień administratora innym
- Konfiguracja ustawień powiadomień
- Generowanie kodów QR do dołączania
- Usuwanie karetki (tylko twórca)

### Dla Super Admina (twórca aplikacji):
- **Panel zarządzania całą aplikacją** - dostęp przez przycisk "⚡ Super Admin"
- Przegląd wszystkich karetek i użytkowników w systemie
- Statystyki aplikacji (liczba użytkowników, karetek, przedmiotów)
- Zarządzanie wszystkimi karetkami (podgląd, usuwanie)
- Zarządzanie użytkownikami (blokowanie/odblokowanie)
- Historia aktywności ze wszystkich karetek
- Eksport danych z aplikacji

## 📞 Wsparcie

W przypadku problemów lub pytań, utwórz issue w repozytorium GitHub.

## 📄 Licencja

Ten projekt jest licencjonowany na podstawie licencji MIT.