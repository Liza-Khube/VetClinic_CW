import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/prismaClient.js';
import bcrypt from 'bcrypt';

const TEST_OWNER_DATA = {
  email: 'test.user@gmail.com',
  password: 'Password123',
  name: 'Test',
  surname: 'User',
  phone: '380991112233',
};

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

describe('Users and Auth API Tests', () => {
  let adminToken = '';
  let ownerToken = '';

  beforeEach(async () => {
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
  });

  describe('POST /api/users/register', () => {
    it('1. Register Owner', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send(TEST_OWNER_DATA)
        .expect(201);

      expect(response.body.message).toBe('Owner registration succeded');
      expect(response.body.user.email).toBe(TEST_OWNER_DATA.email);
      expect(response.body.user.role).toBe('owner');

      const createdUser = await prisma.user.findUnique({
        where: { email: TEST_OWNER_DATA.email },
      });
      const ownerProfile = await prisma.owner.findUnique({
        where: { user_id: createdUser.user_id },
      });

      expect(createdUser).not.toBeNull();
      expect(ownerProfile).not.toBeNull();
    });

    it('2. ConflictError (if email exists)', async () => {
      await request(app).post('/api/users/register').send(TEST_OWNER_DATA);

      const response = await request(app)
        .post('/api/users/register')
        .send(TEST_OWNER_DATA)
        .expect(409);

      expect(response.body.message).toContain(
        'User with this email already exists'
      );
    });
  });

  describe('POST /api/users/create-vet', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send(TEST_ADMIN_LOGIN);

      if (response.statusCode !== 200) {
        throw new Error(
          `Admin login failed in beforeEach: Status ${response.statusCode}`
        );
      }

      adminToken = response.body.token;
    });

    it('3. Create a vet', async () => {
      const response = await request(app)
        .post('/api/users/create-vet')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(TEST_VET_DATA)
        .expect(201);

      expect(response.body.message).toBe('Vet account was created');
      expect(response.body.user.email).toBe(TEST_VET_DATA.vetEmail);
      expect(response.body.user.role).toBe('vet');

      const createdUser = await prisma.user.findUnique({
        where: { email: TEST_VET_DATA.vetEmail },
      });
      const vetProfile = await prisma.vet.findUnique({
        where: { user_id: createdUser.user_id },
      });

      expect(vetProfile.specialisation).toBe('Dental');
    });

    it('4. Failed if token is missing (Authentication Error 401)', async () => {
      await request(app)
        .post('/api/users/create-vet')
        .send(TEST_VET_DATA)
        .expect(401);
    });

    it('5. Failed if user is not admin (Authorization Error 403)', async () => {
      await request(app).post('/api/users/register').send(TEST_OWNER_DATA);
      const loginResponse = await request(app)
        .post('/api/users/login')
        .send(TEST_OWNER_DATA);
      ownerToken = loginResponse.body.token;

      const response = await request(app)
        .post('/api/users/create-vet')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(TEST_VET_DATA)
        .expect(403);

      expect(response.body.message).toContain('Forbidden: Requires role admin');
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
