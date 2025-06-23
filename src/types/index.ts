export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
  errors?: string[]
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface DatabaseResult {
  insertId?: number
  affectedRows: number
  changedRows?: number
}

// Auth Types dengan explicit field definitions
export interface RegisterRequest {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AdminLoginRequest {
  username?: string
  email?: string
  password: string
}

// JWT Payload interfaces dengan semua field yang diperlukan
export interface JwtPayload {
  id: string
  email: string
  role: UserRole
  iat?: number // issued at
  exp?: number // expiry
  iss?: string // issuer
  aud?: string // audience
  type?: string // token type (access, refresh)
}

export interface AdminJwtPayload {
  id: string
  username: string
  role: AdminRole
  iat?: number // issued at
  exp?: number // expiry
  iss?: string // issuer
  aud?: string // audience
  type?: string // token type (access, refresh)
}

export type UserRole = "guest" | "user" | "community_member"
export type AdminRole = "admin" | "super_admin"

// User Types
export interface User {
  id: string
  name: string
  email: string
  phone: string
  password: string
  gender?: "male" | "female"
  birth_date?: Date
  address?: string
  role: UserRole
  is_verified: boolean
  created_at: Date
  updated_at: Date
}

export interface UpdateProfileRequest {
  name?: string
  gender?: "male" | "female"
  birth_date?: string
  phone?: string
  address?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UserPublic {
  id: string
  name: string
  email: string
  phone: string
  gender?: "male" | "female"
  birth_date?: Date
  address?: string
  role: UserRole
  is_verified: boolean
  created_at: Date
  updated_at?: Date
}

// Admin Types
export interface AdminUser {
  id: string
  username: string
  email: string
  password: string
  full_name: string
  role: AdminRole
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface AdminPublic {
  id: string
  username: string
  email: string
  full_name: string
  role: AdminRole
  created_at: Date
}

// Campaign Types
export interface Campaign {
  id: string
  user_id: string
  title: string
  description: string
  location: string
  category: CampaignCategory
  target_amount: number
  current_amount: number
  deadline: Date
  bank_account: string
  status: CampaignStatus
  admin_notes?: string
  created_at: Date
  updated_at: Date
}

export interface CreateCampaignRequest {
  title: string
  description: string
  location: string
  category: CampaignCategory
  target_amount: number
  deadline: string
  bank_account: string
}

export interface CampaignWithUser extends Campaign {
  user_name: string
  user_email: string
  images: CampaignImage[]
}

export interface CampaignImage {
  id: string
  campaign_id: string
  image_url: string
  is_primary: boolean
  created_at: Date
}

export type CampaignCategory = "medical" | "food" | "rescue" | "shelter" | "other"
export type CampaignStatus = "pending" | "active" | "completed" | "rejected" | "expired"

// Donation Types
export interface Donation {
  id: string
  user_id: string
  campaign_id: string
  amount: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  transaction_id?: string
  payment_proof?: string
  notes?: string
  created_at: Date
  updated_at: Date
}

export interface CreateDonationRequest {
  campaign_id: string
  amount: number
  payment_method: PaymentMethod
  notes?: string
}

export interface DonationWithDetails extends Donation {
  campaign_title: string
  campaign_location: string
  user_name: string
}

export type PaymentMethod = "qris" | "bank_transfer" | "e_wallet"
export type PaymentStatus = "pending" | "success" | "failed" | "cancelled"

// Community Types
export interface CommunityRequest {
  id: string
  user_id: string
  full_name: string
  gender: "male" | "female"
  birth_place: string
  birth_date: Date
  ktp_number: string
  ktp_photo: string
  reason: string
  data_agreement: boolean
  status: "pending" | "approved" | "rejected"
  admin_notes?: string
  created_at: Date
  updated_at: Date
}

export interface JoinCommunityRequest {
  full_name: string
  gender: "male" | "female"
  birth_place: string
  birth_date: string
  ktp_number: string
  reason: string
  data_agreement: boolean | string
}

export interface CommunityRequestWithUser extends CommunityRequest {
  user_name: string
  user_email: string
}
