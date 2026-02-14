export interface TaskSummary {
  overdue: any[];
  today: any[];
  tomorrow: any[];
  remaining: any[];
  review: any[];
  awaiting_client: any[];
  totalCount: number;
}

export class HtmlRenderer {
  static renderStaffEmail(user: { full_name: string }, summary: TaskSummary): string {
    const sections = [
      { title: 'Overdue Tasks', tasks: summary.overdue, color: '#e53e3e' },
      { title: 'Due Today', tasks: summary.today, color: '#3182ce' },
      { title: 'Due Tomorrow', tasks: summary.tomorrow, color: '#38a169' },
      { title: 'Awaiting Client Data', tasks: summary.awaiting_client, color: '#d69e2e' },
      { title: 'Remaining Tasks', tasks: summary.remaining, color: '#718096' },
    ];

    return this.layout(`
      <p>Hello ${user.full_name},</p>
      <p>Here is your daily summary of pending tasks in CAControl.</p>
      ${sections.map(s => this.renderSection(s.title, s.tasks, s.color)).join('')}
    `);
  }

  static renderManagerEmail(user: { full_name: string }, summaryA: TaskSummary, summaryB: TaskSummary): string {
    const renderSummary = (summary: TaskSummary, title: string) => {
      const sections = [
        { title: 'Overdue Tasks', tasks: summary.overdue, color: '#e53e3e' },
        { title: 'Due Today', tasks: summary.today, color: '#3182ce' },
        { title: 'Due Tomorrow', tasks: summary.tomorrow, color: '#3182ce' },
        { title: 'Pending Review', tasks: summary.review, color: '#805ad5' },
        { title: 'Awaiting Client', tasks: summary.awaiting_client, color: '#d69e2e' },
        { title: 'Remaining', tasks: summary.remaining, color: '#718096' },
      ];
      return `
        <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px;">${title}</h2>
        ${sections.map(s => this.renderSection(s.title, s.tasks, s.color)).join('')}
      `;
    };

    return this.layout(`
      <p>Hello ${user.full_name},</p>
      <p>Here is the daily overview for your firm and personal tasks.</p>
      ${renderSummary(summaryA, 'Section A: Your Tasks')}
      ${renderSummary(summaryB, 'Section B: Full Firm Overview')}
    `);
  }

  private static renderSection(title: string, tasks: any[], color: string): string {
    const isOverdue = title.includes('Overdue');
    const isReview = title.includes('Review');

    if (tasks.length === 0) {
      if (isOverdue) {
        return `<div style="margin-bottom: 20px;"><h3 style="color: ${color}; opacity: 0.7;">${title}</h3><p style="color: #666; font-style: italic;">No overdue tasks</p></div>`;
      }
      if (isReview) {
        return `<div style="margin-bottom: 20px;"><h3 style="color: ${color}; opacity: 0.7;">${title}</h3><p style="color: #666; font-style: italic;">No tasks pending for review</p></div>`;
      }
      return '';
    }

    return `
      <div style="margin-bottom: 20px;">
        <h3 style="color: ${color}; margin-bottom: 5px;">${title} (${tasks.length})</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background-color: #f7fafc; text-align: left;">
              <th style="padding: 8px; border: 1px solid #edf2f7;">Task</th>
              <th style="padding: 8px; border: 1px solid #edf2f7;">Client</th>
              <th style="padding: 8px; border: 1px solid #edf2f7;">Assigned To</th>
              <th style="padding: 8px; border: 1px solid #edf2f7;">Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(t => `
              <tr>
                <td style="padding: 8px; border: 1px solid #edf2f7;">${t.title}</td>
                <td style="padding: 8px; border: 1px solid #edf2f7;">${t.client?.name || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid #edf2f7;">${t.staff?.full_name || 'Unassigned'}</td>
                <td style="padding: 8px; border: 1px solid #edf2f7;">${new Date(t.due_date).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private static layout(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .footer { margin-top: 30px; font-size: 12px; color: #718096; border-top: 1px solid #eee; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            ${content}
            <div class="footer">
              Sent by CAControl. To change your notification settings, please visit your dashboard.
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
