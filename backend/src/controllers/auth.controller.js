import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { Hostel } from '../models/hostel.model.js';
import { signToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import mongoose from 'mongoose';

export const register = asyncHandler(async (req, res) => {
    const { name, email, password, hostel: hostelInput, room, role } = req.body;
    if (!name || !password) throw new ApiError(400, 'Name and password required');

    if (email) {
        const exists = await User.findOne({ email });
        if (exists) throw new ApiError(400, 'Email already registered');
    }

    // Resolve hostel: allow either ObjectId string or hostel name
    let hostelId = null;
    if (hostelInput) {
        // If it's a valid ObjectId string, try to use it
        if (mongoose.Types.ObjectId.isValid(hostelInput)) {
            const h = await Hostel.findById(hostelInput);
            if (h) hostelId = h._id;
            else throw new ApiError(400, 'hostel id provided but not found');
        } else {
            // treat as hostel name (case-insensitive)
            const h = await Hostel.findOne({ name: { $regex: `^${hostelInput}$`, $options: 'i' } });
            if (h) hostelId = h._id;
            else throw new ApiError(400, 'hostel name provided not found; create hostel first or provide valid id');
        }
    }

    const userRole = ['student', 'shop_owner'].includes(role) ? role : 'student';
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email, passwordHash, hostel: hostelId, room, role: userRole })
    const token = signToken({ sub: user._id });

    res.status(201).json({
        data: {
            user: { id: user._id, name: user.name, email: user.email, hostel: user.hostel, room: user.room, role: user.role },
            token
        }
    });
});


export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) throw new ApiError(400, 'Email and password required');

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(401, 'Invalid credentials');

    const ok = await user.comparePassword(password);
    if (!ok) throw new ApiError(401, 'Invalid credentials');

    const token = signToken({ sub: user._id });
    res.json({ data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token } });
});

export const me = asyncHandler(async (req, res) => {
    res.json({ data: req.user });
});
