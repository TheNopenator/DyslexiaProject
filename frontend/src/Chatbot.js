import React, { useState } from "react";
import Tesseract from "tesseract.js";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // ⚠️ Replace with your own secure key OR proxy in production
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

  const systemMessage = {
    role: "system",
    content:
      "You are a virtual helper called WordCat who is always jolly and kind towards students. You can mimic some of the behaviors of a cat while sounding mostly human, and you should strongly cater to what the student tells you they struggle with. If they pass in a word or sentence, you should clearly explain in basic English what it means. Recall that your users will primarily be young children with dyslexia, or potentially their caretakers or teachers. Adding humor is good too!",
  }

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {role: "user", content: input };
    const chatHistory = [systemMessage, ...messages, userMessage];
    
    setMessages([...messages, userMessage]);
    setInput("");

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: chatHistory }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error.message || "Something went wrong!");
      }

      const botResponse = data;
      setMessages((prev) => [...prev, botResponse]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Oops! Error: ${err.message}` },
      ]);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const text = await runOCR(file);
  
        const newMessage = { role: "user", content: text };
        setMessages((prev) => [...prev, newMessage]);
        
        const chatHistory = [systemMessage, ...messages, newMessage];
  
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: chatHistory,
          }),
        });
  
        const data = await res.json();
        const botResponse = data;
        setMessages((prev) => [...prev, botResponse]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `OCR failed: ${err.message}` },
        ]);
      }
    }
  };  

  const runOCR = async (file) => {
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: (m) => console.log(m),
    });
    return text;
  };  

  return (
    <div className="chatbox p-4 bg-white rounded shadow-md w-full max-w-md mx-auto mt-4">
      <div className="messages h-64 overflow-y-auto mb-2">
        {messages.map((msg, i) => (
          <div key={i} className={`my-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>
            <strong>{msg.role === "user" ? "You" : "WordCat"}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          className="flex-grow border p-2 mr-2 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={sendMessage}>
          Send
        </button>
      </div>
      <h2 className="text-xl font-bold text-blue-800 mb-2">Upload an Image</h2>
      <div className="flex justify-between mt-4">
      <div className="ml-4 relative">
        <input
          type="file"
          accept="image/*"
          id="imageUpload"
          onChange={handleImageUpload}
          className="hidden"
        />
        <label htmlFor="imageUpload">
          <button className="bg-green-500 text-white px-4 py-2 rounded">
            Upload Image
          </button>
        </label>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;