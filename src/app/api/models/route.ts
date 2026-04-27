import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return new Response('No API key', { status: 500 });
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    return new Response(JSON.stringify(data, null, 2), { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
}
