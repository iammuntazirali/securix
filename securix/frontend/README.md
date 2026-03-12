# 🛡️ SECURELAB: Security Assessment Management System

**SECURELAB** is a centralized university laboratory management platform designed to streamline and monitor security audit workflows in a controlled academic environment. The system bridges the gap between Faculty, Teaching Assistants (TAs), and Students, allowing for structured security assessments and real-time performance tracking.

---

## 🚀 Project Overview
The project implements a multi-role architecture, ensuring that each user level has specific responsibilities and dedicated views:

* **Student Dashboard**: A module where students perform simulated security audits (SQLi, XSS, etc.) and log their findings.
* **TA Dashboard**: A monitoring panel for Teaching Assistants to track live group activity and assign grades based on technical proficiency.
* **Faculty Dashboard**: A high-level oversight panel for Faculty to manage TAs, track student attack history, and review overall lab performance.

---

## ✨ Key Features

### 👤 Role-Based Access Control
* **Student Interface**: Features a "Start Attack" simulation with live hacker-style terminal logs.
* **TA Interface**: Includes group-wise grading and the ability to review submitted vulnerabilities.
* **Faculty Interface**: Provides a comprehensive view of TA-to-Group assignments and historical attack logs for every student group.

### 🛠️ Educational Attack Vectors
The system is designed to track and simulate several popular cybersecurity assessments:
* **SQL Injection (SQLi)**: Evaluating database security and input sanitization.
* **Cross-Site Scripting (XSS)**: Auditing frontend script injection vulnerabilities.
* **Brute Force Simulation**: Analyzing authentication strength and credential security.

---

## 💻 Tech Stack
* **Frontend**: React.js + Vite (High-performance development)
* **Styling**: Tailwind CSS v4 (Premium dark-themed UI)
* **Icons**: Lucide-React
* **Routing**: React Router DOM v7 (Smooth navigation between dashboards)

---
