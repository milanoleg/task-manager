const express = require('express');

const Task = require('../models/task');
const auth = require('../middleware/auth');

const router = express.Router();

const allowedFields = ['description', 'completed', 'owner'];

router.post('/tasks', auth, async (req, res) => {
  const owner = req.user._id;
  const taskFields = { ...req.body, owner };
  const task = new Task(taskFields);
  const fieldsToUpdate = Object.keys(taskFields);
  const isValidUpdate = fieldsToUpdate.every(update => allowedFields.includes(update));

  if (!isValidUpdate) {
    return res.status(400).send({ error: `Invalid create operation, available fields: ${allowedFields}` });
  }

  try {
    const createdTask = await task.save();

    res.status(201).send(createdTask);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/tasks/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOne({ _id: id, owner: req.user._id });

    if (!task) {
      return res.status(404).send('No tasks found for the logged in User');
    }

    res.send(task);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/tasks', auth, async (req, res) => {
  const { completed, limit, skip, sortBy } = req.query;
  const match = {};
  const sort = {};

  try {
    // const tasks = await Task.find({ owner: req.user._id });
    if (completed !== undefined) {
      match.completed = completed;
    }

    if (!!sortBy) {
      const [field, direction] = sortBy.split(':');

      sort[`${field}`] = direction === 'ASC' ? 1 : -1;
    }

    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        sort,
      },
    });

    res.send(req.user.tasks);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch('/tasks/:id', auth, async (req, res) => {
  const fieldsToUpdate = Object.keys(req.body);
  const isValidUpdate = fieldsToUpdate.every(update => allowedFields.includes(update));

  if (!isValidUpdate) {
    return res.status(400).send({ error: `Invalid update operation, available fields: ${allowedFields}` });
  }

  try {
    const { id } = req.params;
    const task = await Task.findOne({ _id: id, owner: req.user._id });

    if (!task) {
      return res.status(404).send(`Task with id: ${id} does not exist`);
    }

    fieldsToUpdate.forEach(field => task[field] = req.body[field]);
    const savedTask = await task.save();

    res.send(savedTask);
  } catch (error) {
    if (error)

      res.status(400).send(error);
  }
});

router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOneAndDelete({ _id: id, owner: req.user._id });

    if (!task) {
      return res.status(404).send(`Task with id: ${id} does not exist`);
    }

    res.send(task);
  } catch (error) {
    if (error)
      res.status(400).send(error);
  }
});

module.exports = router;