const express = require('express');

const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');
const handleError = require('./middleware/error');

require('./db/mongoose');

const app = express();

app.use(express.json());

app.use(userRouter);
app.use(taskRouter);

app.use(handleError);

module.exports = app;