# 🎒 CampusFind

> A MERN-stack web app to connect students who lose or find items within the university.  
> Unlike traditional boards that dump every request publicly, our system uses a **smart matching engine** to privately connect only relevant users.

---

## 🚀 Problem We Solve
Losing something on campus (ID card, earbuds, wallet…) is common, but:
- Most solutions just show a noisy public feed.
- Users must manually search through endless posts.
- Privacy is not respected.

---

## 💡 Our Twist (Differentiator)
- Requests are **not public** by default.
- Each Lost/Found request runs through a **matching algorithm** (tags, description, category, location).
- If similarity ≥ 60% → a **match is created**.
- Both users get an **email notification** + can **chat inside the app**.
- If no match yet, system waits → notifies when a future request matches.

This makes the platform **smarter, private, and effective**.

---

## ✨ Features (ST1 Milestone)
- Google OAuth2 login restricted to `@chitkara.edu.in` only.
- JWT-secured backend APIs.
- Create Lost or Found requests with category, description, tags, and location.
- Smart request-matching engine (private).
- Email notifications (SendGrid).
- Real-time chat via WebSockets.
- Dashboard shows **only your own requests** + their matches.

---

## 🛠️ Tech Stack
- **Frontend:** React (Vite) + TailwindCSS  
- **Backend:** Node.js + Express.js  
- **Database:** MongoDB (Atlas)  
- **Auth:** Google OAuth2 + JWT  
- **Real-time:** Socket.IO  
- **Email:** SendGrid  

---



