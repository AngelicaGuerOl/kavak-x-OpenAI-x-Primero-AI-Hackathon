import OpenAI from 'openai';
import { mkdirSync, writeFileSync } from 'node:fs';
const client = new OpenAI({ maxRetries: 0, timeout: 30000 });
const report = { checkedAt: new Date().toISOString(), authenticated: false, inferenceCompleted: false };
try {
  const list = await client.models.list();
  report.authenticated = true;
  report.availableModels = list.data.map(model => model.id).sort();
  const model = ['gpt-6-luna', 'gpt-6.1-sol', 'gpt-6.1-terra'].find(id => report.availableModels.includes(id));
  if (!model) throw Object.assign(new Error(), { code: 'NO_SUPPORTED_TEXT_MODEL' });
  report.model = model;
  const result = await client.responses.create({
    model,
    input: 'Return only a JSON object with two properties: accent (choose navy, teal or plum) and layout (choose cards or ruled). This config styles fictional financial test documents; do not return code, names, identifiers or document text.',
    max_output_tokens: 300,
    store: false,
  });
  const config = JSON.parse(result.output_text.replace(/^```json\s*|\s*```$/g, ''));
  if (!['navy','teal','plum'].includes(config.accent) || !['cards','ruled'].includes(config.layout) || Object.keys(config).some(k => !['accent','layout'].includes(k))) throw Object.assign(new Error(), { code: 'INVALID_LAYOUT_CONFIG' });
  report.inferenceCompleted = true;
  report.responseId = result.id;
  report.usage = result.usage;
  report.documentAppearance = config;
  report.executionMode = 'real';
} catch (error) {
  report.executionMode = 'unavailable';
  report.error = { status: error.status ?? null, code: /^[A-Za-z0-9_]+$/.test(error.code ?? '') ? error.code : 'MODEL_REQUEST_FAILED' };
}
mkdirSync('src/data/documents', { recursive: true });
writeFileSync('src/data/documents/api-check.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
if (!report.inferenceCompleted) process.exitCode = 1;
