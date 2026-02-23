import { useState, useRef, useEffect, useCallback } from 'react';
import { useInventoryAuth } from '../context/InventoryAuthContext';
import {
  askAboutCustomers,
  generateCustomerSummary,
} from '../backend/endpoints/crmEndpoints';
import { submitFeedback } from '../backend/endpoints/feedbackEndpoints';

const SUGGESTED_QUESTIONS = [
  "How many customers do I have?",
  "Show repairs in progress",
  "Any urgent repairs pending?",
  "Summarize today's status",
];

export default function CustomerChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your customer data assistant. Ask me anything about your customers and repairs!",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [feedbackComment, setFeedbackComment] = useState({ messageId: null, text: '' });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const streamingMessageIndexRef = useRef(null);
  
  const { currentUser } = useInventoryAuth();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Streaming chunk handler
  const handleStreamChunk = useCallback((chunk, fullText) => {
    setMessages(prev => {
      const idx = streamingMessageIndexRef.current;
      if (idx == null || idx >= prev.length) return prev;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], content: fullText };
      return updated;
    });
  }, []);

  // Feedback handler
  const handleFeedback = useCallback(async (msgIndex, rating) => {
    setMessages(prev => {
      const updated = [...prev];
      const msg = updated[msgIndex];
      updated[msgIndex] = { ...msg, feedback: msg.feedback === rating ? null : rating };
      return updated;
    });

    const msg = messages[msgIndex];
    try {
      await submitFeedback({
        messageId: msg.id,
        question: msg.question || '',
        answer: msg.content,
        rating,
        module: 'crm',
      });
    } catch (err) {
      console.error('Feedback error:', err);
      // Revert on failure
      setMessages(prev => {
        const updated = [...prev];
        updated[msgIndex] = { ...updated[msgIndex], feedback: null };
        return updated;
      });
    }
  }, [messages]);

  // Feedback comment handler
  const handleFeedbackComment = useCallback(async (msgIndex) => {
    const msg = messages[msgIndex];
    const commentText = feedbackComment.text.trim();
    if (!commentText) return;

    try {
      await submitFeedback({
        messageId: msg.id,
        question: msg.question || '',
        answer: msg.content,
        rating: msg.feedback || 'down',
        comment: commentText,
        module: 'crm',
      });
      setFeedbackComment({ messageId: null, text: '' });
    } catch (err) {
      console.error('Feedback comment error:', err);
    }
  }, [messages, feedbackComment]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    const query = inputValue.trim();
    if (!query || isLoading || isStreaming) return;

    if (!currentUser) {
      setError('Please log in to use the chatbot');
      return;
    }

    // Add user message + streaming placeholder
    const placeholderMsg = {
      role: 'assistant',
      content: '',
      isStreaming: true,
      id: crypto.randomUUID(),
      question: query,
      feedback: null,
    };

    setMessages(prev => {
      const newMessages = [...prev, { role: 'user', content: query }, placeholderMsg];
      streamingMessageIndexRef.current = newMessages.length - 1;
      return newMessages;
    });
    setInputValue('');
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);

    try {
      const result = await askAboutCustomers(query, currentUser.uid, false, handleStreamChunk);

      setMessages(prev => {
        const updated = [...prev];
        const idx = streamingMessageIndexRef.current;
        updated[idx] = {
          ...updated[idx],
          content: result.answer,
          isStreaming: false,
          meta: { customersUsed: result.customersUsed },
        };
        return updated;
      });
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages(prev => {
        const updated = [...prev];
        const idx = streamingMessageIndexRef.current;
        updated[idx] = {
          ...updated[idx],
          content: err.message || 'Sorry, I encountered an error. Please try again.',
          isStreaming: false,
          isError: true,
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      streamingMessageIndexRef.current = null;
    }
  };

  const handleSuggestedQuestion = (question) => {
    if (isLoading || isStreaming) return;
    setInputValue(question);
    // Auto-submit after a brief delay
    setTimeout(() => {
      handleSubmit({ preventDefault: () => {} });
    }, 100);
  };

  const handleGetSummary = async () => {
    if (isLoading || isStreaming || !currentUser) return;

    const placeholderMsg = {
      role: 'assistant',
      content: '',
      isStreaming: true,
      id: crypto.randomUUID(),
      question: 'Give me a summary of all customers',
      feedback: null,
    };

    setMessages(prev => {
      const newMessages = [...prev, { role: 'user', content: 'Give me a summary of all customers' }, placeholderMsg];
      streamingMessageIndexRef.current = newMessages.length - 1;
      return newMessages;
    });
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);

    try {
      const result = await generateCustomerSummary(currentUser.uid, handleStreamChunk);
      setMessages(prev => {
        const updated = [...prev];
        const idx = streamingMessageIndexRef.current;
        updated[idx] = {
          ...updated[idx],
          content: result.answer,
          isStreaming: false,
          meta: { customersUsed: result.customersUsed },
        };
        return updated;
      });
    } catch (err) {
      console.error('Summary error:', err);
      setMessages(prev => {
        const updated = [...prev];
        const idx = streamingMessageIndexRef.current;
        updated[idx] = {
          ...updated[idx],
          content: err.message || 'Failed to generate summary.',
          isStreaming: false,
          isError: true,
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      streamingMessageIndexRef.current = null;
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Hi! I'm your customer data assistant. Ask me anything about your customers and repairs!",
      },
    ]);
    setError(null);
  };

  return (
    <div className="chatbot-wrapper">
      {/* Chat toggle button */}
      <button
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="chatbot-container">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"></path>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                  <line x1="9" y1="9" x2="9.01" y2="9"></line>
                  <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
              </div>
              <div>
                <h4>Customer Assistant</h4>
                <span className="chatbot-status">
                  <span className="status-dot"></span>
                  Powered by Gemini AI
                </span>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button 
                className="chatbot-action-btn" 
                onClick={handleGetSummary}
                disabled={isLoading || isStreaming}
                title="Get summary"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              </button>
              <button 
                className="chatbot-action-btn" 
                onClick={clearChat}
                title="Clear chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chatbot-message ${msg.role} ${msg.isError ? 'error' : ''} ${msg.isStreaming ? 'streaming' : ''}`}
              >
                {/* Show streaming indicator for empty streaming message */}
                {msg.isStreaming && !msg.content ? (
                  <div className="message-content loading">
                    <div className="loading-indicator">
                      <div className="ai-thinking-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"></path>
                          <circle cx="7.5" cy="14.5" r="1.5"></circle>
                          <circle cx="16.5" cy="14.5" r="1.5"></circle>
                        </svg>
                      </div>
                      <div className="loading-text">Thinking</div>
                      <div className="typing-dots">
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                      </div>
                    </div>
                    <div className="shimmer-bar"></div>
                  </div>
                ) : (
                  <>
                    <div className="message-content">
                      {msg.content}
                      {msg.isStreaming && <span className="streaming-cursor">▊</span>}
                    </div>
                    {msg.meta && !msg.isStreaming && (
                      <div className="message-meta">
                        Analyzed {msg.meta.customersUsed} customer record{msg.meta.customersUsed !== 1 ? 's' : ''}
                      </div>
                    )}
                    {/* Feedback buttons */}
                    {!msg.isStreaming && msg.role === 'assistant' && !msg.isError && (
                      <div className="message-feedback">
                        <button
                          className={`feedback-btn${msg.feedback === 'up' ? ' active' : ''}`}
                          onClick={() => handleFeedback(index, 'up')}
                          title="Helpful"
                          aria-label="Thumbs up"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill={msg.feedback === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                          </svg>
                        </button>
                        <button
                          className={`feedback-btn${msg.feedback === 'down' ? ' active' : ''}`}
                          onClick={() => handleFeedback(index, 'down')}
                          title="Not helpful"
                          aria-label="Thumbs down"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill={msg.feedback === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10zM17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                          </svg>
                        </button>
                        {msg.feedback && (
                          <button
                            className="feedback-comment-toggle"
                            onClick={() => setFeedbackComment(prev => prev.messageId === msg.id ? { messageId: null, text: '' } : { messageId: msg.id, text: '' })}
                            title="Add comment"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                    {/* Feedback comment input */}
                    {feedbackComment.messageId === msg.id && (
                      <div className="feedback-comment">
                        <textarea
                          value={feedbackComment.text}
                          onChange={(e) => setFeedbackComment(prev => ({ ...prev, text: e.target.value }))}
                          placeholder="Tell us more about this response..."
                          rows={2}
                        />
                        <button
                          className="feedback-comment-submit"
                          onClick={() => handleFeedbackComment(index)}
                          disabled={!feedbackComment.text.trim()}
                        >
                          Submit
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested questions (only show if few messages) */}
          {messages.length <= 2 && (
            <div className="chatbot-suggestions">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  className="suggestion-chip"
                  onClick={() => handleSuggestedQuestion(q)}
                  disabled={isLoading || isStreaming}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="chatbot-error">
              {error}
            </div>
          )}

          {/* Input */}
          <form className="chatbot-input-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about your customers..."
              disabled={isLoading || isStreaming}
              className="chatbot-input"
            />
            <button
              type="submit"
              disabled={isLoading || isStreaming || !inputValue.trim()}
              className="chatbot-send-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
