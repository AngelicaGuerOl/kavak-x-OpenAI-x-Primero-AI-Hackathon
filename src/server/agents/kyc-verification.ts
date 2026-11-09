import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';
import type { AnalyzeResponse, AgentTraceEntry, Finding } from '@/contracts/case';

const KycOutputSchema = z.object({
  documentKinds: z.array(z.string()),
  questionsForVerification: z.array(z.string()),
  summary: z.string(),
});

const VerificationOutputSchema = z.object({
  findings: z.array(z.object({
    code: z.string(),
    severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
    message: z.string(),
    evidence: z.array(z.string()),
    sourceIds: z.array(z.string()),
  })),
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

export function createKycAgent(toolCalls: string[] = []) {
  const listDocuments = tool({
    name: 'list_synthetic_documents',
    description: 'List the document kinds present in the supplied synthetic case.',
    parameters: z.object({ caseJson: z.string() }),
    execute: async ({ caseJson }) => {
      toolCalls.push('list_synthetic_documents');
      const record = SyntheticCaseSchema.parse(JSON.parse(caseJson));
      return JSON.stringify({ documents: record.documents, addressPresent: record.address });
    },
  });

  return new Agent({
    name: 'KYC Agent',
    instructions: 'Review only the supplied synthetic account-opening case. Use the document listing tool. Identify what is present and what Verification should check. Never decide credit eligibility or claim official verification.',
    outputType: KycOutputSchema,
    tools: [listDocuments],
  });
}

export function createVerificationAgent(toolCalls: string[] = []) {
  const compareCaseFields = tool({
    name: 'compare_synthetic_case_fields',
    description: 'Compare RFC values and check address presence and synthetic identity expiry.',
    parameters: z.object({ caseJson: z.string() }),
    execute: async ({ caseJson }) => {
      toolCalls.push('compare_synthetic_case_fields');
      const record = SyntheticCaseSchema.parse(JSON.parse(caseJson));
      const findings: Finding[] = [];
      if (!record.address) findings.push({ code: 'ADDRESS_MISSING', severity: 'WARNING', message: 'Falta comprobante de domicilio', evidence: ['address=false en fixture sintético'], sourceIds: ['check_document_presence'] });
      if (record.rfc !== record.taxRfc) findings.push({ code: 'RFC_MISMATCH', severity: 'WARNING', message: 'RFC distinto entre solicitud y constancia fiscal simulada', evidence: ['RFC de solicitud y RFC fiscal no coinciden'], sourceIds: ['compare_shared_fields'] });
      if (record.ineExpires < new Date().toISOString().slice(0, 10)) findings.push({ code: 'INE_EXPIRED', severity: 'WARNING', message: 'Identificación sintética vencida', evidence: [`vigencia=${record.ineExpires}`], sourceIds: ['check_document_expiry'] });
      return JSON.stringify({ findings });
    },
  });

  return new Agent({
    name: 'Verification Agent',
    instructions: 'Verify the supplied synthetic account case using the comparison tool. Report only findings returned by the tool and cite its evidence. Keep all outcomes subject to human review; never approve or reject credit or claim official external checks.',
    outputType: VerificationOutputSchema,
    tools: [compareCaseFields],
  });
}

export async function analyzeWithAgents(caseInput: unknown): Promise<AnalyzeResponse> {
  const customerCase = SyntheticCaseSchema.parse(caseInput);
  if (!process.env.OPENAI_API_KEY) throw new Error('MODEL_UNAVAILABLE: OPENAI_API_KEY no está configurada');
  const caseJson = JSON.stringify(customerCase);
  const trace: AgentTraceEntry[] = [];
  const kycTools: string[] = [];
  const kyc = await run(createKycAgent(kycTools), `Revisa este caso sintético de apertura de cuenta y prepara verificaciones: ${caseJson}`);
  if (!kyc.finalOutput) throw new Error('KYC Agent no produjo salida estructurada');
  if (!kycTools.includes('list_synthetic_documents')) throw new Error('KYC Agent no ejecutó su herramienta de documentos');
  trace.push({ agent: 'KYC', action: 'Revisión de expediente con OpenAI Agents SDK', result: kyc.finalOutput.summary, ...(kycTools.length ? { toolId: kycTools[0] } : {}), timestamp: new Date().toISOString() });

  const verificationTools: string[] = [];
  const verification = await run(createVerificationAgent(verificationTools), `Verifica este caso sintético. KYC identificó: ${JSON.stringify(kyc.finalOutput)}. Caso: ${caseJson}`);
  if (!verification.finalOutput) throw new Error('Verification Agent no produjo salida estructurada');
  if (!verificationTools.includes('compare_synthetic_case_fields')) throw new Error('Verification Agent no ejecutó su herramienta de comparación');
  trace.push({ agent: 'VERIFICATION', action: 'Contraste de evidencia con OpenAI Agents SDK', result: verification.finalOutput.summary, ...(verificationTools.length ? { toolId: verificationTools[0] } : {}), timestamp: new Date().toISOString() });

  const findings = verification.finalOutput.findings;
  const status = findings.some((finding) => finding.code === 'ADDRESS_MISSING')
    ? 'PENDING_INFORMATION'
    : findings.length > 0 ? 'REQUIRES_REVIEW' : 'READY_FOR_HUMAN_REVIEW';
  return {
    caseId: customerCase.id,
    runId: crypto.randomUUID(),
    status,
    findings,
    agentTrace: trace,
    productGuidance: [],
    executionMode: 'real',
    simulated: false,
  };
}

export function validateSyntheticCase(input: unknown): SyntheticCase {
  return SyntheticCaseSchema.parse(input);
}
