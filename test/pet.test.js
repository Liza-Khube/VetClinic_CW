import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/prismaClient.js';
import bcrypt from 'bcrypt';

const TEST_ADMIN_LOGIN = {
  email: 'admin1@gmail.com',
  password: 'psswdAdmin',
};

const TEST_OWNER_DATA = {
  email: 'kostya.shevchuk@gmail.com',
  password: 'Password123',
  name: 'Kostyantyn',
  surname: 'Shevchuk',
  phone: '380991112244',
};

const TEST_PET = {
  name: 'Bonia',
  dateOfBirth: '2020-11-15',
  gender: 'female',
  speciesName: 'cat',
  breedName: 'sphynx',
};

let adminToken = '';
let ownerToken = '';

beforeEach(async () => {
  await prisma.pet.deleteMany();
  await prisma.breed.deleteMany();
  await prisma.species.deleteMany();
  await prisma.vet.deleteMany();
  await prisma.owner.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(TEST_ADMIN_LOGIN.password, 10);
  const admin = await prisma.user.create({
    data: {
      email: TEST_ADMIN_LOGIN.email,
      password: passwordHash,
      role: 'admin',
      name: 'Super',
      surname: 'Admin',
    },
  });
  const loginResponseAdmin = await request(app)
    .post('/api/users/login')
    .send({
      email: TEST_ADMIN_LOGIN.email,
      password: TEST_ADMIN_LOGIN.password,
    })
    .expect(200);
  adminToken = loginResponseAdmin.body.token;

  await request(app).post('/api/users/register').send(TEST_OWNER_DATA).expect(201);

  const loginResponseOwner = await request(app).post('/api/users/login').send({
    email: TEST_OWNER_DATA.email,
    password: TEST_OWNER_DATA.password,
  });

  ownerToken = loginResponseOwner.body.token;
});

describe('Pet Controller Logic', () => {
  it('1. Create Pet (Success)', async () => {
    const response = await request(app)
      .post('/api/owner/create-pet')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(TEST_PET)
      .expect(200);
    expect(response.body.message).toBe('Pet created successfully');
    expect(response.body.pet).toBeDefined();
    expect(response.body.pet.name).toBe(TEST_PET.name);
  });

  it('2. Create Pet Validation Error (Missing fields)', async () => {
    const response = await request(app)
      .post('/api/owner/create-pet')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'NoData',
      })
      .expect(400);
  });

  it('3. Create Pet Unauthorized (No Token)', async () => {
    await request(app).post('/api/owner/create-pet').send(TEST_PET).expect(401);
  });

  it('4. View My Pets', async () => {
    await request(app)
      .post('/api/owner/create-pet')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(TEST_PET)
      .expect(200);

    const response = await request(app)
      .get('/api/owner/my-pets')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(response.body.pets).toBeDefined();
    expect(Array.isArray(response.body.pets)).toBe(true);
    expect(response.body.pets.length).toBeGreaterThanOrEqual(1);
    expect(response.body.pets[0].name).toBe(TEST_PET.name);
  });

  it('5. View All Pets (Admin)', async () => {
    await request(app)
      .post('/api/owner/create-pet')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(TEST_PET)
      .expect(200);

    const response = await request(app)
      .get('/api/pets/all-pets')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.message).toBe('Pet list is shown');
    expect(response.body.data).toBeDefined();
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    expect(response.body.data[0].name).toBe(TEST_PET.name);
    expect(response.body.data[0].breed).toBeDefined();
  });

  it('6. View All Pets Forbidden (Owner role)', async () => {
    await request(app)
      .get('/api/pets/all-pets')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(403);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
