import * as React from 'react';
const { useState } = React;
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertTriangle, CheckCircle, Video, MapPin } from 'lucide-react';
import { Task, Meeting } from '../../types';

interface CalendarViewProps {
  tasks: Task[];
  meetings?: Meeting[];
  currentRole: 'partner' | 'staff';
  currentStaffId?: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, meetings = [], currentRole, currentStaffId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Filter tasks based on role
  let filteredTasks = tasks;
  if (currentRole === 'staff' && currentStaffId) {
    filteredTasks = tasks.filter((task: Task) => task.staff_id === currentStaffId);
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return { tasks: [], meetings: [] };

    const dayTasks = filteredTasks.filter((task: Task) => {
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === date.toDateString();
    });

    const dayMeetings = meetings.filter((meeting: Meeting) => {
      const meetingDate = new Date(meeting.start_time);
      return meetingDate.toDateString() === date.toDateString();
    });

    return { tasks: dayTasks, meetings: dayMeetings };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'assigned':
        return <Clock className="h-3 w-3 text-blue-500" />;
      case 'in_progress':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'awaiting_client_data':
        return <AlertTriangle className="h-3 w-3 text-orange-500" />;
      case 'ready_for_review':
        return <Clock className="h-3 w-3 text-purple-500" />;
      case 'filed_completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isOverdue = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendar</h2>
          <p className="text-gray-600 mt-1">Track due dates and important deadlines</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm font-medium rounded-l-lg ${viewMode === 'month' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm font-medium rounded-r-lg ${viewMode === 'week' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>

          <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5" />
            <span>{formatDate(currentDate)}</span>
          </h3>

          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div key={day} className="bg-gray-100 p-3 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((date: Date | null, index: number) => {
            const { tasks: dayTasks, meetings: dayMeetings } = getEventsForDate(date);
            const isEmpty = !date;

            return (
              <div
                key={index}
                className={`bg-white min-h-[120px] p-2 ${isEmpty ? 'opacity-50' : 'hover:bg-gray-50'
                  } ${isToday(date) ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
              >
                {date && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${isToday(date) ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                      {date.getDate()}
                    </div>

                    <div className="space-y-1">
                      {/* Meetings First */}
                      {dayMeetings.map((meeting: Meeting) => (
                        <div
                          key={meeting.id}
                          className="text-xs p-1 rounded truncate bg-purple-100 text-purple-800 border border-purple-200"
                          title={`Meeting: ${meeting.title} (${new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                        >
                          <div className="flex items-center space-x-1">
                            {meeting.meeting_link ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                            <span className="truncate">{new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {meeting.title}</span>
                          </div>
                        </div>
                      ))}

                      {dayTasks.slice(0, 3).map((task: Task) => (
                        <div
                          key={task.id}
                          className={`text-xs p-1 rounded truncate ${isOverdue(date) && task.status !== 'filed_completed'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : task.status === 'filed_completed'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          title={`${task.title} - ${task.client?.name}`}
                        >
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(task.status)}
                            <span className="truncate">{task.title}</span>
                          </div>
                        </div>
                      ))}

                      {(dayTasks.length + dayMeetings.length) > 3 && (dayTasks.length > 0) && (
                        <div className="text-xs text-gray-600 font-medium">
                          +{dayTasks.length + dayMeetings.length - (dayMeetings.length + Math.min(dayTasks.length, 3))} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
            <span className="text-sm text-gray-600">Pending Task</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
            <span className="text-sm text-gray-600">Meeting</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span className="text-sm text-gray-600">Overdue</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-sm text-gray-600">Completed</span>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
        <div className="space-y-3">
          {filteredTasks
            .filter((task: Task) => new Date(task.due_date) >= new Date() && task.status !== 'filed_completed')
            .sort((a: Task, b: Task) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
            .slice(0, 5)
            .map((task: Task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(task.status)}
                  <div>
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    <p className="text-sm text-gray-600">{task.client?.name} • {task.period}</p>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {new Date(task.due_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </div>
              </div>
            ))}

          {filteredTasks.filter((task: Task) =>
            new Date(task.due_date) >= new Date() && task.status !== 'filed_completed'
          ).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No upcoming deadlines</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;