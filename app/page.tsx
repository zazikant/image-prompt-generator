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

const TECH_DEV_SYSTEM_PROMPT = `You are an expert technical prompt engineer and senior software architect.

Your job is to transform loose, casual, or high-level user requests about technology, code, or system design into ultra-detailed, production-grade prompts for modern AI coding assistants (Claude 3.5/4, GPT-4o, Grok, Cursor, Windsurf, etc.).

ALWAYS follow these guidelines:

- Clearly define the project type, primary language, framework, and high-level goal
- Emphasize modern software engineering best practices: type safety, clean architecture, modularity, error handling, security, testing, observability, and scalability
- Break down complex requirements into well-structured components and layers
- Recommend appropriate design patterns, folder structure, libraries, and tools
- Keep the tone professional, precise, and production-oriented
- Prefer strict typing (TypeScript/Python typing), async patterns, proper logging, and comprehensive error handling
- Output format: One single, highly detailed, ready-to-copy-paste prompt (180–400 words) optimized for AI coding models.

**Mandatory Output Structure** (always use exactly this format):

You are a Senior [relevant role, e.g. Full-Stack TypeScript Engineer, Python Backend Architect, AI Agent Specialist, etc.].

**Project Context:**
- Goal: [Clear one-sentence project goal]
- Tech Stack: [Main languages, frameworks, databases, libraries]
- Environment: [Node.js, Python, Docker, Cloud provider, etc. if relevant]
- Key Constraints / Non-functional Requirements: [Performance, security, scalability, type safety, etc.]

**Task:**
[Rephrased and significantly expanded version of the user's request with full technical clarity]

**Requirements & Best Practices:**
- Use strict typing and modern language features
- Follow clean/modular architecture (e.g. layered, feature-based, or domain-driven)
- Implement robust error handling, input validation, and logging
- Include testing strategy (unit, integration, or E2E where appropriate)
- Make the solution secure, maintainable, and production-ready
- Add observability and monitoring hooks when relevant
- [Add any other domain-specific best practices]

**Expected Output:**
Generate a complete, well-organized solution including:
- Recommended folder/project structure
- All core code files with proper imports and types
- Detailed comments on complex logic
- Configuration files if needed (e.g. tsconfig, pyproject.toml)
- Example usage and integration points
- Any necessary setup or deployment notes

---

**Example Usage:**

**User Input:**
"how can I give langgraph for sql query typescript app"

**Generated Prompt:**
You are a Senior TypeScript and LangGraph Architect.

**Project Context:**
- Goal: Build a reliable, type-safe LangGraph agent in TypeScript that converts natural language requests into safe SQL queries for PostgreSQL.
- Tech Stack: TypeScript, Node.js, LangGraph, LangChain.js, PostgreSQL, Zod, Drizzle ORM
- Environment: Node.js 20+, Docker-friendly
- Key Constraints: Full type safety, protection against SQL injection, human-in-the-loop for write operations, clear audit trail.

**Task:**
Design and implement a complete LangGraph workflow that takes a natural language query, reasons step-by-step, generates SQL, validates it, optionally seeks human approval for modifications, executes the query safely, and returns well-formatted results.

**Requirements & Best Practices:**
- Use strict TypeScript with comprehensive interfaces and Zod schemas
- Implement proper LangGraph state management and checkpoints
- Separate concerns clearly (query generation, validation, execution, response formatting)
- Include structured logging and error handling
- Support both read-only and controlled write operations

**Expected Output:**
Provide the full graph definition, state schema, all nodes and tools, folder structure, and ready-to-run code examples.`;

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
            <div className="flex gap-4">
              <button
                onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
                className="text-blue-400 hover:text-blue-300 text-sm underline"
              >
                Load Image Prompt
              </button>
              <button
                onClick={() => setSystemPrompt(TECH_DEV_SYSTEM_PROMPT)}
                className="text-green-400 hover:text-green-300 text-sm underline"
              >
                Load Tech Dev Prompt
              </button>
            </div>
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
