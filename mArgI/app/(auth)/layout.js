import React from 'react';
import BeamsBackground from '@/components/beams-background-auth-wrapper';

const AuthLayout = ({ children }) => {
    return (
        <BeamsBackground className="fixed inset-0 z-50">
            <div className="absolute inset-0 overflow-y-auto">
                <div className='flex min-h-full items-center justify-center p-4'>
                    {children}
                </div>
            </div>
        </BeamsBackground>
    )
};
export default AuthLayout