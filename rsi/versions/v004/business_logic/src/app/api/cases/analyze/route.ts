import { AnalyzeRequestSchema, AnalyzeResponseSchema } from '@/contracts/case.schema';
import { analyzeWithAgents, ModelUnavailableError } from '@/server/agents/kyc-verification';
import { cases } from '@/server/core';

export async function POST(request: Request) {
  const parsed = AnalyzeRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: { code: 'INVALID_REQUEST', message: 'caseId requerido' } }, { status: 400 });
  const customerCase = cases.find((entry) => entry.id === parsed.data.caseId);
  if (!customerCase) return Response.json({ error: { code: 'CASE_NOT_FOUND', message: 'Caso inexistente' } }, { status: 404 });

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: { code: 'MODEL_UNAVAILABLE', message: 'Configura OPENAI_API_KEY para ejecutar agentes reales. El modo simulado está disponible solo mediante el servicio de desarrollo.' } }, { status: 503 });
  }
  try {
    const result = AnalyzeResponseSchema.parse(await analyzeWithAgents(customerCase));
    return Response.json(result);
  } catch (error) {
    if (error instanceof ModelUnavailableError) {
      return Response.json({ error: { code: 'MODEL_UNAVAILABLE', message: error.message } }, { status: 503 });
    }
    const message = error instanceof Error ? error.message : 'Error inesperado al ejecutar agentes';
    return Response.json({ error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}
