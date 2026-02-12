const express = require('express');
const router = express.Router();
const { register, login, logout, refreshToken, getMe, updateMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerValidator, loginValidator, changePasswordValidator, updateProfileValidator } = require('../validators/authValidators');

// Public routes
router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.post('/refresh', refreshToken);

// Protected routes
router.use(protect);
router.post('/logout', logout);
router.get('/me', getMe);
router.put('/me', updateProfileValidator, validate, updateMe);
router.put('/change-password', changePasswordValidator, validate, changePassword);

module.exports = router;
