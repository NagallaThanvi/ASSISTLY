import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

/**
 * Chatbot Service using Groq API (Free, Ultra-Fast)
 * Model: llama-3.1-8b-instant (recommended for speed)
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const API_KEY = process.env.REACT_APP_GROQ_API_KEY;

/**
 * Get system context about the user and platform
 */
async function getSystemContext(userId, communityId) {
  try {
    // Get recent requests from the community
    const requestsQuery = query(
      collection(db, 'requests'),
      where('communityId', '==', communityId),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const requestsSnapshot = await getDocs(requestsQuery);
    const recentRequests = requestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get user's own requests
    const userRequestsQuery = query(
      collection(db, 'requests'),
      where('createdByUid', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    const userRequestsSnapshot = await getDocs(userRequestsQuery);
    const userRequests = userRequestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      recentRequests,
      userRequests
    };
  } catch (error) {
    console.error('Error getting system context:', error);
    return { recentRequests: [], userRequests: [] };
  }
}

/**
 * Build system prompt with context
 */
function buildSystemPrompt(context) {
  return `You are a helpful AI assistant for Assistly, a community care platform that connects neighbors who need help with volunteers who can assist.

Platform Features:
- Users can create help requests (categories: General Help, Groceries, Medical, Transportation, Housework, Pet Care, Childcare, Tech Help, Yard Work, Moving, Companionship)
- Volunteers can browse and claim requests to help
- Users earn points for helping others (gamification)
- Real-time messaging between requesters and volunteers
- Community-based organization

Your Role:
1. Help users create well-structured requests
2. Answer questions about platform features
3. Suggest relevant open requests to volunteers
4. Provide guidance on urgency levels and categories
5. Explain the points/gamification system
6. Assist with troubleshooting

Guidelines:
- Be friendly, empathetic, and concise
- Ask clarifying questions when needed
- Suggest appropriate categories and urgency levels
- Respect user privacy
- If you don't know something, admit it
- Keep responses under 150 words unless more detail is needed

Recent Community Activity:
${context.recentRequests.length > 0 ? context.recentRequests.map(r => `- ${r.title} (${r.category}, ${r.urgency} urgency, status: ${r.status})`).join('\n') : 'No recent requests'}

User's Recent Requests:
${context.userRequests.length > 0 ? context.userRequests.map(r => `- ${r.title} (${r.status})`).join('\n') : 'No previous requests'}`;
}

/**
 * Call Groq API (OpenAI-compatible format)
 */
async function callGroqAPI(messages) {
  if (!API_KEY) {
    throw new Error('Groq API key not configured. Please add REACT_APP_GROQ_API_KEY to your .env file.');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant', // Ultra-fast model
      messages: messages,
      temperature: 0.7,
      max_tokens: 300,
      top_p: 0.95,
      stream: false
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get response from AI');
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';
}

/**
 * Main chatbot function
 */
export async function getChatbotResponse(userMessage, conversationHistory, userId, communityId) {
  try {
    // Get context
    const context = await getSystemContext(userId, communityId);
    const systemPrompt = buildSystemPrompt(context);

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: userMessage }
    ];

    // Get response from API
    const response = await callGroqAPI(messages);

    return {
      success: true,
      message: response.trim()
    };
  } catch (error) {
    console.error('Chatbot error:', error);
    return {
      success: false,
      message: error.message || 'Sorry, I encountered an error. Please try again.',
      error: error.message
    };
  }
}

/**
 * Analyze user intent and provide quick actions
 */
export function analyzeIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  const intents = {
    createRequest: /create|new request|need help|post|submit/i.test(lowerMessage),
    viewRequests: /view|see|show|browse|list.*request/i.test(lowerMessage),
    helpWithCategory: /category|categories|type|kind of help/i.test(lowerMessage),
    urgencyHelp: /urgent|urgency|priority|how urgent/i.test(lowerMessage),
    pointsInfo: /points|score|gamification|rewards|earn/i.test(lowerMessage),
    statusCheck: /status|progress|update.*request/i.test(lowerMessage),
    howToVolunteer: /volunteer|help others|claim|assist/i.test(lowerMessage)
  };

  const detectedIntents = Object.entries(intents)
    .filter(([_, matches]) => matches)
    .map(([intent]) => intent);

  return detectedIntents;
}

/**
 * Get quick reply suggestions based on context
 */
export function getQuickReplies(conversationHistory) {
  const lastMessage = conversationHistory[conversationHistory.length - 1];
  
  if (!lastMessage || conversationHistory.length === 0) {
    return [
      'Create a new request',
      'Browse available requests',
      'How does the platform work?',
      'Explain the points system'
    ];
  }

  // Context-aware suggestions
  const suggestions = [
    'Tell me more',
    'How do I get started?',
    'What are the categories?',
    'Show me examples'
  ];

  return suggestions;
}

/**
 * Save conversation to Firestore for analytics
 */
export async function saveConversation(userId, communityId, messages) {
  try {
    await addDoc(collection(db, 'chatbot_conversations'), {
      userId,
      communityId,
      messages,
      timestamp: new Date(),
      messageCount: messages.length
    });
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
}
