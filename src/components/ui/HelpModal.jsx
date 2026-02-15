import React from 'react';
import { X, GitPullRequest, Key, CheckSquare, GitMerge } from 'lucide-react';

const HelpModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-surface border border-border p-6 rounded-xl w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <span className="bg-primary/20 p-2 rounded-lg text-primary">
                        <GitMerge size={20} />
                    </span>
                    How to use
                </h2>

                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="bg-zinc-800 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-blue-400 font-bold border border-white/5">1</div>
                        <div>
                            <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                                <GitPullRequest size={16} className="text-zinc-400" />
                                Paste PR Link
                            </h3>
                            <p className="text-zinc-400 text-sm">Copy the URL of the GitHub Pull Request you want to analyze and paste it into the search bar.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-zinc-800 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-blue-400 font-bold border border-white/5">2</div>
                        <div>
                            <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                                <Key size={16} className="text-zinc-400" />
                                Authenticate
                            </h3>
                            <p className="text-zinc-400 text-sm">Enter a GitHub Personal Access Token (Classic) with <code>repo</code> scope. This is stored locally in your browser.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-zinc-800 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-blue-400 font-bold border border-white/5">3</div>
                        <div>
                            <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                                <CheckSquare size={16} className="text-zinc-400" />
                                Select & Merge
                            </h3>
                            <p className="text-zinc-400 text-sm">
                                Review the diff. <span className="text-green-400">Green lines</span> add code, <span className="text-red-400">Red lines</span> keep existing code.
                                Select exactly what you want to ship and click <strong>Merge</strong>.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <button
                        onClick={onClose}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
