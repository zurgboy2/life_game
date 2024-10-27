// src/App.js
import React, { useState, useEffect } from 'react';
import Card from './Card';
import './App.css';
import apiCall from './api';
import GameBoard from './GameBoard';

function RulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="rules-card">
        <button className="close-button" onClick={onClose}>×</button>
        <h2 className="rules-title">Life Choices - Quick Guide</h2>
        
        <div className="rules-content">
          <section className="rules-section">
            <h3>Components:</h3>
            <ul>
              <li>Life Cards Deck</li>
              <li>Opportunity Cards Decks (color-coded)</li>
              <li>20-sided die</li>
              <li>Tracking sheet</li>
            </ul>
          </section>

          <section className="rules-section">
            <h3>Core Rules:</h3>
            <ol>
              <li>Draw Life Cards one at a time</li>
              <li>Number of Opportunity cards you can draw is shown on bottom right</li>
              <li>Cards can be rejected if allowed</li>
              <li>Keep accepted cards and track their modifiers for future rolls</li>
            </ol>
          </section>

          <section className="rules-section">
            <h3>Tracking Sheet:</h3>
            <div className="tracking-sheet">
{`=== LIFE CHOICES TRACKING SHEET ===

RESOURCES                  ACTIVE MODIFIERS
Energy (E):     ____      Career:    ____
Happiness (Ha): ____      Social:    ____
Knowledge (K):  ____      Education: ____
Wealth (W):     ____      Finance:   ____
Influence (I):  ____      Health:    ____
Health (He):    ____
Time (T):       ____/100

LIFE STAGE: [  ]0-22  [  ]23-35  [  ]36-50  [  ]51+`}
            </div>
          </section>

          <section className="rules-section">
            <h3>Game Ends When:</h3>
            <ul>
              <li>Time reaches 100 units OR</li>
              <li>Death card is drawn (survival chance varies by age)</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}


function AddCardModal({ isOpen, onClose, onSubmit, selectedDeck }) {
  const [newCard, setNewCard] = useState({
    "Name of Card": "",
    "Genre of Card": "Career",
    "Type of card": "Choice",
    "Card Description": "",
    "Card Content": ""
  });

  const genres = ['Career', 'Social', 'Education', 'Finance', 'Health'];
  const types = ['Choice', 'Age-Dependent', 'Luck-Based', 'Direct Action'];

  // Generate template JSON based on type
  const generateTemplateJSON = (type) => {
    const baseResults = {
      "K": 0,
      "W": 0,
      "I": 0,
      "He": 0,
      "Ha": 0,
      "E": 0,
      "T": 0,
      "modifiers": ["Career:0", "Social:0", "Education:0", "Finance:0", "Health:0"],
      "modifier_effects": []
    };

    const baseCosts = {
      "E": 0,
      "Ha": 0,
      "K": 0,
      "W": 0,
      "I": 0,
      "He": 0,
      "T": 0
    };

    const templates = {
      'Choice': {
        "options": [
          {
            "name": "Option 1",
            "results": baseResults,
            "costs": baseCosts
          },
          {
            "name": "Option 2",
            "results": baseResults,
            "costs": baseCosts
          }
        ]
      },
      'Age-Dependent': {
        "age_ranges": [
          {
            "range": "0-22",
            "options": [{
              "name": "Option for Young",
              "results": baseResults,
              "costs": baseCosts
            }]
          },
          {
            "range": "23-35",
            "options": [{
              "name": "Option for Adult",
              "results": baseResults,
              "costs": baseCosts
            }]
          },
          {
            "range": "36+",
            "options": [{
              "name": "Option for Mature",
              "results": baseResults,
              "costs": baseCosts
            }]
          }
        ]
      },
      'Luck-Based': {
        "results": baseResults,
        "costs": baseCosts
      },
      'Direct Action': {
        "results": baseResults,
        "costs": baseCosts
      }
    };

    return JSON.stringify(templates[type], null, 2);
  };

  // Update Card Content when type changes
  useEffect(() => {
    setNewCard(prev => ({
      ...prev,
      "Card Content": generateTemplateJSON(prev["Type of card"])
    }));
  }, [newCard["Type of card"]]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(newCard);
    setNewCard({
      "Name of Card": "",
      "Genre of Card": "Career",
      "Type of card": "Choice",
      "Card Description": "",
      "Card Content": ""
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="add-card-modal">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Add New Card to {selectedDeck}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Card Name:</label>
            <input
              type="text"
              value={newCard["Name of Card"]}
              onChange={(e) => setNewCard({...newCard, "Name of Card": e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Genre:</label>
            <select
              value={newCard["Genre of Card"]}
              onChange={(e) => setNewCard({...newCard, "Genre of Card": e.target.value})}
            >
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Type:</label>
            <select
              value={newCard["Type of card"]}
              onChange={(e) => setNewCard({...newCard, "Type of card": e.target.value})}
            >
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={newCard["Card Description"]}
              onChange={(e) => setNewCard({...newCard, "Card Description": e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Card Content:</label>
            <textarea
              value={newCard["Card Content"]}
              onChange={(e) => setNewCard({...newCard, "Card Content": e.target.value})}
              required
              style={{ fontFamily: 'monospace', minHeight: '200px' }}
            />
          </div>

          <button type="submit" className="submit-button">Add Card</button>
        </form>
      </div>
    </div>
  );
}

function App() {
  const [cardData, setCardData] = useState(null);
  const [decks, setDecks] = useState(null);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [view, setView] = useState('menu');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const scriptId = 'games_script';
        const action = 'getDecks';
        
        const response = await apiCall(scriptId, action, {});
        setDecks(response);
      } catch (error) {
        console.error('Error fetching decks:', error);
      }
    };

    fetchDecks();
  }, []);

  const PasswordForm = () => {
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        // Test authentication with a simple API call
        const scriptId = 'games_script';
        const action = 'verifyPassword';
        await apiCall(scriptId, action, { password });
        localStorage.setItem('gamePassword', password); // Save password
        setIsAuthenticated(true);
      } catch (error) {
        alert('Invalid password');
        console.error('Authentication failed:', error);
      }
    };

    // Add a useEffect to check for saved password on load
    useEffect(() => {
      const savedPassword = localStorage.getItem('gamePassword');
      if (savedPassword) {
        setPassword(savedPassword);
        // Verify saved password still works
        const verifyExistingPassword = async () => {
          try {
            const scriptId = 'games_script';
            const action = 'verifyPassword';
            await apiCall(scriptId, action, { password: savedPassword });
            setIsAuthenticated(true);
          } catch (error) {
            localStorage.removeItem('gamePassword');
          }
        };
        verifyExistingPassword();
      }
    }, []);

    return (
      <div className="password-screen">
        <form onSubmit={handleSubmit}>
          <h2>Enter Access Key</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter access key"
            required
          />
          <button type="submit">Access Game</button>
        </form>
      </div>
    );
  };


  const fetchDeckCards = async (deckName) => {
    try {
      const scriptId = 'games_script';
      const action = 'getCards';
      
      const response = await apiCall(scriptId, action, { deck: deckName });
      setCardData(response);
      setSelectedDeck(deckName);
      setView('deck-view'); // Add this line
    } catch (error) {
      console.error('Error fetching card data:', error);
    }
  };

  const handleAddCard = async (newCard) => {
    try {
      const scriptId = 'games_script';
      const action = 'addCard';
      
      await apiCall(scriptId, action, { 
        card: newCard,
        deck: selectedDeck // Add the deck name to the API call
      });

      // Refresh card data for the current deck after adding
      const response = await apiCall(scriptId, 'getCards', { deck: selectedDeck });
      setCardData(response);
    } catch (error) {
      console.error('Error adding card:', error);
    }
  };

  const startGame = () => {
    setView('game-setup');
  };

  const setupGame = async (secondaryDeck) => {
    try {
      // Get Life Cards deck
      const lifeCards = await apiCall('games_script', 'getCards', { deck: 'Life Card' });
      // Get selected secondary deck
      const secondaryCards = await apiCall('games_script', 'getCards', { deck: secondaryDeck });

      // Initialize game state
      const newGameState = {
        lifeDeck: shuffleCards(lifeCards),
        secondaryDeck: shuffleCards(secondaryCards),
        secondaryDeckName: secondaryDeck,
        drawnLifeCards: [],
        drawnSecondaryCards: [],
        stats: {
          Energy: 100,
          Happiness: 50,
          Knowledge: 0,
          Wealth: 0,
          Influence: 0,
          Health: 100,
          Time: 0
        },
        modifiers: {
          Career: 0,
          Social: 0,
          Education: 0,
          Finance: 0,
          Health: 0
        }
      };

      setGameState(newGameState);
      setView('game');
    } catch (error) {
      console.error('Error setting up game:', error);
    }
  };

  const shuffleCards = (cards) => {
    return [...cards].sort(() => Math.random() - 0.5);
  };

  return (
    <div className="App">
      {!isAuthenticated ? (
        <PasswordForm />
      ) : (
        <>
          {view === 'menu' && (
            <div className="main-menu">
              <h1>Life Choices</h1>
              <button onClick={startGame}>Start New Game</button>
              <button onClick={() => setView('decks')}>View/Edit Decks</button>
              <button className="rules-button" onClick={() => setIsRulesOpen(true)}>?</button>
            </div>
          )}
      
          {(view === 'game-setup' || view === 'decks') && decks && (
            <div className="deck-selection">
              <h1>{view === 'game-setup' ? 'Select a Secondary Deck' : 'Select a Deck to View/Edit'}</h1>
              <button 
                className="back-button" 
                onClick={() => setView('menu')}
              >
                ← Back to Menu
              </button>
              <div className="deck-list">
                {decks
                  .filter(deck => view === 'decks' || deck.name !== 'Life Card')
                  .map((deck, index) => (
                    <div 
                      key={index} 
                      className="deck-item"
                      onClick={() => {
                        if (view === 'game-setup') {
                          setupGame(deck.name);
                        } else {
                          fetchDeckCards(deck.name);
                        }
                      }}
                    >
                      <h2>{deck.name}</h2>
                      <p>{deck.description}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
      
          {view === 'game' && gameState && (
            <GameBoard 
              gameState={gameState} 
              setGameState={setGameState}
              onExit={() => {
                setGameState(null);
                setView('menu');
              }}
            />
          )}
      
          {view === 'deck-view' && cardData && (
            <>
              <button 
                className="back-button" 
                onClick={() => {
                  setSelectedDeck(null);
                  setView('decks');
                }}
              >
                ← Back to Decks
              </button>
              <div className="card-container">
                {cardData.map((card, index) => (
                  <Card key={index} rawCard={card} deckName={selectedDeck} />
                ))}
              </div>
            </>
          )}
          
          <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
          <AddCardModal 
            isOpen={isAddCardOpen}
            onClose={() => setIsAddCardOpen(false)}
            onSubmit={handleAddCard}
            selectedDeck={selectedDeck}
          />
      
          {view === 'loading' && (
            <div className="loading">
              <p>Loading...</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;