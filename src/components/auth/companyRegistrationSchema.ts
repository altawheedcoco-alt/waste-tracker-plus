import { z } from 'zod';

const phoneRegex = /^[\d\s+\-()]{8,20}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const companyRegistrationSchema = z.object({
  organizationType: z.string().min(1, 'نوع الشركة مطلوب'),
  organizationName: z.string().trim().min(2, 'اسم الشركة مطلوب (حرفين على الأقل)').max(200, 'الحد الأقصى 200 حرف'),
  organizationNameEn: z.string().trim().max(200, 'الحد الأقصى 200 حرف').optional().or(z.literal('')),
  organizationEmail: z.string().trim().regex(emailRegex, 'بريد إلكتروني غير صالح').max(255),
  organizationPhone: z.string().trim().regex(phoneRegex, 'رقم هاتف غير صالح'),
  secondaryPhone: z.string().trim().regex(phoneRegex, 'رقم هاتف غير صالح').optional().or(z.literal('')),
  address: z.string().trim().min(5, 'العنوان مطلوب (5 أحرف على الأقل)').max(500, 'الحد الأقصى 500 حرف'),
  city: z.string().trim().max(100).optional().or(z.literal('')),
  region: z.string().trim().max(100).optional().or(z.literal('')),
  commercialRegister: z.string().trim().min(1, 'السجل التجاري مطلوب').max(50, 'الحد الأقصى 50 حرف'),
  environmentalLicense: z.string().trim().max(50).optional().or(z.literal('')),
  activityType: z.string().trim().max(500).optional().or(z.literal('')),
  productionCapacity: z.string().trim().max(100).optional().or(z.literal('')),
  representativeName: z.string().trim().min(2, 'اسم المسؤول مطلوب').max(100, 'الحد الأقصى 100 حرف'),
  representativePosition: z.string().trim().max(100).optional().or(z.literal('')),
  representativePhone: z.string().trim().regex(phoneRegex, 'رقم هاتف غير صالح').optional().or(z.literal('')),
  representativeEmail: z.string().trim().regex(emailRegex, 'بريد إلكتروني غير صالح').optional().or(z.literal('')),
  representativeNationalId: z.string().trim().max(20).optional().or(z.literal('')),
  delegateName: z.string().trim().max(100).optional().or(z.literal('')),
  delegatePhone: z.string().trim().regex(phoneRegex, 'رقم هاتف غير صالح').optional().or(z.literal('')),
  delegateEmail: z.string().trim().regex(emailRegex, 'بريد إلكتروني غير صالح').optional().or(z.literal('')),
  delegateNationalId: z.string().trim().max(20).optional().or(z.literal('')),
  agentName: z.string().trim().max(100).optional().or(z.literal('')),
  agentPhone: z.string().trim().regex(phoneRegex, 'رقم هاتف غير صالح').optional().or(z.literal('')),
  agentEmail: z.string().trim().regex(emailRegex, 'بريد إلكتروني غير صالح').optional().or(z.literal('')),
  agentNationalId: z.string().trim().max(20).optional().or(z.literal('')),
  email: z.string().trim().regex(emailRegex, 'بريد إلكتروني غير صالح للدخول').max(255).optional().or(z.literal('')),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').max(128),
  fullName: z.string().trim().min(2, 'الاسم مطلوب').max(100),
  phone: z.string().trim().regex(phoneRegex, 'رقم هاتف غير صالح').optional().or(z.literal('')),
});

export type CompanyFormSchema = z.infer<typeof companyRegistrationSchema>;
