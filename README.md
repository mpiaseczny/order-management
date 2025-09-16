# Order Management System

## Architektura Systemu

### Backend (Java 17 + Spring Boot)

System składa się z czterech głównych mikrousług:

#### 1. **API Gateway**
- **Rola**: Punkt wejścia dla wszystkich żądań z frontendu
- **Funkcjonalności**:
  - Routing żądań do odpowiednich mikrousług (poprzez Consul uruchomiony na dockerze)
  - Weryfikacja tokenów JWT
  - Przekazywanie informacji o użytkowniku (header X-User-Id uzupełniany z JWT) - przydaje się do filtrowania zamówień, SSE dla zalogowanego użytkownika, uzupełniania pola createdById w zamówieniu (dzięki temu użytkownik nie może stworzyć zamówienia dla innego użytkownika)
  - Konfiguracja CORS dla integracji z frontendem

#### 2. **Auth Service**
- **Rola**: Zarządzanie uwierzytelnianiem i autoryzacją
- **Funkcjonalności**:
  - Rejestracja i logowanie użytkowników z generowaniem tokenów JWT
  - Szyfrowanie haseł (BCrypt)
- **Baza danych**: H2 z encją User

#### 3. **Order Service**
- **Rola**: Główna logika biznesowa zarządzania zamówieniami
- **Funkcjonalności**:
  - Pobieranie i filtrowanie zamówień (wszystkie/aktywne)
  - Zmiana statusów zamówień
  - Publikowanie eventów na Kafkę przy tworzeniu/aktualizacji zamówień
- **Baza danych**: H2 z encją Order
- **Kafka Topics**: 
  - `order-created` - nowe zamówienia
  - `order-status-changed` - zmiany statusów

#### 4. **Notification Service**
- **Rola**: Obsługa powiadomień w czasie rzeczywistym
- **Funkcjonalności**:
  - Server-Sent Events (SSE) dla komunikacji real-time z frontendem
  - Konsumowanie eventów z Kafka
  - Przekazywanie powiadomień do odpowiednich użytkowników (na podstawie headera X-User-Id)

### Frontend (ES6 + Lit + Lion)

#### Routing
- Do routingu wykorzystałem bibliotekę @vaadin/router.
- Lista dostępnych stron znajduje się w katalogu pages.
- Dodałem również guarda, który blokuje wejście na /orders dopóki użytkownik się nie zaloguje.

#### Komponenty Lit-element:

##### 1. **MainLayout** (`main-layout.js`)
- **Funkcjonalność**: Komponent głównego layoutu aplikacji (header)

##### 2. **RegisterForm** (`register-form.js`)
- **Funkcjonalność**: Formularz rejestracji z walidacjami

##### 3. **LoginForm** (`login-form.js`)
- **Funkcjonalność**: Formularz logowania z walidacjami

##### 4. **OrderForm** (`order-form.js`)
- **Funkcjonalność**: Formularz dodawania nowych zamówień z walidacjami

##### 5. **OrdersPanel** (`orders-panel.js`)
- **Funkcjonalność**: Tabela z listą zamówień odświeżana real-time

#### Usługi:

##### 1. **ApiService** (`api.js`)
- Komunikacja z backendem przez API Gateway
- Automatyczne dołączanie nagłówków autoryzacji
- Obsługa błędów HTTP

##### 2. **AuthService** (`auth.js`)
- Zarządzanie tokenami JWT
- Przechowywanie danych uwierzytelniania w localStorage

##### 3. **NotificationService** (`kafka.js`)
- Połączenie SSE z Notification Service
- Subskrypcja powiadomień real-time
- Obsługa reconnect przy utracie połączenia

## API Endpoints

### Auth Service (`/api/auth`)
- `POST /register` - rejestracja nowego użytkownika
- `POST /login` - logowanie użytkownika

### Order Service (`/api/orders`)
- `GET /orders` - pobieranie zamówień użytkownika
- `GET /orders?activeOnly=true` - pobieranie tylko aktywnych zamówień
- `POST /orders` - tworzenie nowego zamówienia
- `PUT /orders/{id}/status` - aktualizacja statusu zamówienia

### Notification Service (`/api/notifications`)
- `GET /subscribe` - subskrypcja SSE dla powiadomień real-time

## Funkcjonalności Real-time

### Server-Sent Events (SSE)
1. Frontend nawiązuje połączenie SSE z Notification Service
2. Notification Service przechowuje aktywne połączenia użytkowników
3. Eventy z Kafki są przekazywane do odpowiednich użytkowników
4. Frontend automatycznie odświeża listę zamówień przy otrzymaniu powiadomienia

### Walidacja Danych
- **Backend**: Bean Validation z adnotacjami
- **Frontend**: Lion validators (Required, MinNumber)

## Testy
- **Backend**: Powstały testy jednostkowe oraz integracyjne dla order-service
- **Frontend**: Powstały testy jednostkowe dla komponentów

## Decyzje Projektowe

### 1. **Architektura Mikroserwisów**
**Dlaczego**: Separacja odpowiedzialności, skalowalność, niezależne deploymenty, łatwość utrzymania, testowania i rozwijania poszczególnych komponentów

### 2. **JWT Authentication**
**Dlaczego**: JWT pozwala na bezstanowe uwierzytelnianie – mikroserwisy nie muszą współdzielić sesji HTTP, 
ponieważ wszystkie informacje o użytkowniku są zaszyte w samym tokenie. Dobrze też współgra z API Gateway. W docelowej aplikacji przydałoby się dorobić mechanizm odświeżania tokenów.

### 3. **Server-Sent Events (SSE)**
**Dlaczego**: Prostota implementacji dla one-way real-time communication. Alternatywą były WebSockety, ale są bardziej złożone dla tego przypadku.

### 4. **H2 Database**
**Dlaczego**: Szybkość developmentu, brak konfiguracji, demonstracja. Dla rzeczywistych aplikacji lepszym rozwiązaniem byłoby PostgreSQL/MySQL.

## Uruchomienie Aplikacji

### Wymagania
- Java 17
- Node.js 20+
- Docker (dla Kafki i Consula)

### Backend
```bash
# Uruchomienie Kafka, Consul
docker-compose up -d

# Uruchomienie każdego serwisu
cd backend/api-gateway && ./mvnw spring-boot:run
cd backend/auth-service && ./mvnw spring-boot:run
cd backend/order-service && ./mvnw spring-boot:run
cd backend/notification-service && ./mvnw spring-boot:run
```

### Frontend
```bash
cd frontend-app
npm install
npm start
```

### Porty
- API Gateway: 8080
- Auth Service: 8081
- Order Service: 8082
- Notification Service: 8083
- Frontend: 8002
- Kafka: 9092
- Zookeeper: 2181
