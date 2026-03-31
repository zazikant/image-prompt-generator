import { ai, ax } from '@ax-llm/ax';

async function main() {
  const llm = ai({ name: 'openrouter', apiKey: 'test', config: { model: 'test' } });
  const gen = ax('userInput:string -> modelOutput:string');
  console.log(Object.keys(gen));
  console.log(gen.forward.toString());
}
main();
