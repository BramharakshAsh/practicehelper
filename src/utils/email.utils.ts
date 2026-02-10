import { devLog, devError } from '../services/logger';

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

    // Cryptographically secure random index
    const secureRandom = (max: number): number => {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] % max;
    };

    // Ensure at least one of each type
    let password = '';
    password += uppercase[secureRandom(uppercase.length)];
    password += lowercase[secureRandom(lowercase.length)];
    password += numbers[secureRandom(numbers.length)];
    password += special[secureRandom(special.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += allChars[secureRandom(allChars.length)];
    }

    // Fisher-Yates shuffle (unbiased)
    const arr = password.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = secureRandom(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
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

        devLog('[WelcomeEmail] Invoking Edge Function for:', params.email);

        const { data, error } = await supabase.functions.invoke('send-staff-welcome-email', {
            body: params
        });

        if (error) {
            devError('[WelcomeEmail] Edge Function error:', error);
            throw error;
        }

        devLog('[WelcomeEmail] Email sent successfully:', data);
    } catch (error) {
        devError('[WelcomeEmail] Failed to send welcome email:', error);
        // Don't throw - we don't want staff creation to fail if email fails
        // Just log the error
    }
};
