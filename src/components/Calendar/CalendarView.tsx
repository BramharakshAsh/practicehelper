import * as React from 'react';
const { useState } = React;
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertTriangle, CheckCircle, Video, MapPin } from 'lucide-react';
import { Task, Meeting } from '../../types';

interface CalendarViewProps {
  tasks: Task[];
  meetings?: Meeting[];
  currentRole: 'partner' | 'staff';
  currentStaffId?: string;
  selectedStaffRole?: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, meetings = [], currentRole, currentStaffId, selectedStaffRole }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Filter tasks based on role
  let filteredTasks = tasks;
  if (currentRole === 'staff' && currentStaffId) {
    if (selectedStaffRole === 'partner' || selectedStaffRole === 'manager') {
      filteredTasks = tasks.filter((task: Task) => task.staff_id === currentStaffId || task.assigned_by === currentStaffId);
    } else {
      filteredTasks = tasks.filter((task: Task) => task.staff_id === currentStaffId);
    }
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
    <div className="space-y-4 sm:space-y-6">
      {/* Calendar Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center justify-between sm:justify-start sm:space-x-6 w-full sm:w-auto">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>

            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <span>{formatDate(currentDate)}</span>
            </h3>

            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg self-center sm:self-auto">
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${viewMode === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${viewMode === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Week
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div key={day} className="bg-gray-50 p-2 text-center text-[10px] sm:text-sm font-bold text-gray-500 uppercase tracking-wider">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}

          {/* Calendar days */}
          {days.map((date: Date | null, index: number) => {
            const { tasks: dayTasks, meetings: dayMeetings } = getEventsForDate(date);
            const isEmpty = !date;
            const hasEvents = dayTasks.length > 0 || dayMeetings.length > 0;

            return (
              <div
                key={index}
                className={`bg-white min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 flex flex-col ${isEmpty ? 'bg-gray-50/50' : 'hover:bg-gray-50'
                  } ${isToday(date) ? 'ring-2 ring-blue-500 ring-inset z-10' : ''}`}
              >
                {date && (
                  <>
                    <div className={`text-[11px] sm:text-sm font-bold mb-1 ${isToday(date) ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                      {date.getDate()}
                    </div>

                    <div className="flex-1 space-y-1 overflow-hidden">
                      {/* Meetings */}
                      {dayMeetings.map((meeting: Meeting) => (
                        <div
                          key={meeting.id}
                          className="hidden sm:block text-[10px] p-1 rounded truncate bg-purple-100 text-purple-800 border border-purple-200 shadow-sm"
                          title={`Meeting: ${meeting.title}`}
                        >
                          <div className="flex items-center space-x-1">
                            {meeting.meeting_link ? <Video className="h-2.5 w-2.5" /> : <MapPin className="h-2.5 w-2.5" />}
                            <span className="truncate">{meeting.title}</span>
                          </div>
                        </div>
                      ))}

                      {/* Tasks */}
                      {dayTasks.slice(0, 2).map((task: Task) => (
                        <div
                          key={task.id}
                          className={`hidden sm:block text-[10px] p-1 rounded truncate ${isOverdue(date) && task.status !== 'filed_completed'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : task.status === 'filed_completed'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                            } shadow-sm`}
                          title={`${task.title}`}
                        >
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(task.status)}
                            <span className="truncate">{task.title}</span>
                          </div>
                        </div>
                      ))}

                      {/* Mobile indicators */}
                      {hasEvents && (
                        <div className="sm:hidden flex flex-wrap gap-0.5 mt-auto">
                          {dayMeetings.length > 0 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          )}
                          {dayTasks.some(t => t.status !== 'filed_completed') && (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          )}
                          {dayTasks.some(t => t.status === 'filed_completed') && (
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          )}
                          {isOverdue(date) && dayTasks.some(t => t.status !== 'filed_completed') && (
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          )}
                        </div>
                      )}

                      {(dayTasks.length + dayMeetings.length) > 2 && (
                        <div className="hidden sm:block text-[9px] text-gray-500 font-bold px-1">
                          +{(dayTasks.length + dayMeetings.length) - 2} more
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-blue-600" />
          Upcoming Deadlines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filteredTasks
            .filter((task: Task) => new Date(task.due_date) >= new Date() && task.status !== 'filed_completed')
            .sort((a: Task, b: Task) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
            .slice(0, 6)
            .map((task: Task) => (
              <div key={task.id} className="group flex items-start justify-between p-3 sm:p-4 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    {getStatusIcon(task.status)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{task.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{task.client?.name}</p>
                    <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider mt-1">{task.period}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="text-xs font-bold text-gray-900">
                    {new Date(task.due_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                  <div className={`text-[10px] mt-1 ${new Date(task.due_date).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                    {Math.ceil((new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d left
                  </div>
                </div>
              </div>
            ))}

          {filteredTasks.filter((task: Task) =>
            new Date(task.due_date) >= new Date() && task.status !== 'filed_completed'
          ).length === 0 && (
              <div className="col-span-full text-center py-10 sm:py-12 bg-white rounded-xl">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-500 font-medium">No upcoming deadlines</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;