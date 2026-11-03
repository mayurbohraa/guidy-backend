const {test}=require("node:test");
const assert=require("node:assert/strict");
const {createServer}=require("node:net");
const {inspectFile,scanFile}=require("../dist/helpers/file.validation");
const {completeRecovery}=require("../dist/modules/authentication/recovery.controller");
const users=require("../dist/modules/authentication/user.model").default;

test("content checks reject renamed binaries, truncated documents, and invalid text",()=>{
 assert.equal(inspectFile(Buffer.from("Study notes"),"notes.txt"),"text/plain");
 for(const [content,name] of [["MZ\0payload","notes.txt"],["not a PDF","notes.pdf"],["PKinvalid","notes.docx"]]) assert.throws(()=>inspectFile(Buffer.from(content),name));
});

test("required malware scanning fails closed when no scanner is configured",async(t)=>{
 const previous={host:process.env.CLAMAV_HOST,required:process.env.REQUIRE_MALWARE_SCAN};
 delete process.env.CLAMAV_HOST;process.env.REQUIRE_MALWARE_SCAN="true";
 try{await assert.rejects(scanFile(Buffer.from("notes")),{status:503});}
 finally{if(previous.host===undefined)delete process.env.CLAMAV_HOST;else process.env.CLAMAV_HOST=previous.host;if(previous.required===undefined)delete process.env.REQUIRE_MALWARE_SCAN;else process.env.REQUIRE_MALWARE_SCAN=previous.required;}
});

test("scanner transport streams content and rejects a positive malware result",async()=>{
 const server=createServer(socket=>{let bytes=Buffer.alloc(0);socket.on("data",data=>{bytes=Buffer.concat([bytes,data]);if(bytes.length>=10 && bytes.subarray(-4).equals(Buffer.alloc(4)))socket.end("stream: Test-Signature FOUND\0");});});
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const oldHost=process.env.CLAMAV_HOST,oldPort=process.env.CLAMAV_PORT;
 process.env.CLAMAV_HOST="127.0.0.1";process.env.CLAMAV_PORT=String(server.address().port);
 try{await assert.rejects(scanFile(Buffer.from("sample contents")),{status:400});}
 finally{if(oldHost===undefined)delete process.env.CLAMAV_HOST;else process.env.CLAMAV_HOST=oldHost;if(oldPort===undefined)delete process.env.CLAMAV_PORT;else process.env.CLAMAV_PORT=oldPort;await new Promise(resolve=>server.close(resolve));}
});

test("invalid recovery tokens and weak passwords cannot reach a password write",async(t)=>{
 t.mock.method(users,"findOneAndUpdate",async()=>assert.fail("No write expected"));
 await completeRecovery({body:{token:"invalid",password:"weak"}},{status(code){assert.equal(code,400);return this;},json(body){assert.ok(body.message);}});
});
