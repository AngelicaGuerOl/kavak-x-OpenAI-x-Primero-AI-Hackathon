import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';
import { AnalyzeResponseSchema, FindingSchema } from '@/contracts/case.schema';
import type { AnalyzeResponse, Finding } from '@/contracts/case';

const KycOutputSchema = z.object({
  documentKinds: z.array(z.string()),
  questionsForVerification: z.array(z.string()),
  summary: z.string(),
});

const VerificationOutputSchema = z.object({
  findings: z.array(FindingSchema),
  summary: z.string(),
});

const SyntheticCaseSchema = z.object({
  id: z.string(),
  rfc: z.string(),
  taxRfc: z.string(),
  ineExpires: z.string(),
  address: z.boolean(),
  documents: z.array(z.string()),
});
type SyntheticCase = z.infer<typeof SyntheticCaseSchema>;

function parseCaseJson(caseJson: string): SyntheticCase {
  return SyntheticCaseSchema.parse(JSON.parse(caseJson));
}

/** Synthetic tool implementation; callback runs only after successful execution. */
export function listSyntheticDocuments(caseJson: string, onExecuted?: () => void) {
  const record = parseCaseJson(caseJson);
  const result = { documents: record.documents, addressPresent: record.address };
  onExecuted?.();
  return result;
}

/** Synthetic evidence comparison; no external registry or service is contacted. */
export function compareSyntheticCaseFields(caseJson: string, onExecuted?: () => void) {
  const record = parseCaseJson(caseJson);
  const findings: Finding[] = [];
  if (!record.address) findings.push({ code: 'ADDRESS_MISSING', severity: 'WARNING', message: 'Falta comprobante de domicilio', evidence: ['address=false en fixture sintético'], sourceIds: ['check_document_presence'] });
  if (record.rfc !== record.taxRfc) findings.push({ code: 'RFC_MISMATCH', severity: 'WARNING', message: 'RFC distinto entre solicitud y constancia fiscal simulada', evidence: ['RFC de solicitud y RFC fiscal no coinciden'], sourceIds: ['compare_shared_fields'] });
  if (record.ineExpires < new Date().toISOString().slice(0, 10)) findings.push({ code: 'INE_EXPIRED', severity: 'WARNING', message: 'Identificación sintética vencida', evidence: [`vigencia=${record.ineExpires}`], sourceIds: ['check_document_expiry'] });
  const validatedFindings = z.array(FindingSchema).parse(findings);
  onExecuted?.();
  return { findings: validatedFindings };
}

export function createKycAgent(toolCalls: string[] = [], listedDocuments: string[][] = []) {
  const listDocuments = tool({
    name: 'list_synthetic_documents',
    description: 'List document kinds present in the supplied synthetic case.',
    parameters: z.object({ caseJson: z.string() }),
    execute: async ({ caseJson }) => {
      const result = listSyntheticDocuments(caseJson);
      toolCalls.push('list_synthetic_documents');
      listedDocuments.push(result.documents);
      return JSON.stringify(result);
    },
  });

  return new Agent({
    name: 'KYC Agent',
    instructions: 'Review only the supplied synthetic account-opening case. Use the document listing tool. Identify what is present and prepare specific checks for Verification. Never decide credit eligibility or claim official verification.',
    outputType: KycOutputSchema,
    tools: [listDocuments],
  });
}

export function createVerificationAgent(toolCalls: string[] = [], executedFindings: Finding[][] = []) {
  const compareFields = tool({
    name: 'compare_synthetic_case_fields',
    description: 'Compare synthetic RFC values and check address presence and synthetic identity expiry.',
    parameters: z.object({ caseJson: z.string() }),
    execute: async ({ caseJson }) => {
      const result = compareSyntheticCaseFields(caseJson);
      toolCalls.push('compare_synthetic_case_fields');
      executedFindings.push(result.findings);
      return JSON.stringify(result);
    },
  });

  return new Agent({
    name: 'Verification Agent',
    instructions: 'Verify the supplied synthetic account case using the comparison tool. Report only findings returned by the tool and cite its evidence. Keep all outcomes subject to human review; never approve or reject credit or claim official external checks.',
    outputType: VerificationOutputSchema,
    tools: [compareFields],
  });
}

export class ModelUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ModelUnavailableError';
  }
}

function toSafeModelError(stage: string, error: unknown): ModelUnavailableError {
  const cause = error instanceof Error ? error : new Error('Unknown model error');
  const details = error && typeof error === 'object' ? error as { status?: unknown; code?: unknown } : {};
  const status = typeof details.status === 'number' ? details.status : undefined;
  const code = typeof details.code === 'string' ? details.code : undefined;
  const safeMessage = cause.message
    .replace(/sk-[A-Za-z0-9_-]+/g, '[redacted]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .slice(0, 240);
  console.error('Agents SDK model request failed', { stage, name: cause.name, status, code, message: safeMessage });
  const reason = code ?? (status ? `HTTP ${status}` : cause.name);
  return new ModelUnavailableError(`${stage}: ${reason} — ${safeMessage}`);
}

function traceTimestamp() {
  return new Date().toISOString();
}

export async function analyzeWithAgents(caseInput: unknown): Promise<AnalyzeResponse> {
  const customerCase = SyntheticCaseSchema.parse(caseInput);
  if (!process.env.OPENAI_API_KEY) throw new ModelUnavailableError('OPENAI_API_KEY no está configurada');

  const caseJson = JSON.stringify(customerCase);
  const trace: AnalyzeResponse['agentTrace'] = [];
  const runId = crypto.randomUUID();
  const kycToolCalls: string[] = [];
  const listedDocuments: string[][] = [];
  let kyc;
  try {
    kyc = await run(createKycAgent(kycToolCalls, listedDocuments), `Revisa este caso sintético de apertura de cuenta, lista los documentos y prepara verificaciones: ${caseJson}`);
  } catch (error) {
    throw toSafeModelError('KYC Agent', error);
  }
  const parsedKycOutput = KycOutputSchema.safeParse(kyc.finalOutput);
  if (!parsedKycOutput.success) throw new ModelUnavailableError('KYC Agent no produjo salida estructurada válida');
  const kycOutput = parsedKycOutput.data;
  if (!kycToolCalls.includes('list_synthetic_documents')) {
    throw new ModelUnavailableError('KYC Agent no ejecutó la herramienta simulada de documentos');
  }
  if (JSON.stringify([...kycOutput.documentKinds].sort()) !== JSON.stringify([...(listedDocuments[0] ?? [])].sort())) {
    throw new ModelUnavailableError('La salida de KYC Agent no coincide con la herramienta de documentos');
  }
  trace.push({
    agent: 'KYC',
    action: 'Análisis de expediente sintético y preparación de verificaciones con OpenAI Agents SDK',
    result: kycOutput.summary,
    ...(kycToolCalls.includes('list_synthetic_documents') ? { toolId: 'list_synthetic_documents' } : {}),
    timestamp: traceTimestamp(),
  });

  const verificationToolCalls: string[] = [];
  const executedFindings: Finding[][] = [];
  let verification;
  try {
    verification = await run(
      createVerificationAgent(verificationToolCalls, executedFindings),
      `Contrasta la evidencia del caso sintético con las verificaciones preparadas por KYC: ${JSON.stringify(kycOutput)}. Caso: ${caseJson}`,
    );
  } catch (error) {
    throw toSafeModelError('Verification Agent', error);
  }
  const parsedVerificationOutput = VerificationOutputSchema.safeParse(verification.finalOutput);
  if (!parsedVerificationOutput.success) throw new ModelUnavailableError('Verification Agent no produjo salida estructurada válida');
  const verificationOutput = parsedVerificationOutput.data;
  if (!verificationToolCalls.includes('compare_synthetic_case_fields')) {
    throw new ModelUnavailableError('Verification Agent no ejecutó la herramienta simulada de contraste');
  }
  if (JSON.stringify(verificationOutput.findings) !== JSON.stringify(executedFindings[0] ?? [])) {
    throw new ModelUnavailableError('Los hallazgos de Verification Agent no coinciden con la evidencia de la herramienta');
  }
  trace.push({
    agent: 'VERIFICATION',
    action: 'Contraste de evidencia sintética con OpenAI Agents SDK',
    result: verificationOutput.summary,
    ...(verificationToolCalls.includes('compare_synthetic_case_fields') ? { toolId: 'compare_synthetic_case_fields' } : {}),
    timestamp: traceTimestamp(),
  });

  const findings = z.array(FindingSchema).parse(verificationOutput.findings);
  const status = findings.some((finding) => finding.code === 'ADDRESS_MISSING')
    ? 'PENDING_INFORMATION'
    : findings.length > 0 ? 'REQUIRES_REVIEW' : 'READY_FOR_HUMAN_REVIEW';
  return AnalyzeResponseSchema.parse({
    caseId: customerCase.id,
    runId,
    status,
    findings,
    agentTrace: trace,
    productGuidance: [],
    executionMode: 'real',
    simulated: false,
  });
}

export function validateSyntheticCase(input: unknown): SyntheticCase {
  return SyntheticCaseSchema.parse(input);
}
