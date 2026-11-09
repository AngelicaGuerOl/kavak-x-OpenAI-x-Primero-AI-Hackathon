'use client';
import {useState} from 'react';
import type {AnalyzeResponse,LearningRunResponse,GenerateWorkflowResponse} from '@/contracts/api';
export default function Home(){
 const [result,setResult]=useState<unknown>(null); const [loading,setLoading]=useState(false); const [error,setError]=useState('');
 async function run(path:string,body:unknown){setLoading(true);setError('');try{const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw new Error(data.error?.message||'Error');setResult(data)}catch(e){setError(String(e))}finally{setLoading(false)}}
 return <main style={{maxWidth:900,margin:'3rem auto',fontFamily:'sans-serif',lineHeight:1.5}}><h1>SRI Finance</h1><p>Expedientes sintéticos · revisión humana · aprendizaje RSI</p><div style={{display:'flex',gap:12,flexWrap:'wrap'}}><button disabled={loading} onClick={()=>run('/api/cases/analyze',{caseId:'case-001'})}>Analizar expediente</button><button disabled={loading} onClick={()=>run('/api/learning/run',{suiteId:'onboarding-v1'})}>Ejecutar aprendizaje</button><button disabled={loading} onClick={()=>run('/api/workflows/generate',{suiteId:'auto-financing-v1'})}>Generar proceso</button></div>{loading&&<p>Ejecutando agentes…</p>}{error&&<p role="alert">{error}</p>}{result!==null&&<pre style={{whiteSpace:'pre-wrap',background:'#eef2f5',padding:20}}>{JSON.stringify(result as AnalyzeResponse|LearningRunResponse|GenerateWorkflowResponse,null,2)}</pre>}</main>
}
