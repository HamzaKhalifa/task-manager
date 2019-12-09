const { Router } = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendCancelEmail } = require('../emails/account');

const router = new Router();

// User profile
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
})

// Any user Profile
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) return res.send(user);
        return res.status(404).send();
    } catch(e) {
        res.status(500).send();
    }
})

// Register
router.post('/users', async (req, res) => {
    let user = new User(req.body);
    const token = await user.generateAuthToken();
    try {
        user = await user.save();
        sendWelcomeEmail(user.email, user.name);
        res.status(201).send({user, token});
    } catch(e) {
        res.status(400).send(e);
    }
});

// Login
router.post('/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOneByCredentials(email, password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch(e) {
        res.status(400).send(e);
    }
});
 
// Logout
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
        await req.user.save();
        res.send('Logged out');
    } catch(e) {
        res.status(500).send(e);
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send('Logged out from all devices');
    } catch(e) {
        res.status(500).send();
    }
})

// Updating user
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'age', 'email', 'password'];
    updates.forEach(update => {
        if (!allowedUpdates.includes(update))
            return res.status(400).send('Field ' + update + ' cannot be updated');
    });

    try {
        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();
        res.send(req.user);
    } catch(e) {
        res.status(400).send(e);
    }
});

// Deleting one's account
router.delete('/users', auth, async (req, res) => {
    try {
        //const user = await User.findByIdAndDelete(req.user._id);
        await req.user.remove();
        sendCancelEmail(req.user.emial, req.user.name);
        res.send(req.user);
    } catch(e) {
        res.status(500).send(e);
    }
});

// For avatar picture
const upload = multer({
    // dest: 'avatars',
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) 
            return cb(new Error('Only images are allowed'));

        cb(undefined, true);
    }
});

// Post an avatar picture
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();

    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

// Delete the avatar picture
router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save();
        res.send();
    } catch(e) {
        res.status(500).send(e);
    }
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user && user.avatar) {
            res.set('Content-Type', 'image/png');
            return res.send(user.avatar);
        }
        
        throw new Error();
    } catch (error) {
        res.status(404).send();
    }
});

module.exports = router;