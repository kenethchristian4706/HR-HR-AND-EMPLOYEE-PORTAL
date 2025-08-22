from rest_framework import serializers
from .models import HR, Employee, Leave, Attendance, Task
from django.contrib.auth.hashers import make_password


class HRSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = HR
        fields = ['id', 'name', 'email', 'password', 'department']

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().update(instance, validated_data)


class EmployeeSerializer(serializers.ModelSerializer):
    hr = serializers.PrimaryKeyRelatedField(queryset=HR.objects.all())
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Employee
        fields = ['id', 'name', 'email', 'password', 'department', 'designation', 'salary', 'hr']

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().update(instance, validated_data)


class LeaveSerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.all())
    # expose related employee name for HR UI
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    employee_email = serializers.CharField(source='employee.email', read_only=True)
    status = serializers.CharField(read_only=True)

    class Meta:
        model = Leave
        fields = ['id', 'employee', 'employee_name', 'employee_email', 'start_date', 'end_date', 'reason', 'status', 'created_at']

    def create(self, validated_data):
        validated_data['status'] = 'Pending'
        return super().create(validated_data)


class AttendanceSerializer(serializers.ModelSerializer):
    # keep the employee id for reference, and expose employee name for HR UI
    employee = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.all())
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    employee_email = serializers.CharField(source='employee.email', read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'employee', 'employee_name', 'employee_email', 'date', 'status', 'check_in', 'check_out']

    def validate(self, data):
        # Additional validation is handled in views (e.g., approved leave check).
        return data


class TaskSerializer(serializers.ModelSerializer):
    hr = serializers.PrimaryKeyRelatedField(queryset=HR.objects.all())
    employee = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.all())
    hr_name = serializers.CharField(source='hr.name', read_only=True)
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    employee_email = serializers.CharField(source='employee.email', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id',
            'hr',
            'hr_name',
            'employee',
            'employee_name',
            'employee_email',
            'title',
            'description',
            'due_date',
            'priority',
            'status',
            'created_at',
        ]
        read_only_fields = ['id', 'hr_name', 'employee_name', 'employee_email', 'created_at']
