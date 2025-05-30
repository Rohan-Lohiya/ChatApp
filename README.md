# 🗨️ ChatBox

A full-stack real-time chat application with support for **single** and **group chats**, admin controls, theming, and seamless authentication. Built with **Next.js**, **Node.js**, and **Socket.IO**.

---

## ✨ Features

### 💬 Chat Functionality
- **Single and Group Chats** with real-time messaging via **Socket.IO**
- **Enter to Send** toggle
- **User “About” Info** customization

### 👥 Group Features
- Group **Admin** roles:
  - Add/remove participants
  - Delete others’ messages
  - Make other users admins
  - Change group description

### 🎨 User Interface
- Simple and intuitive UI
- **Dark/Light Theme** toggle

### 🔐 Authentication
- Google Sign-In via **NextAuth.js**
- Token management using **NextAuth Token**

---

## ⚙️ Tech Stack

### Frontend
- **Next.js**
- **Redux** for state management
- **Socket.IO** client
- **Axios** and **Fetch API** for requests
- **Fuse.js** for fuzzy search
- **ReactBits UI Library**
- **NextAuth.js** for authentication

### Backend
- **Node.js** + **Express.js**
- **Socket.IO** for real-time communication
- **MongoDB** with **Mongoose**
- **JWT** for token management
- **UUID** for unique identifiers

---

## 🛠️ Setup Instructions

### 1. Clone the repo
```bash
git clone https://github.com/your-username/chatsphere.git
cd ChatApp
```

### 2. Set up environment variables

#### Frontend (`.env.local`)
```env
GOOGLE_ID=your_google_client_id
GOOGLE_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret(create_your_own_and_use_same_in_backend)
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

#### Backend (`.env`)
```env
MONGO_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=same_as_frontend
```

### 3. Install dependencies

#### Frontend
```bash
cd frontend
npm install
```

#### Backend
```bash
cd backend
npm install
```

### 4. Run the app

#### Start Backend
```bash
nodemon server.js
```

#### Start Frontend
```bash
npm run dev
```

---

## 🚀 Deployment

- Frontend: [Vercel](https://vercel.com/)
- Backend: [Vercel Functions](https://vercel.com/docs/functions) or [Render](https://render.com/), [Railway](https://railway.app/), or any Node host

---

## 📂 Project Structure

```
frontend/
  ├── app/
  ├── components/
  ├── public/
  ├── .env.local
  ├── next.config.js
  └── ...

backend/
  ├── controller/
  ├── dbconnection/
  ├── model/
  ├── socket/
  ├── server.js
  ├── Socket.js
  ├── .env
  └── ...
```

---

## 📸 Screenshots

> Add some screenshots or a short demo video/gif to showcase the UI and features.

---

## 🧑‍💻 Author

**Rohan Lohiya**  
[LinkedIn](https://linkedin.com/in/your-profile) • [GitHub](https://github.com/your-username)

---

## 📝 License

This project is licensed under the MIT License.
