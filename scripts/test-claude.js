require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function testClaude() {
  console.log('🤖 Testing Claude API...\n');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: 'Generate a simple recipe using these ingredients: chicken, potatoes, carrots. Format as JSON with name, ingredients array, and instructions array.'
      }
    ],
  });

  console.log('✅ Claude Response:\n');
  console.log(message.content[0].text);
}

testClaude().catch(console.error);
