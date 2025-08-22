from django.contrib import admin

# Register your models here.
from .models import HR, Employee
admin.site.register(HR)
admin.site.register(Employee)