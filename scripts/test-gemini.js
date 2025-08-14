const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

async function testGemini() {
  try {
    console.log('Testing Gemini API connection...');
    
    // Get the Gemini Pro model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro-latest',
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
    });

    // Test a simple prompt
    const prompt = 'Hello, Gemini! Can you tell me a short joke?';
    console.log('Sending prompt:', prompt);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('\nGemini API Response:');
    console.log(text);
    console.log('\n✅ Gemini API connection successful!');
    
  } catch (error) {
    console.error('❌ Error testing Gemini API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    }
    process.exit(1);
  }
}

testGemini();
