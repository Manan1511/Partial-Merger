import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

/**
 * DependencyConfirmModal — asks the user whether to also enable a dependency feature.
 *
 * Props:
 *   isOpen       (boolean)  — whether the modal is visible
 *   feature      (string)   — the feature the user is trying to enable
 *   dependency   (string)   — the feature that `feature` depends on
 *   onConfirm    (function) — called when user clicks "Yes, enable both"
 *   onDeny       (function) — called when user clicks "No, just this one"
 *   onClose      (function) — called when user dismisses without choosing
 */
const DependencyConfirmModal = ({ isOpen, feature, dependency, onConfirm, onDeny, onClose }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-surface border border-border p-6 rounded-xl w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Warning icon */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-warning/20 p-2 rounded-lg">
                        <AlertTriangle size={20} className="text-warning" />
                    </div>
                    <h2 className="text-lg font-bold">Dependency Found</h2>
                </div>

                {/* Message */}
                <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
                    <strong className="text-white">{feature}</strong> depends on{' '}
                    <strong className="text-white">{dependency}</strong>.
                    <br />
                    Would you like to enable <strong className="text-white">{dependency}</strong> as well?
                </p>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onConfirm}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-2 rounded-lg transition-colors text-sm"
                    >
                        Yes, enable both
                    </button>
                    <button
                        onClick={onDeny}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2 rounded-lg transition-colors text-sm"
                    >
                        No, just this one
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DependencyConfirmModal;
