// Test environment bootstrap
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_temprfit_32bytes_long';
process.env.NODE_ENV = 'test';
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test_key_placeholder';

import RevokedToken from './../models/RevokedToken.js';
// By default in offline test runs, avoid unmocked Mongoose buffering timeouts
RevokedToken.findOne = async () => null;
RevokedToken.findOneAndUpdate = async () => ({});
