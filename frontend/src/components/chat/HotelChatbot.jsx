import { useState, useEffect, useRef } from "react";
import { apiRequest } from "../../api/client.js";
import { useAppStore } from "../../store/AppStoreContext.jsx";

export default function HotelChatbot({ hotelId, onClose }) {
  const { state } = useAppStore();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [documentTopics, setDocumentTopics] = useState([]);
  const [showTopics, setShowTopics] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadDocumentTopics();
    // Add welcome message
    setMessages([
      {
        id: 1,
        type: "bot",
        content: "Hello! I'm your hotel assistant. I can help you with information about our services, menu, amenities, and more. What would you like to know?",
        timestamp: new Date()
      }
    ]);
  }, [hotelId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function loadDocumentTopics() {
    try {
      const response = await apiRequest(`/hotels/${hotelId}/chat/topics`);
      setDocumentTopics(response.topics || []);
    } catch (err) {
      console.error("Failed to load document topics:", err);
      // Fallback topics if API fails
      setDocumentTopics([
        { id: "services", title: "Room Services", description: "24/7 room service, laundry, housekeeping" },
        { id: "menu", title: "Food & Dining", description: "Restaurant menu, breakfast, lunch, dinner" },
        { id: "amenities", title: "Hotel Amenities", description: "Wi-Fi, gym, pool, parking" },
        { id: "policies", title: "Hotel Policies", description: "Check-in/out, cancellation, pet policy" }
      ]);
    }
  }

  async function handleSendMessage(message = inputMessage) {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);
    setShowTopics(false);

    try {
      const response = await apiRequest(`/hotels/${hotelId}/chat`, {
        method: "POST",
        body: {
          message: message,
          guestToken: state.session.guestToken
        }
      });

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: response.reply,
        sources: response.sources,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: "I apologize, but I'm having trouble accessing information right now. Please try again or contact our front desk for assistance.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  function handleTopicClick(topic) {
    const topicMessage = `Tell me about ${topic.title.toLowerCase()}`;
    handleSendMessage(topicMessage);
  }

  function handleKeyPress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-start p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Chat Window */}
      <div className="relative w-full max-w-md h-[600px] card-glass surface-elevated rounded-[1.75rem] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-300 to-rose-300 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-950" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">Hotel Assistant</h3>
              <p className="text-xs text-slate-400">Ask me anything about the hotel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.type === "user"
                    ? "bg-gradient-to-r from-amber-300 to-rose-300 text-slate-950"
                    : "bg-white/10 text-white"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/20">
                    <p className="text-xs text-slate-300 mb-1">Sources:</p>
                    {message.sources.map((source, idx) => (
                      <p key={idx} className="text-xs text-slate-400">• {source}</p>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/10 rounded-2xl px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Topics */}
          {showTopics && documentTopics.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Quick topics:</p>
              <div className="grid gap-2">
                {documentTopics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicClick(topic)}
                    className="text-left p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <p className="text-sm font-medium text-white">{topic.title}</p>
                    <p className="text-xs text-slate-400">{topic.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about services, menu, amenities..."
              className="flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2 text-white outline-none placeholder:text-slate-500 text-sm"
              disabled={loading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputMessage.trim()}
              className="rounded-xl bg-gradient-to-r from-amber-300 to-rose-300 px-4 py-2 text-slate-950 font-medium transition hover:from-amber-200 hover:to-rose-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}