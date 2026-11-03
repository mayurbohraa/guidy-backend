require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("node:dns");
const {readFile} = require("node:fs/promises");
const {join,basename} = require("node:path");
const Resource = require("../dist/modules/resources/resources.model").default;
const {storeFile,removeFile} = require("../dist/helpers/file.storage");
const {inspectFile,scanFile} = require("../dist/helpers/file.validation");
(async()=>{
 const counts={migrated:0,missing:0,rejected:0};
 try {
  if(!process.env.DB_URL) throw new Error("Set DB_URL");
  mongoose.set("strictQuery",true);dns.setServers(["8.8.8.8","1.1.1.1"]);dns.setDefaultResultOrder("ipv4first");
  await mongoose.connect(process.env.DB_URL,{serverSelectionTimeoutMS:10000,family:4});
  for await(const resource of Resource.find({fileId:{$exists:false},isDeleted:false}).cursor()) {
   const filename=basename(resource.resourceURL.replace(/\\/g,"/"));
   let buffer;
   try {buffer=await readFile(join(process.cwd(),"uploads",filename));}
   catch {if(/^guidy-demo-resource-(?:[1-9]|1[0-4])\.txt$/.test(filename)) {try {buffer=await readFile(join(__dirname,"demo-resources",filename));}catch{}}}
   if(!buffer){counts.missing++;continue;}
   let mimeType,scanStatus;
   try{mimeType=inspectFile(buffer,resource.resourceName);scanStatus=await scanFile(buffer);}catch{counts.rejected++;continue;}
   const id=await storeFile(buffer,resource.resourceName,mimeType);
   try {const result=await Resource.updateOne({_id:resource._id,fileId:{$exists:false}},{$set:{fileId:id,mimeType,scanStatus,fileSize:buffer.length}});if(!result.modifiedCount) await removeFile(id);else counts.migrated++;}
   catch(error){await removeFile(id).catch(()=>{});throw error;}
  }
  console.log(JSON.stringify(counts));
 }catch(error){console.error("Upload migration failed:",error.code||error.name);process.exitCode=1;}
 finally{await mongoose.disconnect();}
})();
