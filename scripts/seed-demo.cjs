/* Repeatable showcase data: insert missing demo records and preserve existing edits. */
require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("node:dns");
const { createHash } = require("node:crypto");
const { mkdir, writeFile } = require("node:fs/promises");
const path = require("node:path");
const model = (name) => require("../dist/modules/" + name).default;
const User = model("authentication/user.model");
const Course = model("courses/courses.model");
const Task = model("tasks/tasks.model");
const Event = model("events/events.model");
const Grade = model("grades/grades.model");
const Notebook = model("notebook/notebook.model");
const Resource = model("resources/resources.model");
const Notification = model("notifications/notification.model");
const Registration = model("registration/registration.model");
const { uploadsDir } = require("../dist/helpers/uploads.dir");
const counts = {};
const id = (key) => new mongoose.Types.ObjectId(createHash("sha256").update("guidy-showcase-v1:" + key).digest("hex").slice(0,24));
async function insert(Model, key, values, filter = { _id: id(key) }) {
  const result = await Model.updateOne(filter, { $setOnInsert: { _id: id(key), ...values } }, { upsert: true, runValidators: true, timestamps: false });
  counts[Model.modelName] = (counts[Model.modelName] || 0) + result.upsertedCount;
  return Model.findOne(filter);
}
const curriculum = [
  [["Programming Fundamentals", "Calculus I", "Academic Writing", "Introduction to Computing"], ["Object-Oriented Programming", "Calculus II", "Discrete Mathematics", "Digital Logic"]],
  [["Data Structures", "Database Systems", "Computer Architecture", "Linear Algebra"], ["Algorithms", "Operating Systems", "Software Engineering", "Probability and Statistics"]],
  [["Web Development", "Computer Networks", "Human-Computer Interaction", "Systems Analysis"], ["Mobile Application Development", "Information Security", "Artificial Intelligence", "Software Testing"]],
  [["Cloud Computing", "Data Science", "Project Management", "Capstone Project I"], ["Distributed Systems", "Professional Ethics", "Entrepreneurship", "Capstone Project II"]],
];
async function main() {
  if (!process.env.DB_URL) throw new Error("Set DB_URL before seeding");
  mongoose.set("strictQuery", true);
  // Match the application's Atlas DNS configuration.
  dns.setServers(["8.8.8.8", "1.1.1.1"]); dns.setDefaultResultOrder("ipv4first");
  await mongoose.connect(process.env.DB_URL, { serverSelectionTimeoutMS: 10000, family: 4 });
  const accounts = {};
  for (const role of ["admin", "contributor", "student"]) {
    accounts[role] = await User.findOne({ email: `guidy${role}@qu.edu.qa`, role });
    if (!accounts[role]) throw new Error(`Existing ${role} demo account was not found; no data was written`);
  }
  const courses = [];
  for (let year = 1; year <= 4; year++) {
    for (const [termIndex, term] of ["fall", "spring"].entries()) {
      for (const [index, name] of curriculum[year - 1][termIndex].entries()) {
        const course_code = `DEMO-CS${year}${termIndex + 1}${index + 1}`;
        courses.push(await insert(Course, course_code, { name, course_code, year, term, creditHour: 3,
          percent: 100, instructorName: "Demo Faculty", course_info: "Showcase curriculum entry for demonstration purposes." }, { course_code }));
      }
    }
  }
  // An existing registration is left intact; grades are added for its courses too.
  const registration = await insert(Registration, "registration", { userId: accounts.student._id,
    courseIds: courses.filter(c => c.year === 1 && c.term === "fall").map(c => c._id) }, { userId: accounts.student._id });
  const registeredCourses = await Course.find({ _id: { $in: registration.courseIds } });
  const gradeCourses = new Map([...courses, ...registeredCourses].map(c => [String(c._id), c]));
  let gradeIndex = 0;
  for (const course of gradeCourses.values()) {
    const offset = gradeIndex++ % 5;
    await insert(Grade, "grade:" + course._id, { user: accounts.student._id, course: course._id,
      year: course.year, term: course.term, quiz1: 14 + offset, quiz2: 16, midterm: 15 + offset,
      project: 18, final: 16 + offset }, { user: accounts.student._id, course: course._id });
  }
  const roleTasks = {
    student: ["Review programming lecture notes", "Complete calculus practice questions", "Prepare group project outline", "Read the academic writing guide", "Submit weekly study reflection"],
    contributor: ["Prepare database revision notes", "Review the resource upload checklist", "Submit sample practice questions", "Update web development study guide", "Check feedback from resource reviews"],
    admin: ["Review pending resource submissions", "Check learning resource quality", "Verify academic term coverage", "Review contributor feedback", "Prepare next review session"],
  };
  const roleEvents = {
    student: [["Calculus revision", "Study session"], ["Programming quiz", "Assessment"], ["Group project meeting", "Project"], ["Academic writing workshop", "Workshop"], ["Database practice", "Study session"], ["Semester review", "Planning"]],
    contributor: [["Resource planning", "Planning"], ["Study guide review", "Review"], ["Contributor workshop", "Workshop"], ["Submission deadline", "Deadline"], ["Peer feedback meeting", "Meeting"], ["Content coverage review", "Review"]],
    admin: [["Resource moderation session", "Review"], ["Academic planning meeting", "Meeting"], ["Contributor onboarding", "Workshop"], ["Submission review deadline", "Deadline"], ["Quality assurance review", "Review"], ["Semester planning", "Planning"]],
  };
  for (const [role, user] of Object.entries(accounts)) {
    for (const [index, taskDescription] of roleTasks[role].entries()) await insert(Task, `${role}:task:${index}`, { userId: user._id, taskDescription: "Demo: " + taskDescription, checked: index > 2 });
    for (const [index, [name, eventType]] of roleEvents[role].entries()) {
      const eventDate = new Date(); eventDate.setHours(12,0,0,0); eventDate.setDate(eventDate.getDate() + [-3,0,2,5,9,15][index]);
      await insert(Event, `${role}:event:${index}`, { userId: user._id, eventName: "Demo: " + name, eventDate, eventType });
    }
    for (let index = 0; index < 3; index++) await insert(Notification, `${role}:notification:${index}`, {
      user: user._id, title: ["Demo: Welcome to your Guidy workspace", "Demo: Learning materials ready for review", "Demo: Your showcase calendar is ready"][index],
      description: "Sample notification for the Guidy demonstration account.", isRead: index === 0,
      createdAt: new Date(Date.now() - index * 86400000), updatedAt: new Date(),
    });
  }
  for (let index = 0; index < 8; index++) {
    const course = courses[index * 4];
    await insert(Notebook, "notebook:" + index, { user: accounts.student._id, subject: course._id,
      year: String(course.year), term: course.term, notebookTitle: "Demo: " + course.name + " revision",
      notebookContent: `Demo study notes for ${course.name}.\n1. Review the main concepts from class.\n2. Work through two practice examples.\n3. Record questions for the next tutorial.\nThese are fictional showcase notes.` });
  }
  await mkdir(uploadsDir, { recursive: true });
  for (let index = 0; index < 14; index++) {
    const course = courses[index * 2];
    const status = index < 8 ? "accepted" : index < 12 ? "pending" : "denied";
    const filename = `guidy-demo-resource-${index + 1}.txt`;
    // Exclusive file creation avoids replacing a downloaded or edited demo document.
    await writeFile(path.join(uploadsDir, filename), `GUIDY DEMO LEARNING RESOURCE\n${course.name}\n\nFictional study outline for demonstration only.\n- Review key concepts.\n- Complete practice examples.\n- Discuss questions with your instructor.\n`, { encoding: "utf8", flag: "wx" }).catch(error => { if (error.code !== "EEXIST") throw error; });
    await insert(Resource, "resource:" + index, { user: accounts.contributor._id, subject: course._id,
      year: String(course.year), term: course.term, status, isDeleted: false, resourceURL: filename,
      resourceName: `Demo - ${course.name} study guide.txt` });
  }
  const roles = Object.fromEntries(await Promise.all(Object.entries(accounts).map(async ([role,user]) => [role, {
    tasks: await Task.countDocuments({userId:user._id}), events:await Event.countDocuments({userId:user._id}), notifications:await Notification.countDocuments({user:user._id}),
  }])));
  console.log(JSON.stringify({ inserted: counts, verified: { roles, demoCourses: await Course.countDocuments({course_code:/^DEMO-CS/}),
    registeredCourses: registeredCourses.length, studentGrades:await Grade.countDocuments({user:accounts.student._id}),
    studentNotebooks:await Notebook.countDocuments({user:accounts.student._id}), resourceStates:await Resource.aggregate([{$match:{user:accounts.contributor._id,isDeleted:false}},{$group:{_id:"$status",count:{$sum:1}}}]) } }, null, 2));
}
main().catch(error => { console.error("Demo seed failed:", error.code || error.name, error.message.replace(/mongodb[^\s]+/g,"[connection redacted]")); process.exitCode = 1; }).finally(() => mongoose.disconnect());
