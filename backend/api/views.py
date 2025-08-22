from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from .models import Employee, HR, Leave
from .serializers import HRSerializer, EmployeeSerializer, LeaveSerializer
from django.contrib.auth.hashers import check_password
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q, Count
from .models import Employee, HR, Leave, Attendance, Task
from .serializers import HRSerializer, EmployeeSerializer, LeaveSerializer, AttendanceSerializer, TaskSerializer
from django.contrib.auth.hashers import check_password
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime, timedelta


@api_view(['GET'])
def leaves_status_summary(request):
	"""Return total counts grouped by leave status across all employees.

	Response: { "pending": int, "approved": int, "rejected": int }
	"""
	try:
		pending = Leave.objects.filter(status='Pending').count()
		approved = Leave.objects.filter(status='Approved').count()
		rejected = Leave.objects.filter(status='Rejected').count()
		return Response({
			'pending': pending,
			'approved': approved,
			'rejected': rejected
		})
	except Exception as e:
		return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def employees_department_count(request):
	"""Return employee count per department.

	Response: [ { "department": "HR", "count": 10 }, ... ]
	"""
	try:
		qs = Employee.objects.values('department').annotate(count=Count('id'))
		data = [ { 'department': d['department'], 'count': d['count'] } for d in qs ]
		return Response(data)
	except Exception as e:
		return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AttendancePercentageView(APIView):
	"""Return attendance percentage for a specific employee.

	Response JSON:
	{
	  "employee_id": 2,
	  "employee_name": "Dilip",
	  "total_days": 20,
	  "present_days": 15,
	  "attendance_percentage": 75.0
	}
	"""
	permission_classes = [AllowAny]

	def get(self, request, employee_id):
		# ensure employee exists
		employee = get_object_or_404(Employee, id=employee_id)
		try:
			total_days = Attendance.objects.filter(employee_id=employee_id).count()
			present_days = Attendance.objects.filter(employee_id=employee_id, status='Present').count()
			attendance_percentage = round((present_days / total_days * 100), 2) if total_days > 0 else 0

			return Response({
				'employee_id': employee.id,
				'employee_name': employee.name,
				'total_days': total_days,
				'present_days': present_days,
				'attendance_percentage': attendance_percentage
			})
		except Exception as e:
			return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def employee_list(request):
	queryset = Employee.objects.all()
	department = request.GET.get('department')
	search = request.GET.get('search')

	if department:
		queryset = queryset.filter(department__iexact=department)
	if search:
		queryset = queryset.filter(Q(name__icontains=search) | Q(email__icontains=search))

	data = [
		{
			"id": emp.id,
			"name": emp.name,
			"email": emp.email,
			"department": emp.department,
			"designation": emp.designation,
			"salary": str(emp.salary)
		}
		for emp in queryset
	]
	return Response(data, status=status.HTTP_200_OK)


class StatsView(APIView):
	def get(self, request):
		employees_count = Employee.objects.count()
		departments_count = Employee.objects.values('department').distinct().count()
		return Response({
			"employees_count": employees_count,
			"departments_count": departments_count
		})


# Unified Login View
@api_view(['POST'])
def login(request):
	email = request.data.get('email')
	password = request.data.get('password')
	# Try HR first
	try:
		hr = HR.objects.get(email=email)
		if password == hr.password:
			data = HRSerializer(hr).data
			return Response({'role': 'hr', 'data': data})
	except HR.DoesNotExist:
		pass
	# Try Employee next
	try:
		emp = Employee.objects.get(email=email)
		if check_password(password, emp.password):
			data = EmployeeSerializer(emp).data
			return Response({'role': 'employee', 'data': data})
	except Employee.DoesNotExist:
		pass
	return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


# List all employees for logged-in HR
@api_view(['GET'])
def employee_list_by_hr(request):
	hr_id = request.query_params.get('hr_id')
	employees = Employee.objects.filter(hr_id=hr_id)
	serializer = EmployeeSerializer(employees, many=True)
	return Response(serializer.data)


# Create employee (by HR)
@api_view(['POST'])
def employee_create(request):
	serializer = EmployeeSerializer(data=request.data)
	if serializer.is_valid():
		new_emp = serializer.save()
		# Try to notify via Node mailer service (non-blocking). If mailer isn't available, log and continue.
		try:
			import requests
			mailer_url = 'http://localhost:3001/send-welcome-email'
			payload = { 'name': new_emp.name, 'email': new_emp.email, 'password': request.data.get('password') }
			# best-effort POST; timeout short so it doesn't block API
			requests.post(mailer_url, json=payload, timeout=2)
		except Exception as e:
			# keep API success even if mailing fails
			print('Mailer call failed:', str(e))
		return Response(serializer.data, status=status.HTTP_201_CREATED)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Update employee (by HR)
@api_view(['PUT'])
def employee_update(request, pk):
	try:
		emp = Employee.objects.get(pk=pk)
	except Employee.DoesNotExist:
		return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
	serializer = EmployeeSerializer(emp, data=request.data, partial=True)
	if serializer.is_valid():
		serializer.save()
		return Response(serializer.data)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Get employee by id
@api_view(['GET'])
def employee_detail(request, pk):
	try:
		emp = Employee.objects.get(pk=pk)
		serializer = EmployeeSerializer(emp)
		return Response(serializer.data)
	except Employee.DoesNotExist:
		return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)


# Delete employee (by HR)
@api_view(['DELETE'])
def employee_delete(request, pk):
	try:
		emp = Employee.objects.get(pk=pk)
		emp.delete()
		return Response({'message': 'Employee deleted'})
	except Employee.DoesNotExist:
		return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)


# --- Leave Management Endpoints ---

@api_view(['POST'])
def leave_request(request):
	emp_id = request.data.get('employee')
	if not emp_id:
		return Response({'error': 'Employee ID required'}, status=status.HTTP_400_BAD_REQUEST)
	# validate dates: start_date and end_date must be present, properly formatted (YYYY-MM-DD), not in the past, and start <= end
	start_str = request.data.get('start_date')
	end_str = request.data.get('end_date')
	if not start_str or not end_str:
		return Response({'error': 'start_date and end_date are required'}, status=status.HTTP_400_BAD_REQUEST)
	try:
		# strict parsing: expect YYYY-MM-DD
		start_date = datetime.strptime(start_str, '%Y-%m-%d').date()
		end_date = datetime.strptime(end_str, '%Y-%m-%d').date()
	except Exception:
		return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
	today = timezone.localdate()
	if start_date < today or end_date < today:
		return Response({'error': 'Cannot request leave for past dates.'}, status=status.HTTP_400_BAD_REQUEST)
	if start_date > end_date:
		return Response({'error': 'start_date cannot be after end_date.'}, status=status.HTTP_400_BAD_REQUEST)

	# Prevent requesting a range that overlaps with any already-approved leave for this employee
	try:
		existing = Leave.objects.filter(employee_id=emp_id, status='Approved', start_date__lte=end_date, end_date__gte=start_date)
		if existing.exists():
			return Response({'error': 'An approved leave already exists for the requested date range.'}, status=status.HTTP_400_BAD_REQUEST)
	except Exception:
		# fallback to safe behavior
		pass

	serializer = LeaveSerializer(data=request.data)
	if serializer.is_valid():
		serializer.save()
		return Response(serializer.data, status=status.HTTP_201_CREATED)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def leave_mine(request):
	emp_id = request.query_params.get('employee')
	if not emp_id:
		return Response({'error': 'Employee ID required'}, status=status.HTTP_400_BAD_REQUEST)
	leaves = Leave.objects.filter(employee_id=emp_id).order_by('-created_at')
	serializer = LeaveSerializer(leaves, many=True)
	return Response(serializer.data)


@api_view(['GET'])
def leave_pending(request):
	leaves = Leave.objects.filter(status='Pending').order_by('-created_at')
	serializer = LeaveSerializer(leaves, many=True)
	return Response(serializer.data)


@api_view(['GET'])
def leave_summary(request):
	"""Return total approved leaves and pending leaves for an employee.
	Query params: ?employee=<id>
	Response: { "total_taken": <int>, "pending": <int> }
	"""
	emp_id = request.query_params.get('employee')
	if not emp_id:
		return Response({'error': 'Employee ID required'}, status=status.HTTP_400_BAD_REQUEST)
	try:
		total_taken = Leave.objects.filter(employee_id=emp_id, status='Approved').count()
		pending = Leave.objects.filter(employee_id=emp_id, status='Pending').count()
		return Response({ 'total_taken': total_taken, 'pending': pending })
	except Exception as e:
		return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def leave_action(request, leave_id):
	action = request.data.get('action')
	leave = get_object_or_404(Leave, id=leave_id)
	if action not in ['approve', 'reject']:
		return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
	leave.status = 'Approved' if action == 'approve' else 'Rejected'
	leave.save()
	# If approved, create or update attendance for the date range
	if leave.status == 'Approved':
		current = leave.start_date
		while current <= leave.end_date:
			Attendance.objects.update_or_create(
				employee=leave.employee,
				date=current,
				defaults={'status': 'Leave', 'check_in': None, 'check_out': None}
			)
			current = current + timedelta(days=1)
	serializer = LeaveSerializer(leave)
	return Response(serializer.data)


# --- Attendance Endpoints ---

@api_view(['POST'])
def attendance_mark(request):
	"""Employee marks attendance (check_in recorded)."""
	emp_id = request.data.get('employee')
	if not emp_id:
		return Response({'error': 'Employee ID required'}, status=status.HTTP_400_BAD_REQUEST)
	employee = get_object_or_404(Employee, id=emp_id)
	today = timezone.localdate()
	# Prevent marking Present on approved leave
	if Leave.objects.filter(employee=employee, start_date__lte=today, end_date__gte=today, status='Approved').exists():
		return Response({'error': 'Leave approved for today; cannot mark Present.'}, status=status.HTTP_400_BAD_REQUEST)
	# create or update attendance
	now = timezone.localtime().time()
	attendance, created = Attendance.objects.get_or_create(employee=employee, date=today, defaults={'status': 'Present', 'check_in': now})
	if not created:
		# if existing, update check_in if missing
		if not attendance.check_in:
			attendance.check_in = now
			attendance.status = 'Present'
			attendance.save()
	serializer = AttendanceSerializer(attendance)
	return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
def attendance_checkout(request):
	"""Employee updates check_out for the day."""
	emp_id = request.data.get('employee')
	if not emp_id:
		return Response({'error': 'Employee ID required'}, status=status.HTTP_400_BAD_REQUEST)
	employee = get_object_or_404(Employee, id=emp_id)
	today = timezone.localdate()
	try:
		attendance = Attendance.objects.get(employee=employee, date=today)
		now = timezone.localtime().time()
		attendance.check_out = now
		attendance.save()
		serializer = AttendanceSerializer(attendance)
		return Response(serializer.data)
	except Attendance.DoesNotExist:
		return Response({'error': 'No attendance record for today'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def attendance_list(request):
	"""HR: list attendance with filters: date, range (weekly/monthly), employee, department"""
	qs = Attendance.objects.select_related('employee')
	date = request.query_params.get('date')
	range_param = request.query_params.get('range')
	employee_id = request.query_params.get('employee')
	employee_query = request.query_params.get('q')
	department = request.query_params.get('department')
	start_date = request.query_params.get('start_date')
	end_date = request.query_params.get('end_date')

	if date:
		qs = qs.filter(date=date)
	if range_param == 'weekly':
		today = timezone.localdate()
		start = today - timedelta(days=today.weekday())
		qs = qs.filter(date__gte=start)
	if range_param == 'monthly':
		today = timezone.localdate()
		qs = qs.filter(date__year=today.year, date__month=today.month)
	# support employee id or name search via 'employee' (id) or 'q' (name or id)
	if employee_id:
		qs = qs.filter(employee_id=employee_id)
	if employee_query:
		# try numeric id match first
		if employee_query.isdigit():
			qs = qs.filter(employee_id=int(employee_query))
		else:
			qs = qs.filter(employee__name__icontains=employee_query)
	if department:
		qs = qs.filter(employee__department__iexact=department)
	if start_date and end_date:
		qs = qs.filter(date__range=[start_date, end_date])

	# ordering
	ordering = request.query_params.get('ordering')
	if ordering:
		qs = qs.order_by(ordering)

	serializer = AttendanceSerializer(qs, many=True)
	return Response(serializer.data)


@api_view(['PUT'])
def attendance_update(request, pk):
	"""HR can update/correct attendance record."""
	try:
		att = Attendance.objects.get(pk=pk)
	except Attendance.DoesNotExist:
		return Response({'error': 'Attendance not found'}, status=status.HTTP_404_NOT_FOUND)
	serializer = AttendanceSerializer(att, data=request.data, partial=True)
	if serializer.is_valid():
		serializer.save()
		return Response(serializer.data)

	# return validation errors if any
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def change_password(request):
	"""Allow the authenticated employee to change their password.

	Expects JSON body: { old_password, new_password, confirm_password }
	"""
	# Support two modes:
	# 1) Authenticated request: use request.user.email
	# 2) Unauthenticated request: accept 'email' or 'employee' (id) in the JSON body
	user = request.user
	email = None
	if getattr(user, 'is_authenticated', False):
		email = getattr(user, 'email', None)
	# fallback to values provided in payload for unauthenticated requests
	if not email:
		email = request.data.get('email')
		# also accept numeric employee id under 'employee' or 'employee_id'
		if not email:
			emp_id = request.data.get('employee') or request.data.get('employee_id')
			if emp_id:
				try:
					emp_lookup = Employee.objects.get(pk=int(emp_id))
					email = emp_lookup.email
				except Exception:
					email = None

	if not email:
		# if we still don't have an email, require the client to provide it
		return Response({'error': 'Email or employee id required'}, status=status.HTTP_400_BAD_REQUEST)

	try:
		emp = Employee.objects.get(email=email)
	except Employee.DoesNotExist:
		return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

	old_password = request.data.get('old_password')
	new_password = request.data.get('new_password')
	confirm_password = request.data.get('confirm_password')

	if not old_password or not new_password or not confirm_password:
		return Response({'error': 'old_password, new_password and confirm_password are required'}, status=status.HTTP_400_BAD_REQUEST)

	# validate old password
	if not check_password(old_password, emp.password):
		return Response({'error': 'Old password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

	if new_password != confirm_password:
		return Response({'error': 'New password and confirm password do not match'}, status=status.HTTP_400_BAD_REQUEST)

	if new_password == old_password:
		return Response({'error': 'New password must be different from old password'}, status=status.HTTP_400_BAD_REQUEST)

	# set and save new password
	emp.set_password(new_password)
	emp.save()
	return Response({'message': 'Password updated successfully'})


@api_view(['GET'])
def attendance_stats_employee(request):
	"""Return stats for an employee: total leaves taken, pending leaves, attendance %"""
	emp_id = request.query_params.get('employee')
	if not emp_id:
		return Response({'error': 'Employee ID required'}, status=status.HTTP_400_BAD_REQUEST)
	try:
		total_leaves = Leave.objects.filter(employee_id=emp_id, status='Approved').count()
		pending_leaves = Leave.objects.filter(employee_id=emp_id, status='Pending').count()
		total_days = Attendance.objects.filter(employee_id=emp_id).count()
		present_days = Attendance.objects.filter(employee_id=emp_id, status='Present').count()
		attendance_percent = (present_days / total_days * 100) if total_days > 0 else 0
		return Response({
			'total_leaves': total_leaves,
			'pending_leaves': pending_leaves,
			'attendance_percent': round(attendance_percent, 2)
		})
	except Exception as e:
		return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def attendance_stats_hr(request):
	"""Return HR analytics: department-wise attendance %, top punctual, lowest attendance"""
	try:
		# department-wise attendance %
		dept_stats = Employee.objects.values('department').annotate(
			total=Count('attendances'),
			present=Count('attendances', filter=Q(attendances__status='Present'))
		)
		dept_summary = []
		for d in dept_stats:
			pct = (d['present'] / d['total'] * 100) if d['total'] > 0 else 0
			dept_summary.append({'department': d['department'], 'attendance_percent': round(pct, 2)})

		# top punctual employees (earliest average check_in)
		punctual = Attendance.objects.filter(check_in__isnull=False).values('employee__id', 'employee__name').annotate(avg_check_in=Count('check_in')).order_by('avg_check_in')[:5]

		# lowest attendance employees
		lowest = Employee.objects.annotate(total=Count('attendances'), present=Count('attendances', filter=Q(attendances__status='Present'))).order_by('present')[:5]
		lowest_list = [{'employee': e.name, 'present': e.present, 'total': e.total} for e in lowest]

		return Response({
			'departments': dept_summary,
			'top_punctual': list(punctual),
			'lowest_attendance': lowest_list
		})
	except Exception as e:
		return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import HR, Employee, Task
from .serializers import TaskSerializer

def _get_hr_by_id(hr_id):
    try:
        return HR.objects.get(pk=hr_id)
    except (HR.DoesNotExist, ValueError, TypeError):
        return None

def _get_employee_by_id(emp_id):
    try:
        return Employee.objects.get(pk=emp_id)
    except (Employee.DoesNotExist, ValueError, TypeError):
        return None

@api_view(['GET', 'POST'])
def tasks_list_create(request):
    """
    GET: list tasks for a given HR (requires ?hr_id=<id>)
    POST: create task - requires 'hr' (id) in body (or 'hr_id'); 'employee' id and task fields.
    """
    if request.method == 'GET':
        hr_id = request.query_params.get('hr_id')
        if not hr_id:
            return Response({"error": "hr_id query param required"}, status=status.HTTP_400_BAD_REQUEST)
        hr = _get_hr_by_id(hr_id)
        if not hr:
            return Response({"error": "HR not found"}, status=status.HTTP_404_NOT_FOUND)
        tasks = Task.objects.filter(hr=hr).order_by('-created_at')
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # POST
    hr_id = request.data.get('hr') or request.data.get('hr_id')
    if not hr_id:
        return Response({"error": "'hr' (id) is required in request body"}, status=status.HTTP_400_BAD_REQUEST)
    hr = _get_hr_by_id(hr_id)
    if not hr:
        return Response({"error": "HR not found"}, status=status.HTTP_404_NOT_FOUND)

    # ensure employee exists
    emp_id = request.data.get('employee')
    if not emp_id:
        return Response({"error": "'employee' (id) is required"}, status=status.HTTP_400_BAD_REQUEST)
    emp = _get_employee_by_id(emp_id)
    if not emp:
        return Response({"error": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)

    data = request.data.copy()
    data['hr'] = hr.id
    serializer = TaskSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def tasks_my_tasks(request):
    """
    GET: list tasks for an employee (requires ?employee_id=<id> or ?employee=<id>)
    """
    employee_id = request.query_params.get('employee_id') or request.query_params.get('employee')
    if not employee_id:
        return Response({"error": "employee_id query param required"}, status=status.HTTP_400_BAD_REQUEST)
    employee = _get_employee_by_id(employee_id)
    if not employee:
        return Response({"error": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)

    tasks = Task.objects.filter(employee=employee).order_by('-created_at')
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['PATCH'])
def tasks_update_status(request, pk):
    """
    PATCH: update task status. Client must provide employee id (in body 'employee' or query param 'employee_id')
    Only the owning employee may update their task.
    """
    employee_id = request.data.get('employee') or request.query_params.get('employee_id')
    if not employee_id:
        return Response({"error": "employee id required (body 'employee' or ?employee_id)"}, status=status.HTTP_400_BAD_REQUEST)
    employee = _get_employee_by_id(employee_id)
    if not employee:
        return Response({"error": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

    if task.employee_id != employee.id:
        return Response({"error": "You may only modify your own tasks"}, status=status.HTTP_403_FORBIDDEN)

    allowed = {'status'}
    update_data = {k: v for k, v in request.data.items() if k in allowed}
    if not update_data:
        return Response({"error": "No updatable fields provided (allowed: status)"}, status=status.HTTP_400_BAD_REQUEST)

    serializer = TaskSerializer(task, data=update_data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
