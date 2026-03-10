import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

const MANAGER_SUGGESTED_QUESTIONS = [
  "Show low stock items in my store",
  "Summarize today's store sales",
  "Which team members made the most sales this week?",
  "What should I reorder for this store?",
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
    : (userProfile?.role === 'master'
      ? MASTER_SUGGESTED_QUESTIONS
      : userProfile?.role === 'manager'
        ? MANAGER_SUGGESTED_QUESTIONS
        : MEMBER_SUGGESTED_QUESTIONS);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isCrmPage]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

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

  const handleFeedback = useCallback(async (msgIndex, rating) => {
    const msg = messages[msgIndex];
    if (!msg || msg.feedback === rating) return;

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
      setMessages(prev => {
        const updated = [...prev];
        updated[msgIndex] = { ...updated[msgIndex], feedback: null };
        return updated;
      });
    }
  }, [messages, isCrmPage]);

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
  }, [messages, feedbackComment, isCrmPage]);

  const handleSubmit = async (e) => {
    e?.preventDefault();

    const query = inputValue.trim();
    if (!query || isLoading || isStreaming) return;

    if (!currentUser) {
      setError('Please log in to use the chatbot');
      return;
    }

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
    setTimeout(() => {
      handleSubmit({ preventDefault: () => { } });
    }, 100);
  };

  const handleGetSummary = async () => {
    if (isLoading || isStreaming || !currentUser) return;

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

  return createPortal(
    <div className={`fixed z-[2500] font-sans ${isOpen ? 'bottom-0 right-0' : 'bottom-6 right-6'}`}>
      {!isOpen && (
        <button
          className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-800 to-blue-500 border-none text-white cursor-pointer flex items-center justify-center shadow-[0_4px_20px_rgba(59,130,246,0.4)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-105 hover:shadow-[0_6px_25px_rgba(59,130,246,0.5)]"
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

      {isOpen && (
        <div className="fixed bottom-5 right-5 w-[390px] h-[min(540px,calc(100dvh-100px))] bg-white dark:bg-gray-800 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden border border-slate-200 dark:border-gray-700 animate-chatbot-slide-up isolate max-[480px]:w-[calc(100vw-1.5rem)] max-[480px]:h-[calc(100dvh-80px)] max-[480px]:bottom-3 max-[480px]:right-3">
          <div className="px-3 py-3 pl-[1.125rem] min-h-14 box-border bg-gradient-to-br from-blue-800 to-blue-500 text-white flex justify-between items-center gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-[10px] bg-white/20 flex items-center justify-center shrink-0">
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
                <h4 className="text-[0.9375rem] font-semibold m-0 mb-0.5 leading-tight">{isCrmPage ? 'CRM Assistant' : 'Inventory Assistant'}</h4>
                <span className="text-xs opacity-90 flex items-center gap-1.5 leading-tight min-h-4 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-opacity"></span>
                  Powered by Gemini AI
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                className="w-[30px] h-[30px] rounded-lg border-none bg-white/15 text-white cursor-pointer flex items-center justify-center transition-all duration-200 hover:enabled:bg-white/30 disabled:opacity-50"
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
                  className="w-[30px] h-[30px] rounded-lg border-none bg-amber-500/30 text-white cursor-pointer flex items-center justify-center transition-all duration-200 hover:enabled:bg-amber-500/50 disabled:opacity-50"
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
                className="w-[30px] h-[30px] rounded-lg border-none bg-white/15 text-white cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-white/30"
                onClick={clearChat}
                title="Clear chat"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
              <button
                className="w-[30px] h-[30px] rounded-lg border-none bg-white/20 text-white cursor-pointer flex items-center justify-center transition-all duration-200 ml-1 hover:bg-red-500/70"
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

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0 bg-slate-50 dark:bg-gray-900">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`max-w-[85%] animate-message-fade-in ${msg.role === 'user' ? 'self-end' : 'self-start'}`}
              >
                {msg.isStreaming && !msg.content ? (
                  <div className="px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-bl-sm min-w-[180px]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-blue-500 animate-bobble">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                      </div>
                      <div className="text-[0.8125rem] text-slate-600 dark:text-gray-400">Analyzing</div>
                      <div className="flex gap-[3px] ml-auto">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-typing-bounce"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-typing-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-typing-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                    <div className="h-2 rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer"></div>
                  </div>
                ) : (
                  <>
                    <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-blue-800 to-blue-500 text-white rounded-br-sm'
                        : msg.isError
                          ? 'bg-red-50 dark:bg-red-900/20 border border-red-600 text-red-600 rounded-bl-sm'
                          : 'bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-50 border border-slate-200 dark:border-gray-700 rounded-bl-sm'
                    } ${msg.isStreaming ? 'border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]' : ''}`}>
                      {msg.content}
                      {msg.isStreaming && <span className="inline-block text-blue-500 animate-blink ml-0.5 font-normal">▊</span>}
                    </div>
                    {msg.meta && !msg.isStreaming && (
                      <div className="text-[0.6875rem] text-slate-400 dark:text-gray-500 mt-1.5 pl-1">
                        {formatMeta(msg.meta)}
                      </div>
                    )}
                    {!msg.isStreaming && msg.role === 'assistant' && !msg.isError && (
                      <div className="flex items-center gap-1.5 mt-1.5 pl-1">
                        <button
                          className={`inline-flex items-center justify-center w-[26px] h-[26px] border-none rounded-md bg-transparent cursor-pointer transition-all duration-150 p-0 ${
                            msg.feedback === 'up' ? 'text-blue-500 bg-blue-500/10' : 'text-slate-400 dark:text-gray-500 hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-gray-400'
                          }`}
                          onClick={() => handleFeedback(index, 'up')}
                          title="Helpful"
                          aria-label="Thumbs up"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill={msg.feedback === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                          </svg>
                        </button>
                        <button
                          className={`inline-flex items-center justify-center w-[26px] h-[26px] border-none rounded-md bg-transparent cursor-pointer transition-all duration-150 p-0 ${
                            msg.feedback === 'down' ? 'text-blue-500 bg-blue-500/10' : 'text-slate-400 dark:text-gray-500 hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-gray-400'
                          }`}
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
                            className="inline-flex items-center justify-center w-[26px] h-[26px] border-none rounded-md bg-transparent text-slate-400 dark:text-gray-500 cursor-pointer transition-all duration-150 p-0 hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-gray-400"
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
                    {feedbackComment.messageId === msg.id && (
                      <div className="flex flex-col gap-1.5 mt-1.5 pl-1">
                        <textarea
                          value={feedbackComment.text}
                          onChange={(e) => setFeedbackComment(prev => ({ ...prev, text: e.target.value }))}
                          placeholder="Tell us more about this response..."
                          rows={2}
                          className="w-full p-2 border border-slate-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-50 text-xs font-[inherit] resize-y min-h-10 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                        />
                        <button
                          className="self-end px-3 py-1 border-none rounded-md bg-blue-500 text-white text-xs cursor-pointer transition-colors duration-150 hover:enabled:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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

          {messages.length <= 2 && (
            <div className="px-4 py-3 flex flex-wrap gap-2 bg-slate-50 dark:bg-gray-900 border-t border-slate-200 dark:border-gray-700">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  className="px-3.5 py-2 text-xs rounded-[20px] bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 cursor-pointer transition-all duration-200 whitespace-nowrap hover:enabled:border-blue-500 hover:enabled:text-blue-500 hover:enabled:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed max-[480px]:text-[0.6875rem] max-[480px]:px-3 max-[480px]:py-1.5"
                  onClick={() => handleSuggestedQuestion(q)}
                  disabled={isLoading || isStreaming}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-600 text-red-600 text-[0.8125rem]">
              {error}
            </div>
          )}

          <form className="p-4 bg-white dark:bg-gray-800 border-t border-slate-200 dark:border-gray-700 flex gap-3" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isCrmPage ? "Ask about your customers..." : "Ask about inventory, sales, stores..."}
              disabled={isLoading || isStreaming}
              className="flex-1 px-4 py-3 text-sm border border-slate-200 dark:border-gray-700 rounded-3xl bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-gray-50 outline-none transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/15"
            />
            <button
              type="submit"
              disabled={isLoading || isStreaming || !inputValue.trim()}
              className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-blue-800 to-blue-500 border-none text-white cursor-pointer flex items-center justify-center transition-all duration-200 shrink-0 hover:enabled:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
    ,
    document.body
  );
}
