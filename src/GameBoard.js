import React, { useState } from 'react';
import Card from './Card';
import './GameBoard.css';

const GameBoard = ({ gameState, setGameState, onExit }) => {
  const [activeCards, setActiveCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logEntry, setLogEntry] = useState('');
  const [editingStat, setEditingStat] = useState(null);

  const handleStatEdit = (stat, value) => {
    const newValue = parseInt(value) || 0;
    const newState = {...gameState};
    newState.stats[stat] = newValue;
    setGameState(newState);
    setEditingStat(null);
  };

  const handleStatAdjust = (stat, amount) => {
    const newState = {...gameState};
    newState.stats[stat] = Math.max(0, newState.stats[stat] + amount);
    setGameState(newState);
  };

  const handleStatChange = (stat, value) => {
    const newValue = parseInt(value) || 0;
    const newState = {...gameState};
    newState.stats[stat] = Math.max(0, newValue);
    setGameState(newState);
  };
  
    const drawCards = () => {
    if (gameState.lifeDeck.length === 0) return;
    
    const newState = {...gameState};
    const drawnLifeCard = {...newState.lifeDeck.pop(), deck: 'Life Card'};  // Set deck name explicitly
    
    // Draw opportunity cards based on Life Card's Opportunity Cards value
    const opportunityCards = [];
    const numOpportunityCards = drawnLifeCard["Opportunity Cards"] || 0;
    
    for (let i = 0; i < numOpportunityCards; i++) {
      if (newState.secondaryDeck.length > 0) {
        const oppCard = {...newState.secondaryDeck.pop(), deck: gameState.secondaryDeckName};  // Set deck name explicitly
        opportunityCards.push(oppCard);
      }
    }
    
    // Set active cards
    setActiveCards([
      { ...drawnLifeCard, isLife: true },
      ...opportunityCards.map(card => ({ ...card, isLife: false }))
    ]);
    
    newState.drawnLifeCards.push(drawnLifeCard);
    setGameState(newState);
  };

  const handleCardClick = (card) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const handleCardUse = (card) => {
    const newActiveCards = activeCards.filter(c => c !== card);
    setActiveCards(newActiveCards);
    setIsModalOpen(false);
    
    // If it's not a life card and not used, put it back in the deck
    if (!card.isLife) {
      const newState = {...gameState};
      newState.secondaryDeck.push(card);
      setGameState(newState);
    }
    
    // Add to log
    addLogEntry(`Used ${card.isLife ? 'Life Card' : gameState.secondaryDeckName}: ${card["Name of Card"]}`);
  };

  const handleCardMinimize = () => {
    setIsModalOpen(false);
  };

  const addLogEntry = (entry) => {
    const newState = {...gameState};
    newState.log = newState.log || [];
    newState.log.push({
      text: entry,
      timestamp: new Date().toISOString(),
      id: Date.now()
    });
    setGameState(newState);
  };

  const handleLogEdit = (id, newText) => {
    const newState = {...gameState};
    const logIndex = newState.log.findIndex(entry => entry.id === id);
    if (logIndex !== -1) {
      newState.log[logIndex].text = newText;
      newState.log[logIndex].edited = true;
      setGameState(newState);
    }
  };

  const saveGame = () => {
    const saveData = JSON.stringify(gameState);
    const blob = new Blob([saveData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'life_choices_save.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadGame = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const loadedState = JSON.parse(e.target.result);
          setGameState(loadedState);
        } catch (error) {
          console.error('Error loading save file:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleModifierAdjust = (modifier, amount) => {
    const newState = {...gameState};
    newState.modifiers[modifier] = newState.modifiers[modifier] + amount;
    setGameState(newState);
  };
  
  const handleModifierChange = (modifier, value) => {
    const newValue = parseInt(value) || 0;
    const newState = {...gameState};
    newState.modifiers[modifier] = newValue;
    setGameState(newState);
  };
  
  return (
    <div className="game-board">
      <div className="game-header">
        <div className="stats-display">
          {Object.entries(gameState.stats).map(([stat, value]) => (
            <div key={stat} className="stat-item">
              <span className="stat-label">{stat}:</span>
              {editingStat === stat ? (
                <input
                  type="number"
                  value={value}
                  onChange={(e) => handleStatEdit(stat, e.target.value)}
                  onBlur={() => setEditingStat(null)}
                  autoFocus
                  className="stat-edit-input"
                />
              ) : (
                <span 
                  className="stat-value"
                  onClick={() => setEditingStat(stat)}
                >
                  {value}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="modifiers-display">
          {Object.entries(gameState.modifiers).map(([modifier, value]) => (
            <div key={modifier} className="modifier-item">
              <span className="modifier-label">{modifier}:</span>
              <span className="modifier-value">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="game-actions">
        <button 
          onClick={drawCards}
          disabled={activeCards.length > 0}
        >
          Draw Life Card ({gameState.lifeDeck.length} remaining)
        </button>
        <button onClick={saveGame}>Save Game</button>
        <input
          type="file"
          accept=".json"
          onChange={loadGame}
          style={{ display: 'none' }}
          id="load-game"
        />
        <label htmlFor="load-game" className="button">Load Game</label>
        <button onClick={onExit}>Exit Game</button>
      </div>

      <div className="active-cards">
        {activeCards.map((card, index) => (
          <div key={index} className="card-preview" onClick={() => handleCardClick(card)}>
            <Card rawCard={card} deckName={card.deck} isPreview={true} />
          </div>
        ))}
      </div>

      {isModalOpen && selectedCard && (
        <div className="card-modal">
          <div className="modal-content">
            <div className="card-section">
              <Card rawCard={selectedCard} deckName={selectedCard.deck} />
              <div className="modal-actions">
                <button onClick={handleCardMinimize}>Minimize</button>
                {!selectedCard.isLife && (
                  <button onClick={() => handleCardUse(selectedCard)}>Don't Use</button>
                )}
                <button onClick={() => handleCardUse(selectedCard)}>
                  {selectedCard.isLife ? 'Continue' : 'Use Card'}
                </button>
              </div>
            </div>

            <div className="stat-window">
            <h3>Adjust Values</h3>
            <div className="stat-window-section">
                <h4>Stats</h4>
                {Object.entries(gameState.stats).map(([stat, value]) => (
                <div key={stat} className="stat-adjust-item">
                    <span className="stat-label">{stat}</span>
                    <div className="stat-adjust-controls">
                    <button 
                        className="stat-adjust-button"
                        onClick={() => handleStatAdjust(stat, -1)}
                    >
                        -
                    </button>
                    <input
                        type="number"
                        className="stat-adjust-value"
                        value={value}
                        onChange={(e) => handleStatChange(stat, e.target.value)}
                    />
                    <button 
                        className="stat-adjust-button"
                        onClick={() => handleStatAdjust(stat, 1)}
                    >
                        +
                    </button>
                    </div>
                </div>
                ))}
            </div>
            
            <div className="stat-window-section">
                <h4>Modifiers</h4>
                {Object.entries(gameState.modifiers).map(([modifier, value]) => (
                <div key={modifier} className="stat-adjust-item">
                    <span className="stat-label">{modifier}</span>
                    <div className="stat-adjust-controls">
                    <button 
                        className="stat-adjust-button"
                        onClick={() => handleModifierAdjust(modifier, -1)}
                    >
                        -
                    </button>
                    <input
                        type="number"
                        className="stat-adjust-value"
                        value={value}
                        onChange={(e) => handleModifierChange(modifier, e.target.value)}
                    />
                    <button 
                        className="stat-adjust-button"
                        onClick={() => handleModifierAdjust(modifier, 1)}
                    >
                        +
                    </button>
                    </div>
                </div>
                ))}
            </div>
            </div>
          </div>
        </div>
      )}

      <div className="game-log">
        <h3>Game Log</h3>
        <div className="log-entries">
          {(gameState.log || []).map((entry) => (
            <div key={entry.id} className="log-entry">
              <input
                type="text"
                value={entry.text}
                onChange={(e) => handleLogEdit(entry.id, e.target.value)}
              />
              {entry.edited && <span className="edited-marker">(edited)</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
 
export default GameBoard;
