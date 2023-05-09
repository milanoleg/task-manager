const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/user');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const { sendWelcomeEmail } = require('../emails/account');

const uploader = multer({
  limits: {
    fileSize: 1000000 // 1 Mb
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|png|jpeg)$/i)) {
      return cb(new Error('Please, upload .jpg, .png or .jpeg file'));
    }

    return cb(undefined, true);
  }
});

const router = express.Router();
const allowedFields = ['name', 'password', 'email', 'age'];

router.post('/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByCredentials(email, password);

    if (!user) {
      res.status(400).send('Invalid user credentials');
    }

    const token = await user.generateAuthToken();
    user.tokens.push({ token });

    await user.save();

    res.send({ user: user, token });

  } catch (e) {
    console.log(e);
    res.status(500).send({ error: e });
  }
});

router.post('/users/signup', async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email });

  if (existingUser) {
    return res.status(400).send({ error: `User with email: ${req.body.email} already exists` });
  }

  const user = new User(req.body);
  const fieldsToCreate = Object.keys(req.body);
  const isValidUpdate = fieldsToCreate.every(update => allowedFields.includes(update));

  if (!isValidUpdate) {
    return res.status(400).send({ error: `Invalid create operation, available fields: ${allowedFields}` });
  }

  try {
    const createdUser = await user.save();

    sendWelcomeEmail(user.email, user.name);

    const token = await createdUser.generateAuthToken();
    createdUser.tokens.push({ token });

    await createdUser.save();

    res.status(201).send({ user: createdUser, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post('/users/logout', auth, async (req, res) => {
  try {
    const isLogoutAllSessions = req.body.logoutAll;

    req.user.tokens = isLogoutAllSessions ? [] : req.user.tokens.filter(token => token.token !== req.token);

    await req.user.save();

    res.send('Logged out');
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

router.get('/users/me', auth, async (req, res) => {
  try {
    res.send(req.user);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch('/users/me', auth, async (req, res) => {
  const fieldsToUpdate = Object.keys(req.body);
  const isValidUpdate = fieldsToUpdate.every(update => allowedFields.includes(update));

  if (!isValidUpdate) {
    return res.status(400).send({ error: `Invalid update operation, available fields: ${allowedFields}` });
  }

  try {
    if (!req.user) {
      return res.status(404).send(`User with id: ${req.user._id} does not exist`);
    }

    fieldsToUpdate.forEach(field => req.user[field] = req.body[field]);

    const savedUser = await req.user.save();

    res.send(savedUser);
  } catch (error) {
    if (error)
      res.status(500).send(error);
  }
});

router.delete('/users/me', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).send(`User with id: ${req.user._id} does not exist`);
    }

    const user = await User.findOneAndDelete({ _id: req.user._id });

    await Task.deleteMany({ owner: req.user._id });

    res.send(user);
  } catch (error) {
    if (error) {
      res.status(500).send(error);
    }
  }
});

router.post('/users/me/avatar', auth, uploader.single('avatar'), async (req, res) => {
  req.user.avatar = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();

  await req.user.save();

  res.status(200).send('Avatar uploaded');
});

router.get('/users/:id/avatar', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user?.avatar) {
      res.status(400).send();
    }

    res.set('Content-Type', 'image/png').send(user.avatar);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete('/users/me/avatar', auth, async (req, res) => {
  try {
    req.user.avatar = undefined;

    await req.user.save();

    res.status(200).send('Avatar deleted');
  } catch (error) {
    if (error) {
      res.status(500).send(error);
    }
  }
});

module.exports = router;