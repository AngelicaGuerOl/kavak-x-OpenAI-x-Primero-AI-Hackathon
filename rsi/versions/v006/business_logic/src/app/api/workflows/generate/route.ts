import {z} from 'zod';import {generate} from '@/server/core';
export async function POST(request:Request){const parsed=z.object({suiteId:z.literal('auto-financing-v1'),memoryVersion:z.string().optional()}).safeParse(await request.json().catch(()=>null));return parsed.success?Response.json(generate()):Response.json({error:{code:'INVALID_REQUEST',message:'Suite inválida'}},{status:400})}
