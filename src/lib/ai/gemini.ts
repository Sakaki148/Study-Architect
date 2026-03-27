// ============================================
// Gemini AI - Core Module
// ============================================

import { GoogleGenerativeAI } from '@google/generative-ai';

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('the use for today has ended');
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function generateWithGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    ...(systemInstruction && { systemInstruction }),
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateJSONWithGemini<T>(prompt: string, systemInstruction?: string): Promise<T> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    generationConfig: {
      responseMimeType: 'application/json',
    },
    ...(systemInstruction && { systemInstruction }),
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    return JSON.parse(text) as T;
  } catch(e) {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      return JSON.parse(match[1]) as T;
    }
    throw new Error('Failed to parse Gemini JSON output');
  }
}

export async function streamWithGemini(
  prompt: string,
  onChunk: (chunk: string) => void,
  systemInstruction?: string
): Promise<string> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    ...(systemInstruction && { systemInstruction }),
  });

  const result = await model.generateContentStream(prompt);
  let fullText = '';
  for await (const chunk of result.stream) {
    const text = chunk.text();
    fullText += text;
    onChunk(text);
  }
  return fullText;
}
