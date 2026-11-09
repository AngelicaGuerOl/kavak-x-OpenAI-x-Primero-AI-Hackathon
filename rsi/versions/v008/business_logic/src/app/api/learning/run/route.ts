import {z} from 'zod';import {learn} from '@/server/core';
export async function POST(request:Request){const parsed=z.object({suiteId:z.literal('onboarding-v1')}).safeParse(await request.json().catch(()=>null));return parsed.success?Response.json(learn()):Response.json({error:{code:'INVALID_REQUEST',message:'Suite inválida'}},{status:400})}
