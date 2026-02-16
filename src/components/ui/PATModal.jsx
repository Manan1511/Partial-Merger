import React, { useState } from 'react';
import { X, ExternalLink, Check } from 'lucide-react';
import clsx from 'clsx';

const PATModal = ({ isOpen, onClose, onSave }) => {
    const [token, setToken] = useState('');
    const [saveLocally, setSaveLocally] = useState(false); // Default false for security

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-surface border border-border p-6 rounded-xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold mb-2">GitHub Authentication</h2>
                <div className="bg-white/5 p-4 rounded-lg mb-6 text-sm text-zinc-300 border border-white/10">
                    <p className="mb-2 font-semibold text-white">How to get a token:</p>
                    <ol className="list-decimal list-inside space-y-2 text-xs">
                        <li>
                            Go to <a href="https://github.com/settings/tokens/new?scopes=repo&description=Partial%20PR%20Merger" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">GitHub Settings <ExternalLink size={10} /></a>
                        </li>
                        <li>Generate a new <strong>classic</strong> token.</li>
                        <li>Ensure the code <strong>repo</strong> scope is checked.</li>
                        <li>Copy and paste the token below.</li>
                    </ol>
                </div>
                <p className="text-zinc-400 text-sm mb-6">
                    A Personal Access Token (PAT) is required to fetch diffs and merge lines.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Personal Access Token</label>
                        <input
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="ghp_..."
                            className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-mono text-sm"
                        />
                    </div>

                    <div
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => setSaveLocally(!saveLocally)}
                    >
                        <div className={clsx(
                            "w-4 h-4 rounded border flex items-center justify-center transition-all",
                            saveLocally ? "bg-primary border-primary" : "border-zinc-600 bg-zinc-800 group-hover:border-zinc-500"
                        )}>
                            {saveLocally && <Check size={10} className="text-white" />}
                        </div>
                        <label className="text-sm text-zinc-300 select-none cursor-pointer group-hover:text-white transition-colors">
                            Store token locally (Remember me)
                        </label>
                    </div>

                    <button
                        onClick={() => onSave(token, saveLocally)}
                        disabled={!token}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save Token
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PATModal;
