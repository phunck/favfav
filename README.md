# .favfav – The Ultimate Favicon Generator

**.favfav** is a lightweight, privacy-friendly favicon generator built with [Next.js](https://nextjs.org/) and [TypeScript](https://www.typescriptlang.org/).  
It lets you create pixel-perfect favicon sets in seconds – including `.ico`, Apple Touch, Android, Windows Tiles, and PWA assets – all neatly packaged in a ZIP.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## 🚀 Features

- **One-click generation** of complete favicon sets  
- Generates real `.ico` files (up to 256×256)  
- Includes optional **Apple Touch**, **Android / PWA**, and **Windows** icons  
- Smart recommendations for image sizes (256×256 or 512×512 for PWAs)  
- **Pro Mode** – upload pixel-perfect images per size, no automatic scaling  
- Clean, modern UI with gradient themes  
- Built-in Stripe donation dialog (thank-you modal after download)  
- Fully client-side image processing using Node.js and Sharp  
- No tracking, no cookies, no nonsense  

---

## 🧰 Tech Stack

- **Next.js 16 (App Router)**
- **TypeScript**
- **React 18**
- **Sharp**
- **png-to-ico**
- **Tailwind CSS**
- **Shadcn/UI Components**
- **Stripe Checkout (optional)**

---

## 💡 Usage

1. Upload a single image (recommended: **256×256 px**)  
2. Choose the platforms you want (Apple, Android, Windows)  
3. Hit **Generate Favicons**  
4. Download your ZIP file  
5. *(Optional)* Support the project via the Stripe dialog 💙  

---

## 🧑‍💻 Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build

# Start the production build
npm start