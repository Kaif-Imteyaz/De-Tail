# De-Tail: AI-Powered Search Interface

An intelligent search interface powered by DeepSeek AI and Tavily Search that delivers comprehensive answers with transparent reasoning and citations.

![De-Tail](public/preview.png)

## Features

- AI-powered search responses with step-by-step reasoning
- Real-time search results from Tavily Search API
- Transparent reasoning process for each answer
- Source citations and references
- Edge runtime for fast responses
- Real-time streaming responses

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- DeepSeek API key
- Tavily API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Kaif-Imteyaz/De-Tail.git
cd De-Tail
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory:
```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser. {any availabe prot}

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **AI Integration**: DeepSeek API
- **Search**: Tavily Search API
- **Streaming**: Vercel AI SDK
- **Deployment**: Vercel (recommended)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── deepseek/
│   │   │   └── chat/
│   │   │       └── route.ts
│   │   └── tavily/
│   │       └── search/
│   │           └── route.ts
│   ├── components/
│   │   └── Search.tsx
│   ├── layout.tsx
│   └── page.tsx
└── lib/
    └── utils.ts
```

## Deployment

1. Fork the repository
2. Create a new project on [Vercel](https://vercel.com)
3. Connect your forked repository
4. Add your environment variables in Vercel:
   - `DEEPSEEK_API_KEY`
   - `TAVILY_API_KEY`
5. Deploy!

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [@rileybrown_ai](https://x.com/rileybrown_ai) for inspiration 
- [@ansh](https://github.com/ansh) for the project template
- [DeepSeek](https://deepseek.com) for their powerful AI API
- [Tavily](https://tavily.com) for their search API
- [Vercel](https://vercel.com) for their amazing hosting platform

---

[Kaif Imteyaz](https://github.com/Kaif-Imteyaz)