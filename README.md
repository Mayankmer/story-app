Here is a clean, professional, and GitHub-ready README format:

---

# **AI Story Generator – React Web App**

A **React-based web application** that uses **Generative AI** to create dynamic stories based on user-defined genres, characters, and plot outlines.

---

## 🚀 **Features**

* Generate AI-powered stories
* Select genres, characters, and plot ideas
* Clean UI with Tailwind CSS
* Built with React + Vite
* Powered by Google Gemini API

---

## 📦 **Prerequisites**

Ensure the following are installed before setup:

* **Node.js** (v16 or higher)
* **npm** (comes with Node.js)
* **Google Gemini API Key**

---

## ⚙️ **Quick Setup Guide**

Follow these steps in your terminal to set up the project from scratch.

---

### **1. Create the Project**

```bash
npm create vite@latest story-generator -- --template react
cd story-generator
```

---

### **2. Install Dependencies**

Install required packages:

```bash
npm install
npm install lucide-react
npm install tailwindcss @tailwindcss/vite
```

---

### **3. Configure Styles**

#### **A. Update `vite.config.js`**

Replace the content with:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

#### **B. Update `src/index.css`**

Replace all content with:

```css
@import "tailwindcss";
```

---

### **4. Add Application Code**

* Open `src/App.jsx`
* Delete all existing code
* Paste the Story Generator application code

---

### **5. Add Your API Key**

In `src/App.jsx`, find:

```js
const apiKey = "PASTE_YOUR_GEMINI_API_KEY_HERE";
```

Replace the empty string with your actual API key.

---

### **6. Run the App**

Start the development server:

```bash
npm run dev
```

Open the link shown in the terminal (usually:
➡️ **[http://localhost:5173](http://localhost:5173)**)

---

If you want, I can also generate a polished project description, a license section, or GitHub badges!
