import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './DebateMembersView.css';

const API_BASE = 'http://localhost:8001';

export default function DebateMembersView({ onBack }) {
  const [debaters, setDebaters] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/debate-personas`)
      .then((res) => res.json())
      .then((data) => {
        const debaterList = data.debaters || [];
        const modList = data.moderators || [];
        setDebaters(debaterList);
        setModerators(modList);
        if (debaterList.length > 0) {
          setSelectedPersona(debaterList[0]);
        }
      })
      .catch(console.error);
  }, []);

  const allMembers = [...debaters, ...moderators];

  if (allMembers.length === 0) {
    return (
      <div className="debate-members-view">
        <div className="debate-members-loading">Loading debate personas...</div>
      </div>
    );
  }

  return (
    <div className="debate-members-view">
      <div className="debate-members-sidebar">
        <div className="debate-members-sidebar-header">
          <button className="debate-members-back" onClick={onBack}>
            ← Back
          </button>
          <h2 className="debate-members-title">Debate Members</h2>
        </div>

        <div className="debate-persona-list">
          <div className="debate-persona-section-label">Debaters</div>
          {debaters.map((persona) => (
            <div
              key={persona.id}
              className={`debate-persona-item ${
                selectedPersona?.id === persona.id ? 'selected' : ''
              }`}
              onClick={() => setSelectedPersona(persona)}
            >
              <div className="debate-persona-item-name">{persona.name}</div>
              <div className="debate-persona-item-title">{persona.title}</div>
              <div className="debate-persona-item-style">{persona.style}</div>
            </div>
          ))}
          {moderators.length > 0 && (
            <>
              <div className="debate-persona-section-label">Moderator</div>
              {moderators.map((persona) => (
                <div
                  key={persona.id}
                  className={`debate-persona-item moderator ${
                    selectedPersona?.id === persona.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedPersona(persona)}
                >
                  <div className="debate-persona-item-name">{persona.name}</div>
                  <div className="debate-persona-item-title">{persona.title}</div>
                  <div className="debate-persona-item-style">{persona.style}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="debate-members-content">
        {selectedPersona && (
          <>
            <div className="debate-persona-header">
              <div className="debate-persona-style-badge">
                {selectedPersona.style}
              </div>
              <h1 className="debate-persona-name-large">
                {selectedPersona.name}
              </h1>
              <p className="debate-persona-title-large">
                {selectedPersona.title}
              </p>
              <div className="debate-persona-model">
                Model: <code>{selectedPersona.model}</code>
              </div>
            </div>

            <div className="debate-persona-system-message">
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
