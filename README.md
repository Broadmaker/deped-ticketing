# DepEd Zamboanga Sibugay — Helpdesk & Ticketing System

A web-based helpdesk ticketing system for the **Division of Zamboanga Sibugay**, Department of Education.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

### Installation

```bash
# 1. Navigate into the project folder
cd deped-ticketing

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will open at **http://localhost:3000**

---

## 📁 Project Structure

```
deped-ticketing/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AdminLayout.jsx  # Admin page wrapper (sidebar + topbar)
│   │   ├── AdminSidebar.jsx # Admin navigation sidebar
│   │   ├── Badges.jsx       # StatusBadge, PriorityBadge
│   │   ├── PublicHeader.jsx # Public site header + nav
│   │   └── PublicLayout.jsx # Public page wrapper (header + footer)
│   │
│   ├── data/
│   │   └── seed.js          # Offices, services, sample tickets
│   │
│   ├── hooks/
│   │   └── useTickets.jsx   # Global ticket state (React Context)
│   │
│   ├── pages/               # One file per page/route
│   │   ├── HomePage.jsx         # Public: Home
│   │   ├── SubmitPage.jsx       # Public: Submit a ticket
│   │   ├── TrackPage.jsx        # Public: Track a ticket
│   │   ├── AdminDashboard.jsx   # Admin: Dashboard
│   │   ├── AdminTicketList.jsx  # Admin: All tickets (filterable)
│   │   ├── AdminTicketDetail.jsx# Admin: Ticket detail + reply
│   │   └── AdminSettings.jsx    # Admin: Settings
│   │
│   ├── App.jsx              # Root component + React Router routes
│   ├── index.css            # Tailwind + global styles
│   ├── main.jsx             # React entry point
│   └── utils.js             # formatDate, status/priority configs
│
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

---

## 🎨 Theme

| Color   | Hex       | Usage                        |
|---------|-----------|------------------------------|
| Forest  | `#0B4E3D` | Primary (header, buttons)    |
| Gold    | `#FFC107` | Accent (CTA buttons, labels) |
| White   | `#FFFFFF` | Cards, backgrounds           |

Fonts: **Plus Jakarta Sans** (body) · **DM Serif Display** (headings)

---

## 📄 Current Pages

### Public
| Route      | Page              |
|------------|-------------------|
| `/`        | Home              |
| `/submit`  | Submit a Ticket   |
| `/track`   | Track a Ticket    |

### Admin
| Route                    | Page              |
|--------------------------|-------------------|
| `/admin`                 | Dashboard         |
| `/admin/tickets`         | All Tickets       |
| `/admin/tickets/:id`     | Ticket Detail     |
| `/admin/settings`        | Settings          |

---

## 🏢 Offices (Current)

- ✅ **ICT Office** — Active (8 services)
- 🔜 Records Office — Coming Soon
- 🔜 Budget & Finance — Coming Soon
- 🔜 Human Resources — Coming Soon

---

## 🗺️ Roadmap

- [ ] Connect to backend (Node.js + Express)
- [ ] MySQL / PostgreSQL database integration
- [ ] Login system (Admin + Office accounts)
- [ ] Add more offices and their services
- [ ] Email notifications on ticket submission
- [ ] File attachment support

---

## 📦 Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder — ready to deploy on the DepEd server.
