# De-Tail

De-Tail is an intelligent research assistant that combines **real-time web search** with **AI-powered analysis**. It delivers comprehensive answers with transparent reasoning and direct source citations, built to make research smoother and more reliable.

---

<img width="1784" height="577" alt="image" src="https://github.com/user-attachments/assets/0438a314-e17d-4928-a9f1-81a7f472e9b9" />


## Features

### Intelligent Search & Analysis
Automatically fetches relevant web results and processes them with AI.

### Transparent Reasoning
Displays the AI’s step-by-step thinking before the final answer.

### Source Citations
Includes clickable links to every reference material used.

### Real-Time Streaming
Watch responses unfold live as they’re generated.

### Client-Side API Keys
Input your API keys directly in the interface, no backend setup required.

---

## Getting Started

### Prerequisites

* Node.js **18.x** or later
* **OpenAI API key**
* **Tavily AI API key**

### Installation

#### Clone the repository

```bash
git clone https://github.com/Kaif-Imteyaz/De-Tail.git
cd De-Tail
```

#### Install dependencies

```bash
npm install
```

#### Run the development server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) and enter your API keys in the navbar to start using the app.

---

## Tech Stack

* **Framework:** Next.js 14 (App Router)
* **Styling:** Tailwind CSS
* **AI & Search:** OpenAI API, Tavily Search API
* **Streaming:** Vercel AI SDK

---

## How It Works
1. You submit a query and provide your API keys through the navbar.
2. The app uses the Tavily API to fetch relevant web sources.
3. These sources, along with your query, are sent to the OpenAI API.
4. The AI’s reasoning and final answer stream back in real-time, complete with citations.

---

## Deployment
Deploy directly to **Vercel** — zero configuration needed.
Once deployed, the app runs entirely client-side after you enter your API keys.

---

## License
Licensed under the **MIT License**.

---
### Built by [Kaif Imteyaz](https://github.com/Kaif-Imteyaz)
