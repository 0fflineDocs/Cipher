import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './MembersView.css';

export default function MembersView({ personas, chairmen }) {
  const [activeCategory, setActiveCategory] = useState('tech');
  const [selectedPersona, setSelectedPersona] = useState(null);

  // Auto-select first persona if none selected
  useEffect(() => {
    if (!selectedPersona && personas && personas.tech && personas.tech.length > 0) {
      setSelectedPersona({ ...personas.tech[0], category: 'tech' });
    }
  }, [personas, selectedPersona]);

  if (!personas || !chairmen) {
    return (
      <div className="members-view">
        <div className="members-loading">Loading personas...</div>
      </div>
    );
  }

  // Get current category personas
  const currentPersonas = personas[activeCategory] || [];

  const handlePersonaClick = (persona, category) => {
    setSelectedPersona({ ...persona, category });
  };

  const handleChairmanClick = (chairman) => {
    setSelectedPersona({ ...chairman, category: 'chairman' });
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'tech':
        return 'var(--tech-purple)';
      case 'culture':
        return 'var(--culture-green)';
      case 'chairman':
        return 'var(--chairman-orange)';
      default:
        return 'var(--text-primary)';
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'tech':
        return 'Tech Council Member';
      case 'culture':
        return 'Culture Council Member';
      case 'chairman':
        return 'Chairman';
      default:
        return 'System';
    }
  };

  return (
    <div className="members-view">
      <div className="members-sidebar">
        <h2 className="members-title">Council Members</h2>

        {/* Tech Personas */}
        <div className="members-category">
          <button
            className={`category-header ${activeCategory === 'tech' ? 'active' : ''}`}
            onClick={() => setActiveCategory('tech')}
          >
            <span className="category-icon tech">⚡</span>
            <span>Tech</span>
          </button>
          {activeCategory === 'tech' && (
            <div className="persona-list">
              {personas.tech?.map((persona) => (
                <div
                  key={persona.name}
                  className={`persona-item tech ${
                    selectedPersona?.name === persona.name ? 'selected' : ''
                  }`}
                  onClick={() => handlePersonaClick(persona, 'tech')}
                >
                  <div className="persona-item-name">{persona.name}</div>
                  <div className="persona-item-role">{persona.personality}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Culture Personas */}
        <div className="members-category">
          <button
            className={`category-header ${activeCategory === 'culture' ? 'active' : ''}`}
            onClick={() => setActiveCategory('culture')}
          >
            <span className="category-icon culture">🎨</span>
            <span>Culture</span>
          </button>
          {activeCategory === 'culture' && (
            <div className="persona-list">
              {personas.culture?.map((persona) => (
                <div
                  key={persona.name}
                  className={`persona-item culture ${
                    selectedPersona?.name === persona.name ? 'selected' : ''
                  }`}
                  onClick={() => handlePersonaClick(persona, 'culture')}
                >
                  <div className="persona-item-name">{persona.name}</div>
                  <div className="persona-item-role">{persona.personality}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chairmen */}
        <div className="members-category">
          <div className="category-header chairman-header">
            <span className="category-icon chairman">👑</span>
            <span>Chairmen</span>
          </div>
          <div className="persona-list">
            {chairmen?.map((chairman) => (
              <div
                key={chairman.name}
                className={`persona-item chairman ${
                  selectedPersona?.name === chairman.name ? 'selected' : ''
                }`}
                onClick={() => handleChairmanClick(chairman)}
              >
                <div className="persona-item-name">{chairman.name}</div>
                <div className="persona-item-role">{chairman.personality}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="members-content">
        {selectedPersona && (
          <>
            <div className="persona-header">
              <div
                className="persona-category-badge"
                style={{ borderColor: getCategoryColor(selectedPersona.category) }}
              >
                {getCategoryLabel(selectedPersona.category)}
              </div>
              <h1
                className="persona-name-large"
                style={{ color: getCategoryColor(selectedPersona.category) }}
              >
                {selectedPersona.name}
              </h1>
              <p className="persona-personality-large">
                {selectedPersona.personality}
              </p>
              <div className="persona-model">
                Model: <code>{selectedPersona.model}</code>
              </div>
            </div>

            <div className="persona-system-message">
              <h3>System Message</h3>
              <div className="system-message-content markdown-content">
                <ReactMarkdown>{selectedPersona.system_message}</ReactMarkdown>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
