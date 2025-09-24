"""
Custom filters for competitions app to replace django_filters functionality
"""
from django.db.models import Q
from rest_framework.filters import BaseFilterBackend
from django.core.exceptions import ValidationError


class CompetitionFilterBackend(BaseFilterBackend):
    """
    Custom filter backend for Competition model
    """
    
    def filter_queryset(self, request, queryset, view):
        """Filter competitions based on query parameters"""
        
        # Status filter
        status = request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Competition type filter
        competition_type = request.query_params.get('competition_type', None)
        if competition_type:
            queryset = queryset.filter(competition_type=competition_type)
        
        # Organizer filter
        organizer = request.query_params.get('organizer', None)
        if organizer:
            try:
                queryset = queryset.filter(organizer__id=organizer)
            except (ValueError, ValidationError):
                # Invalid organizer ID, return empty queryset
                queryset = queryset.none()
        
        return queryset


class CategoryFilterBackend(BaseFilterBackend):
    """
    Custom filter backend for Category model
    """
    
    def filter_queryset(self, request, queryset, view):
        """Filter categories based on query parameters"""
        
        # Category type filter
        category_type = request.query_params.get('category_type', None)
        if category_type:
            queryset = queryset.filter(category_type=category_type)
        
        # Level filter
        level = request.query_params.get('level', None)
        if level:
            queryset = queryset.filter(level=level)
        
        return queryset


class VenueFilterBackend(BaseFilterBackend):
    """
    Custom filter backend for Venue model
    """
    
    def filter_queryset(self, request, queryset, view):
        """Filter venues based on query parameters"""
        
        # Country filter
        country = request.query_params.get('country', None)
        if country:
            queryset = queryset.filter(country__icontains=country)
        
        # City filter
        city = request.query_params.get('city', None)
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        return queryset


class HorseFilterBackend(BaseFilterBackend):
    """
    Custom filter backend for Horse model
    """
    
    def filter_queryset(self, request, queryset, view):
        """Filter horses based on query parameters"""
        
        # Owner filter
        owner = request.query_params.get('owner', None)
        if owner:
            try:
                queryset = queryset.filter(owner__id=owner)
            except (ValueError, ValidationError):
                queryset = queryset.none()
        
        # Trainer filter
        trainer = request.query_params.get('trainer', None)
        if trainer:
            try:
                queryset = queryset.filter(trainer__id=trainer)
            except (ValueError, ValidationError):
                queryset = queryset.none()
        
        # Breed filter
        breed = request.query_params.get('breed', None)
        if breed:
            queryset = queryset.filter(breed__icontains=breed)
        
        # Gender filter
        gender = request.query_params.get('gender', None)
        if gender:
            queryset = queryset.filter(gender=gender)
        
        # FEI registered filter
        is_fei_registered = request.query_params.get('is_fei_registered', None)
        if is_fei_registered is not None:
            if is_fei_registered.lower() in ['true', '1', 'yes']:
                queryset = queryset.filter(is_fei_registered=True)
            elif is_fei_registered.lower() in ['false', '0', 'no']:
                queryset = queryset.filter(is_fei_registered=False)
        
        return queryset


class ParticipantFilterBackend(BaseFilterBackend):
    """
    Custom filter backend for Participant model
    """
    
    def filter_queryset(self, request, queryset, view):
        """Filter participants based on query parameters"""
        
        # Competition filter
        competition = request.query_params.get('competition', None)
        if competition:
            try:
                queryset = queryset.filter(competition__id=competition)
            except (ValueError, ValidationError):
                queryset = queryset.none()
        
        # Rider filter
        rider = request.query_params.get('rider', None)
        if rider:
            try:
                queryset = queryset.filter(rider__id=rider)
            except (ValueError, ValidationError):
                queryset = queryset.none()
        
        # Category filter
        category = request.query_params.get('category', None)
        if category:
            try:
                queryset = queryset.filter(category__id=category)
            except (ValueError, ValidationError):
                queryset = queryset.none()
        
        # Confirmed filter
        is_confirmed = request.query_params.get('is_confirmed', None)
        if is_confirmed is not None:
            if is_confirmed.lower() in ['true', '1', 'yes']:
                queryset = queryset.filter(is_confirmed=True)
            elif is_confirmed.lower() in ['false', '0', 'no']:
                queryset = queryset.filter(is_confirmed=False)
        
        # Paid filter
        is_paid = request.query_params.get('is_paid', None)
        if is_paid is not None:
            if is_paid.lower() in ['true', '1', 'yes']:
                queryset = queryset.filter(is_paid=True)
            elif is_paid.lower() in ['false', '0', 'no']:
                queryset = queryset.filter(is_paid=False)
        
        return queryset