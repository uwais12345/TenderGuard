import React, { useState, useRef, useEffect } from 'react';
import { X, MessageSquare, Send, Loader2, Bot, User } from 'lucide-react';
import axios from 'axios';

const ChatModal = ({ vendor, onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `Hello! I have access to the full proposal document from **${vendor.company_name}**. Ask me anything about their pricing, terms, delivery timelines, certifications, or any other details from their submission.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/chat', {
        vendor_pdf_text: vendor.parsed_text || '',
        message: question
      });
      setMessages(prev => [...prev, { role: 'ai', text: response.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: '⚠️ Failed to get a response. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content chat-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <div className="bot-icon-container">
              <MessageSquare size={22} />
            </div>
            <div>
              <h3>Ask AI About This Proposal</h3>
              <p>{vendor.company_name} · {vendor.source_file}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-bubble-row ${msg.role}`}>
              <div className="chat-avatar">
                {msg.role === 'ai' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className="chat-bubble">
                {msg.text.split('**').map((part, i) =>
                  i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble-row ai">
              <div className="chat-avatar"><Bot size={16} /></div>
              <div className="chat-bubble typing-bubble">
                <Loader2 size={14} className="spin" /> Analyzing proposal...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="chat-input-row">
          <textarea
            className="chat-input"
            placeholder="Ask about pricing, delivery, certifications, warranties…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
          />
          <button
            className="chat-send-btn"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
