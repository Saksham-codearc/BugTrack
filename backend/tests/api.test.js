process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_DB = 'true';
process.env.AUTO_SEED = 'false';
process.env.JWT_SECRET = 'test-only-secret';
process.env.CLIENT_URL = 'http://localhost:5173';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const { User } = require('../src/models/User');
const { Project } = require('../src/models/Project');
const { Ticket } = require('../src/models/Ticket');
const { Comment } = require('../src/models/Comment');

const auth = (token) => ({ Authorization: `Bearer ${token}` });

test('BugTrack API end-to-end', async (t) => {
  let alice;
  let bob;
  let vic;
  let project;
  let ticket;

  t.before(async () => {
    await connectDB();
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Ticket.deleteMany({}),
      Comment.deleteMany({}),
    ]);
  });

  t.after(async () => {
    await disconnectDB();
  });

  await t.test('health check responds', async () => {
    const res = await request(app).get('/api/health').expect(200);
    assert.equal(res.body.status, 'ok');
  });

  await t.test('registers users and protects routes', async () => {
    const first = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice Admin', email: 'alice@test.dev', password: 'password123' })
      .expect(201);
    assert.ok(first.body.token);
    assert.equal(first.body.user.role, 'admin');
    alice = first.body;

    const second = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob Builder', email: 'bob@test.dev', password: 'password123' })
      .expect(201);
    bob = second.body;

    const third = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Vic Viewer', email: 'vic@test.dev', password: 'password123' })
      .expect(201);
    vic = third.body;

    await request(app).get('/api/projects').expect(401);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.dev', password: 'password123' })
      .expect(200);
    assert.equal(login.body.user.email, 'alice@test.dev');

    await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.dev', password: 'wrong-password' })
      .expect(401);
  });

  await t.test('creates a project and invites members by email', async () => {
    const created = await request(app)
      .post('/api/projects')
      .set(auth(alice.token))
      .send({ title: 'Checkout Revamp', description: 'A test project for the bug tracker.' })
      .expect(201);

    project = created.body.project;
    assert.equal(project.members[0].role, 'admin');
    assert.ok(project.key.length >= 2);

    const inviteDev = await request(app)
      .post(`/api/projects/${project.id}/members`)
      .set(auth(alice.token))
      .send({ email: 'bob@test.dev', role: 'developer' })
      .expect(201);
    assert.equal(inviteDev.body.project.members.length, 2);

    await request(app)
      .post(`/api/projects/${project.id}/members`)
      .set(auth(alice.token))
      .send({ email: 'vic@test.dev', role: 'viewer' })
      .expect(201);

    const list = await request(app).get('/api/projects').set(auth(bob.token)).expect(200);
    assert.equal(list.body.projects.length, 1);
    assert.equal(list.body.projects[0].id, project.id);
  });

  await t.test('creates and filters tickets', async () => {
    const created = await request(app)
      .post(`/api/projects/${project.id}/tickets`)
      .set(auth(alice.token))
      .send({
        title: 'Checkout button does nothing',
        description: 'Clicking pay has no effect on Safari.',
        type: 'bug',
        priority: 'high',
        assignee: bob.user.id,
        labels: ['checkout', 'safari'],
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      })
      .expect(201);

    ticket = created.body.ticket;
    assert.equal(ticket.key, `${project.key}-1`);
    assert.equal(ticket.status, 'todo');
    assert.equal(ticket.assignee.id, bob.user.id);

    const querystring = `/api/projects/${project.id}/tickets?status=todo&priority=high&assignee=${bob.user.id}&q=checkout`;
    const filtered = await request(app).get(querystring).set(auth(vic.token)).expect(200);
    assert.equal(filtered.body.total, 1);

    const noMatch = await request(app)
      .get(`/api/projects/${project.id}/tickets?q=does-not-exist`)
      .set(auth(alice.token))
      .expect(200);
    assert.equal(noMatch.body.total, 0);
  });

  await t.test('viewers are read-only but can comment', async () => {
    await request(app)
      .post(`/api/projects/${project.id}/tickets`)
      .set(auth(vic.token))
      .send({ title: 'Viewer should not create this ticket' })
      .expect(403);

    const comment = await request(app)
      .post(`/api/tickets/${ticket.id}/comments`)
      .set(auth(vic.token))
      .send({ text: 'I can reproduce this on Safari 17.' })
      .expect(201);

    const reply = await request(app)
      .post(`/api/tickets/${ticket.id}/comments`)
      .set(auth(bob.token))
      .send({ text: 'Thanks — looking into it now.', parentId: comment.body.comment.id })
      .expect(201);

    const threads = await request(app)
      .get(`/api/tickets/${ticket.id}/comments`)
      .set(auth(alice.token))
      .expect(200);
    assert.equal(threads.body.total, 2);
    assert.equal(threads.body.comments.length, 1);
    assert.equal(threads.body.comments[0].replies.length, 1);

    // Deleting the parent should cascade to the reply.
    await request(app)
      .delete(`/api/comments/${comment.body.comment.id}`)
      .set(auth(vic.token))
      .expect(200);

    const afterDelete = await request(app)
      .get(`/api/tickets/${ticket.id}/comments`)
      .set(auth(alice.token))
      .expect(200);
    assert.equal(afterDelete.body.total, 0);
    assert.ok(reply.body.comment.id);
  });

  await t.test('updates tickets and moves them across the board', async () => {
    const updated = await request(app)
      .patch(`/api/tickets/${ticket.id}`)
      .set(auth(bob.token))
      .send({ priority: 'urgent', description: 'Updated description from the developer.' })
      .expect(200);
    assert.equal(updated.body.ticket.priority, 'urgent');

    const moved = await request(app)
      .patch(`/api/tickets/${ticket.id}/status`)
      .set(auth(bob.token))
      .send({ status: 'in_progress', position: 0 })
      .expect(200);
    assert.equal(moved.body.ticket.status, 'in_progress');

    const dashboard = await request(app).get('/api/dashboard/summary').set(auth(bob.token)).expect(200);
    assert.equal(dashboard.body.stats.total, 1);
    assert.equal(dashboard.body.stats.in_progress, 1);
  });

  await t.test('uploads and deletes a screenshot attachment', async () => {
    const uploaded = await request(app)
      .post(`/api/tickets/${ticket.id}/attachments`)
      .set(auth(bob.token))
      .attach('files', Buffer.from('89504e470d0a1a0a', 'hex'), {
        filename: 'screenshot.png',
        contentType: 'image/png',
      })
      .expect(201);

    assert.equal(uploaded.body.ticket.attachments.length, 1);
    const attachmentId = uploaded.body.ticket.attachments[0].id;

    const removed = await request(app)
      .delete(`/api/tickets/${ticket.id}/attachments/${attachmentId}`)
      .set(auth(bob.token))
      .expect(200);
    assert.equal(removed.body.ticket.attachments.length, 0);
  });

  await t.test('enforces delete permissions and cleans up', async () => {
    // A developer cannot delete the project.
    await request(app).delete(`/api/projects/${project.id}`).set(auth(bob.token)).expect(403);

    const second = await request(app)
      .post(`/api/projects/${project.id}/tickets`)
      .set(auth(alice.token))
      .send({ title: 'Second ticket gets the next number' })
      .expect(201);
    assert.equal(second.body.ticket.key, `${project.key}-2`);

    await request(app).delete(`/api/tickets/${second.body.ticket.id}`).set(auth(alice.token)).expect(200);

    await request(app).delete(`/api/projects/${project.id}`).set(auth(alice.token)).expect(200);
    assert.equal(await Project.countDocuments(), 0);
    assert.equal(await Ticket.countDocuments(), 0);
    assert.equal(await Comment.countDocuments(), 0);
  });
});
