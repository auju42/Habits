# Deployment & Data Storage Guide

## 📱 How to Access from Different Devices

Since this is a web application, you can access it from your phone, tablet, or other computers. Here are the best ways:

### Option 1: Deploy to Vercel (Recommended)
This is the easiest way to get a permanent URL (e.g., `https://my-habit-tracker.vercel.app`) that works everywhere.

1. Create a [GitHub repository](https://github.com/new) and push your code.
2. Sign up at [Vercel.com](https://vercel.com).
3. "Add New Project" -> Import your GitHub repo.
4. Add your Environment Variables (from your `.env` file) in Vercel settings.
5. Click **Deploy**.

### Option 2: Access via Local Network (Home Wi-Fi)
If you just want to test on your phone while your computer is running:

1. Use the command `npm run dev -- --host` in your terminal.
2. The terminal will show a Network URL, usually something like: `http://192.168.1.5:5173`.
3. Type that exact URL into your phone's browser (must be on same Wi-Fi).

---

## 💾 Where is Data Stored?

Your data is stored in the **Cloud** using **Google Firebase Firestore**.

- **Not on your device**: It is NOT saved only on your laptop.
- **Synced Everywhere**: Because it's in the cloud, if you log in with your Google account on your phone, you will see the exact same habits and data as on your laptop.
- **Offline Support**: Firebase has some offline capabilities, but updates are synced to the central database when you reconnect.

### Technical Details
- **Database**: Firestore (NoSQL document database)
- **Structure**:
  - Collection: `users`
    - Document: `userId` (your unique Google ID)
      - Subcollection: `habits` (your habits)
      - Subcollection: `tasks` (your to-do items)

This means your data is safe even if you clear your browser cache or switch computers!

---

## ❓ FAQ & Security

### 1. Will everyone see my data if I push to GitHub?
**NO.**
Your habits and personal data are stored in the **Firebase Database**, NOT in your code files. When you push to GitHub, you are only analyzing the *recipe* (the code), not the *ingredients* (your actual data).

### 2. What about my API Keys?
We have configured the project to protect your keys:
- **.gitignore**: We added `.env` to this file. This tells git to **IGNORE** your secrets file. It will NOT be uploaded to GitHub.
- **Environment Variables**: When you deploy to Vercel, you will paste these keys into Vercel's secure dashboard.

**Important**: 
- Never upload your `.env` file manually.
- Firebase keys are actually safe to be public (they identify your app, like a phone number), but keeping them secret helps prevent strangers from using your quota.
