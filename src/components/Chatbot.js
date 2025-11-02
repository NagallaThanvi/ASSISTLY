import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  IconButton,
  TextField,
  Typography,
  Avatar,
  Fab,
  Chip,
  CircularProgress,
  Tooltip,
  Collapse,
  Divider
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getChatbotResponse, analyzeIntent, getQuickReplies, saveConversation } from '../services/chatbotService';
import { 
  createSpeechRecognition, 
  createSpeechSynthesis, 
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported 
} from '../services/voiceService';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const messagesEndRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const { user, communityId } = useAuth();

  // Initialize voice services
  useEffect(() => {
    if (isSpeechRecognitionSupported()) {
      speechRecognitionRef.current = createSpeechRecognition();
    }
    if (isSpeechSynthesisSupported()) {
      speechSynthesisRef.current = createSpeechSynthesis();
    }

    return () => {
      // Cleanup
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.stop();
      }
    };
  }, []);

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: Date.now(),
        text: "Hi! I'm your Assistly AI assistant. I can help you create requests, find volunteers, answer questions about the platform, and more. How can I assist you today?",
        sender: 'bot',
        timestamp: new Date()
      }]);
      setQuickReplies(getQuickReplies([]));
    }
  }, [isOpen, messages.length]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: messageText.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Analyze intent for better UX
      const intents = analyzeIntent(messageText);
      console.log('Detected intents:', intents);

      // Get bot response
      const response = await getChatbotResponse(
        messageText,
        messages,
        user?.uid,
        communityId
      );

      const botMessage = {
        id: Date.now() + 1,
        text: response.message,
        sender: 'bot',
        timestamp: new Date(),
        error: !response.success
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Speak bot response if voice is enabled
      if (voiceEnabled && speechSynthesisRef.current && botMessage.text) {
        speechSynthesisRef.current.speak(botMessage.text, {
          rate: 1.0,
          pitch: 1.0,
          volume: 0.8
        });
      }
      
      // Update quick replies
      setQuickReplies(getQuickReplies([...messages, userMessage, botMessage]));

      // Save conversation periodically
      if (messages.length % 10 === 0) {
        await saveConversation(user?.uid, communityId, [...messages, userMessage, botMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again or check your API key configuration.',
        sender: 'bot',
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (reply) => {
    handleSendMessage(reply);
  };

  const handleReset = () => {
    setMessages([]);
    setQuickReplies([]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceInput = () => {
    if (!speechRecognitionRef.current) {
      alert('Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      // Stop listening
      speechRecognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript('');
    } else {
      // Start listening
      setIsListening(true);
      speechRecognitionRef.current.start(
        (transcript, isFinal) => {
          if (isFinal) {
            setInputMessage(transcript);
            setInterimTranscript('');
            setIsListening(false);
            // Auto-send after voice input
            setTimeout(() => handleSendMessage(transcript), 500);
          } else {
            setInterimTranscript(transcript);
          }
        },
        (error) => {
          console.error('Voice input error:', error);
          setIsListening(false);
          setInterimTranscript('');
          alert(`Voice input error: ${error}`);
        },
        () => {
          setIsListening(false);
          setInterimTranscript('');
        }
      );
    }
  };

  const toggleVoiceOutput = () => {
    setVoiceEnabled(!voiceEnabled);
    if (voiceEnabled && speechSynthesisRef.current) {
      // Stop current speech
      speechSynthesisRef.current.stop();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="chat"
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1300,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
          }
        }}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </Fab>

      {/* Chat Window */}
      <Collapse in={isOpen}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 100,
            right: 24,
            width: { xs: 'calc(100vw - 48px)', sm: 400 },
            maxWidth: 400,
            height: 600,
            maxHeight: 'calc(100vh - 150px)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1300,
            borderRadius: 3,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)' }}>
                <BotIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="600">
                  Assistly AI
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Always here to help
                </Typography>
              </Box>
            </Box>
            <Box>
              <Tooltip title={voiceEnabled ? 'Disable voice output' : 'Enable voice output'}>
                <IconButton 
                  size="small" 
                  onClick={toggleVoiceOutput} 
                  sx={{ color: 'white', mr: 1 }}
                >
                  {voiceEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Reset conversation">
                <IconButton size="small" onClick={handleReset} sx={{ color: 'white', mr: 1 }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Messages Area */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              bgcolor: 'background.default',
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  gap: 1
                }}
              >
                {message.sender === 'bot' && (
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                    <BotIcon sx={{ fontSize: 20 }} />
                  </Avatar>
                )}
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    maxWidth: '75%',
                    bgcolor: message.sender === 'user' 
                      ? 'primary.main' 
                      : message.error 
                        ? 'error.light'
                        : 'background.paper',
                    color: message.sender === 'user' ? 'white' : 'text.primary',
                    borderRadius: 2,
                    wordBreak: 'break-word'
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.text}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      opacity: 0.7,
                      fontSize: '0.7rem'
                    }}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Paper>
                {message.sender === 'user' && (
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                    <PersonIcon sx={{ fontSize: 20 }} />
                  </Avatar>
                )}
              </Box>
            ))}
            
            {isLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                  <BotIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Paper elevation={1} sx={{ p: 1.5, borderRadius: 2 }}>
                  <CircularProgress size={20} />
                </Paper>
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </Box>

          {/* Quick Replies */}
          {quickReplies.length > 0 && !isLoading && (
            <Box sx={{ px: 2, pb: 1 }}>
              <Divider sx={{ mb: 1 }} />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {quickReplies.map((reply, index) => (
                  <Chip
                    key={index}
                    label={reply}
                    size="small"
                    onClick={() => handleQuickReply(reply)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'primary.light',
                        color: 'white'
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Input Area */}
          <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
            {interimTranscript && (
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  mb: 1, 
                  color: 'text.secondary',
                  fontStyle: 'italic'
                }}
              >
                Listening: {interimTranscript}...
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder={isListening ? 'Listening...' : 'Type or speak your message...'}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || isListening}
                multiline
                maxRows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3
                  }
                }}
              />
              {isSpeechRecognitionSupported() && (
                <Tooltip title={isListening ? 'Stop listening' : 'Voice input'}>
                  <IconButton
                    color={isListening ? 'error' : 'default'}
                    onClick={handleVoiceInput}
                    disabled={isLoading}
                    sx={{
                      bgcolor: isListening ? 'error.light' : 'action.hover',
                      '&:hover': {
                        bgcolor: isListening ? 'error.main' : 'action.selected'
                      }
                    }}
                  >
                    {isListening ? <MicOffIcon /> : <MicIcon />}
                  </IconButton>
                </Tooltip>
              )}
              <IconButton
                color="primary"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading || isListening}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark'
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'action.disabledBackground'
                  }
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Collapse>
    </>
  );
}
