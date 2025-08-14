import { GoogleGenerativeAI } from '@google/generative-ai';

// Debug: Log environment variables (only in development)
if (process.env.NODE_ENV !== 'production') {
  console.log('Environment variables:', {
    hasApiKey: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    keyLength: process.env.NEXT_PUBLIC_GEMINI_API_KEY?.length,
    keyPrefix: process.env.NEXT_PUBLIC_GEMINI_API_KEY?.substring(0, 10) + '...',
    nodeEnv: process.env.NODE_ENV
  });
}

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  const errorMsg = 'Gemini API key is not set. Please ensure NEXT_PUBLIC_GEMINI_API_KEY is set in your environment variables.';
  console.error(errorMsg, { env: process.env });
  throw new Error(errorMsg);
}

// Rate limiting configuration
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
let lastRequestTime = 0;

// Simple rate limiting function
const rateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const delay = RATE_LIMIT_DELAY - timeSinceLastRequest;
    console.log(`Rate limiting: Waiting ${delay}ms before next request`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastRequestTime = Date.now();
};

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Message type used in the app
export interface GeminiMessage {
  role: 'user' | 'model' | 'ai';
  parts: { text: string }[];
}

export async function generateGeminiResponse(messages: GeminiMessage[], retryCount = 0): Promise<string> {
  const MAX_RETRIES = 3;
  
  try {
    // Apply rate limiting
    await rateLimit();
    
    // Filter out any error messages and empty messages
    const filteredMessages = messages.filter(msg => {
      const isError = msg.role === 'ai' && msg.parts[0]?.text?.includes('error');
      return !isError && msg.parts[0]?.text?.trim() !== '';
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('Sending request to Gemini API with messages:', 
        JSON.stringify(filteredMessages, null, 2)
      );
    }

    // Using Gemini 2.0 Flash model for better rate limits
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
    });
    
    // Get the last user message
    const lastUserMessage = [...filteredMessages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) {
      throw new Error('No user message found in the conversation');
    }

    // For the first message, we need to use generateContent instead of startChat
    if (filteredMessages.length <= 1) {
      const result = await model.generateContent(lastUserMessage.parts[0].text);
      const response = await result.response;
      return response.text();
    }
    
    // For subsequent messages, use chat
    const chat = model.startChat({
      history: filteredMessages.slice(0, -1).map(msg => ({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.parts[0].text }]
      })),
    });

    // Send the message and get response
    const result = await chat.sendMessage(lastUserMessage.parts[0].text);
    const response = await result.response;
    const text = response.text();
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Gemini API Response:', text);
    }
    
    return text;
    
  } catch (error) {
    console.error('Error in generateGeminiResponse:', error);
    
    // Handle rate limiting with retry
    if (error instanceof Error && error.message.includes('429') && retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      console.log(`Rate limited. Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateGeminiResponse(messages, retryCount + 1);
    }
    
    // Handle other errors
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        return 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (error.message.includes('401')) {
        return 'Invalid API key. Please check your Gemini API key.';
      } else if (error.message.includes('404')) {
        return 'The requested model was not found. Please check the model name.';
      }
      return error.message || "I'm having trouble connecting to the AI service. Please try again later.";
    }
    
    return "An unexpected error occurred. Please try again later.";
  }
}
