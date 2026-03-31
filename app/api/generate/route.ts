import { NextRequest, NextResponse } from 'next/server';
import { ai, ax } from '@ax-llm/ax';

export async function POST(req: NextRequest) {
  try {
    const { systemPrompt, userDirections, model, apiKey } = await req.json();

    if (!apiKey || !model || !userDirections?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const llm = ai({
      name: 'openrouter',
      apiKey,
      config: { model: model.trim() },
    });

    const signatureStr = `userDirections:string -> detailedPrompt:string "${systemPrompt.replace(/"/g, '\\"')}"`;

    const promptEngineer = ax(signatureStr);

    const result = await promptEngineer.forward(llm, { userDirections });

    const detailedPrompt = result?.detailedPrompt?.trim?.() || '';

    return NextResponse.json({ detailedPrompt });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}
