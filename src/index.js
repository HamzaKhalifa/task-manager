const express = require('express');
require('./db/mongoose');

const app = express();
const port = process.env.PORT;

const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

app.use(express.json());

// Middleware for maintenance mode:
// app.use((req, res, next) => {
//     res.status(503).send('The site is under maintenance. Check back soon.');
// });

app.listen(port, () => {
    console.log('Server is up on port ' + port);
});

app.use(userRouter);
app.use(taskRouter);