# School Billing System - Application Functions & Operations

This document highlights all key buttons, fields, and interactive elements within the application, explaining their purpose and intended operation.

## 🔑 Login Page (`/login`)
- **Email Address / Password Fields**: standard authentication inputs.
- **Sign In Button**: Submits credentials to `next-auth` for verification.
- **Remember Me Checkbox**: Keeps the user session active for longer periods.
- **Forgot Password**: Redirects to password recovery (Future Enhancement).
- **Quick Login Buttons (Admin, Principal, Parent)**: 
  - *Purpose*: For demo and testing.
  - *Operation*: Automatically populates the form with correct demo credentials and submits.

---

## 🏗️ Dashboard Overview (`/dashboard`)
- **Action Buttons by Role**:
  - **Super Admin**: 
    - `Add New School`: Navigates to the Schools management page.
    - `System Analytics`: Navigates to the Reports page for bird's-eye view data.
  - **Principal**:
    - `Add Student`: Navigates to the Students page to register new pupils.
    - `Generate Invoices`: Opens the invoicing section to bill parents.
  - **Parent**:
    - `Make Payment`: Navigates to the payments portal.
    - `View Statements`: Opens the invoice/history section.
- **Recent Payments Table**: Shows the 3 most recent transactions.
  - *Functional Goal*: Clicking a row should open transaction details.

---

## 🏫 Schools Management (`/dashboard/schools`) - *Admin Only*
- **Add New School Button**: Opens a modal or page to register a new school (Code, Name, Address, Principal).
- **View Analytics Button**: Filters system-wide reports to show data for that specific school.
- **Edit Settings Button**: Allows updating school contact info and payment shortcodes.
- **More (Vertical Dots)**: Secondary actions like "Suspend School" or "Delete".

---

## 🎓 Students Management (`/dashboard/students`) - *Principal Only*
- **Add New Student Button**: Opens a registration form (Name, Admission No, Class, Parent Phone).
- **Search Bar**: Real-time filtering of students by name or admission number.
- **Filter Button**: Refines student list by Class, Status (Active/Suspended), or Gender.
- **Edit Icon**: Opens student profile for modifications.
- **Trash Icon**: Removes student record (with confirmation).

---

## 💳 Payments & Invoices (`/dashboard/payments` / `/dashboard/invoices`)
- **Make Payment**: Triggers M-Pesa STK Push or opens the Paystack/Pesapal card gateway.
- **Download Invoice (PDF)**: Generates a downloadable fee statement for parents.
- **Filter by Term**: Allows viewing fee history by Term 1, 2, or 3.

---

## 📊 Shared Layout (`DashboardLayout`)
- **Sidebar Navigation**: Links to all core modules based on user permissions.
- **Mobile Menu Toggle (Hamburger)**: Opens/Closes sidebar on small screens.
- **Header Logout Button**: Securely ends the session and returns user to login.
- **Sidebar Sign Out**: Alternative logout point at the bottom of the navigation.
- **User Role Badge**: Displays the current user's authority level (e.g., SUPER ADMIN).
