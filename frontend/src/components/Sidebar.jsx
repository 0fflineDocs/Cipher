import { useState, useEffect } from 'react';
import './Sidebar.css';

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onViewMembers,
  onViewDebateSetup,
  onViewDebateMembers,
  currentView,
}) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 onClick={onNewConversation} style={{ cursor: 'pointer' }}>Cipher</h1>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Council</div>
          <button className="sidebar-btn" onClick={onNewConversation}>
            + New Conversation
          </button>
          <button 
            className={`sidebar-btn ${currentView === 'members' ? 'active accent-green' : ''}`}
            onClick={onViewMembers}
          >
            Members
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Debate</div>
          <button 
            className={`sidebar-btn ${currentView === 'debate-setup' || currentView === 'debate' ? 'active accent-amber' : ''}`}
            onClick={onViewDebateSetup}
          >
            + New Debate
          </button>
          <button 
            className={`sidebar-btn ${currentView === 'debate-members' ? 'active accent-amber' : ''}`}
            onClick={onViewDebateMembers}
          >
            Members
          </button>
        </div>
      </div>

      <div className="conversation-list">
        {conversations.length === 0 ? (
          <div className="no-conversations">No conversations yet</div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${
                conv.id === currentConversationId ? 'active' : ''
              }`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className="conversation-title">
                {conv.title || 'New Conversation'}
              </div>
              <div className="conversation-meta">
                {conv.message_count} messages
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
