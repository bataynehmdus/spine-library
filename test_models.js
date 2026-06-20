import { GoogleGenerativeAI } from '@google/generative-ai';
const ai = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

async function run() {
  const models = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.VITE_GEMINI_API_KEY}`).then(res => res.json());
  console.log(models.models.map(m => m.name));
}
run();
