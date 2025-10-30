#!/usr/bin/env python
"""
Script to assign staff (judges) to competitions 8 and 9 that are missing staff assignments.
Run this in production via: python assign_staff_to_missing_competitions.py
"""
import os
import sys
import django
from decimal import Decimal
from datetime import datetime

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.competitions.models import Competition, CompetitionStaff
from apps.users.models import User

def assign_staff_to_competitions():
    """Assign judges to competitions 8 and 9"""

    print("\n" + "="*60)
    print("ASIGNANDO PERSONAL A COMPETENCIAS 8 Y 9")
    print("="*60 + "\n")

    # Get competitions 8 and 9
    competitions = Competition.objects.filter(id__in=[8, 9])

    if not competitions.exists():
        print("❌ No se encontraron competencias con ID 8 o 9")
        return

    print(f"✅ Encontradas {competitions.count()} competencias")

    # Get all judges
    judges = User.objects.filter(role='judge', is_active=True)

    if not judges.exists():
        print("❌ No se encontraron jueces activos en el sistema")
        return

    print(f"✅ Encontrados {judges.count()} jueces activos")

    staff_created = 0

    for competition in competitions:
        print(f"\n📋 Procesando: {competition.name}")

        # Check if already has staff
        existing_staff = CompetitionStaff.objects.filter(competition=competition).count()
        if existing_staff > 0:
            print(f"   ⚠️  Ya tiene {existing_staff} miembros de personal asignados")
            continue

        # Assign 3 judges to each competition
        judge_roles = [
            ('chief_judge', 'Juez Principal'),
            ('judge', 'Juez'),
            ('judge', 'Juez'),
        ]

        for idx, (role, role_name) in enumerate(judge_roles):
            if idx < len(judges):
                judge = judges[idx]

                # Check if this judge is already assigned to this competition
                if CompetitionStaff.objects.filter(
                    competition=competition,
                    staff_member=judge
                ).exists():
                    print(f"   ⚠️  {judge.get_full_name()} ya está asignado")
                    continue

                # Create staff assignment
                CompetitionStaff.objects.create(
                    competition=competition,
                    staff_member=judge,
                    role=role,
                    is_confirmed=True,  # Force accept as per user request
                    notes=f'Asignado automáticamente - {role_name}'
                )

                staff_created += 1
                print(f"   ✅ Asignado: {judge.get_full_name()} como {role_name}")

    print("\n" + "="*60)
    print(f"✅ COMPLETADO: {staff_created} asignaciones de personal creadas")
    print("="*60 + "\n")

if __name__ == '__main__':
    try:
        assign_staff_to_competitions()
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
