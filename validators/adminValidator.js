import Joi from "joi";

export const adminSchemaValidator = Joi.object({
  secretCode: Joi.string().required().messages({
    "any.required": "Secret code is required",
  }),
  name: Joi.string().min(3).max(50).required().messages({
    "string.empty": "Name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Enter a valid email",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must be at least 8 characters long",
    "any.required": "Password is required",
  }),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    "string.pattern.base": "Phone number must be 10 digits",
    "any.required": "Phone number is required",
  }),
});
