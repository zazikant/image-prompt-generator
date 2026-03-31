import { NextRequest, NextResponse } from 'next/server';
import { ai, ax } from '@ax-llm/ax';

export async function POST(req: NextRequest) {
  try {
    const { systemPrompt, userDirections, model, apiKey, useAgenticLoop } = await req.json();

    if (!apiKey || !model || !userDirections?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const llm = ai({
      name: 'openrouter',
      apiKey,
      config: { model: model.trim() },
    });

    // Step 1: V1 Generator
    const v1Signature = `"${systemPrompt.replace(/"/g, '\\"')}" userDirections:string -> v1Prompt:string`;
    const promptEngineer = ax(v1Signature);
    const v1Result = await promptEngineer.forward(llm, { userDirections });
    const v1Prompt = String(v1Result?.v1Prompt || '');

    if (!useAgenticLoop) {
      return NextResponse.json({ 
        detailedPrompt: v1Prompt, 
        critique: '', 
        v1Prompt 
      });
    }

    // Step 2: Critic
    const criticSignature = `v1Prompt:string -> critique:string "You are a Senior Principal Architect. Review this V1 meta-prompt for missing technical requirements, security flaws, missing libraries, or unhandled edge cases based on the user's intent. Output a concise critique highlighting exactly what needs to be added or fixed to make it a bulletproof, production-grade meta-prompt."`;
    const critic = ax(criticSignature);
    const criticResult = await critic.forward(llm, { v1Prompt });
    const critique = String(criticResult?.critique || '');

    // Step 3: Refiner (V2)
    const refinerSignature = `"YOU ARE A MASTER PROMPT ENGINEER. Your mission is to rebuild the [V1Prompt] by surgically integrating every technical requirement from the [Architect's Critique]. You MUST update the Tech Stack, Key Constraints, and Requirements sections in the original docstring to reflect new Security, Infrastructure, and Observability rules. Do not just repeat the V1—EVOLVE it into a production-grade masterpiece. ${systemPrompt.replace(/"/g, '\\"')}" userDirections:string, v1Prompt:string, critique:string -> detailedPrompt:string`;
    const refiner = ax(refinerSignature);
    const result = await refiner.forward(llm, { userDirections, v1Prompt, critique });

    const detailedPrompt = String(result?.detailedPrompt || '').trim();

    return NextResponse.json({ detailedPrompt, critique, v1Prompt });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}
