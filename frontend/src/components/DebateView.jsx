import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './DebateView.css';

export default function DebateView({
  conversation,
  onSendMessage,
  isLoading,
  debateState,
  debateConfig,
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, debateState]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const config = debateConfig || {};

  const getSideColor = (statement) => {
    // Use side field from backend response
    if (statement.side === 'for') return 'blue';
    if (statement.side === 'against') return 'red';
    return 'blue';
  };

  const getSideLabel = (statement) => {
    if (statement.side === 'for') return 'FOR';
    if (statement.side === 'against') return 'AGAINST';
    return '';
  };

  const renderStatement = (statement, phaseLabel) => {
    const color = getSideColor(statement);
    const sideLabel = getSideLabel(statement);
    const icon = statement.icon || '';

    return (
      <div key={`${phaseLabel}-${statement.persona}`} className={`debate-statement ${color}`}>
        <div className={`statement-header ${color}`}>
          <div className="statement-header-left">
            {icon && <span className="statement-icon">{icon}</span>}
            <span className="statement-persona">{statement.persona}</span>
            {statement.title && (
              <span className="statement-title">{statement.title}</span>
            )}
          </div>
          <div className="statement-header-right">
            <span className={`side-tag ${color}`}>{sideLabel}</span>
            <span className="statement-model">{statement.model?.split('/').pop()}</span>
          </div>
        </div>
        <div className="statement-content markdown-content">
          <ReactMarkdown>{statement.content}</ReactMarkdown>
        </div>
      </div>
    );
  };

  const renderStatementsGrid = (statements, phaseLabel) => {
    if (!statements || statements.length === 0) return null;

    // Sort: FOR (blue) on left, AGAINST (red) on right
    const sorted = [...statements].sort((a, b) => {
      if (a.side === 'for' && b.side === 'against') return -1;
      if (a.side === 'against' && b.side === 'for') return 1;
      return 0;
    });

    return (
      <div className="statements-grid">
        {sorted.map((s) => renderStatement(s, phaseLabel))}
      </div>
    );
  };

  const renderVerdict = (verdict) => {
    if (!verdict) return null;
    return (
      <div className="verdict-card">
        <div className="verdict-header">
          <span className="verdict-icon">⚖️</span>
          <span className="verdict-label">Moderator Verdict</span>
          <span className="verdict-moderator">{verdict.moderator}</span>
        </div>
        <div className="verdict-content markdown-content">
          <ReactMarkdown>{verdict.content}</ReactMarkdown>
        </div>
      </div>
    );
  };

  const renderLoadingPhase = (text) => (
    <div className="debate-loading">
      <div className="spinner"></div>
      <span>{text}</span>
    </div>
  );

  // Render a saved debate message from conversation history
  const renderSavedDebate = (msg, index) => {
    return (
      <div key={`debate-${index}`} className="debate-exchange">
        <div className="phase-section">
          <h3 className="phase-title">Opening Statements</h3>
          {renderStatementsGrid(msg.openings, `saved-openings-${index}`)}
        </div>

        {(msg.rounds || []).map((round, roundIdx) => (
          <div key={`round-${roundIdx}`} className="phase-section">
            <h3 className="phase-title">Round {roundIdx + 1}</h3>
            {renderStatementsGrid(round, `saved-round-${index}-${roundIdx}`)}
          </div>
        ))}

        {msg.verdict && (
          <div className="phase-section">
            {renderVerdict(msg.verdict)}
          </div>
        )}
      </div>
    );
  };

  // Render the active streaming debate state
  const renderStreamingDebate = () => {
    if (!debateState) return null;

    return (
      <div className="debate-exchange streaming">
        {/* Opening statements */}
        {debateState.openings ? (
          <div className="phase-section">
            <h3 className="phase-title">Opening Statements</h3>
            {renderStatementsGrid(debateState.openings, 'stream-openings')}
          </div>
        ) : debateState.phase === 'openings' ? (
          <div className="phase-section">
            {renderLoadingPhase('Collecting opening statements...')}
          </div>
        ) : null}

        {/* Completed rounds */}
        {(debateState.rounds || []).map((round, roundIdx) => (
          <div key={`stream-round-${roundIdx}`} className="phase-section">
            <h3 className="phase-title">Round {roundIdx + 1}</h3>
            {renderStatementsGrid(round, `stream-round-${roundIdx}`)}
          </div>
        ))}

        {/* Loading next round */}
        {debateState.phase === 'round' &&
          debateState.openings &&
          debateState.round > (debateState.rounds || []).length && (
            <div className="phase-section">
              {renderLoadingPhase(`Round ${debateState.round} in progress...`)}
            </div>
          )}

        {/* Verdict */}
        {debateState.verdict ? (
          <div className="phase-section">
            {renderVerdict(debateState.verdict)}
          </div>
        ) : debateState.phase === 'verdict' ? (
          <div className="phase-section">
            {renderLoadingPhase('Moderator deliberating...')}
          </div>
        ) : null}
      </div>
    );
  };

  const hasMessages = conversation?.messages?.length > 0;
  const showInput = !hasMessages;

  // Build matchup display from config
  const forLabel = config.debaterForName || config.debaterFor || '';
  const againstLabel = config.debaterAgainstName || config.debaterAgainst || '';

  return (
    <div className="debate-view">
      <div className="debate-header">
        <h2>⚔️ Debate Arena</h2>
        {forLabel && againstLabel && (
          <div className="debate-matchup">
            <span className="matchup-debater blue">{forLabel}</span>
            <span className="matchup-vs">vs</span>
            <span className="matchup-debater red">{againstLabel}</span>
          </div>
        )}
      </div>

      <div className="debate-messages-container">
        {/* Render saved messages */}
        {conversation?.messages?.map((msg, index) => (
          <div key={index} className="message-group">
            {msg.role === 'user' ? (
              <div className="debate-topic-card">
                <div className="topic-label">Debate Topic</div>
                <div className="topic-content">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ) : msg.mode === 'debate' || msg.openings ? (
              renderSavedDebate(msg, index)
            ) : null}
          </div>
        ))}

        {/* Render streaming state */}
        {renderStreamingDebate()}

        {/* Input form for first message */}
        {showInput && (
          <div className="debate-input-area">
            <div className="debate-prompt-text">
              Enter a topic for the debaters to argue
            </div>
            <form className="debate-input-form" onSubmit={handleSubmit}>
              <textarea
                ref={textareaRef}
                className="debate-input"
                placeholder="e.g., Is AI regulation necessary for innovation?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                rows={2}
              />
              <button
                type="submit"
                className="debate-send-btn"
                disabled={!input.trim() || isLoading}
              >
                Start Debate
              </button>
            </form>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
