import type {LearningRunResponse,GenerateWorkflowResponse} from '@/contracts/api';
import type {WorkflowDefinition,ApprovedToolId} from '@/contracts/workflow';
const now=()=>new Date().toISOString();
export { cases } from '@/server/cases';
export { analyze } from '@/server/simulation';
import { cases } from '@/server/cases';
import { analyze } from '@/server/simulation';
import initialExpectations from '@/server/evaluation/onboarding-expectations.json';
const expected: Record<string, string[]> = initialExpectations;
export function learn():LearningRunResponse {const results=cases.map(c=>({id:c.id,actual:analyze(c.id, '2026-11-09')!.findings.map(f=>f.code)}));const failures=results.filter(r=>JSON.stringify(r.actual.sort())!==JSON.stringify(expected[r.id].sort())).map(r=>({caseId:r.id,expectedCodes:expected[r.id],actualCodes:r.actual,explanation:'Diferencia con expectativa independiente'}));return {runId:crypto.randomUUID(),suiteId:'onboarding-v1',baseline:{passed:cases.length-failures.length,total:cases.length},failures,proposals:[],activeMemoryVersion:'none',agentTrace:[{agent:'ORCHESTRATOR',action:'Evaluación local; Reflection no ejecutado',result:failures.length?`${failures.length} fallos; requiere propuesta`:'Sin fallos observados; no se inventa aprendizaje',timestamp:now()}],simulated:true}}
const tools:ApprovedToolId[]=['check_document_presence','check_document_expiry','compare_shared_fields'];
const workflow=(id:string,memoryVersion:string|null):WorkflowDefinition=>({id,version:'1',kind:'AUTO_FINANCING_PREPARATION',title:'Preparación de financiamiento automotriz',memoryVersion,steps:tools.map((toolId,i)=>({id:`step-${i+1}`,toolId,description:toolId,dependsOn:i?[`step-${i}`]:[]}))});
export function generate():GenerateWorkflowResponse {const baseline=workflow('auto-baseline',null),learned=workflow('auto-learned',null);const evaluate=(w:WorkflowDefinition)=>({workflow:w,metric:{passed:0,total:0},caseResults:[]});return {runId:crypto.randomUUID(),suiteId:'auto-financing-v1',baseline:evaluate(baseline),learned:evaluate(learned),agentTrace:[{agent:'BUILDER',action:'Generar proceso',result:'Sin memoria aceptada ni suite B; comparación pendiente',timestamp:now()}],simulated:true}}
