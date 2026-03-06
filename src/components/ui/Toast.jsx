import React, { useEffect } from 'react';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';

const Toast = ({ message, link, type = 'success', onClose }) => {
    useEffect(() => {
        const duration = link ? 8000 : 3000;
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [onClose, link]);

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className={`flex items-center space-x-2 px-4 py-3 rounded-lg shadow-glow border border-white/10 ${type === 'success' ? 'bg-zinc-900 text-green-400' : 'bg-zinc-900 text-red-400'
                }`}>
                {type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                <span className="text-sm font-medium text-white">{message}</span>
                {link && (
                    <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1 ml-1"
                    >
                        View on GitHub <ExternalLink size={12} />
                    </a>
                )}
            </div>
        </div>
    );
};

export default Toast;
