# PulseMap

> **Discover, share, and explore locations around you — powered by AI.**

PulseMap is a full-stack, location-based social discovery platform where users can create and explore points of interest on an interactive map. Locations are automatically categorized using AI, clustered into events, and surfaced through personalized recommendations. The platform includes a web application for both regular users and administrators, and a mobile app for on-the-go exploration.

---

## Live Demo

🌐 [PulseMap](https://happy-rock-048299f03.4.azurestaticapps.net/)

---

## Tech Stack

### Backend
![.NET 8](https://img.shields.io/badge/.NET%208-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![ASP.NET Core](https://img.shields.io/badge/ASP.NET%20Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Entity Framework Core](https://img.shields.io/badge/Entity%20Framework%20Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Hangfire](https://img.shields.io/badge/Hangfire-1C1C1C?style=for-the-badge&logoColor=white)
![Azure Blob Storage](https://img.shields.io/badge/Azure%20Blob%20Storage-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)
![Azure OpenAI](https://img.shields.io/badge/Azure%20OpenAI-0078D4?style=for-the-badge&logo=openai&logoColor=white)

### Frontend — Web
![React 19](https://img.shields.io/badge/React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Material UI](https://img.shields.io/badge/Material%20UI-007FFF?style=for-the-badge&logo=mui&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

### Frontend — Mobile
![React Native](https://img.shields.io/badge/React%20Native-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![React Navigation](https://img.shields.io/badge/React%20Navigation-6B4FBB?style=for-the-badge&logoColor=white)

### Infrastructure & Tooling
![NX](https://img.shields.io/badge/NX%20Monorepo-143055?style=for-the-badge&logo=nx&logoColor=white)

---

## Architecture

PulseMap is organized as an **NX monorepo** with four main workspaces:

```
PulseMap/
├── backend/            # ASP.NET Core 8 REST API
├── frontend-web/       # React 19 Single Page Application
├── frontend-mobile/    # React Native / Expo mobile app
└── shared/             # Shared TypeScript types & utilities
```

<div align="center">  
   <img width="584" height="265" alt="image" src="https://github.com/user-attachments/assets/9202679f-2f93-44ed-92b7-89754096794e" />
</div>

---

## Features

---
<div align="center">  
  <img width="1919" height="946" alt="Home Page" src="https://github.com/user-attachments/assets/27568374-4b98-459f-9153-e3e598b9237f" />
</div>

## 🌐 Web App — User

### Interactive Map
Browse locations on a Leaflet-powered map with color-coded markers per category. Locations cluster at higher zoom levels; zoom in to interact and discover nearby places.

<div align="center">  
  <img width="1551" height="802" alt="image" src="https://github.com/user-attachments/assets/f0364fa4-8d2b-4094-8430-2295ee10c4bb" />
</div>

---

### Add a Location with AI Categorization
Create a new location by placing a pin on the map. The AI backend automatically suggests a category based on your description using embeddings and GPT, with a keyword fallback. Upload multiple images stored on Azure Blob Storage.

<div align="center">  
  <img width="433" height="429" alt="image" src="https://github.com/user-attachments/assets/d72a76fd-77f6-48de-8f07-bec891f77c3c" />
</div>

---

### Like, Comment & Reply
Engage with locations by liking them and leaving comments

<div align="center">  
  <img width="1043" height="740" alt="image" src="https://github.com/user-attachments/assets/ae4ff234-fca4-49ab-8680-8c4b0180ca0b" />
</div>

---

### Report a Location
Flag inappropriate or incorrect content using categorized report types: *location does not exist*, *misleading information*, *inappropriate content*, or *duplicate*.

<div align="center">  
<img width="561" height="305" alt="image" src="https://github.com/user-attachments/assets/d811499f-013d-4138-9ceb-4ea772f1173e" />
</div>

---

### AI-Powered Recommendations
A side panel surfaces 8 personalized location recommendations based on your interaction history and GPS bounds. Click any recommendation to focus the map on it.

<div align="center">  
  <img width="1919" height="879" alt="image" src="https://github.com/user-attachments/assets/a9716866-b3dd-494f-80de-06eab31c6f5e" />
</div>

---

### Event Visualization
Locations clustered by AI are grouped into events and displayed as overlay circles on the map, with confidence scores and review status.

<div align="center">  
  <img width="1560" height="809" alt="Interactive Map" src="https://github.com/user-attachments/assets/f4f24ea6-e7db-4955-90d7-f1e7fa15b0af" />
</div>

---

### My Locations
Manage all your created locations from a dedicated page. Filter by status: All, Active, Expired, or Pending Review. Approve or reject AI-generated event assignments with confidence scores.

<div align="center">  
  <img width="927" height="775" alt="image" src="https://github.com/user-attachments/assets/cdf1339f-c918-4bad-b6cd-f7ece51e1c72" />
</div>

---

### Statistics, Leaderboard & Hot Spots
Track your visit and upload count, compete with others on a ranked leaderboard (top 20 users), and discover the most visited Hot Spots in the app.

<div align="center">  
  <img width="874" height="352" alt="image" src="https://github.com/user-attachments/assets/5c7716ef-7754-4e81-bd27-49c8d0e0e0db" />
</div>

---

### Real-Time Updates via WebSocket
New locations and likes appear on the map live without refreshing, using WebSocket connections for real-time synchronization.

---

## 📱 Mobile App — User

> The mobile app is available exclusively for regular users. 

### Multi-Step Tutorial & Tips System
New users are guided through the app with an onboarding tutorial. Context-specific tips appear on key screens and can be toggled or reset from Settings.

<div align="center">  
  <img width="266" height="333" alt="image" src="https://github.com/user-attachments/assets/535e76cd-17a0-4136-8df0-4fd5e416e87a" />
  <img width="303" height="440" alt="image" src="https://github.com/user-attachments/assets/785e0516-b88b-47ac-a0db-58424fbfb8c2" />
</div>

---

### Interactive Map with Animated Proximity Markers
Explore locations on a mobile map with animated pulsing markers for places in your immediate vicinity. Zoom-based filtering shows neighborhood markers, city-level events, or nothing when fully zoomed out.
When you approach a registered location, the app shows a proximity card with options to confirm your visit, dismiss it, or report the location. Visits are recorded for the leaderboard.

<div align="center">  
  <img width="302" height="617" alt="image" src="https://github.com/user-attachments/assets/9b3c22ed-6112-4cb1-b2ef-1c59f5eff302" />
</div>

---

### Add Location with GPS & AI Category
Pin a new location at your current GPS position. Enter a description and the AI backend instantly suggests a category. For owned businesses, set a custom expiration duration in days and hours.

<div align="center">  
  <img width="309" height="571" alt="image" src="https://github.com/user-attachments/assets/c30329db-562f-4844-9842-9042ddbfe855" />
</div>

---

### AI Recommendations
A dedicated Recommendations screen shows personalized location suggestions scored 0–100, each with a reason, description, and like count. This time, it also depends on the distance between the user and that location.
Tap any card to navigate directly to the location on the map.

<div align="center">  
  <img width="301" height="558" alt="image" src="https://github.com/user-attachments/assets/9024ad1a-f2cd-4adb-a6ca-429618babb03" />
</div>

---

### Multilingual Support (EN / RO)
Switch between English and Romanian at any time from the Settings screen.

---

## 🌐 Web App — Admin

### Admin Map — Full Visibility & Control
Admins see every location in the system regardless of status. Right-click any marker to instantly expire, delete, or extend it. Hover tooltips show full metadata: creator, expiration, event confidence, and review status.

<div align="center">  
  <img width="1493" height="706" alt="image" src="https://github.com/user-attachments/assets/ea6f9de2-dd36-41ad-b38e-e7b6370e4254" />
</div>

---

### AI System Statistics
Monitor AI performance through rich charts: pie charts and bar graphs covering classification (HuggingFace / GPT / keyword fallback), event clustering, location matching, recommendation scoring, and translation service calls.

<div align="center">  
  <img width="1300" height="936" alt="image" src="https://github.com/user-attachments/assets/a571e308-ac0a-4235-b1d7-82e96e63d34f" />
</div>

---

### Background Jobs
Manually trigger and monitor background jobs: expire old locations/events, auto-extend popular locations by likes, run duplicate merging, and re-cluster events.

<div align="center">  
  <img width="874" height="498" alt="image" src="https://github.com/user-attachments/assets/f8c2158c-6fa2-4e9a-a58a-d85ebb6f021b" />
</div>

---

### Deduplication — Event Detection & Location Merging
Trigger AI-powered event detection by configuring a max distance parameter. Review clustered events with confidence scores, then force-merge duplicate locations by selecting a primary location and a merge strategy.

<div align="center">  
  <img width="876" height="794" alt="image" src="https://github.com/user-attachments/assets/6abcdb8c-f2d8-4707-8712-401ae6a7d829" />
</div>

---
