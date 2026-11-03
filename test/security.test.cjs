const assert = require("node:assert/strict");
const { test } = require("node:test");
const { Types } = require("mongoose");
const tasks = require("../dist/modules/tasks/tasks.service");
const taskModel = require("../dist/modules/tasks/tasks.model").default;
const notes = require("../dist/modules/notebook/notebook.service");
const notebookModel = require("../dist/modules/notebook/notebook.model").default;
const { signup } = require("../dist/modules/authentication/authentication.controller");

test("public signup rejects administrator accounts", async () => {
  const req = { body: { role: "admin" } };
  const res = {
    status(code) {
      assert.equal(code, 400);
      return this;
    },
    json(body) {
      assert.equal(body.status, 400);
    },
  };
  await signup(req, res);
});

test("task deletion and notebook updates scope writes to the owner", async (t) => {
  const record = new Types.ObjectId();
  const owner = new Types.ObjectId();
  const attacker = new Types.ObjectId();
  const saved = { _id: record, owner };
  const findRecord = (id, user) =>
    id.equals(record) && user.equals(owner) ? saved : null;

  t.mock.method(taskModel, "findOneAndDelete", ({ _id, userId }) => findRecord(_id, userId));
  t.mock.method(notebookModel, "findOneAndUpdate", ({ _id, user }, update) => {
    assert.equal(update.$set.user, undefined);
    return findRecord(_id, user);
  });

  assert.equal(await tasks.deleteTask(record, attacker), null);
  assert.equal(await tasks.deleteTask(record, owner), saved);
  assert.equal(await notes.updateNote(record, attacker, { user: owner }), null);
  assert.equal(await notes.updateNote(record, owner, { user: attacker }), saved);
});

const grades = require("../dist/modules/grades/grades.service");
const gradeModel = require("../dist/modules/grades/grades.model").default;
const registration = require("../dist/modules/registration/registration.service");
const registrationModel = require("../dist/modules/registration/registration.model").default;
const courseModel = require("../dist/modules/courses/courses.model").default;

test("empty and partial grade records yield a finite course average", async (t) => {
  const owner = new Types.ObjectId();
  const find = t.mock.method(gradeModel, "find", async () => []);
  assert.equal(await grades.getProgress(owner, 0, ""), 0);
  find.mock.mockImplementation(async () => [
    { quiz1: 10, quiz2: 10, midterm: 10, project: 10, final: 10 },
    { quiz1: 20 },
  ]);
  assert.equal(await grades.getProgress(owner, 0, ""), 35);
});

test("grade creation cannot assign the record to another account", async (t) => {
  const owner = new Types.ObjectId();
  const other = new Types.ObjectId();
  t.mock.method(gradeModel, "findOne", () => ({ select: async () => null }));
  t.mock.method(gradeModel, "findOneAndUpdate", async (_filter, update) => update.$set);
  const record = await grades.createGrade(owner, { user: other, course: new Types.ObjectId(), quiz1: 10 });
  assert.equal(record.user, owner);
});

test("registration rejects courses mixed across terms", async (t) => {
  t.mock.method(registrationModel, "findOne", async () => null);
  const ids = Array.from({ length: 4 }, () => new Types.ObjectId());
  t.mock.method(courseModel, "find", async () => ids.map((_id, index) => ({
    _id, year: 1, term: index === 3 ? "spring" : "fall",
  })));
  await assert.rejects(registration.makeRegistration(new Types.ObjectId(), ids), { status: 400 });
});

test("registration detects a concurrent change instead of overwriting it", async (t) => {
  const owner = new Types.ObjectId();
  const ids = Array.from({ length: 4 }, () => new Types.ObjectId());
  t.mock.method(registrationModel, "findOne", async () => ({
    _id: new Types.ObjectId(), userId: owner, courseIds: ids,
  }));
  t.mock.method(courseModel, "find", async () => ids.map((_id) => ({ _id, year: 1, term: "fall" })));
  t.mock.method(registrationModel, "findOneAndUpdate", async (filter) => {
    assert.deepEqual(filter.courseIds, ids);
    return null;
  });
  await assert.rejects(registration.makeRegistration(owner, ids), { status: 409 });
});

const authenticationService = require("../dist/modules/authentication/authentication.service");
const userModel = require("../dist/modules/authentication/user.model").default;
const { updateProfile } = require("../dist/modules/authentication/authentication.controller");

test("profile storage only changes editable contact fields", async (t) => {
  const owner = new Types.ObjectId();
  const contact = { firstName: "Demo", lastName: "User", email: "demo@qu.edu.qa", mobileNumber: "" };
  t.mock.method(userModel, "findByIdAndUpdate", async (id, update, options) => {
    assert.equal(id, owner);
    assert.deepEqual(update, { $set: contact });
    assert.equal(options.new, true);
    assert.equal(options.runValidators, true);
    return contact;
  });
  await authenticationService.updateUserProfile(owner, { ...contact, role: "admin", password: "injected" });
});

test("profile controller uses the authenticated account and excludes the password from responses", async (t) => {
  const owner = new Types.ObjectId();
  const contact = { firstName: "Demo", lastName: "User", email: "demo@qu.edu.qa", mobileNumber: "" };
  t.mock.method(authenticationService, "updateUserProfile", async (id, fields) => {
    assert.equal(id, owner);
    assert.deepEqual(fields, contact);
    return { _id: owner, ...fields, role: "student", password: "stored-hash" };
  });
  const req = { body: { ...contact, userId: new Types.ObjectId(), role: "admin", password: "injected" } };
  const res = {
    locals: { userId: owner },
    json(body) {
      assert.equal(body.data._id, owner);
      assert.equal(body.data.role, "student");
      assert.equal(body.data.password, undefined);
    },
  };
  await updateProfile(req, res);
});

test("invalid profile input does not reach the database", async (t) => {
  const write = t.mock.method(authenticationService, "updateUserProfile", async () => {
    assert.fail("Invalid contact details must not be saved");
  });
  const res = {
    locals: { userId: new Types.ObjectId() },
    status(code) { assert.equal(code, 400); return this; },
    json(body) { assert.ok(body.fields.email); },
  };
  await updateProfile({ body: { firstName: "Demo", lastName: "User", email: "invalid", mobileNumber: "" } }, res);
  assert.equal(write.mock.callCount(), 0);
});


test("demo downloads retain approval checks and can use bundled files when uploads are absent", async (t) => {
  const fs = require("node:fs/promises");
  const path = require("node:path");
  const resources = require("../dist/modules/resources/resources.controller");
  const resourceModel = require("../dist/modules/resources/resources.model").default;
  const record = new Types.ObjectId();
  t.mock.method(resourceModel, "findOne", async (filter) => {
    assert.equal(filter.status, "accepted");
    assert.equal(filter.isDeleted, false);
    return { resourceURL: "guidy-demo-resource-1.txt", resourceName: "Demo study guide.txt" };
  });
  t.mock.method(fs, "access", async () => { throw Object.assign(new Error("File absent"), { code: "ENOENT" }); });
  let downloaded = false;
  await resources.downloadResource({ params: { id: String(record) } }, {
    locals: { user: { role: "student" } },
    download(filename, name, options) {
      assert.equal(filename, "guidy-demo-resource-1.txt");
      assert.equal(name, "Demo study guide.txt");
      assert.equal(options.root, path.join(process.cwd(), "scripts", "demo-resources"));
      downloaded = true;
    },
  });
  assert.equal(downloaded, true);
  assert.match(await fs.readFile("scripts/demo-resources/guidy-demo-resource-1.txt", "utf8"), /demonstration only/);
});
