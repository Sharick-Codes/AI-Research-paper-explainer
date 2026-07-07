import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Sparkles, 
  Info,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, getDocs, addDoc } from 'firebase/firestore';
import { Paper, ChatMessage } from '../types';

interface AIChatBotProps {
  activePaper: Paper | null;
}

export default function AIChatBot({ activePaper }: AIChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Load chat messages from Firestore whenever the active paper changes
  useEffect(() => {
    const fetchChatHistory = async () => {
      const user = auth.currentUser;
      if (!user || !activePaper) {
        setMessages([]);
        return;
      }

      setLoadingHistory(true);
      try {
        const chatCollectionRef = collection(db, 'users', user.uid, 'papers', activePaper.id, 'chat');
        const q = query(chatCollectionRef, orderBy('timestamp', 'asc'));
        const querySnapshot = await getDocs(q);
        
        const loadedMessages: ChatMessage[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          loadedMessages.push({
            id: doc.id,
            role: data.role,
            content: data.content,
            timestamp: data.timestamp
          });
        });

        if (loadedMessages.length === 0) {
          // Initialize with a welcome message
          const initialMsg: ChatMessage = {
            id: 'welcome',
            role: 'assistant',
            content: `Hi! I am your AI research assistant for **"${activePaper.title}"**. Ask me anything about this paper, like explaining specific formulas, methodology details, or summarizing its contributions!`,
            timestamp: new Date().toISOString()
          };
          setMessages([initialMsg]);
        } else {
          setMessages(loadedMessages);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchChatHistory();
  }, [activePaper]);

  if (!activePaper) return null;

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customText || input).trim();
    if (!textToSend || loading) return;

    setInput('');
    setLoading(true);

    const user = auth.currentUser;
    if (!user) return;

    const userMsgId = 'msg_' + Math.random().toString(36).substring(2, 11);
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    // 1. Add user message to UI state instantly
    setMessages(prev => [...prev, userMsg]);

    // 2. Save user message to Firestore
    try {
      const chatCollectionRef = collection(db, 'users', user.uid, 'papers', activePaper.id, 'chat');
      await addDoc(chatCollectionRef, {
        role: 'user',
        content: textToSend,
        timestamp: userMsg.timestamp
      });
    } catch (err) {
      console.error("Failed to save user message:", err);
    }

    try {
      // 3. Request Gemini AI response via our server
      const chatHistoryForAPI = messages.concat(userMsg).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: msg.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paperText: activePaper.extractedText,
          history: chatHistoryForAPI,
          message: textToSend,
          title: activePaper.title
        })
      });

      if (!res.ok) {
        let errorMessage = 'Server returned an error.';
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errData = await res.json();
          errorMessage = errData.error || errorMessage;
        } else {
          const text = await res.text();
          errorMessage = `Server Error (${res.status}): ${text.slice(0, 150)}`;
        }
        throw new Error(errorMessage);
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Invalid response format from server (${res.status}): ${text.slice(0, 150)}`);
      }

      const data = await res.json();
      
      const assistantMsgId = 'msg_' + Math.random().toString(36).substring(2, 11);
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      };

      // 4. Add assistant message to UI
      setMessages(prev => [...prev, assistantMsg]);

      // 5. Save assistant response to Firestore
      try {
        const chatCollectionRef = collection(db, 'users', user.uid, 'papers', activePaper.id, 'chat');
        await addDoc(chatCollectionRef, {
          role: 'assistant',
          content: data.response,
          timestamp: assistantMsg.timestamp
        });
      } catch (err) {
        console.error("Failed to save assistant message:", err);
      }

    } catch (err: any) {
      console.error("Chat explanation error:", err);
      const isQuota = String(err.message || "").toLowerCase().includes("quota");
      const errorMsgText = isQuota 
        ? `Sorry, I encountered an issue: **${err.message || "Failed to contact Gemini API."}**\n\n💡 **Daily free-tier limit reached (20 requests/day).** You can configure your own paid Gemini API Key in the **Settings > Secrets** panel to bypass limits and continue chatting.`
        : `Sorry, I encountered an issue: **${err.message || "Failed to contact Gemini API."}** Please make sure you have set a valid GEMINI_API_KEY in the **Settings > Secrets** panel.`;
      
      const errorMsg: ChatMessage = {
        id: 'err_' + Math.random().toString(36).substring(2, 11),
        role: 'assistant',
        content: errorMsgText,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const suggestionPills = [
    "What is the main contribution?",
    "Summarize the methodology.",
    "Explain the core formula.",
    "What datasets were used?",
    "Identify any limitations."
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans">
      {/* FLOAT BUTTON */}
      {!isOpen && (
        <button
          id="chat_float_btn"
          onClick={() => setIsOpen(true)}
          className="relative group p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl hover:scale-105 transition-all flex items-center justify-center cursor-pointer border border-indigo-500/10"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="absolute right-0 top-0 h-3 w-3 bg-indigo-400 rounded-full ring-2 ring-slate-900 animate-pulse" />
        </button>
      )}

      {/* EXPANDED CHAT PANEL */}
      {isOpen && (
        <div 
          id="chat_panel"
          className="w-[360px] sm:w-[420px] h-[550px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-300"
        >
          {/* Header */}
          <div className="p-4 bg-slate-50 dark:bg-[#0f0f13] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-slate-800 dark:text-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600 rounded-xl text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div className="truncate max-w-[200px] sm:max-w-[260px]">
                <h4 className="text-sm font-bold tracking-tight">Paper AI Assistant</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-450 truncate leading-tight">{activePaper.title}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Messages block */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#0a0a0c]">
            {loadingHistory ? (
              <div className="h-full flex flex-col items-center justify-center space-y-2 text-slate-500 dark:text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500 dark:text-indigo-400" />
                <span className="text-xs">Loading chat history...</span>
              </div>
            ) : (
              messages.map((msg) => {
                const isAI = msg.role === 'assistant';
                return (
                  <div key={msg.id} className={`flex items-start gap-2.5 ${isAI ? '' : 'flex-row-reverse'}`}>
                    <div className={`p-2 rounded-xl flex-shrink-0 text-white ${isAI ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-850 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-white'}`}>
                      {isAI ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>
                    <div className={`p-3.5 rounded-2xl text-sm leading-relaxed max-w-[78%] ${
                      isAI 
                        ? 'bg-white dark:bg-[#0f0f13] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-sm' 
                        : 'bg-indigo-600 text-white shadow shadow-indigo-600/10'
                    }`}>
                      {isAI && msg.id === 'welcome' ? (
                        <p dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      ) : (
                        <p className="whitespace-pre-line">{msg.content}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0f0f13] border border-slate-200 dark:border-slate-800 flex items-center space-x-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                  <span>AI is studying the paper...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions pills */}
          {messages.length < 3 && !loading && !loadingHistory && (
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f0f13] flex gap-2 overflow-x-auto whitespace-nowrap no-scrollbar">
              {suggestionPills.map((pill, i) => (
                <button
                  key={i}
                  onClick={(e) => handleSendMessage(e, pill)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-950/40 hover:bg-indigo-50 dark:hover:bg-indigo-955/20 text-slate-600 dark:text-slate-350 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium cursor-pointer transition-colors"
                >
                  {pill}
                </button>
              ))}
            </div>
          )}

          {/* Form input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-slate-50 dark:bg-[#0f0f13] border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              required
              disabled={loading}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about the paper..."
              className="flex-1 px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-500/50 text-slate-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-850 dark:disabled:text-slate-505 text-white rounded-2xl transition-all flex items-center justify-center cursor-pointer shadow shadow-indigo-600/10"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
