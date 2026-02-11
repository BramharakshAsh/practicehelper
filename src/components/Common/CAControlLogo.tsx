// React import not needed with new JSX transform

interface CAControlLogoProps {
    className?: string;
    showText?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function CAControlLogo({ className = '', showText = true, size = 'md' }: CAControlLogoProps) {
    const sizeMap = {
        sm: { width: 120, iconSize: 32, textSize: 18, gap: 8 },
        md: { width: 180, iconSize: 48, textSize: 26, gap: 12 },
        lg: { width: 240, iconSize: 64, textSize: 36, gap: 16 },
        xl: { width: 320, iconSize: 80, textSize: 48, gap: 20 },
    };

    const dimensions = sizeMap[size];
    const { iconSize, textSize, gap } = dimensions;

    return (
        <div className={`inline-flex items-center ${className}`} style={{ gap: `${gap}px` }}>
            {/* Icon */}
            <svg
                width={iconSize}
                height={iconSize}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Main C shape */}
                <path
                    d="M70 20C57.8 13 43.2 13 31 20C18.8 27 11 39.4 11 53C11 66.6 18.8 79 31 86C43.2 93 57.8 93 70 86"
                    stroke="#1E3A5F"
                    strokeWidth="10"
                    strokeLinecap="round"
                    fill="none"
                />

                {/* Checkmark inside C */}
                <path
                    d="M35 50L45 60L70 35"
                    stroke="#1E3A5F"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Decorative dots on C (green accent) */}
                <circle cx="25" cy="30" r="4" fill="#4CAF50" />
                <circle cx="20" cy="45" r="4" fill="#4CAF50" />
                <circle cx="25" cy="60" r="4" fill="#4CAF50" />

                {/* Orange accent square */}
                <rect x="75" y="50" width="12" height="12" fill="#FF8A3D" rx="2" />

                {/* Small dot accent */}
                <circle cx="85" cy="72" r="3.5" fill="#1E3A5F" />
            </svg>

            {/* Text */}
            {showText && (
                <span
                    className="tracking-tight select-none"
                    style={{
                        fontSize: `${textSize}px`,
                        color: '#1E3A5F',
                        fontWeight: 700,
                        letterSpacing: '-0.02em'
                    }}
                >
                    CAControl
                </span>
            )}
        </div>
    );
}
