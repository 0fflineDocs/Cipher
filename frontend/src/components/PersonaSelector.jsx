import { useState } from 'react';
import './PersonaSelector.css';

export default function PersonaSelector({
  personas,
  chairmen,
  selectedMembers,
  selectedChairman,
  onSelectionChange,
}) {
  const [activeCategory, setActiveCategory] = useState('cybersecurity');
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
    // Default selection: all 4 Cybersecurity personas with Strategic Principal
    const defaultMembers = [
      'Security Architect',
      'Strategic Advisory',
      'Cybersecurity Research',
      'Business Risk & Compliance'
    ];
    
    const defaultChairman = 'Strategic Principal';
    onSelectionChange(defaultMembers, defaultChairman);
  };

  const currentPersonas = personas[activeCategory] || [];

  // Filter chairmen based on active category
  const getAvailableChairmen = () => {
    if (!chairmen) return [];
    
    switch (activeCategory) {
      case 'cybersecurity':
      case 'tech':
        return chairmen.filter(c => c.name === 'Strategic Principal' || c.name === 'Technical Director');
      default:
        return [];
    }
  };

  const availableChairmen = getAvailableChairmen();

  return (
    <div className="persona-selector">
      <h3>Configure Your Council</h3>

      <div className="persona-selector-section">
        <h4>Council Members ({selectedMembers.length}/{maxMembers})</h4>
        
        <div className="category-tabs">
          <button
            className={`category-tab ${activeCategory === 'cybersecurity' ? 'active' : ''}`}
            onClick={() => setActiveCategory('cybersecurity')}
          >
            Cybersecurity
          </button>
          <button
            className={`category-tab ${activeCategory === 'tech' ? 'active' : ''}`}
            onClick={() => setActiveCategory('tech')}
          >
            Tech
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
        <h4>Chairmen</h4>
        <div className="chairman-select">
          {availableChairmen.map((chairman) => (
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
