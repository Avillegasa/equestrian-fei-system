export interface Discipline {
  id: number;
  name: string;
  code: string;
  description: string;
  fei_code: string;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  code: string;
  discipline: Discipline;
  discipline_id: number;
  discipline_name?: string;
  discipline_code?: string;
  level: string;
  min_age_rider: number;
  max_age_rider?: number;
  min_age_horse: number;
  max_participants: number;
  entry_fee: string;
  description?: string;
  fei_parameters: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  full_name: string;
}

export interface Horse {
  id: number;
  name: string;
  registration_number: string;
  breed: string;
  color: string;
  gender: 'MARE' | 'STALLION' | 'GELDING';
  birth_date: string;
  age: number;
  owner: string;
  country_of_birth: string;
  passport_number: string;
  vaccination_current: boolean;
  health_certificate_valid: boolean;
  insurance_valid: boolean;
  fei_id?: string;
  national_registration?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Rider {
  id: number;
  user: User;
  license_number: string;
  nationality: string;
  birth_date: string;
  age: number;
  full_name: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  fei_id?: string;
  license_type: string;
  license_valid_until: string;
  insurance_valid: boolean;
  medical_certificate_valid: boolean;
  experience_level?: string;
  category_permissions: Category[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompetitionCategory {
  id: number;
  category: Category;
  category_id: number;
  max_participants: number;
  entry_fee_override?: string;
  effective_entry_fee: string;
  start_time?: string;
  order: number;
  special_requirements?: string;
  registered_participants: number;
  available_spots: number;
  is_active: boolean;
}

export interface JudgeAssignment {
  id: number;
  judge: User;
  judge_id: number;
  role: 'PRESIDENT' | 'MEMBER' | 'GROUND_JURY' | 'TECHNICAL_DELEGATE' | 'COURSE_DESIGNER' | 'VETERINARIAN' | 'STEWARD';
  role_display: string;
  order: number;
  fee?: string;
  travel_allowance: string;
  accommodation_provided: boolean;
  confirmed: boolean;
  confirmation_date?: string;
  notes?: string;
}

export interface Competition {
  id: string;
  name: string;
  description?: string;
  venue: string;
  address: string;
  start_date: string;
  end_date: string;
  registration_start: string;
  registration_end: string;
  organizer: User;
  contact_email: string;
  contact_phone?: string;
  website?: string;
  status: 'DRAFT' | 'OPEN' | 'REGISTRATION_CLOSED' | 'IN_PROGRESS' | 'SCORING' | 'COMPLETED' | 'CANCELLED' | 'SUSPENDED';
  status_display: string;
  max_total_participants: number;
  allow_late_registration: boolean;
  late_registration_fee: string;
  weather_condition?: string;
  ground_condition?: string;
  temperature?: string;
  fei_code?: string;
  is_fei_sanctioned: boolean;
  regulations?: string;
  total_registered_participants: number;
  is_registration_open: boolean;
  days_until_start: number;
  categories_count?: number;
  competition_categories: CompetitionCategory[];
  created_by: User;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  competition_category: CompetitionCategory;
  rider: Rider;
  horse: Horse;
  competition_name?: string;
  category_name?: string;
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED' | 'WAITLIST';
  status_display: string;
  registered_at: string;
  confirmed_at?: string;
  start_number?: number;
  entry_fee_paid: string;
  outstanding_balance: string;
  payment_reference?: string;
  payment_date?: string;
  special_requirements?: string;
  notes?: string;
  created_by: User;
  updated_at: string;
}

export interface CompetitionStatistics {
  total_participants: number;
  participants_by_category: Record<string, number>;
  participants_by_status: Record<string, number>;
  revenue_total: string;
  revenue_by_category: Record<string, string>;
  pending_payments: string;
  judge_assignments: number;
  completion_percentage: number;
}

export interface CompetitionDashboard {
  competition: Competition;
  summary: {
    total_registrations: number;
    confirmed_registrations: number;
    paid_registrations: number;
    pending_registrations: number;
    total_revenue: string;
    categories_count: number;
    judges_assigned: number;
  };
  categories: Array<{
    category: CompetitionCategory;
    registrations_count: number;
    available_spots: number;
    judges_assigned: number;
    revenue: string;
  }>;
  recent_registrations: Registration[];
}

export interface PublicCompetition {
  id: string;
  name: string;
  description?: string;
  venue: string;
  start_date: string;
  end_date: string;
  status: string;
  status_display: string;
  is_registration_open: boolean;
  contact_email: string;
  website?: string;
  is_fei_sanctioned: boolean;
  fei_code?: string;
}

export interface PublicCompetitionDetail {
  competition: PublicCompetition;
  categories: Array<{
    id: number;
    name: string;
    level: string;
    max_participants: number;
    registered_participants: number;
    available_spots: number;
    entry_fee: string;
    start_time?: string;
  }>;
  total_participants: number;
}

// Formularios y creación
export interface CompetitionFormData {
  name: string;
  description?: string;
  venue: string;
  address: string;
  start_date: string;
  end_date: string;
  registration_start: string;
  registration_end: string;
  contact_email: string;
  contact_phone?: string;
  website?: string;
  max_total_participants: number;
  allow_late_registration: boolean;
  late_registration_fee: string;
  fei_code?: string;
  is_fei_sanctioned: boolean;
  regulations?: string;
  categories_data: Array<{
    category_id: number;
    max_participants: number;
    entry_fee_override?: string;
    start_time?: string;
    order: number;
    special_requirements?: string;
  }>;
}

export interface RegistrationFormData {
  competition_category_id: number;
  rider_id: number;
  horse_id: number;
  special_requirements?: string;
  notes?: string;
}

export interface JudgeAssignmentFormData {
  judge_id: number;
  role: string;
  order: number;
  fee?: string;
  travel_allowance?: string;
  accommodation_provided: boolean;
  notes?: string;
}

export interface StartNumberAssignment {
  competition_category_id: number;
  assignment_method: 'RANDOM' | 'REGISTRATION_ORDER' | 'ALPHABETICAL' | 'MANUAL';
  manual_assignments?: Record<string, number>;
}

export interface BulkRegistrationUpdate {
  registration_ids: string[];
  status: string;
  notes?: string;
}

// Búsqueda y filtros
export interface CompetitionFilters {
  status?: string;
  organizer_id?: number;
  start_date_from?: string;
  start_date_to?: string;
  search?: string;
  upcoming?: boolean;
}

export interface RegistrationFilters {
  competition_id?: string;
  rider_id?: number;
  horse_id?: number;
  status?: string;
  category_id?: number;
}

export interface ParticipantSearch {
  q: string;
  type: 'all' | 'riders' | 'horses';
}

export interface ParticipantSearchResults {
  riders: Rider[];
  horses: Horse[];
  message?: string;
}

// Estados de la aplicación
export interface CompetitionsState {
  competitions: Competition[];
  currentCompetition: Competition | null;
  registrations: Registration[];
  categories: Category[];
  disciplines: Discipline[];
  horses: Horse[];
  riders: Rider[];
  loading: boolean;
  error: string | null;
}

// Props de componentes
export interface CompetitionCardProps {
  competition: Competition;
  onEdit?: (competition: Competition) => void;
  onDelete?: (competitionId: string) => void;
  onViewDetails?: (competitionId: string) => void;
}

export interface RegistrationTableProps {
  registrations: Registration[];
  onStatusChange?: (registrationId: string, status: string) => void;
  onPaymentUpdate?: (registrationId: string, amount: number) => void;
  onBulkUpdate?: (registrationIds: string[], status: string) => void;
  loading?: boolean;
}

export interface CompetitionFormProps {
  competition?: Competition;
  onSubmit: (data: CompetitionFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export interface CategorySelectorProps {
  selectedCategories: number[];
  onCategoriesChange: (categories: number[]) => void;
  disciplineFilter?: number;
}

export interface JudgeAssignmentProps {
  competitionCategory: CompetitionCategory;
  assignments: JudgeAssignment[];
  onAssignmentsChange: (assignments: JudgeAssignmentFormData[]) => void;
  readonly?: boolean;
}

// Respuestas de API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Hooks personalizados
export interface UseCompetitionsOptions {
  filters?: CompetitionFilters;
  enabled?: boolean;
}

export interface UseRegistrationsOptions {
  filters?: RegistrationFilters;
  enabled?: boolean;
}

// Utilidades
export const COMPETITION_STATUS_COLORS: Record<string, string> = {
  'DRAFT': 'gray',
  'OPEN': 'green',
  'REGISTRATION_CLOSED': 'yellow',
  'IN_PROGRESS': 'blue',
  'SCORING': 'purple',
  'COMPLETED': 'green',
  'CANCELLED': 'red',
  'SUSPENDED': 'orange'
};

export const REGISTRATION_STATUS_COLORS: Record<string, string> = {
  'PENDING': 'yellow',
  'CONFIRMED': 'blue',
  'PAID': 'green',
  'CANCELLED': 'red',
  'WAITLIST': 'gray'
};

export const JUDGE_ROLES: Record<string, string> = {
  'PRESIDENT': 'Presidente del Jurado',
  'MEMBER': 'Miembro del Jurado',
  'GROUND_JURY': 'Jurado de Tierra',
  'TECHNICAL_DELEGATE': 'Delegado Técnico',
  'COURSE_DESIGNER': 'Diseñador de Pista',
  'VETERINARIAN': 'Veterinario',
  'STEWARD': 'Comisario'
};