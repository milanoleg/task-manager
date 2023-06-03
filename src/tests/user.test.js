const request = require('supertest');
const { Types } = require('mongoose');
const jwt = require('jsonwebtoken');

const app = require('../app');
const User = require('../models/user');

const testUserId = new Types.ObjectId();

const testUser = {
  _id: testUserId,
  name: "TestUser",
  email: "test-api-user@mail.com",
  age: 21,
  password: "TESTtest123!!",
  tokens: [{
    token: jwt.sign({ _id: testUserId }, process.env.JWT_SECRET)
  }]
};

describe('app.js', () => {
  beforeAll(async () => {
    await User.deleteMany();

    await new User(testUser).save();
  });

  it('should signup new User', async () => {
    const response = await request(app)
      .post('/users/signup')
      .send({
        name: "Andrew",
        email: "kanal.oleg@test.com",
        age: 29,
        password: "APPapp063"
      })
      .expect(201);

    const user = await User.findById(response.body.user._id);

    expect(user).not.toBeNull();
    expect(user.name).toBe('Andrew');
    expect(user.password).not.toBe('APPapp063');
  });

  it('should log in existing User', async () => {
    const response = await request(app).post('/users/login').send({
      email: testUser.email,
      password: testUser.password
    }).expect(200);

    const user = await User.findById(response.body.user._id);

    expect(response.body.token).toBe(user.tokens[1].token);
  });

  it('should NOT log in User with wrong credentials', async () => {
    await request(app).post('/users/login').send({
      email: testUser.email,
      password: "Test123!!"
    }).expect(400);
  });

  it('should get User profile', async () => {
    const response = await request(app)
      .get('/users/me')
      .set('Authorization', `Bearer ${testUser.tokens[0].token}`)
      .send()
      .expect(200);

    const user = await User.findById(response.body._id);

    expect(user).not.toBeNull();
    expect(user.name).toBe('TestUser');
    expect(user.password).not.toBe('TESTtest123!!');
  });

  it('should NOT get User profile for unauthenticated User', async () => {
    await request(app)
      .get('/users/me')
      .send()
      .expect(401);
  });

  it('should upload User avatar', async () => {
    await request(app)
      .post('/users/me/avatar')
      .set('Authorization', `Bearer ${testUser.tokens[0].token}`)
      .attach('avatar', 'src/tests/fixtures/Avatar_GlobalLogic.png')
      .expect(200);

    const user = await User.findById(testUser._id);

    expect(user.avatar).toEqual(expect.any(Buffer));
  });

  it('should update valid user fields', async () => {
    const newUser = {
      name: 'John',
      age: 28,
    };

    await request(app)
      .patch('/users/me')
      .set('Authorization', `Bearer ${testUser.tokens[0].token}`)
      .send(newUser)
      .expect(200);

    const user = await User.findById(testUser._id);

    expect(user.name).toEqual(newUser.name);
    expect(user.age).toEqual(newUser.age);
  });

  it('should NOT update invalid user fields', async () => {
    await request(app)
      .patch('/users/me')
      .set('Authorization', `Bearer ${testUser.tokens[0].token}`)
      .send({
        location: 'city',
      })
      .expect(400);
  });

  it('should delete User profile', async () => {
    const response = await request(app)
      .delete('/users/me')
      .set('Authorization', `Bearer ${testUser.tokens[0].token}`)
      .send()
      .expect(200);

    const user = await User.findById(response.body._id);

    expect(user).toBeNull();
  });

  it('should NOT delete User profile for unauthenticated User', async () => {
    await request(app)
      .get('/users/me')
      .send()
      .expect(401);
  });
});

