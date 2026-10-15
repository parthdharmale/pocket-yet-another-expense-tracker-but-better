import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readRecording,transcribeRecording,MAX_AUDIO_BYTES,TranscriptionError} from '../lib/ai/transcription.ts';
test('recordings accept iPhone raw audio and reject empty, unsupported and oversized bodies',async()=>{
 const file=await readRecording(new Request('https://pocket.test',{method:'POST',headers:{'Content-Type':'audio/mp4'},body:new Uint8Array([1,2,3])}));
 assert.equal(file.name,'recording.m4a');assert.equal(file.size,3);
 for(const [headers,body,status] of [[{'Content-Type':'application/json'},'{}',415],[{'Content-Type':'audio/mp4'},'',400],[{'Content-Type':'audio/mp4','Content-Length':String(MAX_AUDIO_BYTES+1)},'x',413]] as const){await assert.rejects(readRecording(new Request('https://pocket.test',{method:'POST',headers,body})),(e:unknown)=>e instanceof TranscriptionError&&e.status===status);}
 // Also enforce the bound when Content-Length is absent/untrusted.
 await assert.rejects(readRecording(new Request('https://pocket.test',{method:'POST',headers:{'Content-Type':'audio/mp4'},body:new Uint8Array(MAX_AUDIO_BYTES+1)})),(e:unknown)=>e instanceof TranscriptionError&&e.status===413);
});
test('transcription sends multipart audio server-side, detects language and handles provider failures',async(t)=>{
 const previous=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test-key';
 t.after(()=>{if(previous===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previous;});
 const file=new File(['audio'],'recording.m4a',{type:'audio/mp4'});
 const mocked=t.mock.method(globalThis,'fetch',async(url:unknown,options?:RequestInit)=>{
  assert.equal(url,'https://api.openai.com/v1/audio/transcriptions');
  const body=options?.body as FormData;assert.equal(body.get('model'),'gpt-4o-mini-transcribe');assert.equal(body.has('language'),false);assert.equal((body.get('file') as File).name,'recording.m4a');
  assert.equal(new Headers(options?.headers).has('Content-Type'),false);
  return Response.json({text:'  Swiggy 450 HDFC  '});
 });
 assert.equal(await transcribeRecording(file),'Swiggy 450 HDFC');
 mocked.mock.mockImplementation(async()=>Response.json({text:' '}));
 await assert.rejects(transcribeRecording(file),(e:unknown)=>e instanceof TranscriptionError&&e.status===422);
 mocked.mock.mockImplementation(async()=>new Response('',{status:429}));
 await assert.rejects(transcribeRecording(file),(e:unknown)=>e instanceof TranscriptionError&&e.status===429);
 mocked.mock.mockImplementation(async()=>new Response('',{status:400}));
 await assert.rejects(transcribeRecording(file),(e:unknown)=>e instanceof TranscriptionError&&e.status===422);
 mocked.mock.mockImplementation(async()=>new Response('',{status:401}));
 await assert.rejects(transcribeRecording(file),(e:unknown)=>e instanceof TranscriptionError&&e.status===503);
});
