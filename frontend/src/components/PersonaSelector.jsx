import { useState } from 'react';
import './PersonaSelector.css';

export default function PersonaSelector({
  personas,
  chairmen,
  selectedMembers,
  selectedChairman,
  onSelectionChange,
}) {
  const [activeCategory, setActiveCategory] = useState('tech');
  const maxMembers = 6;

  const handlePersonaToggle = (personaName) => {
    let newSelection;
    if (selectedMembers.includes(personaName)) {
      // Deselect
      newSelection = selectedMembers.filter((name) => name !== personaName);
    } else {
      // Select (if not at max)
      if (selectedMembers.length < maxMembers) {
        newSelection = [...selectedMembers, personaName];
      } else {
        return; // Don't allow more than max
      }
    }
    onSelectionChange(newSelection, selectedChairman);
  };

  const handleChairmanSelect = (chairmanName) => {
    onSelectionChange(selectedMembers, chairmanName);
  };

  const handleReset = () => {
    // Default selection: first 3 from tech, first from culture
    const defaultMembers = [];
    
    // Add up to 3 tech personas
    if (personas.tech && personas.tech.length > 0) {
      const techCount = Math.min(3, personas.tech.length);
      for (let i = 0; i < techCount; i++) {
        defaultMembers.push(personas.tech[i].name);
      }
    }
    
    // Add 1 culture persona if available
    if (personas.culture && personas.culture.length > 0) {
      defaultMembers.push(personas.culture[0].name);
    }
    
    const defaultChairman = chairmen && chairmen.length > 0 ? chairmen[0].name : selectedChairman;
    onSelectionChange(defaultMembers, defaultChairman);
  };

  const currentPersonas = personas[activeCategory] || [];

  return (
    <div className="persona-selector">
      <h3>Configure Your Council</h3>

      <div className="persona-selector-section">
        <h4>Council Members ({selectedMembers.length}/{maxMembers})</h4>
        
        <div className="category-tabs">
          <button
            className={`category-tab ${activeCategory === 'tech' ? 'active' : ''}`}
            onClick={() => setActiveCategory('tech')}
          >
            Tech
          </button>
          <button
            className={`category-tab ${activeCategory === 'culture' ? 'active' : ''}`}
            onClick={() => setActiveCategory('culture')}
          >
            Culture
          </button>
        </div>

        <div className="persona-grid">
          {currentPersonas.map((persona) => {
            const isSelected = selectedMembers.includes(persona.name);
            const isDisabled =
              !isSelected && selectedMembers.length >= maxMembers;

            return (
              <div
                key={persona.name}
                className={`persona-card ${isSelected ? 'selected' : ''} ${
                  isDisabled ? 'disabled' : ''
                }`}
                onClick={() => !isDisabled && handlePersonaToggle(persona.name)}
              >
                <div className="persona-name">{persona.name}</div>
                <div className="persona-personality">
                  {persona.personality}
                </div>
              </div>
            );
          })}
        </div>

        {selectedMembers.length >= maxMembers && (
          <div className="selection-count">
            Maximum of {maxMembers} council members selected
          </div>
        )}
      </div>

      <div className="persona-selector-section">
        <h4>Chairman</h4>
        <div className="chairman-select">
          {chairmen && chairmen.map((chairman) => (
            <div
              key={chairman.name}
              className={`chairman-option ${
                selectedChairman === chairman.name ? 'selected' : ''
              }`}
              onClick={() => handleChairmanSelect(chairman.name)}
            >
              <div className="chairman-name">{chairman.name}</div>
              <div className="chairman-personality">
                {chairman.personality}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="selection-actions">
        <button className="btn-reset" onClick={handleReset}>
          Reset to Default
        </button>
      </div>
    </div>
  );
}
