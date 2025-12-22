import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './Stage2.css';

function deAnonymizeText(text, labelToModel) {
  if (!labelToModel) return text;

  let result = text;
  // Replace each "Response from X" with personality type and model in parentheses
  Object.entries(labelToModel).forEach(([label, info]) => {
    const personalityType = info.personality.split('(')[1]?.replace(')', '') || 'Unknown';
    const modelShortName = info.model.split('/')[1] || info.model;
    result = result.replace(new RegExp(label, 'gi'), `**${personalityType}** (${modelShortName})`);
  });
  return result;
}

export default function Stage2({ rankings, labelToModel, aggregateRankings }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!rankings || rankings.length === 0) {
    return null;
  }

  return (
    <div className="stage stage2">
      <h3 className="stage-title">Stage 2: Peer Rankings</h3>

      <h4>Raw Evaluations</h4>
      <p className="stage-description">
        Each model evaluated all responses from different perspectives and provided rankings.
        Below, model names are shown in <strong>bold</strong> for readability, but the original evaluation used perspective labels.
      </p>

      <div className="tabs">
        {rankings.map((rank, index) => (
          <button
            key={index}
            className={`tab ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            {rank.personality.split('(')[1]?.replace(')', '') || rank.model.split('/')[1] || rank.model}
          </button>
        ))}
      </div>

      <div className="tab-content">
        <div className="ranking-model">
          {rankings[activeTab].personality.split('(')[1]?.replace(')', '')} ({rankings[activeTab].model.split('/')[1] || rankings[activeTab].model})
        </div>
        <div className="ranking-content markdown-content">
          <ReactMarkdown>
            {deAnonymizeText(rankings[activeTab].ranking, labelToModel)}
          </ReactMarkdown>
        </div>

        {rankings[activeTab].parsed_ranking &&
         rankings[activeTab].parsed_ranking.length > 0 && (
          <div className="parsed-ranking">
            <strong>Extracted Ranking:</strong>
            <ol>
              {rankings[activeTab].parsed_ranking.map((label, i) => {
                const info = labelToModel && labelToModel[label];
                if (info) {
                  const personalityType = info.personality.split('(')[1]?.replace(')', '') || 'Unknown';
                  const modelShortName = info.model.split('/')[1] || info.model;
                  return <li key={i}>{personalityType} ({modelShortName})</li>;
                }
                return <li key={i}>{label}</li>;
              })}
            </ol>
          </div>
        )}
      </div>

      {aggregateRankings && aggregateRankings.length > 0 && (
        <div className="aggregate-rankings">
          <h4>Aggregate Rankings (Street Cred)</h4>
          <p className="stage-description">
            Combined results across all peer evaluations (lower score is better):
          </p>
          <div className="aggregate-list">
            {aggregateRankings.map((agg, index) => {
              const personalityType = agg.personality?.split('(')[1]?.replace(')', '') || 'Unknown';
              const modelShortName = agg.model.split('/')[1] || agg.model;
              return (
                <div key={index} className="aggregate-item">
                  <span className="rank-position">#{index + 1}</span>
                  <span className="rank-model">
                    {personalityType} ({modelShortName})
                  </span>
                  <span className="rank-score">
                    Avg: {agg.average_rank.toFixed(2)}
                  </span>
                  <span className="rank-count">
                    ({agg.rankings_count} votes)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
