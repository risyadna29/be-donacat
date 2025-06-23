import { v4 as uuidv4 } from "uuid"
import db from "../config/database"
import { hashPassword, comparePassword } from "../utils/bcrypt"
import { generateToken, generateAdminToken } from "../utils/jwt"
import { AppError } from "../middleware/errorHandler"
import { getUserPermissions, getAdminPermissions, formatUserRole, formatAdminRole } from "../utils/roleUtils"
import type {
  RegisterRequest,
  LoginRequest,
  AdminLoginRequest,
  User,
  AdminUser,
  UserPublic,
  AdminPublic,
} from "../types"

export class AuthService {
  async register(userData: RegisterRequest): Promise<{
    token: string
    user: UserPublic
    permissions: string[]
    roleInfo: {
      role: string
      displayName: string
      level: number
    }
  }> {
    const { name, email, phone, password } = userData

    // Check if user already exists
    const [existingUsers] = (await db.execute("SELECT id FROM users WHERE email = ? OR phone = ?", [email, phone])) as [
      User[],
      any,
    ]

    if (existingUsers.length > 0) {
      throw new AppError("User already exists with this email or phone number", 409)
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user with default role 'user'
    const userId = uuidv4()
    await db.execute("INSERT INTO users (id, name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)", [
      userId,
      name,
      email,
      phone,
      hashedPassword,
      "user", // Default role
    ])

    // Get created user
    const [users] = (await db.execute(
      "SELECT id, name, email, phone, gender, birth_date, address, role, is_verified, created_at FROM users WHERE id = ?",
      [userId],
    )) as [UserPublic[], any]

    const user = users[0]
    const permissions = getUserPermissions(user.role)

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    return {
      token,
      user,
      permissions,
      roleInfo: {
        role: user.role,
        displayName: formatUserRole(user.role),
        level: this.getUserRoleLevel(user.role),
      },
    }
  }

  async login(loginData: LoginRequest): Promise<{
    token: string
    user: UserPublic
    permissions: string[]
    roleInfo: {
      role: string
      displayName: string
      level: number
    }
  }> {
    const { email, password } = loginData

    // Find user
    const [users] = (await db.execute("SELECT * FROM users WHERE email = ?", [email])) as [User[], any]

    if (users.length === 0) {
      throw new AppError("Invalid email or password", 401)
    }

    const user = users[0]

    // Verify password
    const isValidPassword = await comparePassword(password, user.password)
    if (!isValidPassword) {
      throw new AppError("Invalid email or password", 401)
    }

    // Generate token with role information
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    // Get user permissions
    const permissions = getUserPermissions(user.role)

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    return {
      token,
      user: userWithoutPassword as UserPublic,
      permissions,
      roleInfo: {
        role: user.role,
        displayName: formatUserRole(user.role),
        level: this.getUserRoleLevel(user.role),
      },
    }
  }

  async adminLogin(loginData: AdminLoginRequest): Promise<{
    token: string
    admin: AdminPublic
    permissions: string[]
    roleInfo: {
      role: string
      displayName: string
      level: number
    }
  }> {
    const username = loginData.username
    const email = loginData.email
    const password = loginData.password

    // Support both username and email login
    let query: string
    let params: string[]
    
    if (username) {
      query = "SELECT * FROM admin_users WHERE username = ? AND is_active = TRUE"
      params = [username]
    } else if (email) {
      query = "SELECT * FROM admin_users WHERE email = ? AND is_active = TRUE"
      params = [email]
    } else {
      throw new AppError("Username or email is required", 400)
    }

    const [admins] = (await db.execute(query, params)) as [AdminUser[], any]

    if (admins.length === 0) {
      throw new AppError("Invalid credentials", 401)
    }

    const admin = admins[0]
    const isValidPassword = await comparePassword(password, admin.password)

    if (!isValidPassword) {
      throw new AppError("Invalid credentials", 401)
    }

    // Generate admin token
    const token = generateAdminToken({
      id: admin.id,
      username: admin.username,
      role: admin.role,
    })

    // Get admin permissions
    const permissions = getAdminPermissions(admin.role)

    // Return admin without password
    const { password: _, ...adminWithoutPassword } = admin

    return {
      token,
      admin: adminWithoutPassword as AdminPublic,
      permissions,
      roleInfo: {
        role: admin.role,
        displayName: formatAdminRole(admin.role),
        level: this.getAdminRoleLevel(admin.role),
      },
    }
  }

  async verifyToken(token: string): Promise<{ valid: boolean; decoded?: any; roleInfo?: any }> {
    try {
      const jwt = await import("jsonwebtoken")
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as any

      let roleInfo = null
      if (decoded.role) {
        if (decoded.username) {
          // Admin token
          roleInfo = {
            type: "admin",
            role: decoded.role,
            displayName: formatAdminRole(decoded.role),
            level: this.getAdminRoleLevel(decoded.role),
            permissions: getAdminPermissions(decoded.role),
          }
        } else {
          // User token
          roleInfo = {
            type: "user",
            role: decoded.role,
            displayName: formatUserRole(decoded.role),
            level: this.getUserRoleLevel(decoded.role),
            permissions: getUserPermissions(decoded.role),
          }
        }
      }

      return { valid: true, decoded, roleInfo }
    } catch (error) {
      return { valid: false }
    }
  }

  private getUserRoleLevel(role: string): number {
    const roleLevels: Record<string, number> = {
      guest: 0,
      user: 1,
      community_member: 2,
    }
    return roleLevels[role] || 0
  }

  private getAdminRoleLevel(role: string): number {
    const roleLevels: Record<string, number> = {
      admin: 1,
      super_admin: 2,
    }
    return roleLevels[role] || 0
  }

  async createDebugAdmin(): Promise<{ admin: AdminPublic; credentials: { username: string; password: string } }> {
    const { v4: uuidv4 } = await import('uuid');
    
    // Check if debug admin already exists
    const [existingAdmins] = await db.execute(
      'SELECT id FROM admin_users WHERE username = ?',
      ['debug_admin']
    ) as [AdminUser[], any];

    if (existingAdmins.length > 0) {
      throw new AppError('Debug admin already exists', 409);
    }

    const credentials = {
      username: 'debug_admin',
      password: 'admin123'
    };

    const hashedPassword = await hashPassword(credentials.password);
    const adminId = uuidv4();

    await db.execute(
      'INSERT INTO admin_users (id, username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?, ?)',
      [adminId, credentials.username, 'debug@admin.com', hashedPassword, 'Debug Administrator', 'super_admin']
    );

    const [admins] = await db.execute(
      'SELECT id, username, email, full_name, role, is_active, created_at FROM admin_users WHERE id = ?',
      [adminId]
    ) as [AdminPublic[], any];

    return {
      admin: admins[0],
      credentials
    };
  }
}
