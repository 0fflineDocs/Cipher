import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './Stage1.css';

// Council member emoji icons
const councilIcons = {
  'Atlas': '🏛️',
  'Eris': '⚡',
  'Pythia': '🔮',
  'Prometheus': '🔥',
  'Nemesis': '⚖️'
};

export default function Stage1({ responses }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!responses || responses.length === 0) {
    return null;
  }

  return (
    <div className="stage stage1">
      <h3 className="stage-title">Stage 1: Individual Responses</h3>

      <div className="council-tabs">
        {responses.map((resp, index) => {
          const councilName = resp.name || resp.model.split('/')[1] || resp.model;
          const councilClass = councilName.toLowerCase().replace(/\s+/g, '-');
          // Just use the personality field directly (no extraction needed)
          const role = resp.personality || '';
          return (
            <button
              key={index}
              className={`council-tab ${councilClass} ${activeTab === index ? 'active' : ''}`}
              onClick={() => setActiveTab(index)}
            >
              <div className="council-name">{councilName}</div>
              <div className="council-personality">{role}</div>
            </button>
          );
        })}
      </div>

      <div className="tab-content">
        <div className="response-header">
          <span className="responding-as">Response from</span>
          <span className="council-name-label">{responses[activeTab].name || responses[activeTab].model}</span>
        </div>
        <div className="response-text markdown-content">
          <ReactMarkdown>{responses[activeTab].response}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
