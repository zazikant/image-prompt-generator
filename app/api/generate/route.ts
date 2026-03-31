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
            const signature = '"Act as an expert prompt engineer. Follow the constraints in systemPrompt to vividly expand the userDirections into a high-quality AI image generation prompt." systemPrompt:string, userDirections:string -> v1Prompt:string';
            const gen = ax(signature);
            const res = await gen.forward(llm, { systemPrompt, userDirections }, { stream: true }) as unknown as AsyncIterable<any>;
            for await (const chunk of res) {
              if (chunk.v1Prompt) controller.enqueue(encoder.encode(chunk.v1Prompt));
            }
          } else if (step === 'critic') {
            const signature = '"You are a Senior Principal Architect. Review the V1 prompt against the original systemPrompt instructions. Identify missing technical requirements and output a concise critique." systemPrompt:string, v1Prompt:string -> critique:string';
            const gen = ax(signature);
            const res = await gen.forward(llm, { systemPrompt, v1Prompt }, { stream: true }) as unknown as AsyncIterable<any>;
            for await (const chunk of res) {
              if (chunk.critique) controller.enqueue(encoder.encode(chunk.critique));
            }
          } else if (step === 'refine') {
            const signature = '"You are a master prompt engineer. Rebuild the v1Prompt by integrating every requirement from the critique while following the systemPrompt constraints." systemPrompt:string, userDirections:string, v1Prompt:string, critique:string -> detailedPrompt:string';
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
