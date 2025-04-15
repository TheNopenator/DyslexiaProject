import React, { useState, useEffect } from "react";
import Tesseract from "tesseract.js";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  doc,
  getDocs
} from "firebase/firestore";

const Chatbot = ({ studentName }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [text, setText] = useState('');
  const [voices, setVoices] = useState([]);

  const systemMessage = {
    role: "system",
    content:
      "You are a virtual helper called WordCat who is always jolly and kind towards students. You can mimic some of the behaviors of a cat while sounding mostly human, and you should strongly cater to what the student tells you they struggle with. If they pass in a word or sentence, you should clearly explain in basic English what it means. Recall that your users will primarily be young children with dyslexia, or potentially their caretakers or teachers. Adding humor is good too! Additional info: Given all these pieces, a 1-on-1 AI tutor is not only feasible, it’s already being built by multiple companies. The uniqueness might come in how specialized it is for dyslexia. A tailored dyslexia AI tutor would place extra emphasis on things like phonemic awareness exercises (maybe having the child say the sounds they hear, not just read text), multi-sensory prompts (“trace this letter with your finger while saying it”), and over-learning (lots of review of past skills to build automaticity). It would also need to be tolerant and encouraging, since dyslexic learners can become easily discouraged. Thankfully, an AI doesn’t show frustration – it provides a judgment-free space to practice, which many students appreciate. In fact, research by the University of California found that giving students with dyslexia access to supportive AI tools can reduce their anxiety and improve engagement​",
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (!studentName) return;

      try {
        const messagesSnapshot = await getDocs(
          collection(db, "students", studentName, "messages")
        );
        const loadedMessages = messagesSnapshot.docs.map((doc) => doc.data());
        setMessages(loadedMessages);
      } catch (err) {
        console.error("Error fetching messages: ", err);
      }
    };

    fetchMessages();
  }, [studentName]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    if (!studentName.trim()) {
      alert("Please enter your name before sending a message.");
      return;
    }

    const userMessage = { role: "user", content: input };
    const chatHistory = [systemMessage, ...messages, userMessage];

    setMessages((prev) => [...prev, userMessage]);
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
      textToSpeech(botResponse.content);
      setMessages((prev) => [...prev, botResponse]);

      await saveMessage(studentName, userMessage);
      await saveMessage(studentName, botResponse);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Oops! Error: ${err.message}` },
      ]);
    }
  };

  const handleImageUpload = async (event) => {
    if (!studentName.trim()) {
      alert("Please enter your name before sending a message.");
      return;
    }

    const file = event.target.files[0];
    if (file) {
      try {
        const text = await runOCR(file);

        const newMessage = { role: "user", content: text };
        setMessages((prev) => [...prev, newMessage]);

        const chatHistory = [systemMessage, ...messages, newMessage];

        const res = await fetch("http://localhost:5000/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: chatHistory }),
        });

        const data = await res.json();
        const botResponse = data;
        textToSpeech(botResponse.content);
        setMessages((prev) => [...prev, botResponse]);

        await saveMessage(studentName, newMessage);
        await saveMessage(studentName, botResponse);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `OCR failed: ${err.message}` },
        ]);
      }
    }
  };

  const runOCR = async (file) => {
    const {
      data: { text },
    } = await Tesseract.recognize(file, "eng", {
      logger: (m) => console.log(m),
    });
    return text;
  };

  const saveMessage = async (studentName, messageObj) => {
    try {
      await addDoc(collection(db, "students", studentName, "messages"), messageObj);
    } catch (e) {
      console.error("Error saving message: ", e);
    }
  };

  const textToSpeech = async (content) => {
    const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);

      const femaleVoice = availableVoices.find(voice => 
        voice.name.toLowerCase().includes("female") ||
        voice.name.toLowerCase().includes("samantha") ||
        voice.name.toLowerCase().includes("zira") ||
        voice.name.toLowerCase().includes("google us english")
      );

      if ('speechSynthesis' in window) {
        const speech = new SpeechSynthesisUtterance(content);
        speech.lang = 'en-US';  // Set language
        speech.volume = 1;      // Volume (0 to 1)
        speech.rate = 0.75;        // Speed (0.1 to 10)
        speech.pitch = 1;       // Pitch (0 to 2)
        speech.voice = femaleVoice || selectedVoice;
        window.speechSynthesis.speak(speech);
      } else {
        alert('Your browser does not support text-to-speech.');
      }
  }

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
        <button type="button" onClick={() => window.speechSynthesis.pause()}>Pause</button>
        <button type="button" onClick={() => window.speechSynthesis.resume()}>Resume</button>
        <button type="button" onClick={() => window.speechSynthesis.cancel()}>Stop</button>
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
            <button className="bg-green-500 text-white px-4 py-2 rounded">Upload Image</button>
          </label>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;