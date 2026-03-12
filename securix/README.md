# SECURELABS How to Run the Project

This guide provides step-by-step instructions on how to set up and run the **SECURELABS** project from scratch on a new system.

---

## 1. Prerequisites (What needs to be installed?)
Before running the project, ensure that the following are installed on your system:
1. **Node.js** (v18 or higher) - Required as the JavaScript runtime for both the backend and frontend.
2. **Nmap** - Required for network scanning (the backend relies on it).
   - *Linux (Ubuntu):* `sudo apt install nmap`
   - *Windows:* Download and install from the official Nmap website (ensure it is added to the Environment Variables/PATH).
3. **MongoDB Atlas Account** (A cloud database is recommended, but you can also use a local MongoDB setup).

---

## 2. Backend Setup & Run (Server)

The backend is built with **Node.js, Express, and MongoDB**. To run it:

**Step 1: Navigate to the backend folder**
```bash
cd /path/to/SECURELABS/backend
```

**Step 2: Install Dependencies**
```bash
npm install
```
*(This command reads `package.json` and downloads necessary packages like express, mongoose, socket.io, jwt, bcryptjs, etc.)*

**Step 3: Environment Variables Setup (.env file)**
There must be a `.env` file inside the backend folder. Do not delete this file. It contains important details:


```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster... (Your MongoDB URI)
JWT_SECRET=your_super_secret_jwt_key
```

**Step 4: Start the Backend Server**
```bash
node server.js
```
*You should see this output in the terminal:*
```text
  SECURELABS Backend running on http://localhost:5000
  MongoDB Connected
```

---

## 3. Frontend Setup & Run 

The frontend is built with **React (Vite) and Tailwind CSS**. This needs to be run in a separate terminal.

**Step 1: Open a new terminal and navigate to the frontend folder**
```bash
cd /path/to/SECURELABS/frontend
```

**Step 2: Install Dependencies**
```bash
npm install
```
*(This installs vite, react, react-router-dom, react-icons, socket.io-client, etc.)*

**Step 3: Start the Frontend Server**
```bash
npm run dev
```

*You should see this output in the terminal:*
```text
  VITE v5.0.0  ready in 200 ms
  ➜  Local:   http://localhost:5173/
```

---

## 4. How to Access the Website?

When both the **Backend (Port 5000)** and **Frontend (Port 5173)** are running:

1. Open your web browser (Chrome/Brave).
2. Type in the URL bar: `http://localhost:5173`
3. You will see the **SECURELABS Landing Page**.
4. Click on "Get Started" to **Login / Signup** and access your Dashboard.

---
