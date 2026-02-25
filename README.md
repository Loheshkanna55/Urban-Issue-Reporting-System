# 🏙️ Urban Issue Reporter

**Community-Driven Urban Issue Reporting System**  
Built with Node.js · Express.js · MongoDB · EJS · Socket.io

---

## 📋 Abstract

A centralized web-based platform enabling citizens to report urban civic issues (potholes, garbage, water leakage, etc.) with geolocation and images, track complaint status in real-time, and allow authorities to manage and resolve them efficiently.

**Complaint Lifecycle:** `Reported → Verified → In Progress → Resolved`  
**Priority Algorithm:** `Score = (A×2) + (S×5) + (D×1)`  
*(A = Area complaint count, S = Severity, D = Days pending)*

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | EJS, HTML5, CSS3, Bootstrap 5, Vanilla JS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Real-Time | Socket.io |
| Auth | JWT + bcryptjs + express-session |
| Maps | Google Maps JavaScript API |
| Email | Nodemailer |
| Upload | Multer |

---

## ⚡ Quick Start

### Prerequisites
- Node.js >= 16
- MongoDB (local or MongoDB Atlas)
- Google Maps API Key (optional for maps)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your settings
```

**.env settings:**
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/urban_issues
JWT_SECRET=your_super_secret_key_here
SESSION_SECRET=your_session_secret_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Seed the database
```bash
node seed.js
```
This creates:
- **Admin:** `admin@urban.com` / `admin123`
- **Citizen:** `citizen@urban.com` / `citizen123`
- 8 sample issues across Mumbai

### 4. Run the app
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Open: **http://localhost:3000**

---

## 🧩 Module Overview

### 1. User Authentication
- Register/Login with JWT + session
- Role-based access: **Admin** and **Citizen**
- Profile management with photo upload
- Password change

### 2. Issue Reporting
- Multi-step form (Details → Location → Media)
- Upload up to 5 photos
- Geolocation via browser GPS or map click
- Auto-generated Issue ID: `UIR-YYYYMMDD-XXXX`

### 3. Complaint Lifecycle
- Status flow: Reported → Verified → In Progress → Resolved
- Full status history log with timestamps
- Email notification on status update (Nodemailer)

### 4. Admin Management
- View and filter all issues
- Update status with comments
- Mark spam/fake complaints
- Priority management

### 5. Real-Time Updates
- Socket.io for live status updates
- Toast notifications on issue changes
- Live dashboard counter

### 6. Dashboard & Analytics
- Stats cards (total, pending, resolved)
- Monthly bar chart (Chart.js)
- Category doughnut chart

### 7. Heatmap & Location
- Google Maps with color-coded markers by priority
- Filter by category/status
- Area statistics sidebar

### 8. Priority Algorithm
```
Priority Score = (A × 2) + (S × 5) + (D × 1)

A = Number of issues in same area (area complaint density)
S = Severity rating (1-5 set by reporter)
D = Days since issue was reported
```

| Score | Level |
|-------|-------|
| 40+ | 🔴 Critical |
| 25-39 | 🟠 High |
| 15-24 | 🟡 Medium |
| 0-14 | 🟢 Low |

---

## 📁 Project Structure

```
urban-issue-reporter/
├── app.js                  # Main entry point
├── seed.js                 # Database seeder
├── .env.example            # Environment template
├── config/
│   ├── db.js               # MongoDB connection
│   ├── socket.js           # Socket.io setup
│   └── mailer.js           # Nodemailer config
├── middleware/
│   ├── auth.js             # JWT + session auth
│   └── upload.js           # Multer file upload
├── models/
│   ├── User.js             # User schema
│   ├── Issue.js            # Issue schema + priority algo
│   └── Notification.js     # Notification schema
├── routes/
│   ├── auth.js             # Login/register/profile
│   ├── issues.js           # CRUD for issues
│   ├── admin.js            # Admin management
│   ├── dashboard.js        # Dashboard + notifications
│   └── api.js              # REST API (geojson, stats)
├── views/
│   ├── partials/           # Header, footer EJS partials
│   ├── auth/               # Login, register, profile
│   ├── issues/             # List, new, show
│   ├── admin/              # Dashboard, issues, heatmap, users
│   ├── dashboard.ejs       # Citizen dashboard
│   └── notifications.ejs   # Notifications list
└── public/
    ├── css/style.css       # Complete stylesheet
    ├── js/main.js          # Frontend JS
    └── uploads/            # User-uploaded files
```

---

## 🔑 API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/issues/geojson` | GeoJSON for heatmap |
| GET | `/api/issues/area-stats` | Issue count by area |
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/notifications/unread-count` | Unread badge count |

---

## 📧 Email Setup (Gmail)

1. Enable 2FA on your Gmail
2. Generate an App Password (Google Account → Security → App Passwords)
3. Set `EMAIL_USER` and `EMAIL_PASS` in `.env`

---

## 🗺️ Google Maps Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Maps JavaScript API** + **Geocoding API**
3. Create an API key
4. Add to `.env` as `GOOGLE_MAPS_API_KEY`

> Maps features work without a key in development; markers just won't render.

---

## 👥 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@urban.com | admin123 |
| Citizen | citizen@urban.com | citizen123 |
