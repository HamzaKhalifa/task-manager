const { Router } = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');

const router = new Router();

// limit /tasks?limit=10&skip=10
// For pagination: 
// If I skip 0 and set the limit at 10, then I get the 10 first results. 
// If I skip 10 and set the limit at 10, then I get the second set of 10.
router.get('/tasks', auth, async (req, res) => {
    // For filter
    const match = {};
    if (req.query.completed) {
        match.completed = req.query.completed;
    }

    const options = {};

    // For pagination
    if (req.query.skip) {
        options.skip = parseInt(req.query.skip)
    }
    if (req.query.limit) {
        options.limit = parseInt(req.query.limit)
    }

    // For sorting
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        options.sort = {
            [parts[0]]: parts[1] === 'desc' ? -1 : 1
        };
    }
    try {
        const tasks = await Task.find({ owner: req.user._id, ...match }, null, {...options});
        return res.send(tasks);
    } catch(e) {
        res.status(500).send();
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    try {
        // const task = await Task.findById(req.params.id);
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        if (!task) return res.status(404).send();

        task.populate('owner').execPopulate();
        res.send(task);
    } catch(e) {
        res.status(500).send();
    }
})

router.post('/tasks', auth, async (req, res) => {
    let task = new Task({...req.body, owner: req.user._id});
    try {
        task = await task.save();
        res.status(201).send(task);
    } catch(error) {
        res.status(400).send();
    }
});


router.patch('/tasks/:id', auth, async (req, res) => {
    const allowedUpdates = ['description', 'completed'];
    const updates = Object.keys(req.body);
    const isValid = updates.every(update => allowedUpdates.includes(update));
    if (!isValid) {
        return res.status(400).send('Invalid updates!');
    }
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        if (!task) return res.status(404).send();

        updates.forEach(update => task[update] = req.body[update]);
        await task.save();
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});
        res.send(task);
    } catch(e) {
        res.status(400).send(e);
    }
});

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        if (!task) return res.status(404).send();
        res.send(task);
    } catch(e) {
        res.status(500).send();
    }
});

module.exports = router;