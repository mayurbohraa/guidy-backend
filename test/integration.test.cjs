require("dotenv").config();
const {test}=require("node:test");
const assert=require("node:assert/strict");
const mongoose=require("mongoose");
const dns=require("node:dns");
const {randomBytes}=require("node:crypto");

// Never use the configured application's database name, even when sharing its MongoDB cluster.
const databaseName="guidy_test_"+randomBytes(10).toString("hex");
test("isolated database workflows",{timeout:240000},async(t)=>{
 const uri=process.env.TEST_DB_URL||process.env.DB_URL;
 assert.ok(uri,"Set TEST_DB_URL or DB_URL before running integration tests");
 process.env.secret_key=process.env.secret_key||randomBytes(32).toString("hex");
 process.env.FRONTEND_URL="http://localhost:3000";
 delete process.env.CLAMAV_HOST;delete process.env.REQUIRE_MALWARE_SCAN;
 mongoose.set("strictQuery",true);dns.setServers(["8.8.8.8","1.1.1.1"]);dns.setDefaultResultOrder("ipv4first");
 let server;
 try{
  await mongoose.connect(uri,{dbName:databaseName,serverSelectionTimeoutMS:15000,family:4});
  assert.equal(mongoose.connection.db.databaseName,databaseName);
  const app=require("../dist/app").default;
  const User=require("../dist/modules/authentication/user.model").default;
  const Course=require("../dist/modules/courses/courses.model").default;
  const Grade=require("../dist/modules/grades/grades.model").default;
  const Resource=require("../dist/modules/resources/resources.model").default;
  const Notification=require("../dist/modules/notifications/notification.model").default;
  const Recovery=require("../dist/modules/authentication/recovery.model").default;
  const {hashPassword}=require("../dist/modules/authentication/authentication.service");
  await Promise.all(Object.values(mongoose.models).map(model=>model.init()));
  server=await new Promise(resolve=>{const server=app.listen(0,"127.0.0.1",()=>resolve(server));});
  const base="http://127.0.0.1:"+server.address().port+"/api/v1";
  async function request(route,{token,body,method=body?"POST":"GET",status=200}={}){
   const multipart=body instanceof FormData;
   const response=await fetch(base+route,{method,headers:{...(token?{Authorization:"Bearer "+token}:{}),...(body&&!multipart?{"Content-Type":"application/json"}:{})},body:body?multipart?body:JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
   const text=await response.text();assert.equal(response.status,status,route+" returned "+response.status+": "+text.slice(0,180));
   return response.headers.get("content-type")?.includes("json")?JSON.parse(text):text;
  }
  const password="FixturePass@123";
  const tokens={},accounts={};
  for(const role of ["admin","contributor","student","other"]){accounts[role]=await User.create({firstName:"Test",lastName:"Account",email:role+"@qu.edu.qa",mobileNumber:"+97455123456",password:await hashPassword(password),role:role==="other"?"student":role});tokens[role]=(await request("/login",{body:{email:role+"@qu.edu.qa",password}})).data.token;}
  const courses=await Course.create(Array.from({length:5},(_,index)=>({name:"Integration course "+index,course_code:"TEST"+index,year:1,term:"fall",creditHour:3})));
  const student=tokens.student,admin=tokens.admin,contributor=tokens.contributor;
  await t.test("course search, role metadata, and settings come from the API",async()=>{
   const found=await request("/course/get-courses?search=Integration%20course%201",{token:student});assert.equal(found.data.length,1);
   assert.equal((await request("/course/"+courses[0]._id,{token:student})).data.name,"Integration course 0");
   assert.equal((await request("/role",{token:student})).data.find(role=>role.role==="admin").publicSignup,false);
   assert.equal((await request("/settings",{token:student})).data.fileStorage,"mongodb-gridfs");
  });
  await t.test("user directory is administrator-only and exposes only student/contributor contact fields",async()=>{
   await request("/users?role=student",{token:student,status:403});
   const students=await request("/users?role=student&limit=1",{token:admin});assert.equal(students.data.length,1);assert.equal(students.pagination.total,2);assert.equal(students.pagination.hasNext,true);
   assert.deepEqual(Object.keys(students.data[0]).sort(),["_id","email","firstName","lastName","mobileNumber","role"].sort());
   const contributors=await request("/users?role=contributor&search=contributor",{token:admin});assert.equal(contributors.data.length,1);assert.equal(contributors.data[0].role,"contributor");
   await request("/users?role=admin",{token:admin,status:400});
  });
  await t.test("registration and grade writes validate ownership, range, and registered courses",async()=>{
   await request("/registration/register",{token:student,body:{courseIds:courses.slice(0,4).map(course=>String(course._id))}});
   const scores={course:String(courses[0]._id),quiz1:0,quiz2:17,midterm:16,project:18,final:19};
   await request("/grades",{token:student,body:{...scores,user:String(accounts.other._id),year:4,term:"spring"}});
   await request("/grades",{token:student,body:{...scores,quiz1:12}});
   assert.equal(await Grade.countDocuments({user:accounts.student._id,course:courses[0]._id}),1);
   const grade=await Grade.findOne({user:accounts.student._id});assert.equal(grade.year,1);assert.equal(grade.term,"fall");assert.equal(grade.quiz1,12);
   await request("/grades",{token:student,body:{...scores,quiz1:21},status:400});
   await request("/grades",{token:student,body:{...scores,course:String(courses[4]._id)},status:400});
   await request("/grades",{token:contributor,body:scores,status:403});
  });
  await t.test("personal task deletion and notebook updates cannot cross account boundaries",async()=>{
   const task=(await request("/tasks/create-task",{token:student,body:{taskDescription:"Fixture task"}})).data;
   await request("/tasks/delete-task/"+task._id,{token:tokens.other,method:"DELETE",status:404});
   await request("/tasks/delete-task/"+task._id,{token:student,method:"DELETE"});
   const notebook=(await request("/notebook/addnotebook",{token:student,body:{subject:String(courses[0]._id),year:"1",term:"fall",notebookTitle:"Fixture notes",notebookContent:"Study content"}})).data;
   await request("/notebook/updatenotebook/"+notebook._id,{token:tokens.other,method:"PUT",body:{notebookContent:"Changed"},status:404});
   await request("/notebook/deletenotebook/"+notebook._id,{token:student,method:"DELETE"});
  });
  let resource;
  const uploadBody=(name="study.txt",contents="Integration study notes")=>{const body=new FormData();body.append("year","1");body.append("term","fall");body.append("subject",String(courses[0]._id));body.append("file",new Blob([contents]),name);return body;};
  await t.test("uploads persist in GridFS and downloads enforce approval",async()=>{
   resource=(await request("/resources",{token:contributor,method:"PUT",body:uploadBody()})).data;
   assert.ok(resource.fileId);
   await request("/resources/mine", {token:student,status:403});
   const ownResources = (await request("/resources/mine", {token:contributor})).data;
   assert.ok(ownResources.some(item => item._id === resource._id && item.status === "pending"));
   assert.equal(await request("/resources/"+resource._id+"/download", {token:contributor}), "Integration study notes");
   const withdrawn = (await request("/resources", {token:contributor,method:"PUT",body:uploadBody("withdraw.txt")})).data;
   await request("/resources/mine/"+withdrawn._id, {token:student,method:"DELETE",status:403});
   await request("/resources/mine/"+withdrawn._id, {token:contributor,method:"DELETE"});
   await request("/resources/"+withdrawn._id+"/download", {token:contributor,status:404});
   assert.ok(ownResources.every(item => item.fileId === undefined && item.notificationJobs === undefined));
   assert.equal(await mongoose.connection.db.collection("resourceFiles.files").countDocuments({_id:new mongoose.Types.ObjectId(resource.fileId)}),1);
   await request("/resources/"+resource._id+"/download",{token:student,status:404});
   assert.equal(await request("/resources/"+resource._id+"/download",{token:admin}),"Integration study notes");
   await request("/resources/update/"+resource._id,{token:student,body:{status:"accepted"},status:403});
   await request("/resources/update/"+resource._id,{token:admin,body:{status:"accepted"}});
   assert.equal(await request("/resources/"+resource._id+"/download",{token:student}),"Integration study notes");
   await request("/resources",{token:contributor,method:"PUT",body:uploadBody("fake.pdf","not a PDF"),status:400});
  });
  await t.test("failed notification delivery remains queued and retries without duplicates",async()=>{
   const failure=t.mock.method(Notification,"bulkWrite",async()=>{throw new Error("Simulated delivery failure");});
   const failed=(await request("/resources",{token:contributor,method:"PUT",body:uploadBody("retry.txt")})).data;
   t.mock.restoreAll();
   const stored=await Resource.findById(failed._id);assert.equal(stored.notificationJobs[0].attempts,1);assert.equal(stored.notificationJobs[0].deliveredAt,null);
   await Resource.updateOne({_id:stored._id},{$set:{"notificationJobs.0.nextAttemptAt":new Date(0)}});
   await request("/notifications/retry",{token:admin,method:"POST",body:{}});
   const count=await Notification.countDocuments();
   await request("/notifications/retry",{token:admin,method:"POST",body:{}});
   assert.equal(await Notification.countDocuments(),count);
   assert.ok((await Resource.findById(stored._id)).notificationJobs[0].deliveredAt);
   await request("/notifications/retry",{token:student,method:"POST",body:{},status:403});
  });
  await t.test("workspace search returns only accessible records and real destinations",async()=>{
   const Task=require("../dist/modules/tasks/tasks.model").default;
   const own=await Task.create({userId:accounts.student._id,taskDescription:"Private search marker",checked:false});
   const other=await Task.create({userId:accounts.other._id,taskDescription:"Private search marker",checked:false});
   const found=await request("/search?q=Private%20search",{token:student});
   assert.ok(found.data.some(item=>item.id==="task:"+own._id&&item.href.endsWith("?task="+own._id)));
   assert.ok(!found.data.some(item=>item.id==="task:"+other._id));
   assert.deepEqual((await request("/search?q=%5B",{token:student})).data,[]);
   const directory=await request("/search?q=contributor%40",{token:admin});assert.ok(directory.data.some(item=>item.href.startsWith("/admindashboard/users?role=contributor")));
  });
  await t.test("recovery request throttling is persisted without creating unknown accounts",async()=>{
   for(let index=0;index<5;index++)await request("/forgot-password",{body:{email:"ratefixture@qu.edu.qa"},status:202});
   await request("/forgot-password",{body:{email:"ratefixture@qu.edu.qa"},status:429});
   assert.equal(await User.countDocuments({email:"ratefixture@qu.edu.qa"}),0);
  });
  await t.test("recovery codes are private, rotate on reset, and approvals simulate delivery", async () => {
   const email = "student@qu.edu.qa";
   await request("/forgot-password", {body:{email},status:202});
   await request("/profile/recovery-code", {status:401});
   const reveal = await request("/profile/recovery-code", {token:student});
   const code = reveal.data.code;
   assert.match(code, /^[A-F0-9]{4}(?:-[A-F0-9]{4}){3}$/);
   await request("/account-recovery",{token:student,status:403});
   const recovery = (await request("/account-recovery",{token:admin})).data[0];
   const approval = await request("/account-recovery/"+recovery._id+"/approve",{token:admin,body:{identityVerified:true}});
   assert.ok(!JSON.stringify(approval).includes(code));
   const notice = await Notification.findOne({user:accounts.student._id,title:"Recovery request approved"});
   assert.match(notice.description,/simulated/);
   await request("/verify-recovery-code",{body:{email,code}});
   await request("/reset-password",{body:{email,code,password:"Replacement@123"}});
   await request("/reset-password",{body:{email,code,password:"Replacement@123"},status:400});
   await request("/profile",{token:student,status:401});
   await request("/login",{body:{email,password:"Replacement@123"}});
  });
  await t.test("profile password changes verify the old password and revoke previous sessions", async () => {
   const account = tokens.other;
   await request("/profile/password", {token: account, method:"PUT", body:{currentPassword:"incorrect",newPassword:"UpdatedPass@123"},status:400});
   await request("/profile/password", {token: account, method:"PUT", body:{currentPassword:password,newPassword:"UpdatedPass@123"}});
   await request("/profile", {token:account,status:401});
   const signedIn = await request("/login", {body:{email:"other@qu.edu.qa",password:"UpdatedPass@123"}});
   assert.ok(signedIn.data.token);
  });
  await t.test("soft deletion removes a resource from download access",async()=>{
   await request("/resources/delete/"+resource._id,{token:admin,method:"DELETE"});
   await request("/resources/"+resource._id+"/download",{token:admin,status:404});
  });
 }finally{
  if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  if(mongoose.connection.readyState===1){assert.equal(mongoose.connection.db.databaseName,databaseName);assert.match(databaseName,/^guidy_test_[a-f0-9]{20}$/);await mongoose.connection.dropDatabase();}
  await mongoose.disconnect();
 }
});
