import React, { useState } from 'react';
import './Card.css';
import { DECK_COLORS } from './constants';

const icons = {
  E: '⚡', 
  Ha: '😊',
  K: '📚',
  W: '💰',
  I: '🌟',
  He: '❤️',
  T: '⏰',
};

const GENRE_COLORS = {
  'Choice': '#FF6B6B',
  'Age-Dependent': '#4ECDC4',
  'Luck-Based': '#45B7D1',
  'Direct Action': '#96CEB4',
  'Education': '#FFEEAD',
  'Social': '#6C5B7B',
  'Career': '#2ECC71',
  'Finance': '#E74C3C',
  'Health': '#9B59B6',
  'default': '#34495E'
};

const CARD_TYPE_COLORS = {
  'Choice': '#FF9F43',
  'Age-Dependent': '#00B894',
  'Luck-Based': '#54A0FF',
  'Direct Action': '#5F27CD',
  'default': '#576574'
};

const genreIcons = {
  'Choice': '🔀',
  'Age-Dependent': '👶👴',
  'Luck-Based': '🎲',
  'Direct Action': '➡️',
  'Education': '🎓',
  'Social': '👥',
  'Career': '💼',
  'Finance': '💵',
  'Health': '🏥',
};

const modifierIcons = {
  'Choice': '🔀',
  'Age-Dependent': '⏳',
  'Luck-Based': '🎲',
  'Direct Action': '➡️',
  'Education': '🎓',
  'Social': '👥',
  'Career': '💼',
  'Finance': '💵',
  'Health': '🏥',
};



const Card = ({ rawCard, deckName }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  if (!rawCard) return null;

  // If rawCard has error/content structure, extract the actual card data
  const cardData = rawCard.content ? {
    ...rawCard,
    "Card Content": rawCard.content,
    "Name of Card": rawCard.cardName
  } : rawCard;

  const deckStyle = DECK_COLORS[deckName] || DECK_COLORS.default;
  const cardStyles = {
    '--card-background': deckStyle.background,
    '--card-border': deckStyle.border
  };



  const cardContent = (() => {
    try {
      let content = cardData["Card Content"];
      
      // Helper function to recursively parse JSON strings
      const parseNestedJSON = (str) => {
        try {
          // If it's not a string or is empty, return as is
          if (typeof str !== 'string' || !str) {
            return str;
          }
  
          // Remove any extra quotes at the start and end
          let cleanStr = str.replace(/^"|"$/g, '');
          
          // Replace escaped quotes with regular quotes
          cleanStr = cleanStr.replace(/\\"/g, '"');
          
          // Try to parse the string
          let parsed;
          try {
            parsed = JSON.parse(cleanStr);
          } catch (e) {
            // If initial parse fails, try un-escaping backslashes
            cleanStr = cleanStr.replace(/\\\\/g, '\\');
            parsed = JSON.parse(cleanStr);
          }
          
          // If parsed result is still a string, try parsing again
          if (typeof parsed === 'string') {
            return parseNestedJSON(parsed);
          }
          
          // If it's an object, recursively parse any string values that look like JSON
          if (typeof parsed === 'object' && parsed !== null) {
            Object.keys(parsed).forEach(key => {
              if (typeof parsed[key] === 'string' && 
                  (parsed[key].startsWith('{') || parsed[key].startsWith('['))) {
                try {
                  parsed[key] = parseNestedJSON(parsed[key]);
                } catch (e) {
                  // Keep original value if parsing fails
                }
              }
            });
          }
          
          return parsed;
        } catch (e) {
          console.error('Parse error in parseNestedJSON:', {
            error: e,
            str: str,
            cardName: cardData["Name of Card"]
          });
          return str;
        }
      };
  
      // If content is already an object, return it
      if (typeof content === 'object' && content !== null) {
        return content;
      }
      
      // For string content, handle potentially nested JSON
      if (typeof content === 'string') {
        // Try parsing with the recursive helper
        const parsed = parseNestedJSON(content);
        
        // Log parsing result for debugging
        console.log('Parsed content:', {
          original: content,
          parsed: parsed,
          cardName: cardData["Name of Card"],
          isString: typeof parsed === 'string'
        });
  
        // Validate the structure based on card type
        if (cardData["Genre of Card"] === "Age-Dependent") {
          if (typeof parsed === 'string' || !parsed.age_ranges) {
            console.error('Invalid age-dependent card structure:', {
              content: parsed,
              cardName: cardData["Name of Card"]
            });
            return {
              age_ranges: [{
                range: "Error",
                options: [{
                  name: "Error parsing card data",
                  results: {},
                  costs: {}
                }]
              }]
            };
          }
        }
  
        return parsed;
      }
      
      return {};
    } catch (error) {
      console.error('General error processing card content:', {
        error,
        cardName: cardData["Name of Card"],
        content: cardData["Card Content"]
      });
      return {};
    }
  })();


  const CompactResultDisplay = ({ data }) => {
    if (!data) return null;
    
    // Filter out modifiers and modifier_effects and non-zero values
    const filteredEntries = Object.entries(data)
      .filter(([key, value]) => 
        key !== 'modifiers' && 
        key !== 'modifier_effects' && 
        value !== 0 && 
        value !== null && 
        value !== undefined && 
        value !== ''
      );
    
    if (filteredEntries.length === 0) return null;
  
    return (
      <div className="compact-results">
        {filteredEntries.map(([key, value]) => (
          <span key={key} className="result-item">
            <span className="icon">{icons[key]}</span>
            <span className="value">{value}</span>
          </span>
        ))}
      </div>
    );
  };

  const OptionDisplay = ({ option, ageRange = null }) => {
    const hasModifiers = option.results?.modifiers?.some(mod => {
      const [, value] = mod.split(':');
      return parseInt(value) !== 0;
    });
    const hasModifierEffects = option.results?.modifier_effects?.length > 0;
  
    return (
      <div className="option-display">
        <div className="option-name">{option.name}</div>
        <div className="option-details">
          {option.costs && Object.values(option.costs).some(v => v !== 0) && (
            <div className="costs">
              <CompactResultDisplay data={option.costs} />
            </div>
          )}
          <div className="transform-arrow">➜</div>
          {option.results && Object.values(option.results).some(v => v !== 0) && (
            <div className="results">
              <CompactResultDisplay data={option.results} />
            </div>
          )}
        </div>
        {(hasModifiers || hasModifierEffects) && (
          <div className="option-modifiers">
            {hasModifiers && option.results.modifiers
              .filter(mod => {
                const [, value] = mod.split(':');
                return parseInt(value) !== 0;
              })
              .map((mod, index) => {
                const [type, value] = mod.split(':');
                const icon = icons[type] || modifierIcons[type] || type;
                return (
                  <span key={index} className="modifier-tag">
                    {icon}
                    <span className="modifier-value">{value}</span>
                  </span>
                );
              })}
            {hasModifierEffects && option.results.modifier_effects.map((effect, index) => (
              <div key={index} className="modifier-effect">
                {effect}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const CardContent = ({ isPreview }) => {
    if (isPreview) {
      const getPreviewOptions = () => {
        if (cardContent.age_ranges) {
          return cardContent.age_ranges.flatMap(range => 
            range.options.map(opt => ({
              name: opt.name,
              ageRange: range.range
            }))
          );
        }
        if (cardContent.options) {
          return cardContent.options.map(opt => ({ name: opt.name }));
        }
        if (cardContent.results) {
          return [{ name: "Direct Action" }];
        }
        return [];
      };
  
      const previewOptions = getPreviewOptions();
      
      return (
        <div className="preview-section">
          <div className="options-preview-grid">
            {previewOptions.map((option, index) => (
              <div key={index} className="preview-option">
                {option.ageRange && (
                  <div className="preview-age-range">Age: {option.ageRange}</div>
                )}
                <div className="preview-option-name">{option.name}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  
    if (cardContent.age_ranges) {
      return (
        <div className="age-ranges-list">
          {cardContent.age_ranges.map((ageRange, index) => (
            <div key={index} className="age-range-section">
              <div className="age-range-header">
                {ageRange.range}
              </div>
              <div className="age-range-content">
                {ageRange.options.map((option, optIndex) => (
                  <OptionDisplay 
                    key={optIndex} 
                    option={option} 
                    ageRange={ageRange.range}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }
  
    if (cardContent.options) {
      return (
        <div className="options-list">
          {cardContent.options.map((option, index) => (
            <OptionDisplay key={index} option={option} />
          ))}
        </div>
      );
    }
  
    if (cardContent.results) {
      return (
        <div className="direct-action">
          <OptionDisplay 
            option={{
              name: "Direct Action",
              costs: cardContent.costs,
              results: cardContent.results
            }} 
          />
        </div>
      );
    }
  
    return null;
  };


  const CardFront = () => (
    <div className="card-front">
      <div className="card-header">
        <span className="card-genre">
          {genreIcons[cardData["Genre of Card"]] || cardData["Genre of Card"]}
        </span>
        <h2 className="card-name">{cardData["Name of Card"]}</h2>
      </div>
      <div className="card-body">
        <div className="card-title-banner"
          style={{
            '--genre-color': GENRE_COLORS[cardData["Genre of Card"]] || GENRE_COLORS.default,
            '--type-color': CARD_TYPE_COLORS[cardData["Type of card"]] || CARD_TYPE_COLORS.default
          }}>
          <h1>{cardData["Name of Card"]}</h1>
        </div>
        <div className="card-description">
          {cardData["Card Description"]}
        </div>
        <CardContent isPreview={true} />
      </div>
    </div>
  );

  const CardBack = () => (
    <div className="card-back">
      <div className="card-header">
        <h2 className="card-name">{cardData["Name of Card"]}</h2>
      </div>
      <div className="card-body">
        <CardContent isPreview={false} />
        {cardData["Opportunity Cards"] !== undefined && (
          <div className="opportunity-cards-icon">
            {cardData["Opportunity Cards"]}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="cards-wrapper">
      <div 
        className={`card-container ${isFlipped ? 'flipped' : ''}`} 
        onClick={() => setIsFlipped(!isFlipped)}
        style={cardStyles}
      >
        <div className="card-flipper">
          <CardFront />
          <CardBack />
        </div>
      </div>
    </div>
  );
};

export default Card;