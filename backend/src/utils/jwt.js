import jwt from 'jsonwebtoken';
import { configs } from '../config/env.js';

export const signToken = (payload) =>
  jwt.sign(payload, configs.JWT_SECRET, { expiresIn: configs.JWT_EXPIRES_IN });

export const verifyToken = (token) => jwt.verify(token, configs.JWT_SECRET);
export const decodeToken = (token) => jwt.decode(token, { complete: true });

