import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import MembersView from './components/MembersView';
import DebateSetup from './components/DebateSetup';
import DebateView from './components/DebateView';
import { api } from './api';
import './App.css';

function App() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [personas, setPersonas] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedChairman, setSelectedChairman] = useState(null);
  const [currentView, setCurrentView] = useState('chat');
  const [debateState, setDebateState] = useState(null);
  const [debateConfig, setDebateConfig] = useState(null);

  // Load personas on mount
  useEffect(() => {
    loadPersonas();
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load conversation details when selected
  useEffect(() => {
    if (currentConversationId) {
      loadConversation(currentConversationId);
    }
  }, [currentConversationId]);

  const loadPersonas = async () => {
    try {
      const data = await api.getPersonas();
      setPersonas(data);
      
      // Set default selections: all 4 Cybersecurity personas with Strategic Principal
      if (data.personas && data.chairmen) {
        const defaultMembers = [
          'Security Architect',
          'Strategic Advisory',
          'Cybersecurity Research',
          'Business Risk & Compliance'
        ];
        
        setSelectedMembers(defaultMembers);
        setSelectedChairman('Strategic Principal');
      }
    } catch (error) {
      console.error('Failed to load personas:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const convs = await api.listConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (id) => {
    try {
      const conv = await api.getConversation(id);
      setCurrentConversation(conv);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await api.createConversation();
      setConversations([
        { id: newConv.id, created_at: newConv.created_at, message_count: 0 },
        ...conversations,
      ]);
      setCurrentConversationId(newConv.id);
      setCurrentView('chat');
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSelectConversation = (id) => {
    setCurrentConversationId(id);
    setCurrentView('chat');
  };

  const handleViewMembers = () => {
    setCurrentView('members');
  };

  const handleViewDebateSetup = () => {
    setCurrentView('debate-setup');
  };

  const handleStartDebate = async (config) => {
    // Create a new conversation for the debate
    try {
      const newConv = await api.createConversation();
      setConversations([
        { id: newConv.id, created_at: newConv.created_at, title: 'New Conversation', message_count: 0 },
        ...conversations,
      ]);
      setCurrentConversationId(newConv.id);
      setCurrentConversation(newConv);
      setDebateConfig(config);
      setCurrentView('debate');
    } catch (error) {
      console.error('Failed to create debate conversation:', error);
    }
  };

  const handleDebateMessage = async (content) => {
    if (!currentConversationId || !debateConfig) return;

    setIsLoading(true);

    // Optimistically add user message
    const userMessage = { role: 'user', content };
    setCurrentConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));

    setDebateState({ phase: 'openings', openings: null, rounds: [], round: 0 });

    try {
      await api.sendMessageStream(
        currentConversationId,
        content,
        (eventType, event) => {
          switch (eventType) {
            case 'openings_start':
              setDebateState((prev) => ({ ...prev, phase: 'openings' }));
              break;

            case 'openings_complete':
              setDebateState((prev) => ({
                ...prev,
                openings: event.data,
                phase: 'round',
              }));
              break;

            case 'round_start':
              setDebateState((prev) => ({
                ...prev,
                phase: 'round',
                round: event.round,
              }));
              break;

            case 'round_complete':
              setDebateState((prev) => ({
                ...prev,
                rounds: [...prev.rounds, event.data],
              }));
              break;

            case 'verdict_start':
              setDebateState((prev) => ({ ...prev, phase: 'verdict' }));
              break;

            case 'verdict_complete':
              setDebateState((prev) => ({ ...prev, verdict: event.data }));
              break;

            case 'title_complete':
              loadConversations();
              break;

            case 'complete':
              loadConversation(currentConversationId);
              setDebateState(null);
              setIsLoading(false);
              loadConversations();
              break;

            case 'error':
              console.error('Debate stream error:', event.message);
              setDebateState(null);
              setIsLoading(false);
              break;

            default:
              console.log('Unknown debate event:', eventType);
          }
        },
        null,
        null,
        {
          debaterFor: debateConfig.debaterFor,
          debaterAgainst: debateConfig.debaterAgainst,
          moderator: debateConfig.moderator,
          numRounds: debateConfig.numRounds || 3,
        }
      );
    } catch (error) {
      console.error('Failed to run debate:', error);
      setDebateState(null);
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content) => {
    if (!currentConversationId) return;

    setIsLoading(true);
    try {
      // Optimistically add user message to UI
      const userMessage = { role: 'user', content };
      setCurrentConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
      }));

      // Create a partial assistant message that will be updated progressively
      const assistantMessage = {
        role: 'assistant',
        stage1: null,
        stage2: null,
        stage3: null,
        metadata: null,
        loading: {
          stage1: false,
          stage2: false,
          stage3: false,
        },
      };

      // Add the partial assistant message
      setCurrentConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }));

      // Send message with streaming
      await api.sendMessageStream(
        currentConversationId, 
        content, 
        (eventType, event) => {
          switch (eventType) {
            case 'stage1_start':
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.loading.stage1 = true;
              return { ...prev, messages };
            });
            break;

          case 'stage1_complete':
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.stage1 = event.data;
              lastMsg.loading.stage1 = false;
              return { ...prev, messages };
            });
            break;

          case 'stage2_start':
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.loading.stage2 = true;
              return { ...prev, messages };
            });
            break;

          case 'stage2_complete':
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.stage2 = event.data;
              lastMsg.metadata = event.metadata;
              lastMsg.loading.stage2 = false;
              return { ...prev, messages };
            });
            break;

          case 'stage3_start':
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.loading.stage3 = true;
              return { ...prev, messages };
            });
            break;

          case 'stage3_complete':
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.stage3 = event.data;
              lastMsg.loading.stage3 = false;
              return { ...prev, messages };
            });
            break;

          case 'title_complete':
            // Reload conversations to get updated title
            loadConversations();
            break;

          case 'complete':
            // Stream complete, reload conversations list
            loadConversations();
            setIsLoading(false);
            break;

          case 'error':
            console.error('Stream error:', event.message);
            setIsLoading(false);
            break;

          default:
            console.log('Unknown event type:', eventType);
        }
      },
      selectedMembers,
      selectedChairman
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic messages on error
      setCurrentConversation((prev) => ({
        ...prev,
        messages: prev.messages.slice(0, -2),
      }));
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onViewMembers={handleViewMembers}
        onViewDebateSetup={handleViewDebateSetup}
        currentView={currentView}
      />
      {currentView === 'members' ? (
        <MembersView 
          personas={personas?.personas} 
          chairmen={personas?.chairmen}
        />
      ) : currentView === 'debate-setup' ? (
        <DebateSetup
          chairmen={personas?.chairmen}
          onStartDebate={handleStartDebate}
          onBack={() => setCurrentView('chat')}
        />
      ) : currentView === 'debate' ? (
        <DebateView
          conversation={currentConversation}
          onSendMessage={handleDebateMessage}
          isLoading={isLoading}
          debateState={debateState}
          debateConfig={debateConfig}
        />
      ) : (
        <ChatInterface
          conversation={currentConversation}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          personas={personas}
          selectedMembers={selectedMembers}
          selectedChairman={selectedChairman}
          onSelectionChange={(members, chairman) => {
            setSelectedMembers(members);
            setSelectedChairman(chairman);
          }}
        />
      )}
    </div>
  );
}

export default App;
