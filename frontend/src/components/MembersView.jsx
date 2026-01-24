import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './MembersView.css';

export default function MembersView({ personas, chairmen }) {
  const [activeCategory, setActiveCategory] = useState('cybersecurity');
  const [selectedPersona, setSelectedPersona] = useState(null);

  // Auto-select first persona if none selected
  useEffect(() => {
    if (!selectedPersona && personas && personas.cybersecurity && personas.cybersecurity.length > 0) {
      setSelectedPersona({ ...personas.cybersecurity[0], category: 'cybersecurity' });
    }
  }, [personas, selectedPersona]);

  if (!personas || !chairmen) {
    return (
      <div className="members-view">
        <div className="members-loading">Loading personas...</div>
      </div>
    );
  }

  // Helper to determine if a persona is a chairman and what category they belong to
  const getChairmanCategory = (chairmanName) => {
    if (chairmanName === 'Technical Principal') return 'tech';
    if (chairmanName === 'Strategic Principal') return 'cybersecurity';
    if (chairmanName === 'Ozymandias' || chairmanName === 'Sage') return 'culture';
    return null;
  };

  // Get chairmen for a specific category
  const getChairmenForCategory = (category) => {
    return chairmen.filter((chairman) => getChairmanCategory(chairman.name) === category);
  };

  const handlePersonaClick = (persona, category) => {
    setSelectedPersona({ ...persona, category });
  };

  const getCategoryColor = (category, isChairman = false) => {
    if (isChairman) {
      return 'var(--chairman-orange)';
    }
    switch (category) {
      case 'tech':
        return 'var(--tech-purple)';
      case 'culture':
        return 'var(--culture-green)';
      case 'cybersecurity':
        return 'var(--cybersecurity-blue)';
      default:
        return 'var(--text-primary)';
    }
  };

  const getCategoryLabel = (category, isChairman = false) => {
    if (isChairman) {
      switch (category) {
        case 'tech':
          return 'Tech Council Member & Chairman';
        case 'culture':
          return 'Culture Council Member & Chairman';
        case 'cybersecurity':
          return 'Cybersecurity Council Member & Chairman';
        default:
          return 'Chairman';
      }
    }
    switch (category) {
      case 'tech':
        return 'Tech Council Member';
      case 'culture':
        return 'Culture Council Member';
      case 'cybersecurity':
        return 'Cybersecurity Council Member';
      default:
        return 'System';
    }
  };

  return (
    <div className="members-view">
      <div className="members-sidebar">
        <h2 className="members-title">Council Members</h2>

        {/* Cybersecurity Personas */}
        <div className="members-category">
          <button
            className={`category-header ${activeCategory === 'cybersecurity' ? 'active' : ''}`}
            onClick={() => setActiveCategory('cybersecurity')}
          >
            <span>Cybersecurity</span>
          </button>
          {activeCategory === 'cybersecurity' && (
            <div className="persona-list">
              {personas.cybersecurity?.map((persona) => (
                <div
                  key={persona.name}
                  className={`persona-item cybersecurity ${
                    selectedPersona?.name === persona.name ? 'selected' : ''
                  }`}
                  onClick={() => handlePersonaClick(persona, 'cybersecurity')}
                >
                  <div className="persona-item-name">{persona.name}</div>
                  <div className="persona-item-role">{persona.personality}</div>
                </div>
              ))}
              {getChairmenForCategory('cybersecurity').map((chairman) => (
                <div
                  key={chairman.name}
                  className={`persona-item cybersecurity-chairman ${
                    selectedPersona?.name === chairman.name ? 'selected' : ''
                  }`}
                  onClick={() => handlePersonaClick(chairman, 'cybersecurity')}
                >
                  <div className="persona-item-name">{chairman.name}</div>
                  <div className="persona-item-role">{chairman.personality}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tech Personas */}
        <div className="members-category">
          <button
            className={`category-header ${activeCategory === 'tech' ? 'active' : ''}`}
            onClick={() => setActiveCategory('tech')}
          >
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
              {getChairmenForCategory('tech').map((chairman) => (
                <div
                  key={chairman.name}
                  className={`persona-item tech-chairman ${
                    selectedPersona?.name === chairman.name ? 'selected' : ''
                  }`}
                  onClick={() => handlePersonaClick(chairman, 'tech')}
                >
                  <div className="persona-item-name">{chairman.name}</div>
                  <div className="persona-item-role">{chairman.personality}</div>
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
              {getChairmenForCategory('culture').map((chairman) => (
                <div
                  key={chairman.name}
                  className={`persona-item culture-chairman ${
                    selectedPersona?.name === chairman.name ? 'selected' : ''
                  }`}
                  onClick={() => handlePersonaClick(chairman, 'culture')}
                >
                  <div className="persona-item-name">{chairman.name}</div>
                  <div className="persona-item-role">{chairman.personality}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="members-content">
        {selectedPersona && (
          <>
            <div className="persona-header">
              <div
                className="persona-category-badge"
                style={{ borderColor: getCategoryColor(selectedPersona.category, selectedPersona.isChairman) }}
              >
                {getCategoryLabel(selectedPersona.category, selectedPersona.isChairman || (chairmen && chairmen.some(c => c.name === selectedPersona.name)))}
              </div>
              <h1
                className="persona-name-large"
                style={{ color: getCategoryColor(selectedPersona.category, selectedPersona.isChairman || (chairmen && chairmen.some(c => c.name === selectedPersona.name))) }}
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
