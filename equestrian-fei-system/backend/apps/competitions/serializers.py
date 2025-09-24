from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import (
    Discipline, Category, Venue, Competition, 
    CompetitionStaff, Horse, Participant, CompetitionSchedule
)

User = get_user_model()


class SimpleCompetitionSerializer(serializers.ModelSerializer):
    """Serializer simple para competencias (evita problemas de choices)"""
    
    class Meta:
        model = Competition
        fields = ['id', 'name', 'start_date', 'end_date', 'status']
        read_only_fields = ['id']


class DisciplineSerializer(serializers.ModelSerializer):
    """Serializer para Disciplinas"""
    
    class Meta:
        model = Discipline
        fields = [
            'id', 'name', 'code', 'discipline_type', 'description',
            'is_active', 'max_duration_minutes', 'scoring_system',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CategorySerializer(serializers.ModelSerializer):
    """Serializer para Categorías"""
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'code', 'category_type', 'level',
            'min_age', 'max_age', 'min_height_cm', 'max_height_cm',
            'description', 'is_active', 'max_participants', 'entry_fee',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validaciones personalizadas"""
        if data.get('min_age') and data.get('max_age'):
            if data['min_age'] > data['max_age']:
                raise serializers.ValidationError("La edad mínima no puede ser mayor que la máxima")
        
        if data.get('min_height_cm') and data.get('max_height_cm'):
            if data['min_height_cm'] > data['max_height_cm']:
                raise serializers.ValidationError("La altura mínima no puede ser mayor que la máxima")
        
        return data


class VenueSerializer(serializers.ModelSerializer):
    """Serializer para Sedes"""
    
    class Meta:
        model = Venue
        fields = [
            'id', 'name', 'address', 'city', 'state_province', 'country',
            'postal_code', 'phone', 'email', 'website', 'capacity',
            'indoor_arena', 'outdoor_arena', 'warm_up_area', 'stabling',
            'latitude', 'longitude', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class HorseSerializer(serializers.ModelSerializer):
    """Serializer para Caballos"""
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    trainer_name = serializers.CharField(source='trainer.get_full_name', read_only=True)
    age = serializers.ReadOnlyField()
    
    class Meta:
        model = Horse
        fields = [
            'id', 'name', 'registration_number', 'breed', 'color', 'gender',
            'birth_date', 'height', 'owner', 'owner_name', 'trainer', 'trainer_name',
            'microchip_number', 'passport_number', 'is_fei_registered', 'fei_id',
            'is_active', 'is_available_for_competition', 'notes', 'age',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'age', 'owner_name', 'trainer_name']
    
    def validate_birth_date(self, value):
        """Validar que la fecha de nacimiento sea válida"""
        from datetime import date
        if value > date.today():
            raise serializers.ValidationError("La fecha de nacimiento no puede ser futura")
        return value


class CompetitionStaffSerializer(serializers.ModelSerializer):
    """Serializer para Personal de Competencia"""
    staff_member_name = serializers.CharField(source='staff_member.get_full_name', read_only=True)
    staff_member_email = serializers.CharField(source='staff_member.email', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = CompetitionStaff
        fields = [
            'id', 'competition', 'staff_member', 'staff_member_name', 
            'staff_member_email', 'role', 'role_display', 'is_confirmed', 
            'notes', 'assigned_date'
        ]
        read_only_fields = ['id', 'assigned_date', 'staff_member_name', 'staff_member_email', 'role_display']


class CompetitionScheduleSerializer(serializers.ModelSerializer):
    """Serializer para Programación de Competencias"""
    discipline_name = serializers.CharField(source='discipline.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    schedule_type_display = serializers.CharField(source='get_schedule_type_display', read_only=True)
    
    class Meta:
        model = CompetitionSchedule
        fields = [
            'id', 'competition', 'start_time', 'end_time', 'estimated_duration',
            'title', 'description', 'schedule_type', 'schedule_type_display',
            'discipline', 'discipline_name', 'category', 'category_name',
            'location', 'is_published', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'discipline_name', 'category_name', 'schedule_type_display']
    
    def validate(self, data):
        """Validaciones personalizadas"""
        if data.get('start_time') and data.get('end_time'):
            if data['start_time'] >= data['end_time']:
                raise serializers.ValidationError("La hora de inicio debe ser anterior a la de fin")
        
        return data


class ParticipantSerializer(serializers.ModelSerializer):
    """Serializer para Participantes"""
    rider_name = serializers.CharField(source='rider.get_full_name', read_only=True)
    horse_name = serializers.CharField(source='horse.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    competition_name = serializers.CharField(source='competition.name', read_only=True)
    
    class Meta:
        model = Participant
        fields = [
            'id', 'competition', 'competition_name', 'rider', 'rider_name',
            'horse', 'horse_name', 'category', 'category_name', 'bib_number',
            'registration_date', 'is_confirmed', 'is_paid', 
            'emergency_contact_name', 'emergency_contact_phone', 'special_requirements',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'registration_date', 'created_at', 'updated_at',
            'rider_name', 'horse_name', 'category_name', 'competition_name'
        ]


class CompetitionListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para lista de competencias"""
    organizer_name = serializers.CharField(source='organizer.get_full_name', read_only=True)
    venue_name = serializers.CharField(source='venue.name', read_only=True, allow_null=True)
    venue_city = serializers.CharField(source='venue.city', read_only=True, allow_null=True)
    status_display = serializers.SerializerMethodField()
    competition_type_display = serializers.SerializerMethodField()
    participant_count = serializers.SerializerMethodField()
    is_registration_open = serializers.SerializerMethodField()
    days_until_start = serializers.SerializerMethodField()
    duration_days = serializers.SerializerMethodField()
    
    class Meta:
        model = Competition
        fields = [
            'id', 'name', 'short_name', 'description',
            'organizer', 'organizer_name', 'venue_name', 'venue_city',
            'start_date', 'end_date', 'registration_start', 'registration_end',
            'status', 'status_display', 'competition_type', 'competition_type_display',
            'max_participants', 'entry_fee', 'is_championship',
            'participant_count', 'is_registration_open', 'days_until_start', 'duration_days',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'organizer_name', 'venue_name', 'venue_city', 'status_display',
            'competition_type_display', 'participant_count', 'is_registration_open',
            'days_until_start', 'duration_days', 'created_at', 'updated_at'
        ]
    
    def get_participant_count(self, obj):
        """Obtener número de participantes confirmados"""
        return obj.participants.filter(is_confirmed=True).count()
    
    def get_status_display(self, obj):
        """Obtener display del status"""
        return obj.get_status_display() if hasattr(obj, 'get_status_display') else obj.status
    
    def get_competition_type_display(self, obj):
        """Obtener display del tipo de competencia"""
        return obj.get_competition_type_display() if hasattr(obj, 'get_competition_type_display') else obj.competition_type
    
    def get_is_registration_open(self, obj):
        """Verificar si la inscripción está abierta"""
        try:
            return obj.is_registration_open
        except:
            return False
    
    def get_days_until_start(self, obj):
        """Días hasta el inicio"""
        try:
            return obj.days_until_start
        except:
            return None
    
    def get_duration_days(self, obj):
        """Duración en días"""
        try:
            return obj.duration_days
        except:
            return None


class CompetitionDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para competencias"""
    organizer_name = serializers.CharField(source='organizer.get_full_name', read_only=True)
    venue = VenueSerializer(read_only=True)
    venue_id = serializers.UUIDField(write_only=True)
    disciplines = DisciplineSerializer(many=True, read_only=True)
    discipline_ids = serializers.ListField(child=serializers.UUIDField(), write_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    category_ids = serializers.ListField(child=serializers.UUIDField(), write_only=True)
    staff = CompetitionStaffSerializer(many=True, read_only=True)
    participants = ParticipantSerializer(many=True, read_only=True)
    schedule = CompetitionScheduleSerializer(many=True, read_only=True)
    
    # Campos calculados
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    competition_type_display = serializers.CharField(source='get_competition_type_display', read_only=True)
    participant_count = serializers.SerializerMethodField()
    confirmed_participant_count = serializers.SerializerMethodField()
    is_registration_open = serializers.ReadOnlyField()
    days_until_start = serializers.ReadOnlyField()
    duration_days = serializers.ReadOnlyField()
    
    class Meta:
        model = Competition
        fields = [
            'id', 'name', 'short_name', 'description',
            'organizer', 'organizer_name', 'venue', 'venue_id',
            'disciplines', 'discipline_ids', 'categories', 'category_ids',
            'start_date', 'end_date', 'registration_start', 'registration_end',
            'status', 'status_display', 'competition_type', 'competition_type_display',
            'max_participants', 'max_horses_per_rider', 'entry_fee', 'late_fee',
            'requires_qualification', 'is_championship', 'points_for_ranking',
            'rules', 'prize_money', 'sponsors',
            'staff', 'participants', 'schedule',
            'participant_count', 'confirmed_participant_count',
            'is_registration_open', 'days_until_start', 'duration_days',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'organizer_name', 'status_display', 'competition_type_display',
            'participant_count', 'confirmed_participant_count', 'is_registration_open',
            'days_until_start', 'duration_days', 'created_at', 'updated_at'
        ]
    
    def get_participant_count(self, obj):
        """Obtener número total de participantes"""
        return obj.participants.count()
    
    def get_confirmed_participant_count(self, obj):
        """Obtener número de participantes confirmados"""
        return obj.participants.filter(is_confirmed=True).count()
    
    def validate(self, data):
        """Validaciones personalizadas"""
        # Validar fechas
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] >= data['end_date']:
                raise serializers.ValidationError("La fecha de inicio debe ser anterior a la de fin")
        
        if data.get('registration_start') and data.get('registration_end'):
            if data['registration_start'] >= data['registration_end']:
                raise serializers.ValidationError("La fecha de inicio de inscripción debe ser anterior a la de fin")
        
        if data.get('registration_end') and data.get('start_date'):
            if data['registration_end'] > data['start_date']:
                raise serializers.ValidationError("La inscripción debe cerrar antes del inicio de la competencia")
        
        return data
    
    def create(self, validated_data):
        """Crear competencia con relaciones ManyToMany"""
        discipline_ids = validated_data.pop('discipline_ids', [])
        category_ids = validated_data.pop('category_ids', [])
        venue_id = validated_data.pop('venue_id')
        
        # Obtener la sede
        try:
            venue = Venue.objects.get(id=venue_id)
            validated_data['venue'] = venue
        except Venue.DoesNotExist:
            raise serializers.ValidationError({"venue_id": "Sede no encontrada"})
        
        # Crear la competencia
        competition = Competition.objects.create(**validated_data)
        
        # Agregar disciplinas y categorías
        if discipline_ids:
            disciplines = Discipline.objects.filter(id__in=discipline_ids, is_active=True)
            competition.disciplines.set(disciplines)
        
        if category_ids:
            categories = Category.objects.filter(id__in=category_ids, is_active=True)
            competition.categories.set(categories)
        
        return competition
    
    def update(self, instance, validated_data):
        """Actualizar competencia con relaciones ManyToMany"""
        discipline_ids = validated_data.pop('discipline_ids', None)
        category_ids = validated_data.pop('category_ids', None)
        venue_id = validated_data.pop('venue_id', None)
        
        # Actualizar sede si se proporciona
        if venue_id:
            try:
                venue = Venue.objects.get(id=venue_id)
                instance.venue = venue
            except Venue.DoesNotExist:
                raise serializers.ValidationError({"venue_id": "Sede no encontrada"})
        
        # Actualizar campos básicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Actualizar disciplinas si se proporcionan
        if discipline_ids is not None:
            disciplines = Discipline.objects.filter(id__in=discipline_ids, is_active=True)
            instance.disciplines.set(disciplines)
        
        # Actualizar categorías si se proporcionan
        if category_ids is not None:
            categories = Category.objects.filter(id__in=category_ids, is_active=True)
            instance.categories.set(categories)
        
        return instance


class CompetitionCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear competencias (simplificado)"""
    venue_id = serializers.UUIDField()
    discipline_ids = serializers.ListField(child=serializers.UUIDField())
    category_ids = serializers.ListField(child=serializers.UUIDField())
    
    class Meta:
        model = Competition
        fields = [
            'name', 'short_name', 'description', 'venue_id',
            'discipline_ids', 'category_ids', 'start_date', 'end_date',
            'registration_start', 'registration_end', 'competition_type',
            'max_participants', 'max_horses_per_rider', 'entry_fee', 'late_fee',
            'requires_qualification', 'is_championship', 'points_for_ranking',
            'rules', 'prize_money', 'sponsors'
        ]
    
    def validate(self, data):
        """Validaciones personalizadas"""
        # Validar fechas
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] >= data['end_date']:
                raise serializers.ValidationError("La fecha de inicio debe ser anterior a la de fin")
        
        if data.get('registration_start') and data.get('registration_end'):
            if data['registration_start'] >= data['registration_end']:
                raise serializers.ValidationError("La fecha de inicio de inscripción debe ser anterior a la de fin")
        
        if data.get('registration_end') and data.get('start_date'):
            if data['registration_end'] > data['start_date']:
                raise serializers.ValidationError("La inscripción debe cerrar antes del inicio de la competencia")
        
        # Validar que existan las disciplinas y categorías
        discipline_ids = data.get('discipline_ids', [])
        category_ids = data.get('category_ids', [])
        venue_id = data.get('venue_id')
        
        if not discipline_ids:
            raise serializers.ValidationError("Debe seleccionar al menos una disciplina")
        
        if not category_ids:
            raise serializers.ValidationError("Debe seleccionar al menos una categoría")
        
        # Verificar que existan en la base de datos
        existing_disciplines = Discipline.objects.filter(id__in=discipline_ids, is_active=True).count()
        if existing_disciplines != len(discipline_ids):
            raise serializers.ValidationError("Una o más disciplinas no son válidas")
        
        existing_categories = Category.objects.filter(id__in=category_ids, is_active=True).count()
        if existing_categories != len(category_ids):
            raise serializers.ValidationError("Una o más categorías no son válidas")
        
        if not Venue.objects.filter(id=venue_id, is_active=True).exists():
            raise serializers.ValidationError("La sede seleccionada no es válida")
        
        return data
    
    def create(self, validated_data):
        """Crear competencia con el usuario actual como organizador"""
        discipline_ids = validated_data.pop('discipline_ids')
        category_ids = validated_data.pop('category_ids')
        venue_id = validated_data.pop('venue_id')
        
        # Obtener objetos relacionados
        venue = Venue.objects.get(id=venue_id)
        disciplines = Discipline.objects.filter(id__in=discipline_ids, is_active=True)
        categories = Category.objects.filter(id__in=category_ids, is_active=True)
        
        # Crear la competencia con el usuario actual como organizador
        validated_data['venue'] = venue
        validated_data['organizer'] = self.context['request'].user
        validated_data['status'] = 'draft'  # Empezar como borrador
        
        competition = Competition.objects.create(**validated_data)
        
        # Agregar relaciones ManyToMany
        competition.disciplines.set(disciplines)
        competition.categories.set(categories)
        
        return competition