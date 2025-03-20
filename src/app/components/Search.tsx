'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';

interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [currentQuery, setCurrentQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<{ [key: string]: boolean }>({});
  const [hasSearched, setHasSearched] = useState(false);
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, append, isLoading: isChatLoading, error: chatError } = useChat({
    api: '/api/deepseek/chat',
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatMessage = (content: string) => {
    const reasoningMatch = content.match(/Step-by-step reasoning:\n([\s\S]*?)\n\nFinal Answer:\n([\s\S]*)/);
    if (reasoningMatch) {
      return {
        reasoning: reasoningMatch[1].trim(),
        finalAnswer: reasoningMatch[2].trim()
      };
    }
    return {
      reasoning: '',
      finalAnswer: content
    };
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading || isChatLoading) return;

    const newQuery = query;
    setCurrentQuery(newQuery);
    setQuery(''); // Clear input immediately
    setIsLoading(true);
    setError(null);
    setResults([]);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/tavily/search?query=${encodeURIComponent(newQuery)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch results');
      }

      setResults(data.results);
      
      await append({
        role: 'user',
        content: `Based on these search results, please provide a comprehensive answer to: ${newQuery}\n\nSearch Results:\n${JSON.stringify(data.results, null, 2)}`
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReasoning = (messageId: string) => {
    setExpandedReasoning(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  return (
    <div className="min-h-screen bg-[#18191B] text-white">
      {!hasSearched ? (
        // Initial centered view
        <div className="w-full pt-[35vh]">
          <h1 className="text-[40px] text-center font-medium mb-8 transition-opacity duration-300">
            What do you want to know?
          </h1>
          <div className="max-w-[800px] mx-auto px-4">
            <form onSubmit={handleSearch} className="relative">
              <div className="flex items-center bg-[#212224] rounded-2xl overflow-hidden border border-[#2D2F32]">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask anything..."
                  className="flex-1 bg-transparent px-4 py-3 text-white placeholder-gray-400 focus:outline-none"
                  disabled={isLoading || isChatLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || isChatLoading}
                  className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="relative min-h-screen">
          <div className="pb-24">
            <div className="max-w-[800px] mx-auto px-4 pt-8">
              <div className="mb-6">
                <h2 className="text-[28px] font-medium mb-6">{currentQuery}</h2>
              </div>

              {(error || chatError) && (
                <div className="bg-red-900/20 border border-red-700/50 text-red-200 px-4 py-3 rounded-xl mb-6">
                  <span>{error || (chatError instanceof Error ? chatError.message : 'An error occurred')}</span>
                </div>
              )}

              {isLoading ? (
                <div className="bg-[#1E1F21] rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M12 4V12M12 12V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      {/* <span className="font-medium">Auto</span> */}
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-400">Searching the web</span>
                    </div>
                  </div>
                  <div className="space-y-3 pl-6">
                    <div className="flex items-center gap-2 text-gray-400">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span className="text-sm">why {currentQuery} scientific explanation</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <div className="w-4 h-4 relative">
                        <div className="absolute inset-0 animate-spin">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 3V6M12 18V21M3 12H6M18 12H21M5.63604 5.63604L7.75736 7.75736M16.2426 16.2426L18.364 18.364M5.63604 18.364L7.75736 16.2426M16.2426 7.75736L18.364 5.63604" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                      </div>
                      <span className="text-sm">Reading</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span className="text-sm">Wrapping up</span>
                    </div>
                  </div>
                </div>
              ) : results.length > 0 && (
                <>
                  <div className="bg-[#1E1F21] rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <path d="M12 4V12M12 12V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        {/* <span className="font-medium">Auto</span> */}
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-400">{results.length} sources</span>
                      </div>
                      <button 
                        onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
                        className="text-gray-400 hover:text-gray-300"
                      >
                        <svg className={`w-4 h-4 transition-transform ${isSourcesExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none">
                          <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    {isSourcesExpanded && (
                      <div className="space-y-3 pl-6">
                        <div className="flex items-center gap-2 text-gray-400">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          <span className="text-sm">why {currentQuery} scientific explanation</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {results.map((result, index) => {
                            const domain = new URL(result.url).hostname;
                            return (
                              <a
                                key={index}
                                href={result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-300"
                              >
                                <img 
                                  src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                                  alt=""
                                  className="w-4 h-4 rounded"
                                />
                                <span>{domain.replace('www.', '')}</span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Article Links Section */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-gray-400">Sources</span>
                    </div>
                    <div className="flex overflow-x-auto gap-2 pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-[#1E1F21] [&::-webkit-scrollbar-thumb]:bg-[#2D2F32] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3D3F42]">
                      {results.map((result, index) => {
                        const domain = new URL(result.url).hostname;
                        return (
                          <a
                            key={index}
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 group bg-[#1E1F21] hover:bg-[#25262A] rounded-xl p-3 transition-colors w-[300px]"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <img 
                                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                                alt=""
                                className="w-4 h-4 rounded"
                              />
                              <span className="text-sm text-gray-400">{domain.replace('www.', '')}</span>
                            </div>
                            <h3 className="text-sm font-medium text-white group-hover:text-[#70B7FE] line-clamp-2">
                              {result.title}
                            </h3>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
                {messages.map((message, index) => (
                  message.role === 'user' && (
                    <div key={message.id} className="text-[28px] font-medium">
                      {message.content.split('\n')[0].replace('Based on these search results, please provide a comprehensive answer to: ', '')}
                    </div>
                  )
                ))}

                {messages.map((message) => (
                  message.role === 'assistant' && (
                    <div key={message.id} className="space-y-6">
                      {formatMessage(message.content).reasoning && (
                        <div className="relative">
                          <div className={`bg-[#2A2617] rounded-xl p-4 border border-[#3D3923] ${
                            expandedReasoning[message.id] ? '' : 'max-h-[200px] overflow-hidden'
                          }`}>
                            <h3 className="text-sm font-medium text-[#B4A054] mb-2">Thinking:</h3>
                            <div className="prose prose-invert max-w-none">
                              <p className="text-[#B4A054] text-sm whitespace-pre-wrap">
                                {formatMessage(message.content).reasoning}
                              </p>
                            </div>
                            {!expandedReasoning[message.id] && (
                              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#2A2617] to-transparent" />
                            )}
                          </div>
                          <button
                            onClick={() => toggleReasoning(message.id)}
                            className="mt-2 text-xs text-[#70B7FE] hover:text-[#89C4FE]"
                          >
                            {expandedReasoning[message.id] ? 'Show less' : 'Show more'}
                          </button>
                        </div>
                      )}

                      <div className="bg-[#212224] rounded-xl p-4">
                        <p className="text-white text-sm leading-relaxed">
                          {formatMessage(message.content).finalAnswer}
                        </p>
                      </div>
                    </div>
                  )
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Fixed bottom search bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-[#18191B] border-t border-[#2D2F32] p-4">
            <div className="max-w-[800px] mx-auto">
              <form onSubmit={handleSearch}>
                <div className="flex items-center bg-[#212224] rounded-2xl overflow-hidden border border-[#2D2F32]">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask anything..."
                    className="flex-1 bg-transparent px-4 py-3 text-white placeholder-gray-400 focus:outline-none"
                    disabled={isLoading || isChatLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || isChatLoading}
                    className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 