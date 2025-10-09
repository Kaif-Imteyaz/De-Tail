'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/openai/chat',
  });

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

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-lg">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>Start a conversation with De-Tail AI</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="space-y-4">
                  {formatMessage(message.content).reasoning && (
                    <div className="border-b border-gray-300 pb-3">
                      <h4 className="font-semibold text-gray-700 mb-2">Reasoning:</h4>
                      <p className="whitespace-pre-wrap text-gray-600">{formatMessage(message.content).reasoning}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Final Answer:</h4>
                    <p className="whitespace-pre-wrap">{formatMessage(message.content).finalAnswer}</p>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ))}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error.message}</span>
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask anything..."
          className="flex-1 rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  );
} 