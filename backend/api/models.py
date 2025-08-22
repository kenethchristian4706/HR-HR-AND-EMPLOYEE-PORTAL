
from django.db import models
from django.contrib.auth.hashers import make_password


class HR(models.Model):
	name = models.CharField(max_length=100)
	email = models.EmailField(unique=True)
	password = models.CharField(max_length=128)
	department = models.CharField(max_length=100)

	def __str__(self):
		return self.name


class Employee(models.Model):
	name = models.CharField(max_length=100)
	email = models.EmailField(unique=True)
	password = models.CharField(max_length=128)
	department = models.CharField(max_length=100)
	designation = models.CharField(max_length=100)
	salary = models.DecimalField(max_digits=10, decimal_places=2)
	hr = models.ForeignKey(HR, on_delete=models.CASCADE, related_name='employees')

	def __str__(self):
		return self.name

	def set_password(self, raw_password):
		"""Hash and set the employee's password."""
		self.password = make_password(raw_password)
		# caller should call save()


# Leave model for leave management system
class Leave(models.Model):
	STATUS_CHOICES = [
		('Pending', 'Pending'),
		('Approved', 'Approved'),
		('Rejected', 'Rejected'),
	]
	employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leaves')
	start_date = models.DateField()
	end_date = models.DateField()
	reason = models.TextField()
	status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Pending')
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"{self.employee.name} - {self.status} ({self.start_date} to {self.end_date})"


# Attendance model
class Attendance(models.Model):
	STATUS_CHOICES = [
		('Present', 'Present'),
		('Absent', 'Absent'),
		('Leave', 'Leave'),
	]
	employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendances')
	date = models.DateField(auto_now_add=True)
	status = models.CharField(max_length=20, choices=STATUS_CHOICES)
	check_in = models.TimeField(null=True, blank=True)
	check_out = models.TimeField(null=True, blank=True)

	class Meta:
		unique_together = ('employee', 'date')

	def __str__(self):
		return f"{self.employee.name} - {self.date} - {self.status}"


class Task(models.Model):
    PRIORITY_LOW = 'Low'
    PRIORITY_MEDIUM = 'Medium'
    PRIORITY_HIGH = 'High'
    PRIORITY_CHOICES = [
        (PRIORITY_LOW, 'Low'),
        (PRIORITY_MEDIUM, 'Medium'),
        (PRIORITY_HIGH, 'High'),
    ]

    STATUS_PENDING = 'Pending'
    STATUS_IN_PROGRESS = 'In Progress'
    STATUS_COMPLETED = 'Completed'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_IN_PROGRESS, 'In Progress'),
        (STATUS_COMPLETED, 'Completed'),
    ]

    hr = models.ForeignKey('HR', on_delete=models.CASCADE, related_name='assigned_tasks')
    employee = models.ForeignKey('Employee', on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField()
    due_date = models.DateField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.employee.name}"
