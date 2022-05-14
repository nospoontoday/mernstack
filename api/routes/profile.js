const express                       = require('express');
const router                        = express.Router();
const auth                          = require('../middleware/auth');
const { check, validationResult }   = require('express-validator');

const User      = require('../models/User');
const Profile   = require('../models/Profile');

// @route       GET api/profile/me
// @desc        Get current user's profile
// @access      Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

        if(!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }

        console.log(profile);
        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route       GET api/profile
// @desc        Create or update user profile
// @access      Private
router.post('/', [ auth, [
    check('position', 'Position is required')
        .not()
        .isEmpty(),
    check('skills', 'Skills is required')
        .not()
        .isEmpty()
] ], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const {
        company,
        website,
        location,
        bio,
        position,
        github_username,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body;

    //Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if(company) profileFields.company = company;
    if(website) profileFields.website = website;
    if(location) profileFields.website = location;
    if(bio) profileFields.bio = bio;
    if(position) profileFields.position = position;
    if(github_username) profileFields.github_username = github_username;
    if(skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    // Build social object
    profileFields.social = {};
    if(youtube) profileFields.social.youtube = youtube;
    if(twitter) profileFields.social.twitter = twitter;
    if(facebook) profileFields.social.facebook = facebook;
    if(linkedin) profileFields.social.linkedin = linkedin;
    if(instagram) profileFields.social.instagram = instagram;
    
    try {
        let profile = await Profile.findOne({ user: req.user.id });

        if(profile) {
            // Update
            profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });

            console.log(profile);
            return res.json(profile);
        }

        // Create

        profile = new Profile(profileFields);

        await profile.save();

        return res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

    res.send('Hello');
});

// @route       GET api/profile
// @desc        Get all profiles
// @access      Public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route       GET apo/profile/user/:user_id
// @desc        Get profile by user ID
// @access      Public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);
        
        if(!profile) return res.status(400).json({ msg: 'Profile not found' });

        res.json(profile);
    } catch (err) {
        console.error(err.message);

        if(err.kind == 'ObjectId') return res.status(400).json({ msg: 'Profile not found' });

        res.status(500).send('Server Error');
    }
});


module.exports = router;