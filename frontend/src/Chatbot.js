import React, { useState } from "react";
import axios from "axios";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: newMessages,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const botResponse = res.data.choices[0].message;
      setMessages((prev) => [...prev, botResponse]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Oops! Something went wrong." }]);
    }
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
    </div>
  );
};

export default Chatbot;