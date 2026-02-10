import { useState, useEffect } from 'react';
import './DebateSetup.css';

const API_BASE = 'http://localhost:8001';

export default function DebateSetup({
  onStartDebate,
  onBack,
}) {
  const [debatePersonas, setDebatePersonas] = useState([]);
  const [debateModerators, setDebateModerators] = useState([]);
  const [forPersona, setForPersona] = useState(null);
  const [againstPersona, setAgainstPersona] = useState(null);
  const [moderator, setModerator] = useState(null);
  const [numRounds, setNumRounds] = useState(3);

  useEffect(() => {
    fetch(`${API_BASE}/api/debate-personas`)
      .then((res) => res.json())
      .then((data) => {
        setDebatePersonas(data.debaters || []);
        setDebateModerators(data.moderators || []);
      })
      .catch(console.error);
  }, []);

  const canStart = forPersona && againstPersona && forPersona !== againstPersona;

  const handleStart = () => {
    onStartDebate({
      debaterFor: forPersona,
      debaterAgainst: againstPersona,
      moderator,
      numRounds,
    });
  };

  const renderPersonaCard = (persona, side) => {
    const selected =
      side === 'for'
        ? forPersona === persona.id
        : againstPersona === persona.id;
    const otherSelected =
      side === 'for'
        ? againstPersona === persona.id
        : forPersona === persona.id;
    const color = side === 'for' ? 'blue' : 'red';

    return (
      <div
        key={`${side}-${persona.id}`}
        className={`persona-card-debate ${color} ${selected ? 'selected' : ''} ${otherSelected ? 'disabled' : ''}`}
        onClick={() => {
          if (otherSelected) return;
          if (side === 'for') {
            setForPersona(selected ? null : persona.id);
          } else {
            setAgainstPersona(selected ? null : persona.id);
          }
        }}
      >
        <div className="persona-card-top">
          <div>
            <div className="persona-name-debate">{persona.name}</div>
            <div className="persona-title-debate">{persona.title}</div>
          </div>
        </div>
        <div className="persona-style-debate">{persona.style}</div>
      </div>
    );
  };

  return (
    <div className="debate-setup">
      <div className="debate-setup-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h2>Configure Debate</h2>
      </div>

      <div className="debaters-container">
        <div className="debater-column for-column">
          <div className="side-badge for">FOR</div>
          <p className="side-desc">Defends the position</p>
          <div className="persona-list-debate">
            {debatePersonas.map((p) => renderPersonaCard(p, 'for'))}
          </div>
        </div>

        <div className="vs-divider">VS</div>

        <div className="debater-column against-column">
          <div className="side-badge against">AGAINST</div>
          <p className="side-desc">Challenges the position</p>
          <div className="persona-list-debate">
            {debatePersonas.map((p) => renderPersonaCard(p, 'against'))}
          </div>
        </div>
      </div>

      <div className="debate-options">
        <div className="option-group">
          <label>Rounds</label>
          <div className="rounds-selector">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={`round-btn ${numRounds === n ? 'active' : ''}`}
                onClick={() => setNumRounds(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <label>Moderator (optional)</label>
          <div className="moderator-select">
            <div
              className={`moderator-option ${moderator === null ? 'selected' : ''}`}
              onClick={() => setModerator(null)}
            >
              None
            </div>
            {debateModerators.map((m) => (
              <div
                key={m.id}
                className={`moderator-option ${moderator === m.id ? 'selected' : ''}`}
                onClick={() => setModerator(m.id)}
              >
                <div className="moderator-name">{m.name}</div>
                <div className="moderator-title">{m.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        className="start-debate-btn"
        disabled={!canStart}
        onClick={handleStart}
      >
        Start Debate
      </button>
    </div>
  );
}
