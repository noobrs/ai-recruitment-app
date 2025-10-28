interface FormContainerProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export default function FormContainer({ 
    children, 
    title, 
    subtitle,
    maxWidth = 'md'
}: FormContainerProps) {
    const maxWidthClasses = {
        'sm': 'max-w-sm',
        'md': 'max-w-md',
        'lg': 'max-w-lg',
        'xl': 'max-w-xl',
        '2xl': 'max-w-2xl'
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 px-4 py-12 sm:px-6 lg:px-8">
            <div className={`${maxWidthClasses[maxWidth]} w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl`}>
                {/* Header */}
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900">
                        {title}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {subtitle}
                    </p>
                </div>

                {/* Content */}
                {children}
            </div>
        </div>
    );
}
