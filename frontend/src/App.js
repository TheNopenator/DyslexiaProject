// set NODE_OPTIONS=--openssl-legacy-provider && npm start
import './App.css';
import React from 'react';
import { useState, useEffect } from 'react';
import Chatbot from './Chatbot';
import { db } from './firebase';
import dayjs from "dayjs";
import {
  collection,
  addDoc,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  setDoc
} from "firebase/firestore";

function App() {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [definitions, setDefinitions] = useState({});
  const [playerName, setPlayerName] = useState('');
  const [dailyStreak, setDailyStreak] = useState(0);
  const [lastLogin, setLastLogin] = useState(null);
  const [stars, setStars] = useState(0);
  const [showReward, setShowReward] = useState(true);
  const [currentWordIndex, setCurrentWordIndex] = useState(null);
  const [words, setWords] = useState([]);

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
    
    if (!text.trim()) return;
  
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
  
      const speech = new SpeechSynthesisUtterance(text);
      speech.lang = 'en-US';
      speech.volume = 1;
      speech.rate = 0.5;
      speech.pitch = 1;
      speech.voice = selectedVoice;
  
      const words = text.split(/\s+/).filter(w => w.length > 0);
      let wordBoundaries = [];
      let pos = 0;
      
      words.forEach(word => {
        wordBoundaries.push({
          start: pos,
          end: pos + word.length,
          word: word
        });
        pos += word.length + 1;
      });
  
      speech.onboundary = (event) => {
        if (event.name === 'word') {
          const charIndex = event.charIndex;
          const currentWord = wordBoundaries.find(
            w => charIndex >= w.start && charIndex < w.end
          );
          
          if (currentWord) {
            const wordIndex = words.indexOf(currentWord.word);
            if (wordIndex !== -1 && wordIndex !== currentWordIndex) {
              setCurrentWordIndex(wordIndex);
            }
          }
        }
      };
  
      speech.onend = () => {
        setCurrentWordIndex(null);
      };
  
      setCurrentWordIndex(null);
      window.speechSynthesis.speak(speech);
    } else {
      alert('Your browser does not support text-to-speech.');
    }
  };

  const handleChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    setWords(newText.split(/\s+/).filter(word => word.length > 0));
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
  };

  const renderedWords = text.split(/\s+/).map((word, idx) => {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    const defObj = definitions[cleanWord];
    
    return (
      <span 
        key={`${word}-${idx}`}
        className={`
          word-tooltip 
          ${currentWordIndex === idx ? 'highlighted-word' : ''}
        `}
        onClick={() => fetchDefinition(cleanWord)}
      >
        {word}
        {defObj && (defObj.def || defObj.phonetic) && (
          <span className="tooltip">
            {defObj.phonetic && <span className="phonetic">{defObj.phonetic}</span>}
            {defObj.def &&  (
              <>
                <br />
                {defObj.def}
              </>
            )}
          </span>
        )}
        {' '}
      </span>
    );
  });

  useEffect(() => {
    const updateRewards = async () => {
      if (!playerName) return;

      const ref = doc(db, "students", playerName);
      const snap = await getDoc(ref);
      const today = dayjs().format('YYYY-MM-DD');

      if (!snap.exists()) {
        await setDoc(ref, {
          stars: 5,
          dailyStreak: 1,
          lastLoginDate: today,
        });
        setStars(5);
        setDailyStreak(1);
        setLastLogin(today);
        return;
      }
  
      if (snap.exists()) {
        const data = snap.data();

        if (data.lastLoginDate !== today) {
          let newStreak = 1;
          if (dayjs(today).diff(dayjs(data.lastLoginDate), 'day') === 1) {
            newStreak = data.dailyStreak + 1;
          }
          await updateDoc(ref, {
            stars: data.stars + 5,
            dailyStreak: newStreak,
            lastLoginDate: today,
          });
          setStars(data.stars + 5);
          setDailyStreak(newStreak);
        } else {
          setStars(data.stars);
          setDailyStreak(data.dailyStreak);
        }
        setLastLogin(data.lastLoginDate);
      }
    };
    updateRewards();
    }, [playerName]
  );

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
          <h1>Your Name:</h1>
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
          <button className="submit-button" onClick={handleSubmit}>
            Submit
          </button>
          {text && (
            <div className="text-display">
              {renderedWords}
            </div>
          )}
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
          <Chatbot studentName={playerName} />
        </div>
      </div>

      <div>
        <button onClick={savePlayerData}>Save Data</button>
        <button onClick={loadPlayerData}>Load Data</button>
      </div>

      <div className="rewards-container">
        {showReward && (
          <div className="reward-popup bg-yellow-200 p-4 rounded shadow-md mt-4 transition-opacity duration-500 ease-in-out">
          🌟 You earned 5 stars today! Keep it up!
          <br />
          🔥 1-day streak! You're on fire!
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
