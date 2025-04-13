// set NODE_OPTIONS=--openssl-legacy-provider && npm start
import './App.css';
import React from 'react';
import { useState, useEffect } from 'react';

function App() {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [definitions, setDefinitions] = useState({});
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);

      const femaleVoice = availableVoices.find(voice => 
        voice.name.toLowerCase().includes("female") ||
        voice.name.toLowerCase().includes("samantha") ||
        voice.name.toLowerCase().includes("zira") ||
        voice.name.toLowerCase().includes("google us english")
      );

      if (femaleVoice) {
        setSelectedVoice(femaleVoice);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

  const handleInputChange = (event) => {
    setText(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(text);
      speech.lang = 'en-US';  // Set language
      speech.volume = 1;      // Volume (0 to 1)
      speech.rate = 0.5;        // Speed (0.1 to 10)
      speech.pitch = 1;       // Pitch (0 to 2)
      speech.voice = selectedVoice;
      window.speechSynthesis.speak(speech);
    } else {
      alert('Your browser does not support text-to-speech.');
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
  };

  const fetchDefinition = async (word) => {
    if (!definitions[word]) {
      try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await res.json();
        const def = data[0]?.meanings[0]?.definitions[0]?.definition || 'No definition found.';
        const phonetic = data[0]?.phonetics?.find(p => p.text)?.text || 'No pronunciation found.';

        setDefinitions((prev) => ({...prev, [word]: {def, phonetic } }));
      } catch (err) {
        setDefinitions((prev) => ({...prev, [word]: {
          def: 'Error fetching definition.', phonetic: '' 
          }
        }));
      }
    }

    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(word);
      speech.lang = 'en-US';  // Set language
      speech.volume = 1;      // Volume (0 to 1)
      speech.rate = 0.75;        // Speed (0.1 to 10)
      speech.pitch = 1.5;       // Pitch (0 to 2)
      speech.voice = selectedVoice;
      window.speechSynthesis.speak(speech);
    } else {
      alert('Your browser does not support text-to-speech.');
    }
  };

  const savePlayerData = () => {
    const playerData = {
      name: playerName,
      text,
      selectedVoice: selectedVoice?.name || '',
      definitions,
    };
    localStorage.setItem('playerData', JSON.stringify(playerData));
    alert('Data saved!');
  };

  const loadPlayerData = () => {
    const savedData = localStorage.getItem('playerData');
    if (savedData) {
      const playerData = JSON.parse(savedData);
      setPlayerName(playerData.name);
      setText(playerData.text);
      setSelectedVoice(voices.find(voice => voice.name === playerData.selectedVoice));
      setDefinitions(playerData.definitions);
    } else {
      alert('No saved data found.');
    }
  }

  const words = text.split(/\s+/).map((word, idx) => {
    const defObj = definitions[word.toLowerCase()];
    const phon = definitions[word.toLowerCase()]?.phonetic;
    const def = defObj?.def;

    return (
      <span key={idx} className="word-tooltip" onClick={() => fetchDefinition(word.toLowerCase())}>
        {word}
        <span className="tooltip">
          {phon && <span className="phonetic">{phon}</span>}<br />
          {def || 'Click to define'}
          </span>{' '}
      </span>
    );
  });

  return (
    <div className="min-h-screen bg-blue-100 text-center p-10">
      <link href="https://fonts.googleapis.com/css2?family=Open+Dyslexic&display=swap" rel="stylesheet"></link>
      <div className="container-container">
        <h1 className="text-4xl font-bold text-blue-800 mb-4">
          Welcome to WordCat!
        </h1>
        <img
            src="https://c.tenor.com/F4PgfnPAGdUAAAAC/cute-cat.gif"
            alt="Cute cat gif"
            className="w-32 rounded-xl shadow-lg"
            id="cat-gif"
          />
        </div>
        <p className="text-xl text-gray-700">
          Breaking down complex texts into digestible pieces, one word at a time!
        </p>

        <div>
          <h1>Player Name:</h1>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>

        <div className="text-input-container">
          <h1>Input a text of your choice:</h1>
          <textarea
            className="text-input"
            rows="4"
            cols="50"
            placeholder="Type your text here..."
            value={text}
            onChange={handleChange}
          ></textarea>
          <button className="submit-button">
            Submit
          </button>
          <div className="text-display">
            {words}</div>
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
          <div className="button-group">
            <button type="submit">Convert to Speech</button>
            <button type="button" onClick={() => window.speechSynthesis.pause()}>Pause</button>
            <button type="button" onClick={() => window.speechSynthesis.resume()}>Resume</button>
            <button type="button" onClick={() => window.speechSynthesis.cancel()}>Stop</button>
          </div>
        </form>
        <div className="chatbot-container bg-white p-4 rounded-xl shadow-md max-w-md mx-auto mt-10">
          <h2 className="text-xl font-bold text-blue-800 mb-2">😺 Ask WordCat!</h2>
          <div className="chat-window h-48 overflow-y-auto border p-2 mb-2 rounded">
            <p><strong>WordCat:</strong> Hi there! I'm here to help you understand texts. 🐾</p>
          </div>
          <input
            type="text"
            className="w-full border rounded p-2"
            placeholder="Ask me anything..."
          />
        </div>
      </div>

      <div>
        <button onClick={savePlayerData}>Save Data</button>
        <button onClick={loadPlayerData}>Load Data</button>
      </div>
    </div>
  );
}

export default App;
