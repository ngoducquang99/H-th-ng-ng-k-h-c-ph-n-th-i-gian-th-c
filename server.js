import express from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = Number(process.env.PORT || 3000);
const GRPC_PORT = Number(process.env.GRPC_PORT || 50051);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'state.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const seedCourses = [
  { id: 'CS101', code: 'CS101', name: 'Lập trình nhập môn', credits: 3, capacity: 45, registered: 38, schedule: 'T2 · 7:00-9:30', room: 'A1-301', lecturer: 'ThS. Nguyễn Anh' },
  { id: 'CS205', code: 'CS205', name: 'Cơ sở dữ liệu', credits: 4, capacity: 40, registered: 40, schedule: 'T3 · 9:30-12:00', room: 'B2-204', lecturer: 'TS. Trần Minh' },
  { id: 'CS301', code: 'CS301', name: 'Cấu trúc dữ liệu & Giải thuật', credits: 4, capacity: 50, registered: 32, schedule: 'T4 · 7:00-10:00', room: 'A2-105', lecturer: 'PGS.TS. Lê Hương' },
  { id: 'CS401', code: 'CS401', name: 'Hệ phân tán', credits: 3, capacity: 35, registered: 29, schedule: 'T5 · 13:00-15:30', room: 'C1-210', lecturer: 'ThS. Phạm Đức' },
  { id: 'SE220', code: 'SE220', name: 'Phân tích thiết kế hệ thống', credits: 3, capacity: 40, registered: 24, schedule: 'T6 · 7:00-9:30', room: 'B1-302', lecturer: 'TS. Hoàng Lan' },
  { id: 'NET210', code: 'NET210', name: 'Mạng máy tính', credits: 3, capacity: 36, registered: 27, schedule: 'T7 · 13:00-15:30', room: 'A3-401', lecturer: 'ThS. Vũ Thành' }
];

let state = { courses: seedCourses, registrations: [] };

await fs.mkdir(DATA_DIR, { recursive: true });
try { state = JSON.parse(await fs.readFile(DATA_FILE, 'utf8')); } catch {}

async function save() { await fs.writeFile(DATA_FILE, JSON.stringify(state, null, 2)); }

function publicCourse(course) {
  return { ...course, available: Math.max(0, course.capacity - course.registered) };
}

app.get('/api/courses', (_req, res) => res.json(state.courses.map(publicCourse)));

app.get('/api/registrations', (req, res) => {
  const studentId = String(req.query.studentId || 'SV2024001');
  const registrations = state.registrations.filter(r => r.studentId === studentId);
  res.json(registrations);
});

app.post('/api/registrations', async (req, res) => {
  const { studentId = 'SV2024001', courseId } = req.body;
  const course = state.courses.find(c => c.id === courseId);
  if (!course) return res.status(404).json({ error: 'Không tìm thấy học phần.' });

  if (state.registrations.some(r => r.studentId === studentId && r.courseId === courseId)) {
    return res.status(409).json({ error: 'Bạn đã đăng ký học phần này.' });
  }
  if (course.registered >= course.capacity) {
    return res.status(409).json({ error: 'Lớp học phần đã đủ sinh viên.' });
  }

  const conflict = state.registrations
    .filter(r => r.studentId === studentId)
    .map(r => state.courses.find(c => c.id === r.courseId))
    .find(c => c && c.schedule.split(' · ')[0] === course.schedule.split(' · ')[0]);
  if (conflict) return res.status(409).json({ error: `Trùng lịch với học phần ${conflict.name}.` });

  course.registered += 1;
  const registration = {
    id: `${studentId}-${courseId}-${Date.now()}`,
    studentId,
    courseId,
    courseCode: course.code,
    courseName: course.name,
    credits: course.credits,
    schedule: course.schedule,
    registeredAt: new Date().toISOString()
  };
  state.registrations.push(registration);
  await save();

  io.emit('courses-updated', state.courses.map(publicCourse));
  io.emit('registration-updated', registration);
  res.status(201).json(registration);
});

app.delete('/api/registrations/:courseId', async (req, res) => {
  const studentId = String(req.query.studentId || 'SV2024001');
  const index = state.registrations.findIndex(r => r.studentId === studentId && r.courseId === req.params.courseId);
  if (index === -1) return res.status(404).json({ error: 'Không tìm thấy đăng ký.' });

  const [removed] = state.registrations.splice(index, 1);
  const course = state.courses.find(c => c.id === req.params.courseId);
  if (course) course.registered = Math.max(0, course.registered - 1);
  await save();

  io.emit('courses-updated', state.courses.map(publicCourse));
  io.emit('registration-cancelled', removed);
  res.json({ success: true });
});

io.on('connection', socket => {
  socket.emit('courses-updated', state.courses.map(publicCourse));
});

const protoPath = path.join(__dirname, 'registration.proto');
if (await fs.stat(protoPath).catch(() => null)) {
  const packageDefinition = protoLoader.loadSync(protoPath, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
  const proto = grpc.loadPackageDefinition(packageDefinition).registration;
  const grpcServer = new grpc.Server();
  grpcServer.addService(proto.CourseCapacityService.service, {
    GetCapacity(call, callback) {
      const course = state.courses.find(c => c.id === call.request.courseId);
      callback(null, course ? { courseId: course.id, capacity: course.capacity, registered: course.registered, available: course.capacity - course.registered } : { courseId: call.request.courseId, capacity: 0, registered: 0, available: 0 });
    }
  });
  grpcServer.bindAsync(`127.0.0.1:${GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), error => {
    if (!error) grpcServer.start();
  });
}

server.listen(PORT, () => {
  console.log(`REST/WebSocket: http://localhost:${PORT}`);
  console.log(`gRPC: 127.0.0.1:${GRPC_PORT}`);
});
