import { NextRequest, NextResponse } from 'next/server';
import { ai, ax } from '@ax-llm/ax';

export const runtime = 'edge'; // Use Edge Runtime for speed and higher 30s timeout

export async function POST(req: NextRequest) {
  try {
    const { 
      systemPrompt, 
      userDirections, 
      model, 
      apiKey, 
      step, 
      v1Prompt, 
      critique
    } = await req.json();

    if (!apiKey || !model || !userDirections?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const llm = ai({
      name: 'openrouter',
      apiKey,
      config: { model: model.trim() },
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (step === 'v1' || !step) {
            const signature = 'systemPrompt:string, userDirections:string -> v1Prompt:string';
            const gen = ax(signature);
            const res = await gen.forward(llm, { systemPrompt, userDirections }, { stream: true }) as unknown as AsyncIterable<any>;
            for await (const chunk of res) {
              if (chunk.v1Prompt) controller.enqueue(encoder.encode(chunk.v1Prompt));
            }
          } else if (step === 'critic') {
            const signature = '"You are a Senior Principal Architect. Review this V1 meta-prompt against the original goal defined above. Identify missing technical requirements, security flaws, or unhandled edge cases. Output a concise critique highlighting exactly what needs to be added to reach production-grade quality." systemPrompt:string, v1Prompt:string -> critique:string';
            const gen = ax(signature);
            const res = await gen.forward(llm, { systemPrompt, v1Prompt }, { stream: true }) as unknown as AsyncIterable<any>;
            for await (const chunk of res) {
              if (chunk.critique) controller.enqueue(encoder.encode(chunk.critique));
            }
          } else if (step === 'refine') {
            const signature = '"YOU ARE A MASTER PROMPT ENGINEER. Your mission is to rebuild the [V1Prompt] by surgically integrating every technical, artistic, and structural requirement from the [Architect\'s Critique]. You MUST update all relevant sections of the original instructions to reflect the new criteria mentioned in the critique. Do not just repeat the V1—EVOLVE it into a masterpiece." systemPrompt:string, userDirections:string, v1Prompt:string, critique:string -> detailedPrompt:string';
            const gen = ax(signature);
            const res = await gen.forward(llm, { systemPrompt, userDirections, v1Prompt, critique }, { stream: true }) as unknown as AsyncIterable<any>;
            for await (const chunk of res) {
              if (chunk.detailedPrompt) controller.enqueue(encoder.encode(chunk.detailedPrompt));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}
