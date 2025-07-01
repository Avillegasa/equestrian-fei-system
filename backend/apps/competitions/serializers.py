from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
from .models import (
    Discipline, Category, Competition, CompetitionCategory, 
    Horse, Rider, Registration, JudgeAssignment
)

User = get_user_model()


class DisciplineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discipline
        fields = ['id', 'name', 'code', 'description', 'fei_code', 'is_active', 'created_at']
        read_only_fields = ['created_at']


class CategoryListSerializer(serializers.ModelSerializer):
    discipline_name = serializers.CharField(source='discipline.name', read_only=True)
    discipline_code = serializers.CharField(source='discipline.code', read_only=True)
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'code', 'discipline', 'discipline_name', 'discipline_code',
            'level', 'min_age_rider', 'max_age_rider', 'min_age_horse', 
            'max_participants', 'entry_fee', 'is_active'
        ]


class CategoryDetailSerializer(serializers.ModelSerializer):
    discipline = DisciplineSerializer(read_only=True)
    discipline_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'code', 'discipline', 'discipline_id', 'level',
            'min_age_rider', 'max_age_rider', 'min_age_horse', 'max_participants',
            'entry_fee', 'description', 'fei_parameters', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class UserBasicSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'full_name']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class CompetitionListSerializer(serializers.ModelSerializer):
    organizer = UserBasicSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_registered_participants = serializers.ReadOnlyField()
    is_registration_open = serializers.ReadOnlyField()
    days_until_start = serializers.ReadOnlyField()
    categories_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Competition
        fields = [
            'id', 'name', 'venue', 'start_date', 'end_date', 'organizer',
            'status', 'status_display', 'registration_start', 'registration_end',
            'max_total_participants', 'total_registered_participants',
            'is_registration_open', 'days_until_start', 'categories_count',
            'is_fei_sanctioned', 'fei_code', 'created_at'
        ]
    
    def get_categories_count(self, obj):
        return obj.categories.count()


class CompetitionDetailSerializer(serializers.ModelSerializer):
    organizer = UserBasicSerializer(read_only=True)
    created_by = UserBasicSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_registered_participants = serializers.ReadOnlyField()
    is_registration_open = serializers.ReadOnlyField()
    days_until_start = serializers.ReadOnlyField()
    
    class Meta:
        model = Competition
        fields = [
            'id', 'name', 'description', 'venue', 'address', 'start_date', 'end_date',
            'registration_start', 'registration_end', 'organizer', 'contact_email',
            'contact_phone', 'website', 'status', 'status_display', 'max_total_participants',
            'allow_late_registration', 'late_registration_fee', 'weather_condition',
            'ground_condition', 'temperature', 'fei_code', 'is_fei_sanctioned',
            'regulations', 'total_registered_participants', 'is_registration_open',
            'days_until_start', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class CompetitionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Competition
        fields = [
            'name', 'description', 'venue', 'address', 'start_date', 'end_date',
            'registration_start', 'registration_end', 'contact_email', 'contact_phone',
            'website', 'max_total_participants', 'allow_late_registration',
            'late_registration_fee', 'fei_code', 'is_fei_sanctioned', 'regulations'
        ]
    
    def validate(self, data):
        errors = {}
        
        if 'start_date' in data and 'end_date' in data:
            if data['start_date'] > data['end_date']:
                errors['end_date'] = "La fecha de fin debe ser posterior a la fecha de inicio"
        
        if 'registration_start' in data and 'registration_end' in data:
            if data['registration_start'] >= data['registration_end']:
                errors['registration_end'] = "La fecha de fin de inscripciones debe ser posterior al inicio"
        
        if 'registration_end' in data and 'start_date' in data:
            if data['registration_end'].date() > data['start_date']:
                errors['registration_end'] = "Las inscripciones deben cerrar antes del inicio de la competencia"
        
        if errors:
            raise serializers.ValidationError(errors)
        
        return data


# Serializadores básicos para otros modelos
class HorseListSerializer(serializers.ModelSerializer):
    age = serializers.ReadOnlyField()
    
    class Meta:
        model = Horse
        fields = [
            'id', 'name', 'registration_number', 'breed', 'color', 'gender',
            'birth_date', 'age', 'owner', 'country_of_birth', 'fei_id', 'is_active'
        ]


class HorseDetailSerializer(serializers.ModelSerializer):
    age = serializers.ReadOnlyField()
    
    class Meta:
        model = Horse
        fields = [
            'id', 'name', 'registration_number', 'breed', 'color', 'gender',
            'birth_date', 'age', 'owner', 'country_of_birth', 'passport_number',
            'vaccination_current', 'health_certificate_valid', 'insurance_valid',
            'fei_id', 'national_registration', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class RiderListSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    age = serializers.ReadOnlyField()
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Rider
        fields = [
            'id', 'user', 'license_number', 'nationality', 'birth_date', 'age',
            'full_name', 'fei_id', 'license_type', 'license_valid_until', 'is_active'
        ]


class RiderDetailSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    age = serializers.ReadOnlyField()
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Rider
        fields = [
            'id', 'user', 'license_number', 'nationality', 'birth_date', 'age',
            'full_name', 'phone', 'emergency_contact_name', 'emergency_contact_phone',
            'fei_id', 'license_type', 'license_valid_until', 'insurance_valid',
            'medical_certificate_valid', 'experience_level', 'is_active', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class CompetitionCategorySerializer(serializers.ModelSerializer):
    category = CategoryListSerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True, required=False)
    effective_entry_fee = serializers.ReadOnlyField()
    registered_participants = serializers.ReadOnlyField()
    available_spots = serializers.ReadOnlyField()
    
    class Meta:
        model = CompetitionCategory
        fields = [
            'id', 'category', 'category_id', 'max_participants', 'entry_fee_override',
            'effective_entry_fee', 'start_time', 'order', 'special_requirements',
            'registered_participants', 'available_spots', 'is_active'
        ]


class RegistrationListSerializer(serializers.ModelSerializer):
    rider = RiderListSerializer(read_only=True)
    horse = HorseListSerializer(read_only=True)
    competition_name = serializers.CharField(source='competition_category.competition.name', read_only=True)
    category_name = serializers.CharField(source='competition_category.category.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    outstanding_balance = serializers.ReadOnlyField()
    
    class Meta:
        model = Registration
        fields = [
            'id', 'rider', 'horse', 'competition_name', 'category_name',
            'status', 'status_display', 'registered_at', 'start_number',
            'entry_fee_paid', 'outstanding_balance', 'payment_date'
        ]


class RegistrationDetailSerializer(serializers.ModelSerializer):
    rider = RiderDetailSerializer(read_only=True)
    horse = HorseDetailSerializer(read_only=True)
    competition_category = CompetitionCategorySerializer(read_only=True)
    created_by = UserBasicSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    outstanding_balance = serializers.ReadOnlyField()
    
    class Meta:
        model = Registration
        fields = [
            'id', 'competition_category', 'rider', 'horse', 'status', 'status_display',
            'registered_at', 'confirmed_at', 'start_number', 'entry_fee_paid',
            'outstanding_balance', 'payment_reference', 'payment_date',
            'special_requirements', 'notes', 'created_by', 'updated_at'
        ]
        read_only_fields = ['created_by', 'updated_at']


class JudgeAssignmentSerializer(serializers.ModelSerializer):
    judge = UserBasicSerializer(read_only=True)
    judge_id = serializers.IntegerField(write_only=True, required=False)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = JudgeAssignment
        fields = [
            'id', 'judge', 'judge_id', 'role', 'role_display', 'order',
            'fee', 'travel_allowance', 'accommodation_provided', 'confirmed',
            'confirmation_date', 'notes'
        ]