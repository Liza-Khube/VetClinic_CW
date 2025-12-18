import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/prismaClient.js';
import bcrypt from 'bcrypt';

const TEST_ADMIN_LOGIN = {
  email: 'admin@gmail.com',
  password: 'password123',
};

const TEST_VET_DATA = {
  vetEmail: 'new.vet.test@gmail.com',
  vetPassword: 'vetpassword123',
  name: 'Vet',
  surname: 'Tester',
  experience: 2,
  specialisation: 'Dental',
};

describe('Schedule API Tests', () => {
  let adminToken = '';
  let testVetId = null;

  beforeAll(async () => {
    await prisma.appointment.deleteMany();
    await prisma.slot.deleteMany();
    await prisma.schedule_template.deleteMany();
    await prisma.pet.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash(TEST_ADMIN_LOGIN.password, 10);
    await prisma.user.create({
      data: {
        email: TEST_ADMIN_LOGIN.email,
        password: passwordHash,
        role: 'admin',
        name: 'Super',
        surname: 'Admin',
      },
    });

    const loginRes = await request(app)
      .post('/api/users/login')
      .send(TEST_ADMIN_LOGIN);
    adminToken = loginRes.body.token;

    const vetPasswordHash = await bcrypt.hash(TEST_VET_DATA.vetPassword, 10);
    const vetUser = await prisma.user.create({
      data: {
        email: TEST_VET_DATA.vetEmail,
        password: vetPasswordHash,
        role: 'vet',
        name: TEST_VET_DATA.name,
        surname: TEST_VET_DATA.surname,
        vet: {
          create: {
            specialisation: TEST_VET_DATA.specialisation,
            experience: TEST_VET_DATA.experience,
            is_active: true,
          },
        },
      },
    });
    testVetId = vetUser.user_id;
  });

  describe('POST /api/vets/:vetUserId/schedule', () => {
    it('1. Should successfully create a schedule and generate slots', async () => {
      const scheduleRequest = {
        startDate: '2025-12-22',
        durationDays: 14,
        scheduleData: [
          {
            day_of_week: 'monday',
            start_time: '08:00:00',
            end_time: '14:00:00',
            slot_duration: 30,
          },
          {
            day_of_week: 'tuesday',
            start_time: '14:00:00',
            end_time: '20:00:00',
            slot_duration: 60,
          },
          {
            day_of_week: 'wednesday',
            start_time: '09:00:00',
            end_time: '17:00:00',
            slot_duration: 45,
          },
          {
            day_of_week: 'thursday',
            start_time: '10:00:00',
            end_time: '16:00:00',
            slot_duration: 30,
          },
          {
            day_of_week: 'friday',
            start_time: '08:00:00',
            end_time: '13:00:00',
            slot_duration: 30,
          },
        ],
      };

      const res = await request(app)
        .post(`/api/vets/${testVetId}/schedule`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(scheduleRequest);

      expect(res.status).toBe(201);
      expect(res.body.data.createdSlots).toBe(100);
    });

    it('2. Should return 409 conflict if schedule already exists', async () => {
      const res = await request(app)
        .post(`/api/vets/${testVetId}/schedule`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startDate: '2025-12-22',
          scheduleData: [
            {
              day_of_week: 'tuesday',
              start_time: '09:00:00',
              end_time: '10:00:00',
              slot_duration: 30,
            },
          ],
        });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/vets/:vetUserId/schedule/slots', () => {
    it('3. Should retrieve a list of slots for the vet', async () => {
      const res = await request(app)
        .get(`/api/vets/${testVetId}/schedule/slots`)
        .expect(200);

      expect(res.body.data.slots.length).toBe(100);
    });
  });

  describe('POST /api/vets/:vetUserId/schedule/slots', () => {
    it('4. Should add new slots for a different week based on template', async () => {
      const res = await request(app)
        .post(`/api/vets/${testVetId}/schedule/slots`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startDate: '2026-01-02',
          endDate: '2026-01-06',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.addedSlots).toBe(18);
    });
  });

  describe('GET /api/vets/:vetUserId/schedule/slots', () => {
    it('5. Should retrieve a list of slots for the vet after adding new ones', async () => {
      const res = await request(app)
        .get(`/api/vets/${testVetId}/schedule/slots`)
        .expect(200);

      expect(res.body.data.slots.length).toBe(118);
    });
  });

  describe('GET /api/vets/schedule/analytics', () => {
    it('6. Should generate clinic statistics for admin', async () => {
      const res = await request(app)
        .get('/api/vets/schedule/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ month: 12, year: 2025, minSlotsCount: 50 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reportData');
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
