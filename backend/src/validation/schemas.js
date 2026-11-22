const { z } = require('zod');
const { PROJECT_ROLES } = require('../utils/permissions');
const { TICKET_TYPES, TICKET_STATUSES, TICKET_PRIORITIES } = require('../models/Ticket');

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid identifier');

const optionalId = z.union([objectId, z.null()]).optional();
const dueDate = z.union([z.string().max(40), z.null()]).optional();
const labels = z.array(z.string().trim().min(1).max(24)).max(8).optional();
const color = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value such as #4f46e5')
  .optional();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  avatarColor: color,
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(72),
});

const projectCreateSchema = z.object({
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).optional(),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z][A-Z0-9]{1,7}$/, 'Key must be 2-8 letters/numbers and start with a letter')
    .optional(),
  color,
});

const projectUpdateSchema = z.object({
  title: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(1000).optional(),
  color,
  status: z.enum(['active', 'archived']).optional(),
});

const memberAddSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  role: z.enum(PROJECT_ROLES).default('developer'),
});

const memberRoleSchema = z.object({
  role: z.enum(PROJECT_ROLES),
});

const ticketCreateSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(140),
  description: z.string().trim().max(8000).optional(),
  type: z.enum(TICKET_TYPES).optional(),
  status: z.enum(TICKET_STATUSES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  assignee: optionalId,
  labels,
  dueDate,
});

const ticketUpdateSchema = ticketCreateSchema.partial();

const ticketStatusSchema = z.object({
  status: z.enum(TICKET_STATUSES),
  position: z.number().int().min(0).optional(),
});

const commentCreateSchema = z.object({
  text: z.string().trim().min(1, 'Comment cannot be empty').max(2000),
  parentId: optionalId,
});

const commentUpdateSchema = z.object({
  text: z.string().trim().min(1, 'Comment cannot be empty').max(2000),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  projectCreateSchema,
  projectUpdateSchema,
  memberAddSchema,
  memberRoleSchema,
  ticketCreateSchema,
  ticketUpdateSchema,
  ticketStatusSchema,
  commentCreateSchema,
  commentUpdateSchema,
};
