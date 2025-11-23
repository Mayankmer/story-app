AI Story Generator Web AppA React-based web application that uses Generative AI to create dynamic stories based on user-defined genres, characters, and plot outlines.PrerequisitesNode.js (Version 16 or higher)npm (comes with Node.js)A Google Gemini API Key (Get one here)Quick Setup GuideFollow these commands in your terminal to set up the project from scratch.1. Create the ProjectCreate a new Vite + React project:npm create vite@latest story-generator -- --template react
cd story-generator
2. Install DependenciesInstall the required packages (Tailwind CSS and Icons):npm install
npm install lucide-react
npm install tailwindcss @tailwindcss/vite

3. Configure StylesA. Update tailwind.config.jsReplace the content of vite.config.js with:
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
})

B. Update src/index.cssReplace the content of src/index.css with:@import "tailwindcss";;

4. Add Application CodeOpen src/App.jsx.Delete all existing code in that file.Paste the Story Generator code into src/App.jsx.5. Add Your API KeyOpen src/App.jsx and find line 6:const apiKey = "PASTE_YOUR_GEMINI_API_KEY_HERE";
Replace the empty string with your actual API Key.6. Run the AppStart the development server:npm run dev
Click the link in the terminal (usually http://localhost:5173) to open the app.