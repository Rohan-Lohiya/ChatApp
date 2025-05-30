![HomePage](https://github.com/user-attachments/assets/488fa0c0-3365-46d6-ac5a-0b291e0691b9)

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
git clone https://github.com/Rohan-Lohiya/ChatApp.git
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
FRONTEND_URL=http://localhost:3000
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

When deploying:

1. Set production `.env` files for both backend and frontend.
2. Update Google Cloud Console's **OAuth consent screen** and **Authorized Redirect URIs** to match your deployed domain.

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

![AboutPage](https://github.com/user-attachments/assets/eeeee1d0-8e80-4a3d-bcf1-a2e68cdbaa24)
![GroupChat](https://github.com/user-attachments/assets/e4510349-2aa6-4653-ac5a-87fb9f87c551)
![SingleChat](https://github.com/user-attachments/assets/d3da0a8c-f083-4895-bb0b-2ffa9c3c1d60)

---

## 🧑‍💻 Author

**Rohan Lohiya**  
IIIT Guwahati

---

## 📝 License

This project is licensed under the MIT License.
