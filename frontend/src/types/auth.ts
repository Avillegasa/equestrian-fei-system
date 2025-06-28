// Tipos para el sistema de autenticación y usuarios

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone?: string;
  country?: string;
  role: UserRole;
  is_verified: boolean;
  full_name: string;
  has_judge_profile: boolean;
  has_organizer_profile: boolean;
  judge_profile?: JudgeProfile;
  organizer_profile?: OrganizerProfile;
  date_joined: string;
  last_login?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  ORGANIZER = 'organizer',
  JUDGE = 'judge',
  SPECTATOR = 'spectator'
}

export interface JudgeProfile {
  id: number;
  user_info: {
    full_name: string;
    email: string;
    country: string;
  };
  fei_id?: string;
  certification_level: CertificationLevel;
  disciplines: Discipline[];
  certification_date: string;
  expiry_date?: string;
  license_number?: string;
  biography?: string;
  years_experience: number;
  languages: string[];
  is_active_judge: boolean;
  is_certification_valid: boolean;
}

export enum CertificationLevel {
  LEVEL_1 = 'level1',
  LEVEL_2 = 'level2',
  LEVEL_3 = 'level3',
  LEVEL_4 = 'level4',
  LEVEL_5 = 'level5',
  INTERNATIONAL = 'international'
}

export enum Discipline {
  DRESSAGE = 'dressage',
  JUMPING = 'jumping',
  EVENTING = 'eventing',
  ENDURANCE = 'endurance',
  VAULTING = 'vaulting',
  DRIVING = 'driving',
  REINING = 'reining',
  PARA_DRESSAGE = 'para_dressage',
  PARA_DRIVING = 'para_driving'
}

export interface OrganizerProfile {
  id: number;
  user_info: {
    full_name: string;
    email: string;
    country: string;
  };
  organization_name: string;
  organization_type: OrganizationType;
  license_number?: string;
  website?: string;
  address: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  established_date?: string;
  description?: string;
  is_verified_organizer: boolean;
}

export enum OrganizationType {
  FEDERATION = 'federation',
  CLUB = 'club',
  PRIVATE = 'private',
  EDUCATIONAL = 'educational'
}

// Tipos para formularios de autenticación
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone?: string;
  country?: string;
  role: UserRole;
  password: string;
  password_confirm: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

// Tipos para gestión de perfiles
export interface UpdateProfileData {
  first_name: string;
  last_name: string;
  phone?: string;
  country?: string;
}

export interface CreateJudgeProfileData {
  fei_id?: string;
  certification_level: CertificationLevel;
  disciplines: Discipline[];
  certification_date: string;
  expiry_date?: string;
  license_number?: string;
  biography?: string;
  years_experience: number;
  languages: string[];
}

export interface CreateOrganizerProfileData {
  organization_name: string;
  organization_type: OrganizationType;
  license_number?: string;
  website?: string;
  address: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  established_date?: string;
  description?: string;
}

// Tipos para gestión de contraseñas
export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface ResetPasswordConfirmData {
  token: string;
  new_password: string;
  new_password_confirm: string;
}

// Tipos para permisos
export interface UserPermission {
  id: number;
  user_info: {
    id: number;
    full_name: string;
    email: string;
  };
  module: PermissionModule;
  permission: PermissionType;
  granted_by_info: {
    id: number;
    full_name: string;
    email: string;
  };
  granted_at: string;
  module_display: string;
  permission_display: string;
}

export enum PermissionModule {
  COMPETITIONS = 'competitions',
  SCORING = 'scoring',
  RANKINGS = 'rankings',
  USERS = 'users',
  REPORTS = 'reports',
  AUDIT = 'audit'
}

export enum PermissionType {
  VIEW = 'view',
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  MANAGE = 'manage'
}

// Tipos para auditoría
export interface AuditLog {
  id: number;
  user_info?: {
    id: number;
    full_name: string;
    email: string;
  };
  action: AuditAction;
  action_display: string;
  resource_type: string;
  resource_id: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PERMISSION_GRANT = 'permission_grant',
  PERMISSION_REVOKE = 'permission_revoke'
}

// Tipos para estadísticas
export interface UserStats {
  total_users: number;
  users_by_role: Record<string, number>;
  verified_users: number;
  active_users: number;
  judges_with_profile: number;
  organizers_with_profile: number;
  recent_registrations: number;
}

// Tipos para estado de autenticación
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

// Tipos para errores de API
export interface ApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
  non_field_errors?: string[];
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Constantes para las opciones de los enums
export const USER_ROLE_CHOICES = [
  { value: UserRole.ADMIN, label: 'Administrador' },
  { value: UserRole.ORGANIZER, label: 'Organizador' },
  { value: UserRole.JUDGE, label: 'Juez' },
  { value: UserRole.SPECTATOR, label: 'Espectador' }
];

export const CERTIFICATION_LEVEL_CHOICES = [
  { value: CertificationLevel.LEVEL_1, label: 'Nivel 1' },
  { value: CertificationLevel.LEVEL_2, label: 'Nivel 2' },
  { value: CertificationLevel.LEVEL_3, label: 'Nivel 3' },
  { value: CertificationLevel.LEVEL_4, label: 'Nivel 4' },
  { value: CertificationLevel.LEVEL_5, label: 'Nivel 5' },
  { value: CertificationLevel.INTERNATIONAL, label: 'Internacional' }
];

export const DISCIPLINE_CHOICES = [
  { value: Discipline.DRESSAGE, label: 'Doma Clásica' },
  { value: Discipline.JUMPING, label: 'Salto' },
  { value: Discipline.EVENTING, label: 'Concurso Completo' },
  { value: Discipline.ENDURANCE, label: 'Resistencia' },
  { value: Discipline.VAULTING, label: 'Volteo' },
  { value: Discipline.DRIVING, label: 'Enganche' },
  { value: Discipline.REINING, label: 'Rienda Occidental' },
  { value: Discipline.PARA_DRESSAGE, label: 'Para-Doma' },
  { value: Discipline.PARA_DRIVING, label: 'Para-Enganche' }
];

export const ORGANIZATION_TYPE_CHOICES = [
  { value: OrganizationType.FEDERATION, label: 'Federación' },
  { value: OrganizationType.CLUB, label: 'Club' },
  { value: OrganizationType.PRIVATE, label: 'Organizador Privado' },
  { value: OrganizationType.EDUCATIONAL, label: 'Institución Educativa' }
];