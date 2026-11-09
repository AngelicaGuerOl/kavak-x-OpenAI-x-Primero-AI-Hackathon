import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';
import { AnalyzeResponseSchema, FindingSchema } from '@/contracts/case.schema';
import type { AnalyzeResponse, Finding } from '@/contracts/case';
import { SyntheticCaseSchema, evaluationDate, preparationStatus, type SyntheticCase } from '@/server/synthetic-case';
import { createReviewItems } from '@/server/review-monitor';

const agentModel = process.env.OPENAI_AGENT_MODEL || 'gpt-6-luna';

const KycOutputSchema = z.object({
  documentKinds: z.array(z.string()),
  questionsForVerification: z.array(z.string()),
  summary: z.string(),
});

const VerificationOutputSchema = z.object({
  findings: z.array(FindingSchema),
  summary: z.string(),
});

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
export function compareSyntheticCaseFields(caseJson: string, onExecuted?: () => void, asOf?: string) {
  const date = evaluationDate(asOf);
  const record = parseCaseJson(caseJson);
  const findings: Finding[] = [];
  if (!record.address) findings.push({ code: 'ADDRESS_MISSING', severity: 'WARNING', message: 'Falta comprobante de domicilio', evidence: ['address=false en fixture sintético'], sourceIds: ['check_document_presence'] });
  if (record.rfc !== record.taxRfc) findings.push({ code: 'RFC_MISMATCH', severity: 'WARNING', message: 'RFC distinto entre solicitud y constancia fiscal simulada', evidence: ['RFC de solicitud y RFC fiscal no coinciden'], sourceIds: ['compare_shared_fields'] });
  if (record.ineExpires < date) findings.push({ code: 'INE_EXPIRED', severity: 'WARNING', message: 'Identificación sintética vencida', evidence: [`vigencia=${record.ineExpires}`], sourceIds: ['check_document_expiry'] });
  const validatedFindings = z.array(FindingSchema).parse(findings);
  onExecuted?.();
  return { findings: validatedFindings };
}

export function createKycAgent(caseInput?: unknown, toolCalls: string[] = [], listedDocuments: string[][] = [], trace: AnalyzeResponse['agentTrace'] = []) {
  // Capture an independent copy, never fields supplied by a model tool call.
  const caseJson = caseInput === undefined ? undefined : JSON.stringify(SyntheticCaseSchema.parse(caseInput));
  const listDocuments = tool({
    name: 'list_synthetic_documents',
    description: 'List document kinds present in the supplied synthetic case.',
    parameters: z.object({}).strict(),
    execute: async () => {
      if (!caseJson) throw new Error('Missing server case context');
      const result = listSyntheticDocuments(caseJson);
      trace.push({ agent: 'KYC', toolId: 'list_synthetic_documents', action: 'Listar documentos sintéticos', result: JSON.stringify(result), timestamp: traceTimestamp() });
      toolCalls.push('list_synthetic_documents');
      listedDocuments.push(result.documents);
      return JSON.stringify(result);
    },
  });

  return new Agent({
    name: 'KYC Agent',
    model: agentModel,
    instructions: 'Review only the supplied synthetic account-opening case. Use the document listing tool. Identify what is present and prepare specific checks for Verification. Never decide credit eligibility or claim official verification.',
    outputType: KycOutputSchema,
    tools: [listDocuments],
  });
}

export function createVerificationAgent(caseInput?: unknown, toolCalls: string[] = [], executedFindings: Finding[][] = [], asOf?: string, trace: AnalyzeResponse['agentTrace'] = []) {
  const caseJson = caseInput === undefined ? undefined : JSON.stringify(SyntheticCaseSchema.parse(caseInput));
  const date = evaluationDate(asOf);
  const compareFields = tool({
    name: 'compare_synthetic_case_fields',
    description: 'Compare synthetic RFC values and check address presence and synthetic identity expiry.',
    parameters: z.object({}).strict(),
    execute: async () => {
      if (!caseJson) throw new Error('Missing server case context');
      const result = compareSyntheticCaseFields(caseJson, undefined, date);
      trace.push({ agent: 'VERIFICATION', toolId: 'compare_synthetic_case_fields', action: 'Contrastar evidencia sintética', result: JSON.stringify(result), timestamp: traceTimestamp() });
      toolCalls.push('compare_synthetic_case_fields');
      executedFindings.push(result.findings);
      return JSON.stringify(result);
    },
  });

  return new Agent({
    name: 'Verification Agent',
    model: agentModel,
    instructions: 'Verify the supplied synthetic account case using the comparison tool. Report only findings returned by the tool and cite its evidence. Keep all outcomes subject to human review; never approve or reject credit or claim official external checks.',
    outputType: VerificationOutputSchema,
    tools: [compareFields],
  });
}

export class ModelUnavailableError extends Error {
  runId?: string;
  agentTrace: AnalyzeResponse['agentTrace'] = [];
  constructor(message: string) {
    super(message);
    this.name = 'ModelUnavailableError';
  }
}

function toSafeModelError(stage: string, error: unknown): ModelUnavailableError {
  const details = error && typeof error === 'object' ? error as { status?: unknown; code?: unknown } : {};
  const status = typeof details.status === 'number' ? details.status : undefined;
  const code = typeof details.code === 'string' ? details.code : undefined;
  const reason = code?.match(/^[a-zA-Z0-9_]+$/) ? code : (status ? `HTTP ${status}` : 'MODEL_REQUEST_FAILED');
  console.error('Agents SDK model request failed', { stage, status, code: reason });
  return new ModelUnavailableError(`${stage}: ${reason}`);
}

function traceTimestamp() {
  return new Date().toISOString();
}

export async function analyzeWithAgents(caseInput: unknown, asOf?: string): Promise<AnalyzeResponse> {
  const date = evaluationDate(asOf);
  const customerCase = SyntheticCaseSchema.parse(caseInput);
  const trace: AnalyzeResponse['agentTrace'] = [];
  const runId = crypto.randomUUID();
  try {
    if (!process.env.OPENAI_API_KEY) throw new ModelUnavailableError('OPENAI_API_KEY no está configurada');
    return await executeAgents(customerCase, date, runId, trace);
  } catch (error) {
    if (error instanceof ModelUnavailableError) {
      error.runId = runId;
      error.agentTrace = structuredClone(trace);
    }
    throw error;
  }
}

async function executeAgents(customerCase: SyntheticCase, date: string, runId: string, trace: AnalyzeResponse['agentTrace']): Promise<AnalyzeResponse> {
  const caseJson = JSON.stringify(customerCase);
  const kycToolCalls: string[] = [];
  const listedDocuments: string[][] = [];
  let kyc;
  try {
    kyc = await run(createKycAgent(customerCase, kycToolCalls, listedDocuments, trace), `Revisa este caso sintético de apertura de cuenta, lista los documentos y prepara verificaciones: ${caseJson}`);
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
    timestamp: traceTimestamp(),
  });

  const verificationToolCalls: string[] = [];
  const executedFindings: Finding[][] = [];
  let verification;
  try {
    verification = await run(
      createVerificationAgent(customerCase, verificationToolCalls, executedFindings, date, trace),
      `Contrasta la evidencia del caso sintético con las verificaciones preparadas por KYC: ${JSON.stringify(kycOutput)}. Fecha de evaluación: ${date}. Caso: ${caseJson}`,
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
    timestamp: traceTimestamp(),
  });

  const findings = z.array(FindingSchema).parse(verificationOutput.findings);
  const status = preparationStatus(findings);
  return AnalyzeResponseSchema.parse({
    caseId: customerCase.id,
    runId,
    status,
    findings,
    reviewItems: createReviewItems(findings),
    agentTrace: trace,
    productGuidance: [],
    executionMode: 'real',
    simulated: false,
  });
}

export function validateSyntheticCase(input: unknown): SyntheticCase {
  return SyntheticCaseSchema.parse(input);
}
