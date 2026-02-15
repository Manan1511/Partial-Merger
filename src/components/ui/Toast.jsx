import React, { useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className={`flex items-center space-x-2 px-4 py-3 rounded-lg shadow-glow border border-white/10 ${type === 'success' ? 'bg-zinc-900 text-green-400' : 'bg-zinc-900 text-red-400'
                }`}>
                {type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                <span className="text-sm font-medium text-white">{message}</span>
            </div>
        </div>
    );
};

export default Toast;
