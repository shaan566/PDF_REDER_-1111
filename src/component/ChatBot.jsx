import React, { useState } from 'react';
import VistoAPI from '../API/API';
import '../stylesheet/chatbot.css';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// Configure PDF.js worker from CDN for reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const ChatBot = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I am Gemini AI. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfContent, setPdfContent] = useState('');

  // Extract text from PDF using pdfjs-dist
  const extractTextFromPDF = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      let textContent = '';
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const text = await page.getTextContent();
        const strings = text.items.map((item) => item.str);
        textContent += strings.join(' ') + '\n';
      }

      return textContent.trim();
    } catch (error) {
      console.error('PDF processing error:', error);
      throw new Error('Failed to process PDF');
    }
  };

  const handleSend = async () => {
    
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    
    // Check if this looks like PDF content being pasted (long text)
    if (input.length > 200 && !pdfContent) {
      setPdfContent(input);
      setInput('');
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: '✅ I\'ve saved this text as PDF content! Now you can ask me questions about it.' 
      }]);
      return;
    }
    
    setInput('');
    setLoading(true);

    try {
      let prompt = input;
      
      // If PDF content exists, include it in the context (but allow unrelated questions)
      if (pdfContent) {
        prompt = `Use the following document content to answer if relevant. If the question is unrelated to the document, answer normally.\n\nQuestion: "${input}"\n\nDocument Content:\n${pdfContent.substring(0, 3000)}...`;
      }
      
      const botReply = await VistoAPI(prompt);
      setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, an error occurred.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setPdfFile(file);
      await handleSendPDF(file);
    }
  };

  const handleSendPDF = async (selectedFile) => {
    const fileToUse = selectedFile || pdfFile;
    if (!fileToUse) return;

    const userMessage = { sender: 'user', text: `📄 Uploaded PDF: ${fileToUse.name}` };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const extracted = await extractTextFromPDF(fileToUse);
      setPdfContent(extracted);

      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: `✅ PDF processed successfully! I can now answer questions about "${fileToUse.name}". Ask me anything about the content.` }
      ]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: 'Sorry, I could not process the PDF. Please try a different file.' 
      }]);
    } finally {
      setLoading(false);
      setPdfFile(null);
    }
  };

  return (
    <div className="chat-container">
      <h1 className="chat-title">ChatBot</h1>
      <div className="chat-window">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {loading && <div className="chat-message bot">Typing...</div>}
      </div>
      <div className="chat-input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={"Type a message..."}
        />
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="pdf-input"
        />
        <button type="button" className="pdf-button" onClick={() => document.getElementById('pdf-input')?.click()}>
          PDF
        </button>
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default ChatBot;