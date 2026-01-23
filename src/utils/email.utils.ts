/**
 * Generates a secure random password
 * @param length Password length (default: 12)
 * @returns A random password with letters, numbers, and special characters
 */
export const generateSecurePassword = (length: number = 12): string => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';

    const allChars = uppercase + lowercase + numbers + special;

    // Ensure at least one of each type
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Calls the Supabase Edge Function to send welcome email
 */
export const sendStaffWelcomeEmail = async (params: {
    email: string;
    name: string;
    password: string;
    firmName: string;
}): Promise<void> => {
    try {
        const { supabase } = await import('../services/supabase');

        console.log('[WelcomeEmail] Invoking Edge Function for:', params.email);

        const { data, error } = await supabase.functions.invoke('send-staff-welcome-email', {
            body: params
        });

        if (error) {
            console.error('[WelcomeEmail] Edge Function error:', error);
            throw error;
        }

        console.log('[WelcomeEmail] Email sent successfully:', data);
    } catch (error) {
        console.error('[WelcomeEmail] Failed to send welcome email:', error);
        // Don't throw - we don't want staff creation to fail if email fails
        // Just log the error
    }
};
