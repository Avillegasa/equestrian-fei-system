#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User

user = User.objects.get(username='admin')
user.set_password('admin123')
user.role = 'admin'
user.save()

print("Admin password set to: admin123")