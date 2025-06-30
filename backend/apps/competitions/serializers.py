from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal
from .models import (
    Discipline, Category, Competition, CompetitionCategory, 
    Horse, Rider, Registration, JudgeAssignment
)


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
    discipline_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'code', 'discipline', 'discipline_id', 'level',
            'min_age_rider', 'max_age_rider', 'min_age_horse', 'max_participants',
            'entry_fee', 'description', 'fei_parameters', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        if 'max_age_rider' in data and data['max_age_rider']:
            if data['min_age_rider'] >= data['max_age_rider']:
                raise serializers.ValidationError({
                    'max_age_rider': 'La edad máxima debe ser mayor que la mínima'
                })
        return data


class UserBasicSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'full_name']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


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
    
    def validate_birth_date(self, value):
        if value >= timezone.now().date():
            raise serializers.ValidationError("La fecha de nacimiento debe ser anterior a hoy")
        return value


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
    category_permissions = CategoryListSerializer(many=True, read_only=True)
    
    class Meta:
        model = Rider
        fields = [
            'id', 'user', 'license_number', 'nationality', 'birth_date', 'age',
            'full_name', 'phone', 'emergency_contact_name', 'emergency_contact_phone',
            'fei_id', 'license_type', 'license_valid_until', 'insurance_valid',
            'medical_certificate_valid', 'experience_level', 'category_permissions',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class CompetitionCategorySerializer(serializers.ModelSerializer):
    category = CategoryListSerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True)
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


class JudgeAssignmentSerializer(serializers.ModelSerializer):
    judge = UserBasicSerializer(read_only=True)
    judge_id = serializers.IntegerField(write_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = JudgeAssignment
        fields = [
            'id', 'judge', 'judge_id', 'role', 'role_display', 'order',
            'fee', 'travel_allowance', 'accommodation_provided', 'confirmed',
            'confirmation_date', 'notes'
        ]
    
    def validate_judge_id(self, value):
        try:
            user = User.objects.get(id=value)
            if not hasattr(user, 'judge_profile'):
                raise serializers.ValidationError("El usuario debe tener un perfil de juez válido")
        except User.DoesNotExist:
            raise serializers.ValidationError("Usuario no encontrado")
        return value


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
    competition_categories = CompetitionCategorySerializer(source='competitioncategory_set', many=True, read_only=True)
    
    class Meta:
        model = Competition
        fields = [
            'id', 'name', 'description', 'venue', 'address', 'start_date', 'end_date',
            'registration_start', 'registration_end', 'organizer', 'contact_email',
            'contact_phone', 'website', 'status', 'status_display', 'max_total_participants',
            'allow_late_registration', 'late_registration_fee', 'weather_condition',
            'ground_condition', 'temperature', 'fei_code', 'is_fei_sanctioned',
            'regulations', 'total_registered_participants', 'is_registration_open',
            'days_until_start', 'competition_categories', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
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


class CompetitionCreateSerializer(serializers.ModelSerializer):
    categories_data = serializers.ListField(
        child=serializers.DictField(), 
        write_only=True, 
        required=False,
        help_text="Lista de categorías con sus configuraciones"
    )
    
    class Meta:
        model = Competition
        fields = [
            'name', 'description', 'venue', 'address', 'start_date', 'end_date',
            'registration_start', 'registration_end', 'contact_email', 'contact_phone',
            'website', 'max_total_participants', 'allow_late_registration',
            'late_registration_fee', 'fei_code', 'is_fei_sanctioned', 'regulations',
            'categories_data'
        ]
    
    def create(self, validated_data):
        categories_data = validated_data.pop('categories_data', [])
        validated_data['organizer'] = self.context['request'].user
        validated_data['created_by'] = self.context['request'].user
        
        competition = Competition.objects.create(**validated_data)
        
        # Crear categorías de competencia
        for category_data in categories_data:
            category_id = category_data.pop('category_id')
            category = Category.objects.get(id=category_id)
            CompetitionCategory.objects.create(
                competition=competition,
                category=category,
                **category_data
            )
        
        return competition


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


class RegistrationCreateSerializer(serializers.ModelSerializer):
    competition_category_id = serializers.IntegerField()
    rider_id = serializers.IntegerField()
    horse_id = serializers.IntegerField()
    
    class Meta:
        model = Registration
        fields = [
            'competition_category_id', 'rider_id', 'horse_id',
            'special_requirements', 'notes'
        ]
    
    def validate(self, data):
        competition_category = CompetitionCategory.objects.get(id=data['competition_category_id'])
        rider = Rider.objects.get(id=data['rider_id'])
        horse = Horse.objects.get(id=data['horse_id'])
        
        # Validar que la competencia esté abierta para inscripciones
        if not competition_category.competition.is_registration_open:
            raise serializers.ValidationError("La competencia no está abierta para inscripciones")
        
        # Validar capacidad
        if competition_category.available_spots <= 0:
            raise serializers.ValidationError("No hay cupos disponibles en esta categoría")
        
        # Validar edad del jinete
        if not rider.can_compete_in_category(competition_category.category):
            raise serializers.ValidationError({
                'rider_id': f"El jinete no cumple los requisitos para la categoría {competition_category.category.name}"
            })
        
        # Validar edad del caballo
        horse_age = horse.age
        category = competition_category.category
        if horse_age < category.min_age_horse:
            raise serializers.ValidationError({
                'horse_id': f"El caballo debe tener al menos {category.min_age_horse} años para esta categoría"
            })
        
        # Validar documentación del caballo
        if not horse.vaccination_current:
            raise serializers.ValidationError({
                'horse_id': "El caballo debe tener vacunación al día"
            })
        
        # Validar seguro del jinete
        if not rider.insurance_valid:
            raise serializers.ValidationError({
                'rider_id': "El jinete debe tener seguro válido"
            })
        
        # Validar que no exista inscripción duplicada
        if Registration.objects.filter(
            competition_category=competition_category,
            rider=rider,
            horse=horse
        ).exists():
            raise serializers.ValidationError("Ya existe una inscripción para esta combinación")
        
        return data
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return Registration.objects.create(**validated_data)


class CompetitionStatisticsSerializer(serializers.Serializer):
    total_participants = serializers.IntegerField()
    participants_by_category = serializers.DictField()
    participants_by_status = serializers.DictField()
    revenue_total = serializers.DecimalField(max_digits=10, decimal_places=2)
    revenue_by_category = serializers.DictField()
    pending_payments = serializers.DecimalField(max_digits=10, decimal_places=2)
    judge_assignments = serializers.IntegerField()
    completion_percentage = serializers.FloatField()


class RegistrationBulkUpdateSerializer(serializers.Serializer):
    registration_ids = serializers.ListField(child=serializers.UUIDField())
    status = serializers.ChoiceField(choices=Registration.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_registration_ids(self, value):
        if len(value) == 0:
            raise serializers.ValidationError("Debe proporcionar al menos una inscripción")
        
        existing_count = Registration.objects.filter(id__in=value).count()
        if existing_count != len(value):
            raise serializers.ValidationError("Algunas inscripciones no existen")
        
        return value


class StartNumberAssignmentSerializer(serializers.Serializer):
    competition_category_id = serializers.IntegerField()
    assignment_method = serializers.ChoiceField(choices=[
        ('RANDOM', 'Aleatorio'),
        ('REGISTRATION_ORDER', 'Orden de inscripción'),
        ('ALPHABETICAL', 'Alfabético por jinete'),
        ('MANUAL', 'Manual')
    ])
    manual_assignments = serializers.DictField(
        child=serializers.IntegerField(),
        required=False,
        help_text="Diccionario de registration_id: start_number para asignación manual"
    )
    
    def validate(self, data):
        if data['assignment_method'] == 'MANUAL' and not data.get('manual_assignments'):
            raise serializers.ValidationError({
                'manual_assignments': 'Requerido para asignación manual'
            })
        
        competition_category = CompetitionCategory.objects.get(
            id=data['competition_category_id']
        )
        
        registrations = Registration.objects.filter(
            competition_category=competition_category,
            status__in=['CONFIRMED', 'PAID']
        )
        
        if data['assignment_method'] == 'MANUAL':
            manual_assignments = data['manual_assignments']
            registration_ids = [str(r.id) for r in registrations]
            
            for reg_id in manual_assignments.keys():
                if reg_id not in registration_ids:
                    raise serializers.ValidationError({
                        'manual_assignments': f'Inscripción {reg_id} no válida'
                    })
            
            start_numbers = list(manual_assignments.values())
            if len(start_numbers) != len(set(start_numbers)):
                raise serializers.ValidationError({
                    'manual_assignments': 'Los números de dorsal deben ser únicos'
                })
        
        return data