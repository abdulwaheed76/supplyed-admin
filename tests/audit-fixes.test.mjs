import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import {createRequire} from 'node:module'
import {test} from 'node:test'
import ts from 'typescript'
const runtimeRequire=createRequire(import.meta.url)
function harness(fetch, overrides={}) {
 const cache=new Map(), jar=new Map(), deadlines=[]
 function load(filename) {
  const full=path.resolve(filename); if(cache.has(full)) return cache.get(full).exports
  const loadedModule={exports:{}};cache.set(full,loadedModule)
  const code=ts.transpileModule(fs.readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText
  function localRequire(name) {
   if(name in overrides)return overrides[name]
   if(name==='server-only')return {}
   if(name==='next/headers')return {cookies:async()=>({get:key=>jar.get(key),set:(key,value,options)=>jar.set(key,{value,...options}),delete:({name})=>jar.delete(name)})}
   if(name==='@/lib/auth/session')return {getAdminAccessToken:async()=>({ok:true,accessToken:'local'})}
   if(name==='@/lib/auth/config')return {getAuthConfig:()=>({}),createAuthApiUrl:(_,p)=>new URL(p,'https://backend.test/api/')}
   if(name.startsWith('@/'))return load(name.slice(2)+'.ts')
   if(name.startsWith('.'))return load(path.resolve(path.dirname(full),name)+'.ts')
   return runtimeRequire(name)
  }
  const timeout={timeout:ms=>{deadlines.push(ms);return AbortSignal.timeout(20)},any:signals=>AbortSignal.any(signals)}
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`,{fetch,Response,Request,Headers,URL,ReadableStream,TextEncoder,Error,DOMException,AbortSignal:timeout,console,process:{env:{NODE_ENV:'production'}}})(localRequire,loadedModule,loadedModule.exports)
  return loadedModule.exports
 }
 return {load,jar,deadlines}
}
const envelope=data=>new Response(JSON.stringify({success:true,message:'OK',data}))
test('admin 2FA challenge remains HttpOnly until verification; non-admins cannot enter',async()=>{
 const calls=[]; const replies=[envelope({twoFactorRequired:true,twoFactorToken:'private-challenge'}),envelope({user:{id:'one',email:'one@example.test',role:'ADMIN'},accessToken:'access',refreshToken:'refresh',accessTokenExpiresInSeconds:900,refreshTokenExpiresInSeconds:3600})]
 const h=harness(async(url,init)=>{calls.push({url:String(url),init});return replies.shift()})
 const {authenticateAdmin}=h.load('lib/auth/authenticate.ts')
 assert.equal((await authenticateAdmin({email:'one@example.test',password:'StrongPassword123!'})).code,'two_factor_required')
 assert.equal(h.jar.get('supplyed_admin_2fa').httpOnly,true);assert.equal(h.jar.get('supplyed_admin_2fa').path,'/api/auth')
 assert.equal((await authenticateAdmin({code:'123456'})).ok,true);assert.match(calls[1].url,/auth\/2fa\/verify$/);assert.equal(calls[1].init.headers.Authorization,'Bearer private-challenge');assert.equal(h.jar.size,0)
 const denied=harness(async()=>envelope({user:{id:'two',email:'two@example.test',role:'INSTRUCTOR'},accessToken:'a',refreshToken:'r',accessTokenExpiresInSeconds:900,refreshTokenExpiresInSeconds:3600}))
 assert.equal((await denied.load('lib/auth/authenticate.ts').authenticateAdmin({email:'two@example.test',password:'StrongPassword123!'})).code,'not_admin')
})
test('admin API requests abort hanging upstream calls at a bounded deadline',async()=>{
 const keepAlive=setTimeout(()=>{},1000)
 try {
  const h=harness((_url,init)=>new Promise((_,reject)=>init.signal.addEventListener('abort',()=>reject(init.signal.reason))))
  const result=await h.load('lib/api/admin-api-client.ts').adminApiRequest({path:'users',schema:runtimeRequire('zod').z.unknown()})
  assert.equal(result.ok,false);assert.equal(result.status,504);assert.deepEqual(h.deadlines,[15000])
 } finally {clearTimeout(keepAlive)}
})
test('Word previews cancel streams without converters; downloads preserve bytes',async()=>{
 for(const type of ['application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']) {
  let canceled=false
  const bytes=new TextEncoder().encode('not parsed on the server')
  const h=harness(async()=>new Response(new ReadableStream({start(c){c.enqueue(bytes)},cancel(){canceled=true}}),{headers:{'content-type':type}}),{'@/lib/documents/get-document-download-url':{getDocumentDownloadUrl:async()=>({ok:true,downloadUrl:'https://storage.test/file',contentType:type,originalName:'document.docx'})},mammoth:{get convertToHtml(){throw Error('Converter must not load')}},'word-extractor':class {constructor(){throw Error('Parser must not load')}}})
  const response=await h.load('app/api/documents/[id]/content/route.ts').GET(new Request('https://admin.test/api/documents/one/content'),{params:Promise.resolve({id:'one'})})
  assert.equal(response.status,415);assert.equal(canceled,true);assert.match(await response.text(),/Download this Word document/);assert.match(response.headers.get('content-security-policy'),/sandbox/)
 }
 const bytes=new Uint8Array([80,75,3,4,10,20]);const h=harness(async()=>new Response(bytes,{headers:{'content-type':'application/msword'}}),{'@/lib/documents/get-document-download-url':{getDocumentDownloadUrl:async()=>({ok:true,downloadUrl:'https://storage.test/file',originalName:'document.doc'})}})
 const response=await h.load('app/api/documents/[id]/content/route.ts').GET(new Request('https://admin.test/api/documents/one/content?download=1'),{params:Promise.resolve({id:'one'})})
 assert.equal(response.status,200);assert.match(response.headers.get('content-disposition'),/attachment/);assert.deepEqual(new Uint8Array(await response.arrayBuffer()),bytes)
})
