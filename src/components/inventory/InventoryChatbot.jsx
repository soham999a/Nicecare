import { useState, useRef, useEffect, useCallback } from 'react';
import { useInventoryAuth } from '../../context/InventoryAuthContext';
import {
  askAboutInventory,
  generateInventorySummary,
  analyzeLowStock,
} from '../../backend/endpoints/inventoryEndpoints';
import {
  askAboutCustomers,
  generateCustomerSummary,
} from '../../backend/endpoints/crmEndpoints';
import { submitFeedback } from '../../backend/endpoints/feedbackEndpoints';
import { useLocation } from 'react-router-dom';

const MASTER_SUGGESTED_QUESTIONS = [
  "What's my total inventory value?",
  "Show me low stock items",
  "How are my stores performing?",
  "Summarize today's sales",
];

const MEMBER_SUGGESTED_QUESTIONS = [
  "What products are low in stock?",
  "Show today's sales summary",
  "What's my best selling product?",
  "Which items need restocking?",
];

const CRM_SUGGESTED_QUESTIONS = [
  "How many customers do I have?",
  "Show repairs in progress",
  "Any urgent repairs pending?",
  "Summarize today's status",
];

export default function InventoryChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your business assistant. Ask me anything about your products, stores, customers, and sales!",
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

  const { currentUser, userProfile } = useInventoryAuth();
  const location = useLocation();
  const isCrmPage = location.pathname.includes('/inventory/crm');

  const suggestedQuestions = isCrmPage
    ? CRM_SUGGESTED_QUESTIONS
    : (userProfile?.role === 'master' ? MASTER_SUGGESTED_QUESTIONS : MEMBER_SUGGESTED_QUESTIONS);

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

  // Streaming callback handler
  const handleStreamChunk = useCallback((chunk, fullText) => {
    setMessages(prev => {
      const newMessages = [...prev];
      const streamIndex = streamingMessageIndexRef.current;
      if (streamIndex !== null && newMessages[streamIndex]) {
        newMessages[streamIndex] = {
          ...newMessages[streamIndex],
          content: fullText,
        };
      }
      return newMessages;
    });
  }, []);

  // Feedback handler
  const handleFeedback = useCallback(async (msgIndex, rating) => {
    const msg = messages[msgIndex];
    if (!msg || msg.feedback === rating) return;

    // Optimistically update UI
    setMessages(prev => {
      const updated = [...prev];
      updated[msgIndex] = { ...updated[msgIndex], feedback: rating };
      return updated;
    });

    try {
      await submitFeedback({
        messageId: msg.id,
        question: msg.question || '',
        answer: msg.content,
        rating,
        comment: null,
        module: isCrmPage ? 'crm' : 'inventory',
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

  // Feedback comment submit
  const handleFeedbackComment = useCallback(async (msgIndex) => {
    const msg = messages[msgIndex];
    if (!msg || !feedbackComment.text.trim()) return;

    try {
      await submitFeedback({
        messageId: msg.id,
        question: msg.question || '',
        answer: msg.content,
        rating: msg.feedback || 'down',
        comment: feedbackComment.text.trim(),
        module: isCrmPage ? 'crm' : 'inventory',
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

    // Add user message and placeholder for assistant response
    setMessages(prev => {
      const newMessages = [
        ...prev,
        { role: 'user', content: query },
        { role: 'assistant', content: '', isStreaming: true, id: crypto.randomUUID(), question: query, feedback: null }
      ];
      streamingMessageIndexRef.current = newMessages.length - 1;
      return newMessages;
    });

    setInputValue('');
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);

    try {
      let result;
      if (isCrmPage) {
        result = await askAboutCustomers(query, currentUser.uid, true, handleStreamChunk);
      } else {
        result = await askAboutInventory(
          query,
          currentUser.uid,
          userProfile?.role || 'member',
          userProfile?.assignedStoreId,
          userProfile?.ownerUid,
          handleStreamChunk
        );
      }

      // Update final message with meta data
      setMessages(prev => {
        const newMessages = [...prev];
        const streamIndex = streamingMessageIndexRef.current;
        if (streamIndex !== null && newMessages[streamIndex]) {
          newMessages[streamIndex] = {
            ...newMessages[streamIndex],
            content: result.answer,
            meta: isCrmPage ? { customers: result.customersUsed } : result.dataUsed,
            isStreaming: false,
          };
        }
        return newMessages;
      });
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages(prev => {
        const newMessages = [...prev];
        const streamIndex = streamingMessageIndexRef.current;
        if (streamIndex !== null && newMessages[streamIndex]) {
          newMessages[streamIndex] = {
            role: 'assistant',
            content: err.message || 'Sorry, I encountered an error. Please try again.',
            isError: true,
            isStreaming: false,
          };
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      streamingMessageIndexRef.current = null;
    }
  };

  const handleSuggestedQuestion = (question) => {
    setInputValue(question);
    // Auto-submit after a brief delay
    setTimeout(() => {
      handleSubmit({ preventDefault: () => { } });
    }, 100);
  };

  const handleGetSummary = async () => {
    if (isLoading || isStreaming || !currentUser) return;

    // Add user message and placeholder for assistant response
    setMessages(prev => {
      const newMessages = [
        ...prev,
        { role: 'user', content: 'Give me a business summary' },
        { role: 'assistant', content: '', isStreaming: true, id: crypto.randomUUID(), question: 'Give me a business summary', feedback: null }
      ];
      streamingMessageIndexRef.current = newMessages.length - 1;
      return newMessages;
    });

    setIsLoading(true);
    setIsStreaming(true);
    setError(null);

    try {
      let result;
      if (isCrmPage) {
        result = await generateCustomerSummary(currentUser.uid, handleStreamChunk);
      } else {
        result = await generateInventorySummary(
          currentUser.uid,
          userProfile?.role || 'member',
          userProfile?.assignedStoreId,
          userProfile?.ownerUid,
          handleStreamChunk
        );
      }

      // Update final message with meta data
      setMessages(prev => {
        const newMessages = [...prev];
        const streamIndex = streamingMessageIndexRef.current;
        if (streamIndex !== null && newMessages[streamIndex]) {
          newMessages[streamIndex] = {
            ...newMessages[streamIndex],
            content: result.answer,
            meta: isCrmPage ? { customers: result.customersUsed } : result.dataUsed,
            isStreaming: false,
          };
        }
        return newMessages;
      });
    } catch (err) {
      console.error('Summary error:', err);
      setMessages(prev => {
        const newMessages = [...prev];
        const streamIndex = streamingMessageIndexRef.current;
        if (streamIndex !== null && newMessages[streamIndex]) {
          newMessages[streamIndex] = {
            role: 'assistant',
            content: err.message || 'Failed to generate summary.',
            isError: true,
            isStreaming: false,
          };
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      streamingMessageIndexRef.current = null;
    }
  };

  const handleLowStockAnalysis = async () => {
    if (isLoading || isStreaming || !currentUser) return;

    // Add user message and placeholder for assistant response
    setMessages(prev => {
      const newMessages = [
        ...prev,
        { role: 'user', content: 'Analyze low stock items' },
        { role: 'assistant', content: '', isStreaming: true, id: crypto.randomUUID(), question: 'Analyze low stock items', feedback: null }
      ];
      streamingMessageIndexRef.current = newMessages.length - 1;
      return newMessages;
    });

    setIsLoading(true);
    setIsStreaming(true);
    setError(null);

    try {
      const result = await analyzeLowStock(
        currentUser.uid,
        userProfile?.role || 'member',
        userProfile?.assignedStoreId,
        userProfile?.ownerUid,
        handleStreamChunk
      );

      // Update final message with meta data
      setMessages(prev => {
        const newMessages = [...prev];
        const streamIndex = streamingMessageIndexRef.current;
        if (streamIndex !== null && newMessages[streamIndex]) {
          newMessages[streamIndex] = {
            ...newMessages[streamIndex],
            content: result.answer,
            meta: result.dataUsed,
            isStreaming: false,
          };
        }
        return newMessages;
      });
    } catch (err) {
      console.error('Low stock analysis error:', err);
      setMessages(prev => {
        const newMessages = [...prev];
        const streamIndex = streamingMessageIndexRef.current;
        if (streamIndex !== null && newMessages[streamIndex]) {
          newMessages[streamIndex] = {
            role: 'assistant',
            content: err.message || 'Failed to analyze low stock.',
            isError: true,
            isStreaming: false,
          };
        }
        return newMessages;
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
        content: "Hi! I'm your inventory assistant. Ask me anything about your products, stores, sales, and more!",
      },
    ]);
    setError(null);
  };

  const formatMeta = (meta) => {
    if (!meta) return null;
    if (isCrmPage) {
      if (meta.customers !== undefined) {
        return `Analyzed ${meta.customers} customer record${meta.customers !== 1 ? 's' : ''}`;
      }
      return null;
    }
    const parts = [];
    if (meta.products > 0) parts.push(`${meta.products} products`);
    if (meta.stores > 0) parts.push(`${meta.stores} stores`);
    if (meta.sales > 0) parts.push(`${meta.sales} sales`);
    if (meta.employees > 0) parts.push(`${meta.employees} employees`);
    if (meta.lowStock !== undefined) parts.push(`${meta.lowStock} low stock`);
    return parts.length > 0 ? `Analyzed: ${parts.join(', ')}` : null;
  };

  // #region agent log
  useEffect(() => {
    const el = document.querySelector('.inventory-chatbot-wrapper');
    if (el) {
      const cs = getComputedStyle(el);
      fetch('http://127.0.0.1:7710/ingest/0b56bff7-3ca1-489d-b185-0178fff3f432',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'44bb60'},body:JSON.stringify({sessionId:'44bb60',location:'InventoryChatbot.jsx:wrapper',message:'inventory-chatbot-wrapper computed styles',data:{position:cs.position,bottom:cs.bottom,right:cs.right,zIndex:cs.zIndex},timestamp:Date.now()})}).catch(()=>{});
    }
    if (isOpen) {
      setTimeout(() => {
        const container = document.querySelector('.inventory-chatbot-container');
        if (container) {
          const ccs = getComputedStyle(container);
          fetch('http://127.0.0.1:7710/ingest/0b56bff7-3ca1-489d-b185-0178fff3f432',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'44bb60'},body:JSON.stringify({sessionId:'44bb60',location:'InventoryChatbot.jsx:container',message:'inventory-chatbot-container computed styles',data:{border:ccs.border,borderRadius:ccs.borderRadius,boxShadow:ccs.boxShadow,outline:ccs.outline,maxHeight:ccs.maxHeight,width:ccs.width},timestamp:Date.now()})}).catch(()=>{});
        }
        const header = document.querySelector('.inventory-chatbot-header');
        if (header) {
          const hcs = getComputedStyle(header);
          fetch('http://127.0.0.1:7710/ingest/0b56bff7-3ca1-489d-b185-0178fff3f432',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'44bb60'},body:JSON.stringify({sessionId:'44bb60',location:'InventoryChatbot.jsx:header',message:'inventory-chatbot-header computed styles',data:{background:hcs.background,border:hcs.border,color:hcs.color},timestamp:Date.now()})}).catch(()=>{});
        }
        const input = document.querySelector('.inventory-chatbot-input');
        if (input) {
          const ics = getComputedStyle(input);
          fetch('http://127.0.0.1:7710/ingest/0b56bff7-3ca1-489d-b185-0178fff3f432',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'44bb60'},body:JSON.stringify({sessionId:'44bb60',location:'InventoryChatbot.jsx:input',message:'inventory-chatbot-input computed styles',data:{border:ics.border,borderRadius:ics.borderRadius,outline:ics.outline},timestamp:Date.now()})}).catch(()=>{});
        }
      }, 500);
    }
  }, [isOpen]);
  // #endregion

  return (
    <div className={`inventory-chatbot-wrapper${isOpen ? ' chatbot-open' : ''}`}>
      {/* Chat toggle button */}
      {!isOpen && (
        <button
          className="inventory-chatbot-toggle"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="10" r="1" fill="currentColor"></circle>
            <circle cx="8" cy="10" r="1" fill="currentColor"></circle>
            <circle cx="16" cy="10" r="1" fill="currentColor"></circle>
          </svg>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="inventory-chatbot-container">
          {/* Header */}
          <div className="inventory-chatbot-header">
            <div className="inventory-chatbot-header-info">
              <div className="inventory-chatbot-avatar">
                {isCrmPage ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"></path>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                )}
              </div>
              <div>
                <h4>{isCrmPage ? 'CRM Assistant' : 'Inventory Assistant'}</h4>
                <span className="inventory-chatbot-status">
                  <span className="status-dot"></span>
                  Powered by Gemini AI
                </span>
              </div>
            </div>
            <div className="inventory-chatbot-header-actions">
              <button
                className="inventory-chatbot-action-btn"
                onClick={handleGetSummary}
                disabled={isLoading || isStreaming}
                title="Get business summary"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              </button>
              {!isCrmPage && (
                <button
                  className="inventory-chatbot-action-btn warning"
                  onClick={handleLowStockAnalysis}
                  disabled={isLoading || isStreaming}
                  title="Analyze low stock"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </button>
              )}
              <button
                className="inventory-chatbot-action-btn"
                onClick={clearChat}
                title="Clear chat"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
              <button
                className="inventory-chatbot-close-btn"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                aria-label="Close chat"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
          {/* Messages */}
          <div className="inventory-chatbot-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`inventory-chatbot-message ${msg.role} ${msg.isError ? 'error' : ''} ${msg.isStreaming ? 'streaming' : ''}`}
              >
                {/* Show streaming indicator for empty streaming message */}
                {msg.isStreaming && !msg.content ? (
                  <div className="message-content loading">
                    <div className="loading-indicator">
                      <div className="ai-thinking-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                      </div>
                      <div className="loading-text">Analyzing</div>
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
                        {formatMeta(msg.meta)}
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
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                          </svg>
                        </button>
                        <button
                          className={`feedback-btn${msg.feedback === 'down' ? ' active' : ''}`}
                          onClick={() => handleFeedback(index, 'down')}
                          title="Not helpful"
                          aria-label="Thumbs down"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill={msg.feedback === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10zM17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                          </svg>
                        </button>
                        {msg.feedback && (
                          <button
                            className="feedback-comment-toggle"
                            onClick={() => setFeedbackComment(prev => prev.messageId === msg.id ? { messageId: null, text: '' } : { messageId: msg.id, text: '' })}
                            title="Add comment"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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
            <div className="inventory-chatbot-suggestions">
              {suggestedQuestions.map((q, i) => (
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
            <div className="inventory-chatbot-error">
              {error}
            </div>
          )}

          {/* Input */}
          <form className="inventory-chatbot-input-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isCrmPage ? "Ask about your customers..." : "Ask about inventory, sales, stores..."}
              disabled={isLoading || isStreaming}
              className="inventory-chatbot-input"
            />
            <button
              type="submit"
              disabled={isLoading || isStreaming || !inputValue.trim()}
              className="inventory-chatbot-send-btn"
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
