import React from 'react';

export const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
    return (
        <button
            onClick={onClick}
            className={`realism-button ${className} ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            {...props}
        >
            <div className="blob1" />
            <div className="inner flex items-center justify-center gap-2">
                {children}
            </div>
        </button>
    );
};
