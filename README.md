# Odoo-Ldce-Hackathon-2026

# 🌍 GlobeTrotter – Empowering Personalized Travel Planning

> **Built for the Odoo Hackathon** 🏆

GlobeTrotter is a personalized, intelligent, and collaborative platform that transforms the way individuals plan and experience travel. It empowers users to dream, design, and organize trips with ease by offering an end-to-end travel planning tool that combines flexibility and interactivity.

---

## ✨ Key Features

This application implements 100% of the Odoo Hackathon requirements:

1. **Authentication:** Secure Login/Signup with JWT.
2. **Dashboard:** Central hub showing upcoming trips, stats, and saved destinations.
3. **Create Trip:** Initiate new trips with custom dates, names, and cover photos.
4. **Itinerary Builder:** Add cities, manage travel dates, and build your day-wise plan.
5. **City & Activity Discovery:** Search global destinations and filter activities by category (Sightseeing, Food, Culture, etc.), duration, and cost.
6. **Trip Budget:** Dynamic financial overview with interactive Donut & Bar charts, auto-calculating average daily costs, and alerting on high-spend days.
7. **Interactive Calendar:** A day-by-day vertical timeline featuring **Drag-and-Drop** functionality to effortlessly reorder your daily activities.
8. **Public Sharing:** Generate shareable, read-only itinerary links. Other users can "Copy Trip" to clone it to their account.
9. **User Profile:** Manage personal information, saved cities, and account preferences.
10. **Admin Dashboard:** A live analytics view monitoring platform adoption, user trends, and top destinations.

---

## 🛠 Tech Stack

- **Frontend:** React (Vite), React Router, Context API
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (with Prisma ORM)
- **Styling:** Custom CSS (Dynamic Light/Dark Themes, Glassmorphism, CSS Grids)

---

## 🚀 How to Run Locally

### 1. Backend Setup
Navigate to the `backend/` directory:
```bash
cd backend
npm install
```
Configure your `.env` file with your `DATABASE_URL` and `JWT_SECRET`.
Then, initialize the database:
```bash
npx prisma db push
npm run seed
npm run dev
```

### 2. Frontend Setup
Navigate to the `frontend/` directory in a new terminal:
```bash
cd frontend
npm install
npm run dev
```

The application will be running at `http://localhost:5173`. 
*(Note: The Vite development server automatically proxies API requests to the backend).*

---

## 💡 Why GlobeTrotter?
We built GlobeTrotter to simplify the complexity of planning multi-city travel. By leveraging a robust relational database and a smooth, dynamic frontend experience, we enable users to organize personalized trips efficiently, stay within budget, and enjoy full visibility of their journey.

