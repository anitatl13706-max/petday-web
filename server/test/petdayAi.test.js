import test from 'node:test';
import assert from 'node:assert/strict';
import {getAiReply,sanitizeHistory,staticAnswer,providerConfig,redactPrivateText} from '../src/petdayAi.mjs';
test('guide mode without API key',async()=>{const r=await getAiReply({message:'Daycare cho mèo?',apiKey:''});assert.equal(r.mode,'guide');assert.match(r.reply,/chó/);});
test('trim and sanitize conversation',()=>{assert.deepEqual(sanitizeHistory([{role:'system',content:'x'},{role:'user',content:' ok '}]),[{role:'user',content:'ok'}]);});
test('API success extracts response text',async()=>{const fake=async(_url,init)=>{assert.match(init.headers.Authorization,/Bearer secret/);assert.equal(JSON.parse(init.body).store,false);return {ok:true,json:async()=>({output:[{content:[{type:'output_text',text:'Xin chào PetDay!'}]}]})}};const r=await getAiReply({message:'Xin chào',apiKey:'secret',provider:'openai',fetcher:fake});assert.equal(r.mode,'ai');assert.equal(r.reply,'Xin chào PetDay!');});
test('API error falls back and never leaks secret',async()=>{const r=await getAiReply({message:'Đặt lịch?',apiKey:'secret',fetcher:async()=>({ok:false,status:401})});assert.equal(r.mode,'guide');assert.equal(r.degraded,true);assert.doesNotMatch(r.reply,/secret/);});
test('fallback on transport failure',async()=>{const r=await getAiReply({message:'Spa?',apiKey:'secret',fetcher:async()=>{throw Error('network')}});assert.equal(r.mode,'guide');});
test('refund answer does not claim money transferred',()=>{assert.match(staticAnswer('hoàn tiền'),/quy trình/);});

test('Groq chat completions sends system guide and returns AI text',async()=>{
 const fake=async(url,init)=>{
  assert.equal(url,'https://api.groq.com/openai/v1/chat/completions');
  assert.equal(init.headers.Authorization,'Bearer secret');
  const body=JSON.parse(init.body);
  assert.equal(body.model,'openai/gpt-oss-20b');
  assert.equal(body.messages[0].role,'system');
  assert.equal(body.messages.at(-1).content,'Daycare có nhận mèo?');
  return {ok:true,json:async()=>({choices:[{message:{role:'assistant',content:'Daycare chỉ nhận chó trên một tuổi.'}}]})};
 };
 const r=await getAiReply({message:'Daycare có nhận mèo?',apiKey:'secret',provider:'groq',fetcher:fake});
 assert.equal(r.mode,'ai');assert.match(r.reply,/Daycare/);
});
test('Groq errors degrade to guides without exposing keys',async()=>{
 const r=await getAiReply({message:'Hoàn tiền?',provider:'groq',apiKey:'secret',fetcher:async()=>({ok:false,status:429})});
 assert.equal(r.mode,'guide');assert.equal(r.degraded,true);assert.doesNotMatch(r.reply,/secret/);
});
test('provider selection prefers Groq and supports legacy OpenAI',()=>{
 assert.deepEqual(providerConfig({GROQ_API_KEY:'g',OPENAI_API_KEY:'o'}),{provider:'groq',apiKey:'g',model:'openai/gpt-oss-20b'});
 assert.equal(providerConfig({PETDAY_AI_PROVIDER:'openai',GROQ_API_KEY:'g',OPENAI_API_KEY:'o'}).provider,'openai');
 assert.equal(providerConfig({PETDAY_AI_PROVIDER:'groq',OPENAI_API_KEY:'o'}).apiKey,'');
});
test('redacts email, phone and secret before sending to provider',async()=>{
 const fake=async(url,init)=>{const joined=JSON.stringify(JSON.parse(init.body).messages);assert.doesNotMatch(joined,/private@example.com|0912345678|gsk_abcdefghijklmnopqrstuvwxyz/);return {ok:true,json:async()=>({choices:[{message:{content:'Được ạ!'}}]})}};
 const r=await getAiReply({message:'Liên hệ private@example.com 0912345678 gsk_abcdefghijklmnopqrstuvwxyz',provider:'groq',apiKey:'secret',fetcher:fake});
 assert.equal(r.mode,'ai');assert.match(redactPrivateText('private@example.com'),/đã ẩn/);
});


test('GPT-OSS request uses low reasoning with sufficient completion budget',async()=>{
 const fake=async (_url,init)=>{
  const body=JSON.parse(init.body);
  assert.equal(body.model,'openai/gpt-oss-20b');
  assert.equal(body.reasoning_effort,'low');
  assert.equal(body.include_reasoning,false);
  assert.ok(body.max_completion_tokens>=1000);
  assert.equal(body.temperature,undefined);
  assert.match(body.messages[0].content,/không tự tạo bảng/i);
  return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'Nên báo nhân viên về nỗi sợ máy sấy.'}}]})};
 };
 const r=await getAiReply({message:'Poodle sợ máy sấy',provider:'groq',apiKey:'secret',model:'openai/gpt-oss-20b',fetcher:fake});
 assert.equal(r.mode,'ai');
 assert.match(r.reply,/máy sấy/);
});
test('Empty GPT-OSS content degrades safely',async()=>{
 const r=await getAiReply({message:'Spa?',provider:'groq',apiKey:'secret',model:'openai/gpt-oss-20b',fetcher:async()=>({ok:true,json:async()=>({choices:[{finish_reason:'length',message:{content:''}}]})})});
 assert.equal(r.mode,'guide'); assert.equal(r.degraded,true);
});

// V6.97: keep the initial pet description after six intervening user/assistant turns.
test('conversation context retains early pet facts after six questions',async()=>{
 const history=[{role:'user',content:'Poodle 2 tuổi, 4kg, sợ máy sấy.'}];
 for(let i=0;i<6;i++){history.push({role:'assistant',content:`Trả lời số ${i}`},{role:'user',content:`Câu hỏi số ${i}`});}
 assert.equal(history.length,13);
 const fake=async(_url,init)=>{
  const body=JSON.parse(init.body);
  assert.ok(body.messages.some(m=>m.role==='user'&&m.content.includes('Poodle 2 tuổi')),'initial pet details must be included');
  assert.equal(body.messages.at(-1).content,'Hãy nhắc lại thông tin chó lúc đầu');
  return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'Poodle, 2 tuổi, 4 kg, sợ tiếng máy sấy.'}}]})};
 };
 const result=await getAiReply({message:'Hãy nhắc lại thông tin chó lúc đầu',history,apiKey:'secret',model:'openai/gpt-oss-20b',provider:'groq',fetcher:fake});
 assert.equal(result.mode,'ai');
 assert.match(result.reply,/Poodle/);
});
test('conversation history is bounded to 24 messages',()=>{
 const history=Array.from({length:30},(_,i)=>({role:i%2?'assistant':'user',content:'msg '+i}));
 const selected=sanitizeHistory(history);
 assert.equal(selected.length,24);
 assert.equal(selected[0].content,'msg 6');
});
