# EcoScan
EcoScan is an open-source mobile app designed for consumers that are unhealthy eaters with instant sustainability insights. Using Gemini AI and  barcode scanning, EcoScan decodes product information and receipts to reveal the environmental impact behind everyday purchases.

**WILL NOT WORK ON IOS YET...**

https://drive.google.com/file/d/1JDjZIYxFX6DVbBGRpW4MpkUml14uX4kR/view?usp=sharing

Qr Code Download for APK 





<img width="165" height="170" alt="image" src="https://github.com/user-attachments/assets/4c856bf5-c846-4487-90b1-6f5a7702fa8d" />




# Expo Scan

**Expo Scan** is a React Native app that lets users scan barcodes or receipts to get sustainability insights. The app analyzes product data, calculates environmental impact, and suggests eco-friendly alternatives.

## Features

- Barcode & receipt scanning with Expo Camera
- AI-powered sustainability scoring using Google Generative AI and Gemini
- Suggestions for eco-friendly alternatives
- User authentication & storage via Supabase
- Custom parsing system for accurate product & receipt data

## Tech Stack

- **Frontend:** React Native (TypeScript), Expo
- **Backend & Database:** Supabase
- **AI & Analysis:** Google Generative AI, Gemini
- **Local Storage:** AsyncStorage

## Data Models

### Product Data
```ts
interface ProductData {
  name: string;
  category: string;
  brand?: string;
  sustainabilityScore: number;
  impact: 'low' | 'medium' | 'high';
  carbonFootprint: number;
  waterUsage: number;
  packaging: 'minimal' | 'moderate' | 'excessive';
  alternatives: string[];
  reasons: string[];
}
Receipt Data
ts
Copy
Edit
interface ReceiptData {
  storeName: string;
  date: string;
  total: number;
  items: ReceiptItem[];
}

interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
  category: string;
}
```
## Installation
bash
Copy
Edit
git clone https://github.com/YuvaanshKapila/EcoScan.git
cd EcoScan
npm install
npx expo start
Usage
Register or login via Supabase

Scan barcodes or receipts

View sustainability insights and alternative suggestions

Scans are stored in Supabase for tracking

## Transparency
- Used AI for styling components like button input, etc, but created the scan result card mainly independently
- Open Food Facts implementation used AI for it
- Config files used AI
- Formatters and generation of the local stuff so Gemini doesn't be totality relied on it (not that bad, as that is not code but just some suggestions)
- Gemini prompts
- **NOT 30 PERCENT OF MY CODE, HOWEVER**
