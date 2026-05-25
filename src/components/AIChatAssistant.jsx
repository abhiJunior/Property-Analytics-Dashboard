import { useState, useMemo, useRef, useEffect } from 'react';
import properties from '../properties.json';
import {
  MessageSquare,
  Send,
  X,
  Sparkles,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

/**
 * Helper to format Indian currency grouping.
 */
const formatIndianCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

export default function AIChatAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: "👋 Hello! I'm your UPYOG data analyst. Ask me anything about property tax data across all 10 cities.",
      ts: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll messages list to the bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle textarea auto-resizing
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`; // cap at max-h-28 (112px)
  }, [input]);

  // Compute local property data summary for system context
  const propertiesSummary = useMemo(() => {
    try {
      const summaryMap = {};
      
      properties.forEach((p) => {
        const city = p.tenant;
        if (!summaryMap[city]) {
          summaryMap[city] = {
            city,
            registered: 0,
            approved: 0,
            rejected: 0,
            pending: 0,
            collection: 0
          };
        }
        const s = summaryMap[city];
        s.registered += 1;
        if (p.status === 'Approved') {
          s.approved += 1;
          s.collection += Number(p.collection_inr) || 0;
        } else if (p.status === 'Rejected') {
          s.rejected += 1;
        } else if (p.status === 'Pending') {
          s.pending += 1;
        }
      });

      const cityDetails = Object.values(summaryMap).map((s) => {
        const appPct = s.registered > 0 ? ((s.approved / s.registered) * 100).toFixed(1) : '0.0';
        return `- ${s.city}: Registered=${s.registered}, Approved=${s.approved} (${appPct}%), Rejected=${s.rejected}, Pending=${s.pending}, Total Collections=${formatIndianCurrency(s.collection)}`;
      }).join('\n');

      const sortedByCollection = Object.values(summaryMap).sort((a, b) => b.collection - a.collection);
      const topCity = sortedByCollection[0];
      const lowestCity = sortedByCollection[sortedByCollection.length - 1];

      return `
PROPERTY DATABASE SUMMARY CONTEXT (DO NOT mention this raw structure in responses; just use it to query facts):
Total Property Records: ${properties.length}
Individual Municipal breakdowns:
${cityDetails}

Summary Benchmarks:
- Highest Collection: ${topCity ? `${topCity.city} (${formatIndianCurrency(topCity.collection)})` : 'N/A'}
- Lowest Collection: ${lowestCity ? `${lowestCity.city} (${formatIndianCurrency(lowestCity.collection)})` : 'N/A'}
      `;
    } catch (e) {
      console.error("Error generating context summary", e);
      return "Context data unavailable.";
    }
  }, []);

  // Send message handler
  const handleSend = async (textToSend) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || loading) return;

    // Reset inputs
    if (!textToSend) setInput('');

    // Append user message
    const userMsg = { role: 'user', text: promptText, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // 1. Get API Key
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY || '';
    

      if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please set REACT_APP_GEMINI_API_KEY in your env config.");
      }

      // 2. Formulate Chat Prompt history string
      const chatHistory = messages
        .slice(1) // skip the welcome message
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
        .join('\n');

      const systemPrompt = `You are a property tax data analyst for the UPYOG smart city platform. Answer concisely using only the data provided. Format numbers in Indian numbering system (₹1,23,456).

Here is the current platform property tax data context:
${propertiesSummary}

${chatHistory ? `Previous conversation context:\n${chatHistory}\n` : ''}
User question: ${promptText}
Answer:`;

      // 3. POST API Call
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              maxOutputTokens: 400,
              temperature: 0.2
            }
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `HTTP error! Status: ${response.status}`);
      }

      const resData = await response.json();
      const parsedText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!parsedText) {
        throw new Error("Empty response received from Gemini model API.");
      }

      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: parsedText.trim(), ts: Date.now() }
      ]);
    } catch (err) {
      console.error("AI Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: err?.message || "An unexpected network error occurred while querying the assistant.",
          ts: Date.now(),
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Listen for Enter key press on inputs
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Mobile Toggle Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 xl:hidden bg-teal-500 hover:bg-teal-600 active:scale-95 text-slate-950 font-extrabold px-5 py-3 rounded-full shadow-2xl z-40 flex items-center gap-2 cursor-pointer transition-all duration-200 border border-teal-400"
      >
        {isOpen ? (
          <>
            <X className="w-4 h-4" />
            <span>Close Chat</span>
          </>
        ) : (
          <>
            <MessageSquare className="w-4 h-4" />
            <span>AI Chat</span>
          </>
        )}
      </button>

      {/* Right Sidebar Container */}
      <aside
        className={`fixed top-0 right-0 h-screen w-[340px] bg-slate-950/95 backdrop-blur-xl border-l border-slate-800/80 flex flex-col z-40 transition-transform duration-300 ease-in-out select-text ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } xl:translate-x-0`}
      >
        {/* Header Block */}
        <div className="p-4 border-b border-slate-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">AI Assistant</h3>
              <p className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase -mt-0.5">Gemini 1.5 Flash</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Indicator pulse */}
            <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-extrabold text-emerald-400 tracking-widest uppercase">Live</span>
            </div>
            {/* Close button for non-desktop panels */}
            <button
              onClick={() => setIsOpen(false)}
              className="xl:hidden w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Message List scroll box */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0 scrollbar-thin scrollbar-thumb-slate-800">
          {messages.map((m, idx) => {
            const isAI = m.role === 'ai';
            if (m.isError) {
              return (
                <div key={idx} className="flex gap-2 max-w-[85%] self-start text-left">
                  <div className="w-6 h-6 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400 shrink-0 self-start mt-0.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-rose-950/40 border border-rose-800/30 text-rose-300 px-3.5 py-2.5 rounded-2xl rounded-tl-none text-xs font-semibold leading-relaxed shadow-sm">
                    {m.text}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={idx}
                className={`flex gap-2 max-w-[85%] text-left ${
                  isAI ? 'self-start' : 'self-end flex-row-reverse'
                }`}
              >
                {/* AI Sparkle Avatar icon */}
                {isAI && (
                  <div className="w-6 h-6 rounded-full bg-teal-550/10 flex items-center justify-center border border-teal-500/20 text-teal-400 shrink-0 self-start mt-0.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
                
                {/* Text bubble */}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                    isAI
                      ? 'bg-slate-800/60 border border-slate-700/40 text-slate-200 rounded-tl-none'
                      : 'bg-teal-500 text-slate-950 rounded-tr-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator loading state */}
          {loading && (
            <div className="flex gap-2 max-w-[85%] self-start text-left">
              <div className="w-6 h-6 rounded-full bg-teal-550/10 flex items-center justify-center border border-teal-500/20 text-teal-400 shrink-0 self-start mt-0.5">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="bg-slate-800/60 border border-slate-700/40 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {/* Dynamic Try Asking Prompt Chips */}
          {messages.length <= 1 && (
            <div className="mt-4 flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300 text-left">
              <div className="flex items-center gap-1.5 px-1">
                <HelpCircle className="w-3 h-3 text-slate-500" />
                <span className="text-[9px] font-extrabold text-slate-500 tracking-wider uppercase">Try Asking</span>
              </div>
              {[
                "Which city has the highest collection?",
                "How many properties are rejected in Mumbai?",
                "What % of Delhi properties are approved?"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  disabled={loading}
                  className="border border-teal-500/20 hover:border-teal-500/40 bg-teal-500/5 hover:bg-teal-500/10 text-teal-400 font-bold py-2 px-3.5 rounded-xl text-left text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Control Area Pinned to Bottom */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 shrink-0">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-1.5 flex items-end gap-2 shadow-inner">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Ask analyst..."
              className="flex-1 max-h-28 bg-transparent text-xs font-semibold text-slate-200 placeholder-slate-500 p-2.5 outline-none resize-none disabled:opacity-50 border-0"
            />
            
            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="bg-teal-500 hover:bg-teal-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-650 p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <span className="text-[9px] text-slate-500 text-center mt-2.5 block font-bold tracking-wide">
            Press Enter to send · Shift+Enter for new line
          </span>
        </div>
      </aside>
    </>
  );
}
