# BiteBack

**NUS Orbital 2025 (CP2106 Independent Software Development Project)**  
**Level of Achievement:** Artemis  

Team: **Cameron Loh** & **Benjamin Lua**

---

## Table of Contents
- [Links](#links)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Test Accounts](#test-accounts)
- [User Stories](#user-stories)
- [Key Features](#key-features)
- [Timeline](#timeline)
- [Tech Stack](#tech-stack)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [Infrastructure](#infrastructure)
- [Quality Control](#quality-control)
- [User Testing Highlights](#user-testing-highlights)
- [Contributors](#contributors)

---

## Links
- [Project Log](https://docs.google.com/spreadsheets/d/1s-sSeM4Fq58qKQQO1nC40RBrVHXb6kZMcgcEghLOK8o/edit?usp=sharing)  
- [Poster](https://drive.google.com/file/d/1GkwMfaw_nBQDfVGXWDjr02P-5MEFWtRw/view?usp=sharing)  
- [Web App](https://bite-back-henna.vercel.app/)  
- [Demo Video](https://drive.google.com/file/d/1F4-OC16n7WdZU_Ftr5Vm3tWuQXvxo4G4/view?usp=share_link)  

---

## Problem Statement
Many SMEs (e.g., Sushiro, Shi Li Fang, NUS vendors like The Acai Truck) still rely on outdated **hardcopy reward cards** for customer loyalty.  
These are inefficient, prone to loss/damage, and lack personalization, leading to weaker customer relationships and missed retention opportunities.  

---

## Solution
BiteBack is a **digital restaurant engagement platform** enabling SMEs to:
- Digital loyalty & rewards tracking
- Real-time feedback loop (reviews + owner replies)
- Online reservations & virtual queues
- Restaurant search & discovery
- Promotions management
- Analytics dashboard for owners
- Event booking & pre-order system
- Secure authentication system with Google OAuth

**Stack:** MERN (MongoDB, Express.js, React, Node.js) + Tailwind + ShadCN UI + Mapbox + D3.js

---

## Test Accounts
You can use the following test accounts to try different roles in the application:

### Customer
Username: testCustomer
Password: Password@123

### Restaurant Owner
Username: testOwner
Password: Password@123

*(Alternatively, sign in with Google OAuth for a demo account.)*

---

## User Stories
### Customers
- Track visit history & loyalty rewards  
- Submit feedback/reviews  
- Receive personalized promotions  
- Discover & follow restaurants nearby  

### Restaurant Owners / Staff
- View and reply to customer reviews  
- Manage reservations, queues, events, promotions  
- Track customer loyalty and analytics trends  

---

## Key Features
- **Reservation Booking** – Customers can book, edit, cancel; staff can mark as attended/no-show.  
- **Review Feedback Loop** – Post, update, delete reviews; owners reply and monitor ratings.  
- **Search & Discovery** – Search by name, cuisine, location, tags. Geo search via Mapbox.  
- **Online Queue** – Digital walk-in queue system grouped by party size.  
- **Promotions** – Owners create campaigns, customers browse and filter active offers.  
- **Analytics** – Real-time & historical metrics for owners (reservations, queues, reviews).  
- **Rewards** – Points per restaurant, redeemable for discounts/items.  
- **Event Booking** – Slot-based reservations, including member-only events.  
- **Pre-Order System** – Customers queue and order ahead; kitchen/staff workflow optimized.  
- **Authentication** – Email + Google OAuth, JWT sessions, role-based access.    

---

## Timeline
- **May:** Ideation, login system, reservation feature  
- **June:** Reviews, search/discovery, online queue, promotions, analytics  
- **July:** Rewards, events, pre-orders, OAuth authentication  

---

## Tech Stack

### Frontend
- React.js (SPA, hooks, reusable components)  
- Tailwind + ShadCN UI (UI components)  
- Axios (API calls)  
- React Hook Form + Joi (validation)  
- D3.js (charts/analytics)  
- Mapbox/Leaflet (maps)  

### Backend
- Node.js + Express.js (REST API)  
- MongoDB + Mongoose (database + schema validation)  
- JWT Authentication + RBAC (role-based access)  
- Jest + Supertest (unit & integration tests)  

### Infrastructure
- CI/CD with GitHub Actions & Heroku  
- Frontend deployed on Vercel  
- Logging: Winston & Sentry  

---

## Quality Control
- Automated tests (unit + integration) with Jest & Supertest  
- Manual E2E testing for authentication, reservations, reviews, queues, etc.  
- Linting (ESLint) + pre-commit hooks (Husky)  
- Pull request reviews and CI pipeline  

---

## User Testing Highlights
- **Top customer features:** Events (5/5) and Pre-Orders (4.88/5)  
- **Top owner features:** Rewards Tracking (5/5) and Authentication (4.88/5)  
- Positive feedback on queue management, analytics, rewards  
- Suggested improvements: calendar sync for reservations, better filters, data exports  

---

## Contributors
- [Cameron Loh](https://github.com/cameronlzy)  
- [Benjamin Lua](https://github.com/lkxben)  
