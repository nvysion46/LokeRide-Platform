This is a crucial step. Since your project is now professional, you need a professional **"README"** file. This is the first thing any new developer will read to set up the project on their machine without asking you 100 questions.

Here is a complete, copy-pasteable **Onboarding Guide**. You can copy this text and save it as `README.md` in your main project folder, or just email it to new team members.

---

# 🚗 LokeRide Platform - Developer Setup Guide

Welcome to the LokeRide development team! Follow these instructions to set up the project locally on your machine.

## 🛠️ Prerequisites

Before starting, ensure you have the following installed:

* **VS Code** (Code Editor)
* **Python 3.10+** (Backend)
* **Node.js & npm** (Frontend)
* **MySQL Server** (Database)
* **Git** (Version Control)

---

## 🚀 Step 1: Clone the Repository

Open your terminal or command prompt and run:

```bash
git clone https://github.com/nvysion46/LokeRide-Platform.git
cd LokeRide-Platform

```

---

## 🐍 Step 2: Backend Setup (Flask)

1. **Create a Virtual Environment:**
```bash
python -m venv venv

```


2. **Activate the Environment:**
* *Windows:* `.\venv\Scripts\activate`
* *Mac/Linux:* `source venv/bin/activate`


3. **Install Dependencies:**
```bash
pip install -r requirements.txt

```


4. **Configure Environment Variables:**
Create a new file named `.env` in the root folder and add the following config (ask the Team Lead for specific secrets):
```ini
SECRET_KEY=your_secret_key_here
SQLALCHEMY_DATABASE_URI=mysql+pymysql://root:YOUR_PASSWORD@localhost/rental_car

```


*(Replace `YOUR_PASSWORD` with your actual MySQL root password)*

---

## 🗄️ Step 3: Database Setup

**Crucial:** Do NOT create tables manually. We use migrations.

1. **Create the Empty Database:**
Open MySQL Workbench or your terminal and run this SQL command:
```sql
CREATE DATABASE rental_car;

```


2. **Apply Migrations (Create Tables):**
Back in your VS Code terminal (with `venv` active), run:
```bash
flask db upgrade

```


*✅ Success Message: This will automatically generate the `users`, `cars`, and `bookings` tables.*

---

## ⚛️ Step 4: Frontend Setup (React)

1. **Navigate to the Client Folder:**
Open a **new** terminal (split terminal in VS Code) and run:
```bash
cd client

```


2. **Install Node Modules:**
```bash
npm install

```


*(This installs React, Vite, Tailwind, etc.)*

---

## 🏁 Step 5: Running the Project

You will need **two** terminal windows running simultaneously:

### Terminal 1: Backend (Flask)

```bash
# Make sure you are in the root folder and venv is active
python run.py

```

*Server runs at: `http://127.0.0.1:5000*`

### Terminal 2: Frontend (React)

```bash
# Make sure you are in the client folder
npm run dev

```

*UI runs at: `http://localhost:5173*`

---

## ❓ Troubleshooting

* **"Table already exists" error?**
If you manually created tables before running migrations, run this command to sync:
`flask db stamp head`
* **"Module not found"?**
Make sure your virtual environment is activated (`(venv)` should appear in your terminal).

---
