# 👷 Labour Payment Tracker
## లేబర్ పేమెంట్ ట్రాకర్

Full-stack bilingual (Telugu + English) labour payment tracking system.

---

## 🔐 Login Credentials
- **Username:** `admin`
- **Password:** `LabourAdmin@2024`

---

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
npm start
```
Runs on port **5001**

### Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```
Opens at **http://localhost:3001**

---

## 👥 User Roles

| Role | Access |
|---|---|
| **Admin** | Add/Edit/Delete payments for ALL leaders. See all leader cards on dashboard. |
| **Leader** | See ONLY their own payments and total. Read only. |

---

## 📱 Features
- ✅ Admin dashboard — total spent + per leader cards with progress bars
- ✅ Leader dashboard — only their own data
- ✅ Morning / Afternoon / Evening time selection
- ✅ Telugu + English — names auto-convert (Vasu → వాసు)
- ✅ Dark mode + Light mode
- ✅ Mobile friendly + PWA (install on phone)
- ✅ Export Excel
- ✅ Search + filter by leader, date, method, time of day
- ✅ PhonePe / Google Pay / Cash / Bank Transfer

---

## 📁 Structure
```
labour-tracker/
├── backend/
│   ├── server.js
│   ├── .env          ← MongoDB + JWT (ready!)
│   ├── config/db.js
│   ├── models/User.js
│   ├── models/Payment.js
│   ├── routes/auth.js
│   ├── routes/payments.js
│   └── middleware/auth.js
└── frontend/
    └── src/
        ├── App.js
        ├── context/AppContext.js
        ├── i18n/translations.js
        ├── components/Layout.js
        ├── components/PaymentForm.js
        └── pages/
            ├── Login.js
            ├── Dashboard.js
            ├── Payments.js
            ├── AddPayment.js
            ├── EditPayment.js
            ├── Leaders.js
            └── Settings.js
```

---

## 🌐 Deploy
- Backend → **Render** (root dir: `backend`, start: `node server.js`)
- Frontend → **Netlify** (root dir: `frontend`, build: `npm run build`, publish: `frontend/build`)
- Set `REACT_APP_API_URL=https://your-render-url.onrender.com/api` on Netlify

---

## 📱 Install as Mobile App (PWA)
1. Open app link in Chrome
2. Tap ⋮ menu → "Add to Home Screen"
3. Tap Install → App icon on phone! Works like native app!
