const express                       = require('express');
const router                        = express.Router();
const config                        = require('config');
const auth                          = require('../middleware/auth');
const { Octokit }                   = require("@octokit/core");
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

// @route       GET api/profile/user/:user_id
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

// @route       DELETE api/profile
// @desc        Delete profile, user & posts
// @access      Private

router.delete('/', auth, async (req, res) => {
    try {
        // @todo - remove user's posts

        // Remove profile
        await Profile.findOneAndRemove({ user: req.user.id  });
        // Remove user
        await User.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: 'User successfully deleted.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route       PUT api/profile/experience
// @desc        Add profile experience
// @access      Private

router.put('/experience', [auth, [
    check('title', 'Title is required')
        .not()
        .isEmpty(),
    check('company', 'Company is required')
        .not()
        .isEmpty(),
    check('from', 'From date is required')
        .not()
        .isEmpty()
] ], async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
        title,
        location,
        company,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp = {
        title,
        location,
        company,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id  });

        profile.experience.unshift(newExp);

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route       DELETE api/profile/experience/:exp_id
// @desc        Delete Experience from profile
// @access      Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        const removeIndex = profile.experience.findIndex(p => p.id == req.params.exp_id);

        if (removeIndex > -1) {
            profile.experience.splice(removeIndex, 1);
            await profile.save();

            return res.json(profile);
        }

        return res.status(400).json({ msg: 'Experience not found' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route       PUT api/profile/education
// @desc        Add profile education
// @access      Private

router.put('/education', [auth, [
    check('school', 'School is required')
        .not()
        .isEmpty(),
    check('degree', 'Degree is required')
        .not()
        .isEmpty(),
    check('field_of_study', 'Field of study is required')
        .not()
        .isEmpty(),
    check('from', 'From date is required')
        .not()
        .isEmpty()
] ], async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
        school,
        degree,
        field_of_study,
        from,
        to,
        current,
        description
    } = req.body;

    const newEduc = {
        school,
        degree,
        field_of_study,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id  });

        profile.education.unshift(newEduc);

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route       DELETE api/profile/education/:educ_id
// @desc        Delete Education from profile
// @access      Private

router.delete('/education/:educ_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        const removeIndex = profile.education.findIndex(p => p.id == req.params.educ_id);

        if (removeIndex > -1) {
            profile.education.splice(removeIndex, 1);
            await profile.save();

            return res.json(profile);
        }

        return res.status(400).json({ msg: 'Education not found' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route       GET api/profile/github/org
// @desc        Get user repos from github
// @access      Private

router.get('/github/:username', async (req, res) => {
    try {
        const octokit = new Octokit({
            auth: config.get('githubPersonalAccessToken')
        })

        const response = await octokit.request('GET /users/{username}/repos', {
            username: req.params.username
        });

        if(response.error || response.status != 200) {
            console.error(response.error);
            return res.status(404).json({ msg: 'Not github profile found' });
        }

        return res.json(response.data);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})


module.exports = router;