/**
 * Formats a date string or Date object into a consistent format.
 * Defaults to 'en-IN' locale (DD/MM/YYYY).
 */
export const formatDate = (
    date: string | Date | undefined | null,
    options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
    }
): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    return d.toLocaleDateString('en-IN', options);
};

export const formatDateTime = (
    date: string | Date | undefined | null,
    options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }
): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    return d.toLocaleDateString('en-IN', options);
};
