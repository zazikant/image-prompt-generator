'use client';

import { useState } from 'react';

const DEFAULT_SYSTEM_PROMPT = `You are an expert image prompt engineer. You are an expert at turning loose, casual, or explicit user directions into ultra-detailed, vivid, high-quality prompts for modern text-to-image models (Flux, SD3, SDXL, Pony, etc.).

ALWAYS follow these guidelines:
- Start with strong cinematic composition (e.g. low-angle shot, dramatic perspective)
- Emphasize body language, pose details, clothing (especially sheer/translucent fabrics)
- Build seductive/mood-rich atmosphere with lighting, shadows, skin texture
- Keep it anatomically realistic + professional erotic photography style
- Tasteful yet explicit when appropriate — avoid vulgar/cartoon unless user says so
- Output format: comma-separated descriptive tags (80–150 words), ready to copy-paste

Examples:

taste="photorealistic",
user_input="a cat sitting on a windowsill",
enhanced_prompt="You are an expert image prompt engineer. Transform this image concept into a photorealistic AI image generation prompt.

**Input**:
- Image Concept: "a cat sitting on a windowsill"
- Quality Style: "photorealistic"

**Output**:
Ultra realistic photograph of a ginger cat sitting on a sunlit windowsill, detailed fur texture with individual hairs visible, sharp focus on the subject's eyes, natural lighting with soft shadows, 85mm lens with shallow depth of field, visible dust particles in the light beam, detailed wood grain on the windowsill, warm color temperature"


taste="photorealistic",
user_input="a mountain landscape at sunset",
enhanced_prompt="You are an expert image prompt engineer. Transform this image concept into a photorealistic AI image generation prompt.

**Input**:
- Image Concept: "a mountain landscape at sunset"
- Quality Style: "photorealistic"

**Output**:
Breathtaking photorealistic landscape of snow-capped mountains at golden hour, warm sunset colors reflecting on a serene lake, volumetric lighting with sun rays breaking through clouds, ultra high detail with visible rock textures and snow crystals, 8k resolution, deep depth of field with foreground elements to establish scale, atmospheric perspective on distant peaks"`;

export default function Home() {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [userDirections, setUserDirections] = useState('');
  const [model, setModel] = useState('arcee-ai/trinity-large-preview:free');
  const [apiKey, setApiKey] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('Please enter your OpenRouter API key');
      return;
    }
    setLoading(true);
    setError('');
    setResult('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          userDirections,
          model,
          apiKey,
        }),
      });

      const data: { detailedPrompt?: string; error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');

      setResult(data.detailedPrompt || '');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    alert('Prompt copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-2">Image Prompt Engineer</h1>
        <p className="text-zinc-400 mb-8">v4 – DSPy + Ax (TypeScript). Your docstring controls the output field. Ax handles everything else.</p>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <div>
              <label className="text-sm font-medium">Output Field Instructions (YOUR DOCSTRING)</label>
              <p className="text-xs text-zinc-500 mt-1">
                Paste any researched version. Ax turns this into a type-safe, validated signature.
              </p>
            </div>
            <button
              onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              Load Default Prompt
            </button>
          </div>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full h-80 bg-zinc-900 border border-zinc-700 rounded-2xl p-6 font-mono text-sm resize-y"
            placeholder="Paste your custom instructions here..."
          />
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">Your scene directions</label>
          <textarea
            value={userDirections}
            onChange={(e) => setUserDirections(e.target.value)}
            placeholder="she spreads legs wide, low camera angle from below, knees bent, back arched, looking at viewer..."
            className="w-full h-40 bg-zinc-900 border border-zinc-700 rounded-2xl p-6 text-lg"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2">OpenRouter Model</label>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4 font-mono"
              placeholder="arcee-ai/trinity-large-preview:free"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Your OpenRouter API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4"
              placeholder="sk-or-v1-..."
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !userDirections.trim()}
          className="w-full bg-white text-black py-5 rounded-2xl font-semibold text-xl hover:bg-zinc-200 disabled:opacity-50 transition-all"
        >
          {loading ? 'Generating Prompt (Ax DSPy)...' : 'Generate Image Prompt'}
        </button>

        {error && <p className="mt-4 text-red-400 text-center">{error}</p>}

        {result && (
          <div className="mt-12">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold">Generated Prompt</h3>
              <button
                onClick={copyToClipboard}
                className="bg-zinc-800 hover:bg-zinc-700 px-6 py-2 rounded-xl text-sm"
              >
                📋 Copy
              </button>
            </div>
            <pre className="bg-black border border-zinc-800 rounded-3xl p-8 whitespace-pre-wrap text-sm leading-relaxed overflow-auto max-h-[400px]">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
