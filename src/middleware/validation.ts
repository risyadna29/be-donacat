import type { Request, Response, NextFunction } from "express"
import Joi from "joi"
import type { ApiResponse } from "../types"

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dataToValidate = { ...req.body };

    // --- START: Detailed Logging ---
    console.log('\n🔍 --- VALIDATION MIDDLEWARE ---');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Route: ${req.method} ${req.originalUrl}`);
    console.log('Received req.body:', req.body);
    console.log('File info (req.file):', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    } : 'No file uploaded');
    console.log('Data prepared for validation:', dataToValidate);
    // --- END: Detailed Logging ---
    
    if (dataToValidate.target_amount) {
      dataToValidate.target_amount = Number(dataToValidate.target_amount);
    }
    
    if (dataToValidate.deadline) {
      dataToValidate.deadline = new Date(dataToValidate.deadline);
    }
    
    const { error, value: validatedValue } = schema.validate(dataToValidate, {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      // --- START: Enhanced Error Logging ---
      console.error('❌ --- VALIDATION FAILED! ---');
      console.error('Joi validation error details:', JSON.stringify(error.details, null, 2));
      // --- END: Enhanced Error Logging ---

      const response: ApiResponse = {
        success: false,
        message: "Validation Error",
        errors: error.details.map((detail) => detail.message),
      }
      res.status(400).json(response)
      return
    }

    console.log('✅ --- VALIDATION SUCCEEDED ---');
    req.body = validatedValue;
    next()
  }
}

// Validation Schemas
export const authSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(255).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(10).max(20).pattern(/^[0-9+\-\s()]+$/).required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  adminLogin: Joi.object({
    username: Joi.string().optional(),
    email: Joi.string().email().optional(),
    password: Joi.string().required(),
  }).custom((value, helpers) => {
    if (!value.username && !value.email) {
      return helpers.error('any.invalid', { message: 'Username or email is required' });
    }
    return value;
  }),
}

export const userSchemas = {
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(255),
    gender: Joi.string().valid("male", "female"),
    birth_date: Joi.date(),
    phone: Joi.string().min(10).max(20),
    address: Joi.string().max(500),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
  }),
}

export const communitySchemas = {
  joinCommunity: Joi.object({
    full_name: Joi.string().min(2).max(255).required(),
    gender: Joi.string().valid("male", "female").required(),
    birth_place: Joi.string().min(2).max(255).required(),
    birth_date: Joi.date().iso().required(),
    ktp_number: Joi.string().length(16).pattern(/^[0-9]+$/).required(),
    reason: Joi.string().min(10).max(1000).required(),
    data_agreement: Joi.string().valid("true").required(),
  }),
}

export const campaignSchemas = {
  createCampaign: Joi.object({
    title: Joi.string().min(5).max(255).required(),
    description: Joi.string().min(20).max(5000).required(),
    location: Joi.string().min(3).max(255).required(),
    category: Joi.string().valid("medical", "food", "rescue", "shelter", "other", "adoption").required(),
    target_amount: Joi.number().positive().required(),
    deadline: Joi.date().iso().greater("now").required(),
    bank_account: Joi.string().min(10).max(50).required(),
  }),
}

export const donationSchemas = {
  createDonation: Joi.object({
    campaign_id: Joi.string().uuid().required(),
    amount: Joi.number().positive().required(),
    payment_method: Joi.string().valid("qris", "bank_transfer", "e_wallet").required(),
    notes: Joi.string().max(500).optional(),
  }),
}
