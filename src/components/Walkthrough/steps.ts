import { Step } from 'react-joyride';

export const walkthroughSteps: Step[] = [
    {
        target: '[data-walkthrough="dashboard-overview"]',
        content: 'Welcome to Firm Flow! This is your Dashboard where you can see a summary of your operations, urgent tasks, and staff workload.',
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: '[data-walkthrough="add-task"]',
        content: 'Quickly create tasks for your clients right from the dashboard.',
        placement: 'left',
    },
    {
        target: '[data-walkthrough="calendar-view"]',
        content: 'The Calendar view helps you track all deadlines and scheduled filings in one place.',
        placement: 'bottom',
    },
    {
        target: '[data-walkthrough="audit-section"]',
        content: 'Tip: Use the Audits section for heavy tasks, internal audits, and complex project tracking.',
        placement: 'bottom',
    },
    {
        target: '[data-walkthrough="import-button"]',
        content: 'Save time by importing your existing clients and tasks using our CSV import tool.',
        placement: 'bottom',
    },
    {
        target: 'a[href="/dashboard/staff"]',
        content: 'Manage your team members here. You can assign roles and generate login credentials for them.',
        placement: 'bottom',
    },
    {
        target: 'a[href="/dashboard/clients"]',
        content: 'Add and manage your clients. Associate them with specific compliance types to automate your workflow.',
        placement: 'bottom',
    },
    {
        target: 'body',
        content: 'You are all set! Explore the app and reach out if you need any help.',
        placement: 'center',
    }
];
