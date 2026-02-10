
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
# Database Configuration
DB_USER=lokeride_user
DB_PASSWORD=StrongPassword123!
DB_HOST=localhost
DB_NAME=lokeride_db

# Security (Ask Team Lead for the real key)
JWT_SECRET=paste-secret-key-here

```


*(Replace `YOUR_PASSWORD` with your actual MySQL root password)*

---

## 🗄️ Step 3: Database Setup

Here is the exact step-by-step to provision your database safely using the CLI.

### **Step 1: Open the Client**

1. Press your **Windows Key**.
2. Type **"MySQL 8.0 Command Line Client"**.
3. Click the black icon to open it.

### **Step 2: Log in as Root**

1. It will ask for `Enter password:`.
2. Type your **root** password.
* *Note: You won't see the cursor move or stars appear while typing. This is a security feature. Just type it blindly and hit Enter.*


3. You should see the welcome message: `mysql>`.

### **Step 3: Run the Commands**

Copy and paste these commands **one by one** (or all at once).

**How to Paste:** In the black window, you usually cannot use `Ctrl+V`. Instead, **right-click** anywhere on the title bar (or inside the window depending on your settings) to paste.

**1. Create the Database**

```sql
CREATE DATABASE lokeride_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

```

*Expected Output:* `Query OK, 1 row affected`

**2. Create the Secure User**
*(Replace 'StrongPassword123!' with your own strong password)*

```sql
CREATE USER 'lokeride_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';

```

*Expected Output:* `Query OK, 0 rows affected`

**3. Grant Permissions**

```sql
GRANT ALL PRIVILEGES ON lokeride_db.* TO 'lokeride_user'@'localhost';

```

*Expected Output:* `Query OK, 0 rows affected`

**4. Save Changes**

```sql
FLUSH PRIVILEGES;

```

*Expected Output:* `Query OK, 0 rows affected`

### **Step 4: Verify It Worked**

Run this command to check if your new user exists:

```sql
SELECT user, host FROM mysql.user WHERE user = 'lokeride_user';

```

If you see a table with `lokeride_user` and `localhost`, **you are successful!**

Type `exit` to close the window.


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
