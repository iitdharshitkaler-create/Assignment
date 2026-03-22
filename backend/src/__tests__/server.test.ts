/**
 * Backend Unit Tests — Assignment 2 (Task Board)
 *
 * KEY RULES for Jest mocking with TypeScript / ts-jest:
 *
 * 1. jest.mock() is hoisted above all imports — never reference outer variables
 *    inside a mock factory; define everything inline.
 *
 * 2. Add `__esModule: true` to every mock factory whose source file uses
 *    `export default`. Without it ts-jest treats the mock as plain CommonJS
 *    and `import X from '...'` returns undefined instead of the default object.
 *
 * 3. Import the mocked modules AFTER all jest.mock() calls, then cast them
 *    so TypeScript knows they are jest.Mocked.
 *
 * Directory layout:
 *   backend/
 *     src/
 *       server.ts          ← export default app; guard app.listen with NODE_ENV
 *       __tests__/
 *         server.test.ts   ← this file
 *     database/
 *       user.tsx | board.tsx | project.tsx | story.tsx
 *       task.tsx | notifications.tsx | comment.tsx
 */

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — jest.mock() calls (hoisted; factory bodies run before any import)
// ─────────────────────────────────────────────────────────────────────────────

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose') as typeof import('mongoose');
  return { ...actual, connect: jest.fn().mockResolvedValue(undefined) };
});

jest.mock('jsonwebtoken', () => {
  const fns = {
    sign:   jest.fn().mockReturnValue('fake-jwt-token'),
    verify: jest.fn().mockReturnValue({ email: 'test@test.com', userid: '000000000000000000000001' }),
  };
  return { __esModule: true, default: fns, ...fns };
});

jest.mock('bcrypt', () => {
  const fns = {
    genSalt: jest.fn((_r: number, cb: (e: null, s: string) => void) => cb(null, 'salt')),
    hash:    jest.fn((_p: string, _s: string, cb: (e: null, h: string) => void) => cb(null, 'hashed')),
    compare: jest.fn((_p: string, _h: string, cb: (e: null, r: boolean) => void) => cb(null, true)),
  };
  return { __esModule: true, default: fns, ...fns };
});

// __esModule: true is REQUIRED for every mock whose real file uses `export default`.
// Without it, `import X from '...'` gets undefined instead of the mock object.

jest.mock('../../database/user', () => ({
  __esModule: true,
  default: {
    findOne:           jest.fn(),
    findById:          jest.fn(),
    create:            jest.fn(),
    find:              jest.fn(),
    findByIdAndUpdate: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../database/project', () => ({
  __esModule: true,
  default: {
    findOne:           jest.fn(),
    findById:          jest.fn(),
    create:            jest.fn(),
    find:              jest.fn(),
    findByIdAndUpdate: jest.fn().mockResolvedValue(true),
    findByIdAndDelete: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../database/board', () => ({
  __esModule: true,
  default: {
    findOne:           jest.fn(),
    findById:          jest.fn(),
    create:            jest.fn(),
    find:              jest.fn(),
    findByIdAndDelete: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../database/story', () => ({
  __esModule: true,
  default: {
    findOne:           jest.fn(),
    findById:          jest.fn(),
    create:            jest.fn(),
    find:              jest.fn(),
    findByIdAndDelete: jest.fn().mockResolvedValue(true),
    updateOne:         jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../database/task', () => ({
  __esModule: true,
  default: {
    findOne:           jest.fn(),
    findById:          jest.fn(),
    create:            jest.fn(),
    find:              jest.fn(),
    findByIdAndUpdate: jest.fn().mockResolvedValue(true),
    findByIdAndDelete: jest.fn().mockResolvedValue(true),
    updateMany:        jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../database/notifications', () => ({
  __esModule: true,
  default: {
    findById:          jest.fn(),
    create:            jest.fn(),
    findByIdAndDelete: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../database/comment', () => ({
  __esModule: true,
  default: {
    findById:          jest.fn(),
    create:            jest.fn(),
    findByIdAndDelete: jest.fn().mockResolvedValue(true),
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Imports (mocks already registered above)
// ─────────────────────────────────────────────────────────────────────────────
import request  from 'supertest';
import mongoose from 'mongoose';

import userDataModule         from '../../database/user';
import projectDataModule      from '../../database/project';
import boardDataModule        from '../../database/board';
import storyDataModule        from '../../database/story';
import taskDataModule         from '../../database/task';
import notificationDataModule from '../../database/notifications';
import commentDataModule      from '../../database/comment';

const mockUser    = userDataModule         as jest.Mocked<typeof userDataModule>;
const mockProject = projectDataModule      as jest.Mocked<typeof projectDataModule>;
const mockBoard   = boardDataModule        as jest.Mocked<typeof boardDataModule>;
const mockStory   = storyDataModule        as jest.Mocked<typeof storyDataModule>;
const mockTask    = taskDataModule         as jest.Mocked<typeof taskDataModule>;
const mockNotif   = notificationDataModule as jest.Mocked<typeof notificationDataModule>;
const mockComment = commentDataModule      as jest.Mocked<typeof commentDataModule>;

import * as jwt    from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

import app from '../server';

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Fixed fake IDs (match the userid returned by jwt.verify mock)
// ─────────────────────────────────────────────────────────────────────────────
const fakeUserId    = '000000000000000000000001';
const fakeProjectId = '000000000000000000000002';
const fakeBoardId   = '000000000000000000000003';
const fakeStoryId   = '000000000000000000000004';
const fakeTaskId    = '000000000000000000000005';
const fakeCommentId = '000000000000000000000006';
const fakeNotifId   = '000000000000000000000007';

const AUTH_COOKIE = 'token=fake-jwt-token';

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — chainable populate helper
// ─────────────────────────────────────────────────────────────────────────────
function chainable(value: unknown) {
  const p: any = Promise.resolve(value);
  p.populate = jest.fn().mockReturnValue(p);
  return p;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 — Document factories
// ─────────────────────────────────────────────────────────────────────────────
function makeUser(overrides: Record<string, any> = {}) {
  return {
    _id:              new mongoose.Types.ObjectId(fakeUserId),
    name:             'Test User',
    email:            'test@test.com',
    password:         '$2b$10$hashedpassword',
    avatar:           '',
    projects:         [] as any[],
    archivedprojects: [] as any[],
    projectAdmin:     [] as any[],
    projectMember:    [] as any[],
    projectViewer:    [] as any[],
    notifications:    [] as any[],
    save:             jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function makeProject(overrides: Record<string, any> = {}) {
  return {
    _id:           new mongoose.Types.ObjectId(fakeProjectId),
    name:          'Test Project',
    description:   'A test project',
    global_admin:  new mongoose.Types.ObjectId(fakeUserId),
    project_admin: [] as any[],
    members:       [] as any[],
    boards:        [] as any[],
    save:          jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function makeBoard(overrides: Record<string, any> = {}) {
  return {
    _id:         new mongoose.Types.ObjectId(fakeBoardId),
    projectname: new mongoose.Types.ObjectId(fakeProjectId),
    stories:     [] as any[],
    columns: [
      { name: 'TO-DO',       tasks: [] as any[] },
      { name: 'IN-PROGRESS', tasks: [] as any[] },
      { name: 'REVIEW',      tasks: [] as any[] },
      { name: 'DONE',        tasks: [] as any[] },
    ],
    transitions:  {},
    wipLimits:    {},          // per-column WIP limits, e.g. { "1": 3 }
    save:         jest.fn().mockResolvedValue(true),
    markModified: jest.fn(),
    ...overrides,
  };
}

function makeStory(overrides: Record<string, any> = {}) {
  return {
    _id:       new mongoose.Types.ObjectId(fakeStoryId),
    boardname: new mongoose.Types.ObjectId(fakeBoardId),
    storyname: 'Test Story',
    tasks:     [] as any[],
    status:    'TO-DO',
    save:      jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function makeTask(overrides: Record<string, any> = {}) {
  return {
    _id:         new mongoose.Types.ObjectId(fakeTaskId),
    boardname:   new mongoose.Types.ObjectId(fakeBoardId),
    storyname:   new mongoose.Types.ObjectId(fakeStoryId),
    name:        'Test Task',
    description: 'A test task',
    status:      'TO-DO',
    priority:    'low',
    assigneeid:  new mongoose.Types.ObjectId(fakeUserId),
    assignee:    'Test User',
    reporterid:  new mongoose.Types.ObjectId(fakeUserId),
    reporter:    'Test User',
    comments:    [] as any[],
    auditlog:    [] as string[],
    save:        jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function makeComment(overrides: Record<string, any> = {}) {
  return {
    _id:       new mongoose.Types.ObjectId(fakeCommentId),
    task:      new mongoose.Types.ObjectId(fakeTaskId),
    user:      new mongoose.Types.ObjectId(fakeUserId),
    text:      'Test comment',
    mentions:  [] as any[],
    createdAt: new Date(),
    updatedAt: new Date(),
    save:      jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function makeNotification(overrides: Record<string, any> = {}) {
  return {
    _id:     new mongoose.Types.ObjectId(fakeNotifId),
    Message: 'Test notification',
    read:    false,
    save:    jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Reset mock call history between tests; re-apply default implementations that
// clearAllMocks wipes (bcrypt.compare, jwt.verify).
// ─────────────────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  (bcrypt.compare as jest.Mock).mockImplementation(
    (_p: string, _h: string, cb: (e: null, r: boolean) => void) => cb(null, true),
  );
  (jwt.verify as jest.Mock).mockReturnValue({ email: 'test@test.com', userid: fakeUserId });
});

// ══════════════════════════════════════════════════════════════════════════════
//  TEST SUITES
// ══════════════════════════════════════════════════════════════════════════════

describe('Health Check', () => {
  it('GET / returns 200', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('server working');
  });
});

describe('Authentication', () => {
  describe('POST /registerpage', () => {
    it('creates a new user and returns "registered"', async () => {
      mockUser.create.mockResolvedValue(makeUser() as any);

      const res = await request(app).post('/registerpage').send({
        name: 'Alice', email: 'alice@test.com', password: 'password123', avatar: '',
      });
      expect(res.status).toBe(200);
      expect(res.text).toBe('registered');
      expect(mockUser.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'alice@test.com' }),
      );
    });
  });

  describe('POST /loginpage', () => {
    it('returns { loggedin: true } and sets a cookie on valid credentials', async () => {
      mockUser.findOne.mockResolvedValue(makeUser() as any);

      const res = await request(app)
        .post('/loginpage')
        .send({ email: 'test@test.com', password: 'password' });
      expect(res.status).toBe(200);
      expect(res.body.loggedin).toBe(true);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('returns 500 when email is not registered', async () => {
      mockUser.findOne.mockResolvedValue(null);
      const res = await request(app)
        .post('/loginpage')
        .send({ email: 'nobody@test.com', password: 'pass' });
      expect(res.status).toBe(500);
    });

    it('redirects (302) when password is wrong', async () => {
      (bcrypt.compare as jest.Mock).mockImplementationOnce(
        (_p: string, _h: string, cb: (e: null, r: boolean) => void) => cb(null, false),
      );
      mockUser.findOne.mockResolvedValue(makeUser() as any);
      const res = await request(app)
        .post('/loginpage')
        .send({ email: 'test@test.com', password: 'wrongpassword' });
      expect(res.status).toBe(302);
    });
  });

  describe('POST /logout', () => {
    it('clears cookie and returns { logout: true }', async () => {
      const res = await request(app).post('/logout');
      expect(res.status).toBe(200);
      expect(res.body.logout).toBe(true);
    });
  });
});

describe('User & Profile', () => {
  describe('GET /profile', () => {
    it('returns _id, name, avatar for the logged-in user', async () => {
      mockUser.findById.mockReturnValue(chainable(makeUser()) as any);
      const res = await request(app).get('/profile').set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Test User');
    });
  });

  describe('GET /allusersathome', () => {
    it('returns the full user list', async () => {
      mockUser.find.mockResolvedValue([
        { _id: fakeUserId, name: 'Alice' },
        { _id: '000000000000000000000009', name: 'Bob' },
      ] as any);
      const res = await request(app).get('/allusersathome');
      expect(res.status).toBe(200);
      expect(res.body.userlist).toHaveLength(2);
    });
  });

  describe('GET /allusers/:id', () => {
    it('excludes the global admin from the list', async () => {
      const adminId = new mongoose.Types.ObjectId(fakeUserId);
      const otherId = new mongoose.Types.ObjectId();
      mockUser.find.mockResolvedValue([
        { _id: adminId, name: 'Admin', toString: () => adminId.toString() },
        { _id: otherId, name: 'Bob',   toString: () => otherId.toString() },
      ] as any);
      mockProject.findById.mockResolvedValue(makeProject({ global_admin: adminId }) as any);

      const res = await request(app).get(`/allusers/${fakeProjectId}`);
      expect(res.status).toBe(200);
      expect((res.body.userlist as any[]).every((u: any) => u.name !== 'Admin')).toBe(true);
    });

    it('returns 404 when project does not exist', async () => {
      mockUser.find.mockResolvedValue([] as any);
      mockProject.findById.mockResolvedValue(null);
      const res = await request(app).get(`/allusers/${fakeProjectId}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /checkemailexistence/:email', () => {
    it('returns { exists: true } when email is registered', async () => {
      mockUser.findOne.mockResolvedValue(makeUser() as any);
      const res = await request(app).get('/checkemailexistence/test@test.com');
      expect(res.status).toBe(200);
      expect(res.body.exists).toBe(true);
    });

    it('returns { exists: false } when email is not found', async () => {
      mockUser.findOne.mockResolvedValue(null);
      const res = await request(app).get('/checkemailexistence/nobody@test.com');
      expect(res.status).toBe(200);
      expect(res.body.exists).toBe(false);
    });
  });
});

describe('Projects', () => {
  describe('POST /createnew', () => {
    it('creates a project and returns { created: true }', async () => {
      mockUser.findById.mockReturnValue(chainable(makeUser()) as any);
      mockProject.create.mockResolvedValue(makeProject() as any);

      const res = await request(app)
        .post('/createnew')
        .set('Cookie', AUTH_COOKIE)
        .send({ name: 'My Project', description: 'Doing things' });
      expect(res.status).toBe(200);
      expect(res.body.created).toBe(true);
    });

    it('returns 400 when requester user record is missing', async () => {
      mockUser.findById.mockReturnValue(chainable(null) as any);
      const res = await request(app)
        .post('/createnew')
        .set('Cookie', AUTH_COOKIE)
        .send({ name: 'X', description: 'Y' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /projects', () => {
    it('returns active projects with archived ones excluded', async () => {
      const active   = makeProject();
      const archived = makeProject({ _id: new mongoose.Types.ObjectId() });
      const fakeUser = makeUser({ projects: [active, archived], archivedprojects: [archived] });
      const chain: any = Promise.resolve(fakeUser);
      chain.populate = jest.fn().mockReturnValue(chain);
      mockUser.findById.mockReturnValue(chain);

      const res = await request(app).get('/projects').set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.projects).toBeDefined();
    });
  });

  describe('GET /project/:id', () => {
    it('identifies the user as global_admin', async () => {
      const fakeUser = makeUser();
      mockProject.findById.mockResolvedValue(makeProject({ global_admin: fakeUser._id }) as any);
      mockUser.findById.mockReturnValue(chainable(fakeUser) as any);
      const res = await request(app).get(`/project/${fakeProjectId}`).set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.role).toBe('global_admin');
    });

    it('identifies the user as project_admin', async () => {
      const fakeUser   = makeUser();
      const adminEntry = { toString: () => fakeUser._id.toString() };
      mockProject.findById.mockResolvedValue(
        makeProject({ global_admin: new mongoose.Types.ObjectId(), project_admin: [adminEntry] }) as any,
      );
      mockUser.findById.mockReturnValue(chainable(fakeUser) as any);
      const res = await request(app).get(`/project/${fakeProjectId}`).set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.role).toBe('project_admin');
    });

    it('defaults to viewer role', async () => {
      const fakeUser = makeUser();
      mockProject.findById.mockResolvedValue(
        makeProject({ global_admin: new mongoose.Types.ObjectId(), project_admin: [] }) as any,
      );
      mockUser.findById.mockReturnValue(chainable(fakeUser) as any);
      const res = await request(app).get(`/project/${fakeProjectId}`).set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.role).toBe('viewer');
    });

    it('returns 404 when project does not exist', async () => {
      mockProject.findById.mockResolvedValue(null);
      mockUser.findById.mockReturnValue(chainable(makeUser()) as any);
      const res = await request(app).get(`/project/${fakeProjectId}`).set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /updateprojectdesc/:id', () => {
    it('updates description for global admin', async () => {
      const fakeUser = makeUser();
      mockProject.findById.mockResolvedValue(makeProject({ global_admin: fakeUser._id }) as any);
      mockUser.findById.mockReturnValue(chainable(fakeUser) as any);
      const res = await request(app)
        .post(`/updateprojectdesc/${fakeProjectId}`)
        .set('Cookie', AUTH_COOKIE)
        .send({ description: 'New description' });
      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(true);
    });

    it('returns 403 when a non-admin attempts the update', async () => {
      const fakeUser = makeUser();
      mockProject.findById.mockResolvedValue(
        makeProject({ global_admin: new mongoose.Types.ObjectId(), project_admin: [] }) as any,
      );
      mockUser.findById.mockReturnValue(chainable(fakeUser) as any);
      const res = await request(app)
        .post(`/updateprojectdesc/${fakeProjectId}`)
        .set('Cookie', AUTH_COOKIE)
        .send({ description: 'Unauthorised' });
      expect(res.status).toBe(403);
    });

    it('returns 404 when project is missing', async () => {
      mockProject.findById.mockResolvedValue(null);
      mockUser.findById.mockReturnValue(chainable(makeUser()) as any);
      const res = await request(app)
        .post(`/updateprojectdesc/${fakeProjectId}`)
        .set('Cookie', AUTH_COOKIE)
        .send({ description: 'x' });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /allprojects', () => {
    it('returns all projects', async () => {
      mockProject.find.mockResolvedValue([{ _id: fakeProjectId, name: 'P1' }] as any);
      const res = await request(app).get('/allprojects');
      expect(res.status).toBe(200);
      expect(res.body.projectlist).toHaveLength(1);
    });
  });

  describe('POST /archiveproject/:projectid', () => {
    it('archives a project and returns { archived: true }', async () => {
      const fakeUser = makeUser({ projects: [{ toString: () => fakeProjectId }], archivedprojects: [] });
      mockProject.findById.mockResolvedValue(makeProject() as any);
      mockUser.findById.mockResolvedValue(fakeUser as any);
      const res = await request(app).post(`/archiveproject/${fakeProjectId}`).set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.archived).toBe(true);
    });
  });
});

describe('Members & Admins', () => {
  describe('POST /addmemberinproject', () => {
    it('adds user to project and returns { added: true }', async () => {
      const fakeUser = makeUser({ projects: [], projectViewer: [] });
      mockUser.findById.mockResolvedValue(fakeUser as any);
      mockProject.findById.mockResolvedValue(makeProject() as any);
      mockProject.findByIdAndUpdate.mockResolvedValue(makeProject() as any);
      const res = await request(app)
        .post('/addmemberinproject')
        .send({ choosenuser: fakeUserId, project: { _id: fakeProjectId } });
      expect(res.status).toBe(200);
      expect(res.body.added).toBe(true);
    });
  });

  describe('GET /getprojectmembers/:id', () => {
    it('returns members of the project', async () => {
      mockProject.findById.mockReturnValue(
        chainable(makeProject({ members: [{ _id: fakeUserId, name: 'Alice' }] })) as any,
      );
      const res = await request(app).get(`/getprojectmembers/${fakeProjectId}`);
      expect(res.status).toBe(200);
      expect(res.body.members).toBeDefined();
    });
  });

  describe('POST /addadminproject', () => {
    it('promotes user to project admin and creates a notification', async () => {
      const fakeUser = makeUser({ notifications: [], projectAdmin: [], projects: [] });
      mockProject.findById.mockResolvedValue(makeProject({ project_admin: [] }) as any);
      mockUser.findById.mockResolvedValue(fakeUser as any);
      mockNotif.create.mockResolvedValue(makeNotification() as any);
      const res = await request(app)
        .post('/addadminproject')
        .set('Cookie', AUTH_COOKIE)
        .send({ id: fakeProjectId, project_admin: fakeUserId });
      expect(res.status).toBe(200);
      expect(mockNotif.create).toHaveBeenCalled();
    });

    it('does not duplicate a user who is already an admin', async () => {
      const fakeUser      = makeUser({ notifications: [], projectAdmin: [], projects: [] });
      const existingEntry = { toString: () => fakeUser._id.toString() };
      mockProject.findById.mockResolvedValue(makeProject({ project_admin: [existingEntry] }) as any);
      mockUser.findById.mockResolvedValue(fakeUser as any);
      await request(app)
        .post('/addadminproject')
        .set('Cookie', AUTH_COOKIE)
        .send({ id: fakeProjectId, project_admin: fakeUserId });
      expect(mockNotif.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /getprojectadmins/:id', () => {
    it('returns the list of project admins', async () => {
      mockProject.findById.mockReturnValue(
        chainable(makeProject({ project_admin: [{ _id: fakeUserId, name: 'Admin' }] })) as any,
      );
      const res = await request(app).get(`/getprojectadmins/${fakeProjectId}`);
      expect(res.status).toBe(200);
      expect(res.body.project_admins).toBeDefined();
    });
  });
});

describe('Boards', () => {
  describe('POST /addboardinproject', () => {
    it('creates a board with 4 default columns', async () => {
      mockBoard.create.mockResolvedValue(makeBoard() as any);
      mockProject.findByIdAndUpdate.mockResolvedValue(makeProject() as any);
      const res = await request(app).post('/addboardinproject').send({ project: { _id: fakeProjectId } });
      expect(res.status).toBe(200);
      expect(res.body.added).toBe(true);
      expect(mockBoard.create).toHaveBeenCalledWith(
        expect.objectContaining({
          columns: expect.arrayContaining([
            expect.objectContaining({ name: 'TO-DO' }),
            expect.objectContaining({ name: 'IN-PROGRESS' }),
            expect.objectContaining({ name: 'REVIEW' }),
            expect.objectContaining({ name: 'DONE' }),
          ]),
        }),
      );
    });
  });

  describe('GET /getprojectboards/:id', () => {
    it('returns all boards for a project', async () => {
      mockProject.findById.mockReturnValue(chainable(makeProject({ boards: [makeBoard()] })) as any);
      const res = await request(app).get(`/getprojectboards/${fakeProjectId}`);
      expect(res.status).toBe(200);
      expect(res.body.boards).toBeDefined();
    });
  });

  describe('POST /deleteboard/:id', () => {
    it('deletes the board and returns { deleted: true }', async () => {
      mockProject.findById.mockResolvedValue(makeProject({ boards: [new mongoose.Types.ObjectId()] }) as any);
      mockBoard.findByIdAndDelete.mockResolvedValue(true as any);
      const res = await request(app).post(`/deleteboard/${fakeProjectId}`).send({ pos: 0 });
      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(true);
    });

    it('returns 404 when project is not found', async () => {
      mockProject.findById.mockResolvedValue(null);
      const res = await request(app).post(`/deleteboard/${fakeProjectId}`).send({ pos: 0 });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /movetaskonboard', () => {
    it('moves a task between columns', async () => {
      const taskId    = new mongoose.Types.ObjectId();
      const fakeBoard = makeBoard({
        columns: [
          { name: 'TO-DO',       tasks: [taskId] },
          { name: 'IN-PROGRESS', tasks: [] },
          { name: 'REVIEW',      tasks: [] },
          { name: 'DONE',        tasks: [] },
        ],
      });
      const fakeTask  = makeTask({ storyname: new mongoose.Types.ObjectId(fakeStoryId) });
      const fakeStory = makeStory({ tasks: [taskId] });
      mockBoard.findById.mockResolvedValue(fakeBoard as any);
      mockTask.findByIdAndUpdate.mockResolvedValue(fakeTask as any);
      mockTask.findById.mockResolvedValue(fakeTask as any);
      mockStory.findById.mockResolvedValue(fakeStory as any);
      const res = await request(app).post('/movetaskonboard').send({ boardid: fakeBoardId, taskid: taskId.toString(), from: 0, to: 1 });
      expect(res.status).toBe(200);
      expect(res.body.moved).toBe(true);
    });

    it('blocks move when per-column WIP limit is reached', async () => {
      // Column index 1 has wipLimit:3 and already holds 3 tasks — move must be blocked
      const fakeBoard = makeBoard({
        columns: [
          { name: 'TO-DO',       tasks: [new mongoose.Types.ObjectId()] },
          { name: 'IN-PROGRESS', tasks: [1,2,3].map(() => new mongoose.Types.ObjectId()) },
          { name: 'REVIEW',      tasks: [] },
          { name: 'DONE',        tasks: [] },
        ],
        wipLimits: { '1': 3 },
      });
      mockBoard.findById.mockResolvedValue(fakeBoard as any);
      const res = await request(app).post('/movetaskonboard').send({
        boardid: fakeBoardId,
        taskid:  new mongoose.Types.ObjectId().toString(),
        from: 0, to: 1,
      });
      expect(res.status).toBe(200);
      expect(res.body.error).toMatch(/WIP limit/i);
    });

    it('returns 404 when board is not found', async () => {
      mockBoard.findById.mockResolvedValue(null);
      const res = await request(app).post('/movetaskonboard').send({ boardid: fakeBoardId, taskid: fakeTaskId, from: 0, to: 1 });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /updateworkflow/:id', () => {
    it('saves transitions and returns { updated: true }', async () => {
      const fakeBoard = makeBoard();
      mockBoard.findById.mockResolvedValue(fakeBoard as any);
      const res = await request(app)
        .post(`/updateworkflow/${fakeBoardId}`)
        .set('Cookie', AUTH_COOKIE)
        .send({ transitions: { 'TO-DO': ['IN-PROGRESS'] } });
      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(true);
      expect(fakeBoard.markModified).toHaveBeenCalledWith('transitions');
    });

    it('returns 404 when board is not found', async () => {
      mockBoard.findById.mockResolvedValue(null);
      const res = await request(app)
        .post(`/updateworkflow/${fakeBoardId}`)
        .set('Cookie', AUTH_COOKIE)
        .send({ transitions: {} });
      expect(res.status).toBe(404);
    });
  });

  // ── NEW: per-column WIP limit management ──────────────────────────────────
  describe('POST /updatewiplimits/:id', () => {
    it('global admin can set WIP limits and returns { updated: true }', async () => {
      const fakeUser  = makeUser();                          // _id matches jwt mock
      const fakeBoard = makeBoard({ projectname: new mongoose.Types.ObjectId(fakeProjectId) });
      const fakeProject = makeProject({ global_admin: fakeUser._id });
      mockBoard.findById.mockResolvedValue(fakeBoard as any);
      mockProject.findById.mockResolvedValue(fakeProject as any);
      mockUser.findById.mockResolvedValue(fakeUser as any);

      const res = await request(app)
        .post(`/updatewiplimits/${fakeBoardId}`)
        .set('Cookie', AUTH_COOKIE)
        .send({ wipLimits: { '0': 0, '1': 3, '2': 5, '3': 0 } });

      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(true);
      expect(fakeBoard.markModified).toHaveBeenCalledWith('wipLimits');
    });

    it('project admin can set WIP limits', async () => {
      const fakeUser  = makeUser();
      const adminEntry = { toString: () => fakeUser._id.toString() };
      const fakeBoard = makeBoard({ projectname: new mongoose.Types.ObjectId(fakeProjectId) });
      const fakeProject = makeProject({
        global_admin:  new mongoose.Types.ObjectId(),   // someone else
        project_admin: [adminEntry],
      });
      mockBoard.findById.mockResolvedValue(fakeBoard as any);
      mockProject.findById.mockResolvedValue(fakeProject as any);
      mockUser.findById.mockResolvedValue(fakeUser as any);

      const res = await request(app)
        .post(`/updatewiplimits/${fakeBoardId}`)
        .set('Cookie', AUTH_COOKIE)
        .send({ wipLimits: { '1': 4 } });

      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(true);
    });

    it('returns 403 when a plain member tries to set WIP limits', async () => {
      const fakeUser  = makeUser();
      const fakeBoard = makeBoard({ projectname: new mongoose.Types.ObjectId(fakeProjectId) });
      const fakeProject = makeProject({
        global_admin:  new mongoose.Types.ObjectId(),   // different user
        project_admin: [],                              // not an admin
      });
      mockBoard.findById.mockResolvedValue(fakeBoard as any);
      mockProject.findById.mockResolvedValue(fakeProject as any);
      mockUser.findById.mockResolvedValue(fakeUser as any);

      const res = await request(app)
        .post(`/updatewiplimits/${fakeBoardId}`)
        .set('Cookie', AUTH_COOKIE)
        .send({ wipLimits: { '1': 2 } });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/admin/i);
    });

    it('returns 404 when board is not found', async () => {
      mockBoard.findById.mockResolvedValue(null);

      const res = await request(app)
        .post(`/updatewiplimits/${fakeBoardId}`)
        .set('Cookie', AUTH_COOKIE)
        .send({ wipLimits: {} });

      expect(res.status).toBe(404);
    });

    it('returns 404 when project is not found', async () => {
      const fakeBoard = makeBoard({ projectname: new mongoose.Types.ObjectId(fakeProjectId) });
      mockBoard.findById.mockResolvedValue(fakeBoard as any);
      mockProject.findById.mockResolvedValue(null);
      mockUser.findById.mockResolvedValue(makeUser() as any);

      const res = await request(app)
        .post(`/updatewiplimits/${fakeBoardId}`)
        .set('Cookie', AUTH_COOKIE)
        .send({ wipLimits: { '1': 3 } });

      expect(res.status).toBe(404);
    });

    it('redirects (302) when user is not authenticated', async () => {
      const res = await request(app)
        .post(`/updatewiplimits/${fakeBoardId}`)
        .send({ wipLimits: { '1': 3 } });

      expect(res.status).toBe(302);
    });
  });
});

describe('Column Operations', () => {
  describe('POST /deletecolumn', () => {
    it('removes column at given index', async () => {
      const fakeBoard = makeBoard({ stories: [] });
      mockBoard.findById.mockResolvedValue(fakeBoard as any);
      const res = await request(app).post('/deletecolumn').set('Cookie', AUTH_COOKIE).send({ boardid: fakeBoardId, pos: 0 });
      expect(res.status).toBe(200);
      expect(res.body.deletedcolumn).toBe(true);
      expect(fakeBoard.columns).toHaveLength(3);
    });

    it('returns 401 when board is not found', async () => {
      mockBoard.findById.mockResolvedValue(null);
      const res = await request(app).post('/deletecolumn').set('Cookie', AUTH_COOKIE).send({ boardid: fakeBoardId, pos: 0 });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /renamecolumn', () => {
    it('renames an existing column', async () => {
      const fakeBoard = makeBoard({ stories: [] });
      mockBoard.findById.mockResolvedValue(fakeBoard as any);
      mockTask.updateMany.mockResolvedValue(true as any);
      const res = await request(app).post('/renamecolumn').set('Cookie', AUTH_COOKIE).send({ newname: 'BACKLOG', boardid: fakeBoardId, columnpos: '0' });
      expect(res.status).toBe(200);
      expect(res.body.renamed).toBe(true);
      expect(fakeBoard.columns[0].name).toBe('BACKLOG');
    });

    it('adds a new column when columnpos is -1', async () => {
      const fakeBoard = makeBoard({ stories: [] });
      mockBoard.findById.mockResolvedValue(fakeBoard as any);
      const res = await request(app).post('/renamecolumn').set('Cookie', AUTH_COOKIE).send({ newname: 'TESTING', boardid: fakeBoardId, columnpos: '-1' });
      expect(res.status).toBe(200);
      expect(res.body.renamed).toBe(true);
      expect(fakeBoard.columns.some((c: any) => c.name === 'TESTING')).toBe(true);
    });
  });
});

describe('Stories', () => {
  describe('POST /putstoryonboard/:id', () => {
    it('creates a story and attaches it to the board', async () => {
      const boardObjId = new mongoose.Types.ObjectId();
      mockProject.findById.mockResolvedValue(makeProject({ boards: [boardObjId] }) as any);
      mockBoard.findById.mockResolvedValue(makeBoard({ _id: boardObjId }) as any);
      mockStory.create.mockResolvedValue(makeStory() as any);
      const res = await request(app).post(`/putstoryonboard/${fakeProjectId}`).send(['Sprint 1', 0]);
      expect(res.status).toBe(200);
      expect(res.body.added).toBe(true);
      expect(mockStory.create).toHaveBeenCalledWith(
        expect.objectContaining({ storyname: 'Sprint 1', status: 'todo' }),
      );
    });

    it('returns 404 when project is not found', async () => {
      mockProject.findById.mockResolvedValue(null);
      const res = await request(app).post(`/putstoryonboard/${fakeProjectId}`).send(['Sprint 1', 0]);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /story/:storyid/:id', () => {
    it('returns story and viewer role', async () => {
      const fakeUser = makeUser();
      mockStory.findById.mockReturnValue(chainable(makeStory()) as any);
      mockProject.findById.mockResolvedValue(makeProject({ global_admin: new mongoose.Types.ObjectId() }) as any);
      mockUser.findById.mockReturnValue(chainable(fakeUser) as any);
      const res = await request(app).get(`/story/${fakeStoryId}/${fakeProjectId}`).set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.role).toBe('viewer');
    });

    it('returns 404 when project is not found', async () => {
      mockStory.findById.mockReturnValue(chainable(makeStory()) as any);
      mockProject.findById.mockResolvedValue(null);
      mockUser.findById.mockReturnValue(chainable(makeUser()) as any);
      const res = await request(app).get(`/story/${fakeStoryId}/${fakeProjectId}`).set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /addstorytoboard', () => {
    it('places story tasks into the first board column', async () => {
      const fakeTask  = makeTask();
      const fakeStory = makeStory({ tasks: [fakeTask] });
      mockStory.findById.mockReturnValue(chainable(fakeStory) as any);
      mockBoard.findById.mockResolvedValue(makeBoard() as any);
      mockTask.findByIdAndUpdate.mockResolvedValue(true as any);
      mockStory.updateOne.mockResolvedValue(true as any);
      const res = await request(app).post('/addstorytoboard').send({ storyid: fakeStoryId });
      expect(res.status).toBe(200);
      expect(res.body.added).toBe(true);
    });

    it('returns 404 when story does not exist', async () => {
      mockStory.findById.mockReturnValue(chainable(null) as any);
      const res = await request(app).post('/addstorytoboard').send({ storyid: fakeStoryId });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /deletestory/:storyid/:id', () => {
    it('deletes story and all its tasks', async () => {
      const taskId = new mongoose.Types.ObjectId(fakeTaskId);
      mockStory.findById.mockResolvedValue(makeStory({ tasks: [taskId] }) as any);
      mockProject.findById.mockResolvedValue(makeProject() as any);
      mockTask.findById.mockResolvedValue(makeTask({ _id: taskId }) as any);
      mockBoard.findById.mockResolvedValue(makeBoard() as any);
      mockTask.findByIdAndDelete.mockResolvedValue(true as any);
      mockStory.findByIdAndDelete.mockResolvedValue(true as any);
      const res = await request(app).post(`/deletestory/${fakeStoryId}/${fakeProjectId}`).set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.archived).toBe(true);
      expect(mockTask.findByIdAndDelete).toHaveBeenCalledWith(taskId);
    });

    it('returns 401 when story or project is not found', async () => {
      mockStory.findById.mockResolvedValue(null);
      mockProject.findById.mockResolvedValue(null);
      const res = await request(app).post(`/deletestory/${fakeStoryId}/${fakeProjectId}`).set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(401);
    });
  });
});

describe('Tasks', () => {
  describe('POST /addtaskinstory', () => {
    it('creates a task with audit log entry', async () => {
      const fakeUser  = makeUser();
      const fakeStory = makeStory({ boardname: new mongoose.Types.ObjectId(fakeBoardId) });
      mockStory.findById.mockResolvedValue(fakeStory as any);
      mockUser.findById.mockReturnValue(chainable(fakeUser) as any);
      mockTask.create.mockResolvedValue(makeTask() as any);
      const res = await request(app).post('/addtaskinstory').set('Cookie', AUTH_COOKIE)
        .send({ taskname: 'Fix bug', taskdescription: 'crashes', tasktype: 'bug', storyid: fakeStoryId });
      expect(res.status).toBe(200);
      expect(res.body.added).toBe(true);
      expect(mockTask.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name:     'Fix bug',
          auditlog: expect.arrayContaining([expect.stringContaining('Task created by')]),
        }),
      );
    });

    it('returns 404 when story is not found', async () => {
      mockStory.findById.mockResolvedValue(null);
      const res = await request(app).post('/addtaskinstory').set('Cookie', AUTH_COOKIE)
        .send({ taskname: 'T', taskdescription: '', tasktype: 'task', storyid: fakeStoryId });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /removetaskinstory/:storyid', () => {
    it('removes task from story and board', async () => {
      const taskObjId = new mongoose.Types.ObjectId(fakeTaskId);
      mockStory.findById.mockResolvedValue(makeStory({ tasks: [taskObjId] }) as any);
      mockBoard.findById.mockResolvedValue(makeBoard() as any);
      mockTask.findByIdAndDelete.mockResolvedValue(true as any);
      mockStory.updateOne.mockResolvedValue(true as any);
      const res = await request(app).post(`/removetaskinstory/${fakeStoryId}`).set('Cookie', AUTH_COOKIE).send({ index: 0 });
      expect(res.status).toBe(200);
      expect(res.body.removed).toBe(true);
      expect(mockTask.findByIdAndDelete).toHaveBeenCalledWith(taskObjId);
    });

    it('returns 404 when story is not found', async () => {
      mockStory.findById.mockResolvedValue(null);
      const res = await request(app).post(`/removetaskinstory/${fakeStoryId}`).set('Cookie', AUTH_COOKIE).send({ index: 0 });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /updatetask/:id', () => {
    it('updates task fields and fires notifications', async () => {
      const assigneeId = new mongoose.Types.ObjectId();
      const reporterId = new mongoose.Types.ObjectId();
      const fakeTask   = makeTask({ assigneeid: new mongoose.Types.ObjectId(), reporterid: new mongoose.Types.ObjectId() });
      mockProject.findById.mockResolvedValue(makeProject() as any);
      mockTask.findById.mockResolvedValue(fakeTask as any);
      mockStory.findById.mockResolvedValue(makeStory() as any);
      mockUser.findById
        .mockResolvedValueOnce(makeUser({ _id: assigneeId, notifications: [], projectMember: [] }) as any)
        .mockResolvedValueOnce(makeUser({ _id: reporterId, notifications: [], projectMember: [] }) as any);
      mockTask.findByIdAndUpdate.mockResolvedValue(fakeTask as any);
      mockNotif.create.mockResolvedValue(makeNotification() as any);
      const res = await request(app).post(`/updatetask/${fakeProjectId}`).set('Cookie', AUTH_COOKIE)
        .send({ _id: fakeTaskId, assigneeid: assigneeId.toString(), reporterid: reporterId.toString(), status: 'IN-PROGRESS', priority: 'high', dueDate: '2025-12-31' });
      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(true);
      expect(mockNotif.create).toHaveBeenCalled();
    });

    it('returns 401 when project is not found', async () => {
      mockProject.findById.mockResolvedValue(null);
      const res = await request(app).post(`/updatetask/${fakeProjectId}`).set('Cookie', AUTH_COOKIE)
        .send({ _id: fakeTaskId, assigneeid: fakeUserId, reporterid: fakeUserId });
      expect(res.status).toBe(401);
    });

    it('redirects (302) when user is not authenticated', async () => {
      const res = await request(app).post(`/updatetask/${fakeProjectId}`).send({ _id: fakeTaskId });
      expect(res.status).toBe(302);
    });
  });
});

describe('Comments', () => {
  describe('GET /taskcomments/:taskid', () => {
    it('returns populated comments for a task', async () => {
      mockTask.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(makeTask({ comments: [makeComment()] })) } as any);
      const res = await request(app).get(`/taskcomments/${fakeTaskId}`).set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.comments).toBeDefined();
    });

    it('returns 404 when task is not found', async () => {
      mockTask.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) } as any);
      const res = await request(app).get(`/taskcomments/${fakeTaskId}`).set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /addcomment', () => {
    it('adds comment and notifies mentioned users', async () => {
      const mentionedId = new mongoose.Types.ObjectId();
      mockComment.create.mockResolvedValue(makeComment() as any);
      mockTask.findById.mockResolvedValue(makeTask({ comments: [] }) as any);
      mockStory.findById.mockResolvedValue(makeStory() as any);
      mockNotif.create.mockResolvedValue(makeNotification() as any);
      mockUser.findById.mockResolvedValue(makeUser({ _id: mentionedId, notifications: [] }) as any);
      const res = await request(app).post('/addcomment').set('Cookie', AUTH_COOKIE)
        .send({ taskid: fakeTaskId, text: 'Hey @someone', mentions: [mentionedId.toString()] });
      expect(res.status).toBe(200);
      expect(res.body.added).toBe(true);
      expect(mockNotif.create).toHaveBeenCalledWith(
        expect.objectContaining({ sendto: mentionedId.toString() }),
      );
    });
  });

  describe('POST /deletecomment', () => {
    it('deletes comment and removes it from task', async () => {
      const commentObjId = new mongoose.Types.ObjectId(fakeCommentId);
      mockComment.findById.mockResolvedValue(makeComment({ _id: commentObjId }) as any);
      mockTask.findById.mockResolvedValue(makeTask({ comments: [{ toString: () => commentObjId.toString() }] }) as any);
      mockComment.findByIdAndDelete.mockResolvedValue(true as any);
      const res = await request(app).post('/deletecomment').set('Cookie', AUTH_COOKIE).send({ commentid: fakeCommentId });
      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(true);
      expect(mockComment.findByIdAndDelete).toHaveBeenCalledWith(fakeCommentId);
    });

    it('returns 401 when comment or task is not found', async () => {
      mockComment.findById.mockResolvedValue(null);
      mockTask.findById.mockResolvedValue(null);
      const res = await request(app).post('/deletecomment').set('Cookie', AUTH_COOKIE).send({ commentid: fakeCommentId });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /editcomment', () => {
    it('lets a user edit their own comment', async () => {
      const fakeComment = makeComment({ user: { toString: () => fakeUserId } });
      mockComment.findById.mockResolvedValue(fakeComment as any);
      const res = await request(app).post('/editcomment').set('Cookie', AUTH_COOKIE)
        .send({ editingId: fakeCommentId, editText: 'Corrected text' });
      expect(res.status).toBe(200);
      expect(res.body.edited).toBe(true);
      expect(fakeComment.text).toBe('Corrected text');
    });

    it("returns 403 when editing someone else's comment", async () => {
      const fakeComment = makeComment({ user: { toString: () => new mongoose.Types.ObjectId().toString() } });
      mockComment.findById.mockResolvedValue(fakeComment as any);
      const res = await request(app).post('/editcomment').set('Cookie', AUTH_COOKIE)
        .send({ editingId: fakeCommentId, editText: 'Sneaky' });
      expect(res.status).toBe(403);
    });
  });
});

describe('Notifications', () => {
  describe('GET /getnotifications/:id', () => {
    it('returns all notifications for the user', async () => {
      mockUser.findById.mockReturnValue(chainable(makeUser({ notifications: [makeNotification()] })) as any);
      const res = await request(app).get(`/getnotifications/${fakeUserId}`).set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.notifications).toBeDefined();
    });
  });

  describe('POST /markasread/:messageid', () => {
    it('marks notification as read', async () => {
      const fakeNotification = makeNotification({ read: false });
      mockNotif.findById.mockResolvedValue(fakeNotification as any);
      const res = await request(app).post(`/markasread/${fakeNotifId}`).set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.marked).toBe(true);
      expect(fakeNotification.read).toBe(true);
    });

    it('returns 401 when notification does not exist', async () => {
      mockNotif.findById.mockResolvedValue(null);
      const res = await request(app).post(`/markasread/${fakeNotifId}`).set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(401);
    });
  });

  describe('POST /clearmesages', () => {
    it('deletes all notifications and returns { cleared: true }', async () => {
      const notifObjId = new mongoose.Types.ObjectId();
      const fakeUser   = makeUser({ notifications: [notifObjId] });
      mockUser.findById.mockResolvedValue(fakeUser as any);
      mockNotif.findByIdAndDelete.mockResolvedValue(true as any);
      const res = await request(app).post('/clearmesages').set('Cookie', AUTH_COOKIE);
      expect(res.status).toBe(200);
      expect(res.body.cleared).toBe(true);
      expect(mockNotif.findByIdAndDelete).toHaveBeenCalledWith(notifObjId);
      expect(fakeUser.notifications).toHaveLength(0);
    });
  });
});