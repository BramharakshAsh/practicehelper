Dashboard Redesign - Implementation Plan
Current Dashboard Design
Review
Current Dashboard Design

Overview
Redesigning the dashboard from generic metrics to actionable, practice-focused insights. The new dashboard prioritizes what needs attention NOW rather than historical or vanity metrics.

Design Philosophy
What We're Removing:

❌ Total Clients (irrelevant daily)
❌ Completed Today (ego metric)
❌ Fancy graphs
❌ Long tables
❌ Historical analytics
What We're Adding:

✅ Critical alerts (overdue filings)
✅ Actionable cards (what to do today)
✅ Statutory deadline heatmap (compliance-wise status)
✅ Client dependency tracking (who's blocking work)
✅ Quick actions (common tasks)
Proposed Layout Structure
┌─────────────────────────────────────────────────────────┐
│ 🚨 CRITICAL ALERT STRIP (Sticky)                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  TODAY'S REALITY - 6 Actionable Cards                   │
│  [Due Today] [Overdue] [Await Client] [Review]          │
│  [Staff Overload] [Upcoming]                            │
│                                                          │
├──────────────────────────────────┬──────────────────────┤
│                                   │                      │
│  STATUTORY DEADLINES HEATMAP      │  QUICK ACTIONS      │
│  🔴 GST: 3 overdue, 5 this week  │  + Add Task         │
│  🟠 TDS: 2 due this week          │  + Schedule Filing  │
│  🟢 Income Tax: All clear         │  + Send Reminder    │
│  🟢 Audit: All clear              │  + Import Data      │
│                                   │                      │
├───────────────────────────────────┤  STAFF LOAD         │
│  URGENT TASKS (Next 3-7 Days)     │  ──────────────     │
│  Table with critical info         │  Staff 1: 8 tasks   │
│  - Client                         │  Staff 2: 5 tasks   │
│  - Act + Form                     │  Staff 3: 3 tasks   │
│  - Assigned Staff                 │                      │
│  - Status                         │                      │
│  - Due Date (countdown)           │                      │
│                                   │                      │
├───────────────────────────────────┴──────────────────────┤
│  CLIENT DEPENDENCIES (Top 5 Blocking)                    │
│  ABC Pvt Ltd – GST data pending – 5 days                 │
│  XYZ LLP – TDS challan pending – 3 days                  │
└──────────────────────────────────────────────────────────┘
Proposed Changes
Section A: Critical Alert Banner
[NEW] 

CriticalAlertBanner.tsx
Features:

Full-width red/orange strip
position: sticky; top: 0; z-index: 50
Shows overdue count by type (e.g., "3 GST filings overdue, 4 tasks awaiting client data")
Click → navigates to filtered task list
Data Calculation:

const overdueByType = tasks
  .filter(t => new Date(t.due_date) < now && t.status !== 'filed_completed')
  .reduce((acc, task) => {
    const type = complianceTypes.find(ct => ct.id === task.compliance_type_id);
    const category = type?.category || 'Other';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
Section B: Today's Reality Cards
[NEW] 

InsightCards.tsx
6 Cards:

Due Today

Count with breakdown: GST: 3 | TDS: 1 | IT: 1
Blue theme
Click → filter tasks by due_date = today
Overdue

Count + "Oldest 2 days"
Red theme
Click → filter tasks by overdue
Awaiting Client Data

Count of tasks in "awaiting_client_data" status
Orange theme
Click → filter by status
Pending Partner Review

Count of tasks in "ready_for_review" status
Green theme
Click → filter by status
Staff Overloaded

Count of staff with > 5 active tasks
Yellow theme
Click → go to staff page
Upcoming (Next 7 Days)

Count with breakdown by type
Purple theme
Click → filter tasks by next 7 days
Section C: Statutory Deadlines Heatmap
[NEW] 

StatutoryHeatmap.tsx
Layout:

GST        🔴 3 overdue | 🟠 5 due this week
TDS        🟠 2 due this week  
Income Tax 🟢 All clear
Audit      🟢 All clear
Others     🟢 All clear
Color Logic:

🔴 Red: Has overdue tasks
🟠 Orange: Tasks due this week (but none overdue)
🟢 Green: All clear
Click Behavior:

Click row → filter tasks by that compliance category
Section D: Urgent Tasks Table
[NEW] 

UrgentTasksTable.tsx
Filters:

Statutory tasks only (exclude 'Other' category or as_needed frequency)
Due within next 7 days OR overdue
Exclude completed
Columns:

Client (with icon)
Task (Act + Form, e.g., "GSTR-3B - Apr 2024")
Assigned Staff
Status (badge with color)
Due Date (with countdown: "Overdue 2d" or "Due today" or "2 days left")
Sorting:

Overdue first
Then by due date (earliest first)
Then by priority
Limit: Show top 5-7, with "View All Tasks →" link

Section E: Client Dependency Tracker
[NEW] 

ClientDependencyWidget.tsx
Shows: Top 5 clients with tasks stuck in "awaiting_client_data" status

Format:

ABC Pvt Ltd – GST data pending – 5 days waiting
XYZ LLP – TDS challan pending – 3 days waiting
Calculation:

const clientDependencies = tasks
  .filter(t => t.status === 'awaiting_client_data')
  .map(t => ({
    client: clients.find(c => c.id === t.client_id),
    task: t,
    daysWaiting: daysBetween(t.updated_at, now)
  }))
  .sort((a, b) => b.daysWaiting - a.daysWaiting)
  .slice(0, 5);
Section F: Staff Load Snapshot
[NEW] 

StaffLoadSnapshot.tsx
Simple Layout:

Anita Desai   ████████░░  8 tasks / 2 due today
Suresh Kumar  █████░░░░░  5 tasks / 1 due today  
Ravi Patel    ███░░░░░░░  3 tasks / 0 due today
Click: → Navigate to staff management page

Section G: Quick Actions
[NEW] 

QuickActions.tsx
4 Buttons:

+ Add Task → Open task creation modal
+ Schedule Filing → Open auto-task wizard
+ Send Client Reminder → Open reminder modal (future feature)
+ Import Data → Navigate to import page
Main Dashboard Component
[MODIFY] 

DashboardPage.tsx
New Structure:

<div className="space-y-6">
  <CriticalAlertBanner tasks={tasks} complianceTypes={complianceTypes} />
  
  <InsightCards tasks={tasks} staff={staff} complianceTypes={complianceTypes} />
  
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2 space-y-6">
      <StatutoryHeatmap tasks={tasks} complianceTypes={complianceTypes} />
      <UrgentTasksTable tasks={tasks} clients={clients} staff={staff} />
      <ClientDependencyWidget tasks={tasks} clients={clients} />
    </div>
    
    <div className="space-y-6">
      <QuickActions />
      <StaffLoadSnapshot tasks={tasks} staff={staff} />
    </div>
  </div>
</div>
Verification Plan
Visual Testing
Critical Alert Banner:

Verify sticky positioning works on scroll
Test click navigation to filtered tasks
Verify correct overdue counts
Insight Cards:

Verify all 6 cards display correctly
Test click-to-filter functionality
Verify data accuracy for each card
Statutory Heatmap:

Verify color coding logic (red/orange/green)
Test click-to-filter by category
Verify counts match actual task data
Urgent Tasks Table:

Verify only statutory tasks show
Test sorting (overdue → due date → priority)
Verify countdown displays correctly
Client Dependencies:

Verify top 5 clients with longest wait times
Verify "days waiting" calculation
Staff Load:

Verify task counts per staff
Test click navigation to staff page
Quick Actions:

Test all 4 buttons navigate/open correctly
Responsiveness
Test on mobile (cards should stack)
Test on tablet (2-column layout)
Test on desktop (full 3-column layout)
Edge Cases
No overdue tasks → banner should hide or show green message
No client dependencies → show empty state
All compliance types clear → all green in heatmap