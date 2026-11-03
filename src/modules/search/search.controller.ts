import { Request, Response } from "express";
import courses from "../courses/courses.model";
import tasks from "../tasks/tasks.model";
import events from "../events/events.model";
import notes from "../notebook/notebook.model";
import resources from "../resources/resources.model";
import users from "../authentication/user.model";

export async function searchWorkspace(req: Request, res: Response) {
  const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0,100) : "";
  if (!query) return res.json({ data: [] });
  const regex = { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  const { role, _id: userId } = res.locals.user;
  const root = role === "student" ? "/userdashboard" : role === "admin" ? "/admindashboard" : "/contributordashboard";
  const results: { id: string; title: string; description: string; href: string }[] = [];
  const foundCourses = await courses.find({ $or: [{ name: regex }, { course_code: regex }] }).limit(5).lean();
  foundCourses.forEach(course => results.push({ id: "course:"+course._id, title: course.name, description: "Course · " + (course.course_code || "Year " + course.year), href: root+"/courses/"+course._id }));
  if (role === "student" || role === "admin") {
    const [foundTasks, foundEvents] = await Promise.all([
      tasks.find({ userId, taskDescription: regex }).limit(3).lean(),
      events.find({ userId, $or: [{ eventName: regex }, { eventType: regex }] }).limit(3).lean(),
    ]);
    foundTasks.forEach(task => results.push({ id: "task:"+task._id, title: task.taskDescription, description: "Your task", href: root+"/mytasks?task="+task._id }));
    foundEvents.forEach(event => results.push({ id: "event:"+event._id, title: event.eventName, description: "Your calendar event", href: root+"/calender?event="+event._id }));
  }
  if (role === "student") {
    const [foundNotes, foundResources] = await Promise.all([
      notes.find({ user:userId, $or:[{notebookTitle:regex},{notebookContent:regex}] }).limit(3).lean(),
      resources.find({status:"accepted",isDeleted:false,resourceName:regex}).limit(3).lean(),
    ]);
    foundNotes.forEach(note => results.push({id:"note:"+note._id,title:note.notebookTitle,description:"Your notebook",href:root+"/notes?note="+note._id}));
    foundResources.forEach(resource => results.push({id:"resource:"+resource._id,title:resource.resourceName,description:"Approved resource",href:root+"/resources?search="+encodeURIComponent(resource.resourceName)}));
  }
  if (role === "admin") {
    const foundUsers=await users.find({role:{$in:["student","contributor"]},$or:[{firstName:regex},{lastName:regex},{email:regex}]}).select("firstName lastName email role").limit(4).lean();
    foundUsers.forEach(user=>results.push({id:"user:"+user._id,title:[user.firstName,user.lastName].filter(Boolean).join(" ")||user.email,description:user.role+" · "+user.email,href:root+"/users?role="+user.role+"&search="+encodeURIComponent(user.email)}));
  }
  res.setHeader("Cache-Control","no-store");
  return res.json({data:results});
}
