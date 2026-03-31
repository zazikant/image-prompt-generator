import { NextRequest, NextResponse } from 'next/server';
import { ai, ax } from '@ax-llm/ax';

export const maxDuration = 60; // Allow enough time for the 3-step agentic loop

export async function POST(req: NextRequest) {
  try {
    const { 
      systemPrompt, 
      userDirections, 
      model, 
      apiKey, 
      step, 
      v1Prompt: v1FromClient, 
      critique: critiqueFromClient 
    } = await req.json();

    if (!apiKey || !model || !userDirections?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const llm = ai({
      name: 'openrouter',
      apiKey,
      config: { model: model.trim() },
    });

    // Helper to safely escape docstrings for Ax signatures
    const safeDoc = systemPrompt.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    // Step 1: V1 Generator
    if (step === 'v1' || !step) {
      const v1Signature = `"${safeDoc}" userDirections:string -> v1Prompt:string`;
      const promptEngineer = ax(v1Signature);
      const v1Result = await promptEngineer.forward(llm, { userDirections });
      return NextResponse.json({ v1Prompt: String(v1Result?.v1Prompt || '') });
    }

    // Step 2: Critic
    if (step === 'critic') {
      const criticSignature = `v1Prompt:string -> critique:string "You are a Senior Principal Architect. Review this V1 meta-prompt for missing technical requirements, security flaws, missing libraries, or unhandled edge cases based on the user's intent. Output a concise critique highlighting exactly what needs to be added or fixed to make it a bulletproof, production-grade meta-prompt."`;
      const critic = ax(criticSignature);
      const criticResult = await critic.forward(llm, { v1Prompt: v1FromClient });
      return NextResponse.json({ critique: String(criticResult?.critique || '') });
    }

    // Step 3: Refiner (V2)
    if (step === 'refine') {
      const refinerSignature = `"YOU ARE A MASTER PROMPT ENGINEER. Your mission is to rebuild the [V1Prompt] by surgically integrating every technical, artistic, and structural requirement from the [Architect's Critique]. You MUST update all relevant sections of the original instructions to reflect the new criteria mentioned in the critique. Do not just repeat the V1—EVOLVE it into a masterpiece. ${safeDoc}" userDirections:string, v1Prompt:string, critique:string -> detailedPrompt:string`;
      const refiner = ax(refinerSignature);
      const result = await refiner.forward(llm, { userDirections, v1Prompt: v1FromClient, critique: critiqueFromClient });
      return NextResponse.json({ detailedPrompt: String(result?.detailedPrompt || '') });
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}
