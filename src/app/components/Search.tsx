"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";
import Navbar from "./Navbar";

interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

interface ConversationTurn {
  query: string;
  results: SearchResult[];
  timestamp: number;
  assistantMessage: string;
}

export default function Search() {
  // User input state management
  const [query, setQuery] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");

  // Search results and UI state
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<{
    [key: string]: boolean;
  }>({});
  const [hasSearched, setHasSearched] = useState(false);
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);

  // New feature: Copy to clipboard functionality
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Auto-scroll functionality
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Track if user is scrolling up to read history
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  
  // Track conversation history - each turn has query, results, and assistant response
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);

  // New: Track streaming content with better parsing
  const [streamingContent, setStreamingContent] = useState<{
    fullContent: string;
    currentSection: 'reasoning' | 'answer' | 'none';
    isStreaming: boolean;
  }>({
    fullContent: "",
    currentSection: 'none',
    isStreaming: false
  });

  const {
    messages,
    append,
    isLoading: isChatLoading,
    error: chatError,
  } = useChat({
    api: "/api/openai/chat",
    onError: (error) => {
      console.error("Chat API error:", error);
      setError(error.message);
      setStreamingContent(prev => ({ ...prev, isStreaming: false }));
    },
    onFinish: (message) => {
      console.log("Chat finished:", message);
      // Update the conversation history with the completed message
      setConversationHistory(prev => {
        const newHistory = [...prev];
        if (newHistory.length > 0) {
          newHistory[newHistory.length - 1] = {
            ...newHistory[newHistory.length - 1],
            assistantMessage: message.content
          };
        }
        return newHistory;
      });
      setStreamingContent({
        fullContent: "",
        currentSection: 'none',
        isStreaming: false
      });
    },
    onResponse: (response) => {
      console.log("Chat response received");
      setStreamingContent({
        fullContent: "",
        currentSection: 'reasoning',
        isStreaming: true
      });
    },
    // Custom fetch function to include API key
    fetch: async (url, options) => {
      const aiApiKey = localStorage.getItem('aiApiKey');
      if (!aiApiKey) {
        throw new Error('OpenAI API key not found');
      }

      // Add API key to the request body
      if (options?.body) {
        const body = JSON.parse(options.body as string);
        body.apiKey = aiApiKey;
        options.body = JSON.stringify(body);
      }

      return fetch(url, options);
    },
  });

  // New: Process streaming content with better section detection
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage?.role === 'assistant' && streamingContent.isStreaming) {
      const newContent = lastMessage.content;
      setStreamingContent(prev => {
        // If this is new content (not the same as before)
        if (newContent !== prev.fullContent) {
          let currentSection = prev.currentSection;
          
          // Detect section transitions
          if (newContent.includes('Final Answer:') || newContent.includes('Answer:')) {
            currentSection = 'answer';
          } else if (newContent.includes('Step-by-step reasoning:') || newContent.includes('Reasoning:')) {
            currentSection = 'reasoning';
          }
          
          return {
            fullContent: newContent,
            currentSection,
            isStreaming: true
          };
        }
        return prev;
      });
    }
  }, [messages, streamingContent.isStreaming]);

  const formatMessage = (content: string) => {
    // Try multiple patterns to extract reasoning and final answer
    const patterns = [
      /Step-by-step reasoning:\n([\s\S]*?)\n\nFinal Answer:\n([\s\S]*)/,
      /Reasoning:\n([\s\S]*?)\n\nAnswer:\n([\s\S]*)/,
      /Thinking:\n([\s\S]*?)\n\nAnswer:\n([\s\S]*)/,
      /Analysis:\n([\s\S]*?)\n\nConclusion:\n([\s\S]*)/,
      /(?:Reasoning|Thinking|Analysis):\s*([\s\S]*?)(?:\n\n|\r\n\r\n)(?:Answer|Final Answer|Conclusion):\s*([\s\S]*)/
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return {
          reasoning: match[1].trim(),
          finalAnswer: match[2].trim(),
        };
      }
    }

    // If no pattern matches, treat the whole content as final answer
    return {
      reasoning: "",
      finalAnswer: content,
    };
  };

  // Extract sections from streaming content
  const getStreamingSections = () => {
    const content = streamingContent.fullContent;
    
    // Try to extract reasoning and answer
    const reasoningMatch = content.match(/(?:Step-by-step reasoning:|Reasoning:|Thinking:|Analysis:)\s*([\s\S]*?)(?=(?:Final Answer:|Answer:|Conclusion:)|$)/);
    const answerMatch = content.match(/(?:Final Answer:|Answer:|Conclusion:)\s*([\s\S]*)/);
    
    return {
      reasoning: reasoningMatch ? reasoningMatch[1].trim() : '',
      finalAnswer: answerMatch ? answerMatch[1].trim() : ''
    };
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading || isChatLoading) return;

    const aiApiKey = localStorage.getItem('aiApiKey');
    const tavilyApiKey = localStorage.getItem('tavilyApiKey');

    if (!aiApiKey || !tavilyApiKey) {
      setError('Please configure API keys in settings');
      return;
    }

    const newQuery = query;
    setCurrentQuery(newQuery);
    setQuery('');
    setIsLoading(true);
    setError(null);
    setResults([]);
    setHasSearched(true);
    setStreamingContent({
      fullContent: "",
      currentSection: 'none',
      isStreaming: false
    });

    try {
      console.log('Starting search with query:', newQuery);
      
      // Search with Tavily API key
      const searchResponse = await fetch(
        `/api/tavily/search?query=${encodeURIComponent(newQuery)}&apiKey=${encodeURIComponent(tavilyApiKey)}`
      );
      
      if (!searchResponse.ok) {
        const errorData = await searchResponse.json();
        throw new Error(errorData.error || `Search failed: ${searchResponse.status}`);
      }
      
      const searchData = await searchResponse.json();
      console.log('Search results received:', searchData.results?.length);

      if (!searchData.results || searchData.results.length === 0) {
        throw new Error('No search results found for your query');
      }

      setResults(searchData.results);
      
      // Add to conversation history with empty assistant message (will be filled later)
      const newConversationTurn: ConversationTurn = {
        query: newQuery,
        results: searchData.results,
        timestamp: Date.now(),
        assistantMessage: ""
      };
      
      setConversationHistory(prev => [...prev, newConversationTurn]);
      
      console.log('Sending to OpenAI with API key:', aiApiKey ? 'Present' : 'Missing');
      
      // Use a prompt that encourages detailed reasoning and comprehensive answers
      const userMessage = {
        role: 'user' as const,
        content: `Based on the following search results, please provide a comprehensive and detailed response.

First, carefully analyze the information and provide your step-by-step reasoning process. Consider different aspects, verify facts from multiple sources, and explain your thought process thoroughly.

Then, provide a comprehensive final answer that synthesizes all the relevant information. Make sure the answer is detailed, well-structured, and addresses the question completely.

Question: ${newQuery}

Search Results:
${JSON.stringify(searchData.results, null, 2)}

Please structure your response as follows:

Step-by-step reasoning:
[Your detailed reasoning process here - analyze the search results, compare information, verify facts, and explain your thinking]

Final Answer:
[Your comprehensive and detailed answer here - synthesize the information into a complete response]`
      };

      // The API key will be added automatically by the custom fetch function
      await append(userMessage);

      console.log('Message sent to OpenAI successfully');

    } catch (err) {
      console.error('Search error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        setError('OpenAI rate limit reached. Please wait a moment and try again.');
      } else if (errorMessage.includes('API key') || errorMessage.includes('401')) {
        setError('Invalid or missing API key. Please check your API keys in settings.');
      } else {
        setError(errorMessage);
      }
      setStreamingContent(prev => ({ ...prev, isStreaming: false }));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReasoning = (messageId: string) => {
    setExpandedReasoning((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  // Copy to clipboard functionality
  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Handle scroll events to detect when user is reading history
  const handleScroll = () => {
    if (!chatContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
    setIsScrolledUp(!isAtBottom);
  };

  // Auto-scroll to bottom for new messages
  useEffect(() => {
    if (!isScrolledUp && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isScrolledUp, streamingContent]);

  // Get current conversation index
  const currentConversationIndex = conversationHistory.length - 1;

  return (
    <div className="flex flex-col min-h-screen bg-[#18191B] text-white">
      <Navbar />

      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
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
                      <path
                        d="M5 12H19M19 12L12 5M19 12L12 19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
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
                {/* Main conversation area - Show ALL conversation history */}
                <div className="space-y-8">
                  {conversationHistory.map((turn, index) => {
                    const hasAssistantMessage = turn.assistantMessage.trim().length > 0;
                    const formattedMessage = hasAssistantMessage ? formatMessage(turn.assistantMessage) : null;
                    const hasReasoning = formattedMessage && formattedMessage.reasoning.trim().length > 0;
                    const isCurrentStreaming = streamingContent.isStreaming && index === currentConversationIndex;
                    const streamingSections = getStreamingSections();
                    
                    return (
                      <div key={index} className="space-y-6">
                        {/* User Question */}
                        <div className="mb-6">
                          <h2 className="text-[28px] font-medium mb-6">
                            {turn.query}
                          </h2>
                        </div>

                        {/* Search Results for this turn */}
                        {turn.results.length > 0 && (
                          <>
                            <div className="bg-[#1E1F21] rounded-xl p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 4V12M12 12V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                  </svg>
                                  <span className="text-sm text-gray-500">•</span>
                                  <span className="text-sm text-gray-400">
                                    {turn.results.length} sources found
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Article Links Section */}
                            <div className="mb-6">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm text-gray-400">Sources</span>
                              </div>
                              <div className="flex overflow-x-auto gap-2 pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-[#1E1F21] [&::-webkit-scrollbar-thumb]:bg-[#2D2F32] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3D3F42]">
                                {turn.results.map((result, resultIndex) => {
                                  const domain = new URL(result.url).hostname;
                                  return (
                                    <a
                                      key={resultIndex}
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
                                        <span className="text-sm text-gray-400">
                                          {domain.replace("www.", "")}
                                        </span>
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

                        {/* Assistant Answer */}
                        <div className="space-y-4">
                          {/* REAL-TIME REASONING STREAM - Show only during reasoning phase */}
                          {(isCurrentStreaming && streamingContent.currentSection === 'reasoning') && (
                            <div className="bg-[#2A2617] rounded-xl border border-[#3D3923] overflow-hidden">
                              <div className="px-4 py-3 flex items-center justify-between border-b border-[#3D3923]">
                                <div className="flex items-center gap-3">
                                  <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-[#B4A054] rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-[#B4A054] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-[#B4A054] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                  </div>
                                  <h3 className="text-sm font-medium text-[#B4A054]">
                                    Thinking...
                                  </h3>
                                </div>
                                <span className="text-xs text-[#B4A054] bg-[#3D3923] px-2 py-1 rounded">
                                  Live
                                </span>
                              </div>
                              <div className="px-4 py-4">
                                <div className="prose prose-invert max-w-none">
                                  <p className="text-[#B4A054] text-sm whitespace-pre-wrap leading-relaxed font-mono">
                                    {streamingSections.reasoning}
                                    <span className="inline-block w-2 h-4 bg-[#B4A054] ml-1 animate-pulse"></span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* FINAL REASONING SECTION (Collapsible) - Show after streaming completes */}
                          {hasReasoning && !isCurrentStreaming && (
                            <div className="bg-[#2A2617] rounded-xl border border-[#3D3923] overflow-hidden">
                              <button
                                onClick={() => toggleReasoning(`turn-${index}`)}
                                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#3D3923] transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <svg 
                                    className={`w-4 h-4 text-[#B4A054] transition-transform ${expandedReasoning[`turn-${index}`] ? 'rotate-90' : ''}`}
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2"
                                  >
                                    <path d="M9 18l6-6-6-6" />
                                  </svg>
                                  <h3 className="text-sm font-medium text-[#B4A054]">
                                    Thinking Process {expandedReasoning[`turn-${index}`] ? '(Expanded)' : '(Collapsed)'}
                                  </h3>
                                </div>
                                <span className="text-xs text-[#B4A054]">
                                  {expandedReasoning[`turn-${index}`] ? 'Click to collapse' : 'Click to expand'}
                                </span>
                              </button>
                              
                              {expandedReasoning[`turn-${index}`] && (
                                <div className="px-4 pb-4">
                                  <div className="prose prose-invert max-w-none">
                                    <p className="text-[#B4A054] text-sm whitespace-pre-wrap leading-relaxed">
                                      {formattedMessage?.reasoning}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* REAL-TIME FINAL ANSWER STREAM - Show only during answer phase */}
                          {(isCurrentStreaming && streamingContent.currentSection === 'answer' && streamingSections.finalAnswer) && (
                            <div className="bg-[#212224] rounded-xl p-4 relative border border-[#2D2F32]">
                              <div className="absolute -top-2 left-4 px-2 py-1 bg-[#70B7FE] text-white text-xs rounded flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                <span>Writing Answer</span>
                              </div>
                              <div className="pr-8 pt-2">
                                <h4 className="text-sm font-medium text-gray-300 mb-3">Answer</h4>
                                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                                  {streamingSections.finalAnswer}
                                  <span className="inline-block w-2 h-4 bg-[#70B7FE] ml-0.5 animate-pulse"></span>
                                </p>
                              </div>
                            </div>
                          )}

                          {/* FINAL ANSWER SECTION */}
                          {hasAssistantMessage && formattedMessage && !isCurrentStreaming && (
                            <div className="bg-[#212224] rounded-xl p-4 relative">
                              {/* Copy to Clipboard Button */}
                              <button
                                onClick={() => copyToClipboard(formattedMessage.finalAnswer, `turn-${index}`)}
                                className="absolute top-3 right-3 p-2 text-gray-400 hover:text-[#70B7FE] transition-colors"
                                title="Copy answer to clipboard"
                              >
                                {copiedMessageId === `turn-${index}` ? (
                                  <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 6L9 17l-5-5" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </button>

                              <div className="pr-8">
                                <h4 className="text-sm font-medium text-gray-300 mb-3">Answer</h4>
                                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                                  {formattedMessage.finalAnswer}
                                </p>
                              </div>

                              {/* Copy Success Message */}
                              {copiedMessageId === `turn-${index}` && (
                                <div className="absolute bottom-2 right-2">
                                  <span className="text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded">
                                    Copied!
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Loading state for current query */}
                        {!hasAssistantMessage && index === currentConversationIndex && !streamingContent.isStreaming && (
                          <div className="bg-[#1E1F21] rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                  <path d="M12 4V12M12 12V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-400">
                                  Generating answer...
                                </span>
                              </div>
                            </div>
                            <div className="space-y-3 pl-6">
                              <div className="flex items-center gap-2 text-gray-400">
                                <div className="w-4 h-4 relative">
                                  <div className="absolute inset-0 animate-spin">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                      <path d="M12 3V6M12 18V21M3 12H6M18 12H21M5.63604 5.63604L7.75736 7.75736M16.2426 16.2426L18.364 18.364M5.63604 18.364L7.75736 16.2426M16.2426 7.75736L18.364 5.63604" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                  </div>
                                </div>
                                <span className="text-sm">Generating response</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Separator between conversations */}
                        {index < conversationHistory.length - 1 && (
                          <div className="border-t border-[#2D2F32] my-8"></div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Error Display */}
                {(error || chatError) && (
                  <div className="bg-red-900/20 border border-red-700/50 text-red-200 px-4 py-3 rounded-xl mb-6">
                    <div className="flex items-start gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                      </svg>
                      <div>
                        <span className="font-medium">Error: </span>
                        <span>{error || (chatError instanceof Error ? chatError.message : 'An error occurred')}</span>
                        {(error?.includes('API key') || chatError?.message?.includes('API key')) && (
                          <div className="mt-2 text-sm text-red-300">
                            💡 Please check your API keys in the settings (top-right corner).
                          </div>
                        )}
                        {(error?.includes('rate limit') || chatError?.message?.includes('rate limit')) && (
                          <div className="mt-2 text-sm text-red-300">
                            💡 Try again in a few minutes or check your API key limits.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Bottom search bar - Always visible for continuous conversation */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#18191B] border-t border-[#2D2F32] p-4">
              <div className="max-w-[800px] mx-auto">
                <form onSubmit={handleSearch}>
                  <div className="flex items-center bg-[#212224] rounded-2xl overflow-hidden border border-[#2D2F32]">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={conversationHistory.length > 0 ? "Ask another question..." : "Ask anything..."}
                      className="flex-1 bg-transparent px-4 py-3 text-white placeholder-gray-400 focus:outline-none"
                      disabled={isLoading || isChatLoading}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || isChatLoading}
                      className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M5 12H19M19 12L12 5M19 12L12 19"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}