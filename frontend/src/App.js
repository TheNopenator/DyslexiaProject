import logo from './logo.svg';
import './App.css';
import React from 'react';
import { useState } from 'react';

function App() {
  const [text, setText] = useState('');

  const handleInputChange = (event) => {
    setText(event.target.value);
  };

  const handleSubmit = async (event) => {
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(text);
      speech.lang = 'en-US';  // Set language
      speech.volume = 1;      // Volume (0 to 1)
      speech.rate = 0.5;        // Speed (0.1 to 10)
      speech.pitch = 1;       // Pitch (0 to 2)

      window.speechSynthesis.speak(speech);
    } else {
      alert('Your browser does not support text-to-speech.');
    }
  };
  return (
    <div className="min-h-screen bg-blue-100 text-center p-10">
      <h1 className="text-4xl font-bold text-blue-800 mb-4">
        Welcome to WordPal!
      </h1>
      <p className="text-xl text-gray-700">
        Helping kids break down words and understand texts.
      </p>
      <div className="text-input-container">
        <h1>Input a text of your choice:</h1>
        <textarea
          className="text-input"
          rows="4"
          cols="50"
          placeholder="Type your text here..."
        ></textarea>
        <button className="submit-button">
          Submit
        </button>
      </div>
      <div className="text-to-speech-container">
      <h1>Text to Speech</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={handleInputChange}
          rows="4"
          cols="50"
          placeholder="Type your text here..."
        ></textarea>
        <button type="submit">Convert to Speech</button>
      </form>
    </div>
    </div>
  );
}

export default App;
