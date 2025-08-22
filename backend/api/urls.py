from django.urls import path
from . import views
from .views import StatsView, leave_request, leave_mine, leave_pending, leave_action

urlpatterns = [
	path('login/', views.login, name='login'),
	path('employee/list/', views.employee_list_by_hr, name='employee_list_by_hr'),
	path('employee/create/', views.employee_create, name='employee_create'),
	path('employee/<int:pk>/', views.employee_detail, name='employee_detail'),
	path('employee/update/<int:pk>/', views.employee_update, name='employee_update'),
	path('employee/delete/<int:pk>/', views.employee_delete, name='employee_delete'),
	path('counts/', views.StatsView.as_view(), name='stats-counts'),
	path('employees/', views.employee_list, name='employee-list'),
	# Leave endpoints
	path('leave/request/', views.leave_request, name='leave-request'),
	path('leave/mine/', views.leave_mine, name='leave-mine'),
	path('leave/pending/', views.leave_pending, name='leave-pending'),
	path('leave/summary/', views.leave_summary, name='leave-summary'),
	path('leaves/status-summary/', views.leaves_status_summary, name='leaves-status-summary'),
	path('leave/action/<int:leave_id>/', views.leave_action, name='leave-action'),
	
	# Employee analytics
	path('employees/department-count/', views.employees_department_count, name='employees-department-count'),

	# Attendance endpoints
	path('attendance/mark/', views.attendance_mark, name='attendance-mark'),
	path('attendance/checkout/', views.attendance_checkout, name='attendance-checkout'),
	path('attendance/', views.attendance_list, name='attendance-list'),
	path('attendance/<int:pk>/update/', views.attendance_update, name='attendance-update'),
	path('attendance/stats/employee/', views.attendance_stats_employee, name='attendance-stats-employee'),
	path('attendance/stats/hr/', views.attendance_stats_hr, name='attendance-stats-hr'),
	path('attendance-percentage/<int:employee_id>/', views.AttendancePercentageView.as_view(), name='attendance-percentage'),

	# Tasks endpoints
	path('tasks/', views.tasks_list_create, name='tasks-list-create'),
	path('tasks/my-tasks/', views.tasks_my_tasks, name='tasks-my-tasks'),
	path('tasks/<int:pk>/', views.tasks_update_status, name='tasks-update-status'),
	path('employees/change-password/', views.change_password, name='employee-change-password'),
]
