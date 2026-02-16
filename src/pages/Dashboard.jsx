import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { parseDiff } from '../utils/diffParser';
import { getPRDetails, mergeLines, getFileContent } from '../services/github';
import DiffViewer from '../components/DiffViewer';
import Toast from '../components/ui/Toast';
import { ArrowLeft, GitMerge, Loader2, Github, Check, Minus } from 'lucide-react';

const Dashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [diffData, setDiffData] = useState([]);
    const [prDetails, setPrDetails] = useState(null);
    const [selectedLines, setSelectedLines] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [merging, setMerging] = useState(false);
    const [toast, setToast] = useState(null);

    const { url, token } = location.state || {};

    // --- NEW: Global Selection Mode State ---
    const [fileModes, setFileModes] = useState({}); // { fileName: 'block' | 'single' }
    const [globalMode, setGlobalMode] = useState('block'); // 'block' | 'single'

    // Initialize or Reset modes when diffData changes
    useEffect(() => {
        if (diffData.length > 0) {
            const initialModes = {};
            diffData.forEach(file => initialModes[file.fileName] = 'block');
            setFileModes(initialModes);
            setGlobalMode('block');
        }
    }, [diffData]);

    useEffect(() => {
        if (!url || !token) {
            navigate('/');
            return;
        }

        const fetchDiff = async () => {
            try {
                // simple parse logic repeated locally or import from service
                const regex = /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/;
                const match = url.match(regex);
                if (!match) throw new Error("Invalid URL");

                const { owner, repo, pull_number } = { owner: match[1], repo: match[2], pull_number: match[3] };

                const { diff, pr } = await getPRDetails(token, { owner, repo, pull_number });
                setPrDetails(pr);
                const parsed = parseDiff(diff);
                setDiffData(parsed);

                // Initialize selection: Select all DELETIONS (Red lines) by default
                // Logic: "Selected" means "Keep this line in the final file"
                // So default state = Keep all originals (Base state) + Add 0 new lines.
                const initialSelection = new Set();
                parsed.forEach(file => {
                    file.lines.forEach(line => {
                        if (line.type === 'deletion') {
                            initialSelection.add(line.id);
                        }
                    });
                });
                setSelectedLines(initialSelection);

            } catch (err) {
                console.error(err);
                setToast({ message: "Failed to load PR diff. Check console.", type: "error" });
            } finally {
                setLoading(false);
            }
        };

        fetchDiff();
    }, [url, token, navigate]);

    const toggleBlock = (ids) => {
        if (!ids || ids.length === 0) return;
        const newSet = new Set(selectedLines);

        // Determine target state (if any unrelated line is unselected, we select all. If all selected, we deselect all)
        const allSelected = ids.every(id => newSet.has(id));
        const shouldSelect = !allSelected;

        // Context for mutual exclusion (use first line)
        // Find file and line
        let targetLine = null;
        let targetFile = null;
        const firstId = ids[0];

        for (const file of diffData) {
            const found = file.lines.find(l => l.id === firstId);
            if (found) {
                targetLine = found;
                targetFile = file;
                break;
            }
        }

        if (shouldSelect && targetLine) {
            // Apply Mutual Exclusion (deselect opposite types in the same hunk)
            const lines = targetFile.lines;
            const index = lines.findIndex(l => l.id === firstId);
            const targetType = targetLine.type;
            const oppositeType = targetType === 'addition' ? 'deletion' : 'addition';

            // Scan backwards
            for (let i = index - 1; i >= 0; i--) {
                const l = lines[i];
                if (l.type === 'chunk') break;
                if (l.type === oppositeType) newSet.delete(l.id);
            }
            // Scan forwards (include current block and beyond)
            for (let i = index; i < lines.length; i++) {
                const l = lines[i];
                if (l.type === 'chunk') break;
                if (l.type === oppositeType) newSet.delete(l.id);
            }
        }

        // Apply toggle
        ids.forEach(id => {
            if (shouldSelect) newSet.add(id);
            else newSet.delete(id);
        });

        setSelectedLines(newSet);
    };

    const toggleFileMode = (fileName) => {
        setFileModes(prev => ({
            ...prev,
            [fileName]: prev[fileName] === 'single' ? 'block' : 'single'
        }));
    };

    const toggleGlobalMode = () => {
        const newMode = globalMode === 'block' ? 'single' : 'block';
        setGlobalMode(newMode);

        // Update all files to new mode
        const newModes = {};
        diffData.forEach(file => newModes[file.fileName] = newMode);
        setFileModes(newModes);
    };

    const toggleLine = (id) => {
        const newSet = new Set(selectedLines);
        // Simple toggle for single line mode (allows granular control)
        // We could add simple mutual exclusion here (find line, check opposite at same position),
        // but for "manual/single" mode, simple toggle is usually expected.
        // However, to prevent "double inclusion" (keeping old AND adding new), we might want minimum conflict resoltion.
        // Let's stick to true manual toggle for now.
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedLines(newSet);
    };

    const handleMerge = async () => {
        // Warning: if nothing is selected, we might be creating an empty file or deleting everything?
        // With new logic: No Red Selected = Delete All Original Content. No Green Selected = Add Nothing. 
        // Result = Empty File (or partial empty).
        // Is this valid? Yes, user might want to delete a file content.

        setMerging(true);

        try {
            const finalInputs = [];

            for (const file of diffData) {
                // We process EVERY file now, because even if no lines are "touched", 
                // we need to verify if the user intended to DELETE the original lines (by unchecking them).
                // Wait, if a file has deletions in the diff, and user unchecks them -> they want them GONE.
                // We need to check if ANY line in the file is 'interesting' (either addition selected, or deletion UNSELECTED).

                // Let's simplified: transform every file in diffData.

                const baseBranch = prDetails.base.ref;
                const repo = prDetails.base.repo.name;
                const owner = prDetails.base.repo.owner.login;

                const { content: originalContent } = await getFileContent(token, {
                    owner, repo, path: file.fileName, ref: baseBranch
                });
                let originalLines = originalContent ? originalContent.split(/\r?\n/) : [];

                let newContentLines = [];
                let cursor = 0;

                for (const line of file.lines) {
                    if (line.type === 'chunk') continue;

                    if (line.type === 'context' || line.type === 'deletion') {
                        const targetIdx = (line.oldLine) - 1;

                        // Fill gap
                        while (cursor < targetIdx) {
                            if (cursor < originalLines.length) newContentLines.push(originalLines[cursor]);
                            cursor++;
                        }

                        if (line.type === 'context') {
                            if (cursor < originalLines.length) newContentLines.push(originalLines[cursor]);
                            cursor++;
                        } else if (line.type === 'deletion') {
                            // LOGIC CHANGE:
                            if (selectedLines.has(line.id)) {
                                // Selected = KEEP ORIGINAL
                                // Wait, simple toggleLine doesn't enforce "keep original means don't include new".
                                // The merge logic just processes sequentially.
                                // If I have:
                                // - Old (Selected)
                                // + New (Selected)
                                // Result: "Old" is processed here (pushed).
                                // Then "New" is processed next (pushed).
                                // Result: Both lines. Valid.

                                if (cursor < originalLines.length) newContentLines.push(originalLines[cursor]);
                                cursor++;
                            } else {
                                // Unselected = DELETE (Skip)
                                cursor++;
                            }
                        }
                    } else if (line.type === 'addition') {
                        // LOGIC CHANGE:
                        if (selectedLines.has(line.id)) {
                            // Selected = ADD NEW
                            // Strip '+' prefix if present
                            const cleanLine = line.content.startsWith('+') ? line.content.substring(1) : line.content;
                            newContentLines.push(cleanLine);
                        } else {
                            // Unselected = IGNORE (Skip)
                        }
                    }
                }

                // Remaining
                while (cursor < originalLines.length) {
                    newContentLines.push(originalLines[cursor]);
                    cursor++;
                }

                finalInputs.push({ path: file.fileName, content: newContentLines.join('\n') });
            }

            await mergeLines(token, {
                owner: prDetails.base.repo.owner.login,
                repo: prDetails.base.repo.name,
                baseBranch: prDetails.base.ref,
                itemsToMerge: finalInputs,
                message: `Partial merge of ${selectedLines.size} lines from PR #${prDetails.number}`
            });

            setToast({ message: "Successfully merged selected lines!", type: "success" });
            setSelectedLines(new Set()); // Clear selection
        } catch (err) {
            console.error(err);
            setToast({ message: "Merge failed: " + err.message, type: "error" });
        } finally {
            setMerging(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-zinc-400">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p>Analyzing PR Diff...</p>
        </div>
    );

    if (!prDetails) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-zinc-400">
            <p className="text-red-400 mb-4">Failed to load PR details.</p>
            <button onClick={() => navigate('/')} className="bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
                Go Back
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-white flex flex-col">
            {/* Header */}
            <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-surface/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <GitMerge size={16} className="text-primary" />
                            <span className="font-semibold text-zinc-200">PR #{prDetails?.number}</span>
                            <span className="text-zinc-500">·</span>
                            <span className="font-bold">{prDetails?.title}</span>
                        </div>
                        <div className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-600"></span> {prDetails?.base?.ref}</div>
                            <span>←</span>
                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-glow"></span> {prDetails?.head?.ref}</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleMerge}
                        disabled={merging} // Removed selectedLines.size === 0 check
                        className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-glow transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                    >
                        {merging ? <Loader2 className="animate-spin" size={16} /> : <GitMerge size={16} />}
                        {merging ? "Merging..." : `Merge Selected Lines (${selectedLines.size})`}
                    </button>
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                        <Github size={16} className="text-zinc-400" />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden">
                {/* Sidebar (Simplistic for now) */}
                <aside className="w-64 border-r border-border bg-surface/30 hidden md:block overflow-y-auto">
                    <div className="p-4">
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Changes</h3>
                        <div className="space-y-1">
                            <div className="space-y-1">
                                {diffData.map(file => {
                                    // Calculate selection state based on "PR Version" vs "Repo Version"
                                    const additions = file.lines.filter(l => l.type === 'addition');
                                    const deletions = file.lines.filter(l => l.type === 'deletion');

                                    const selectedAdditions = additions.filter(l => selectedLines.has(l.id)).length;
                                    const selectedDeletions = deletions.filter(l => selectedLines.has(l.id)).length;

                                    const hasAdditions = additions.length > 0;
                                    const hasDeletions = deletions.length > 0;

                                    // "PR Version" State: All Additions Selected, NO Deletions Selected.
                                    const isPRVersion =
                                        (hasAdditions ? selectedAdditions === additions.length : true) &&
                                        (hasDeletions ? selectedDeletions === 0 : true) &&
                                        (hasAdditions || hasDeletions);

                                    // "Repo Version" State: NO Additions Selected, ALL Deletions Selected.
                                    const isRepoVersion =
                                        (hasAdditions ? selectedAdditions === 0 : true) &&
                                        (hasDeletions ? selectedDeletions === deletions.length : true);

                                    // Mixed State: Anything else (Partial selections, custom mix)
                                    const isMixed = !isPRVersion && !isRepoVersion;

                                    // Visual State:
                                    // Checked: Fully PR Version
                                    // Minus: Mixed / Partial
                                    // Empty: Fully Repo Version (Default)

                                    const showCheck = isPRVersion;
                                    const showMinus = isMixed;
                                    const isActive = showCheck || showMinus;

                                    return (
                                        <div key={file.fileName} className="group flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded transition-colors">
                                            <button
                                                onClick={() => {
                                                    const newSet = new Set(selectedLines);
                                                    if (isPRVersion) {
                                                        // Switch to Repo Version (Default)
                                                        // Select all Red, Deselect all Green
                                                        deletions.forEach(l => newSet.add(l.id));
                                                        additions.forEach(l => newSet.delete(l.id));
                                                    } else {
                                                        // Switch to PR Version
                                                        // Select all Green, Deselect all Red
                                                        additions.forEach(l => newSet.add(l.id));
                                                        deletions.forEach(l => newSet.delete(l.id));
                                                    }
                                                    setSelectedLines(newSet);
                                                }}
                                                className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                            >
                                                <div className={`w-3 h-3 rounded border flex items-center justify-center ${isActive
                                                    ? "bg-green-500 border-green-500 text-white"
                                                    : "border-zinc-600 bg-zinc-800"
                                                    }`}>
                                                    {showCheck && <Check size={10} strokeWidth={3} />}
                                                    {showMinus && <Minus size={10} strokeWidth={3} />}
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const el = document.getElementById(file.fileName);
                                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                                className="text-sm text-zinc-400 group-hover:text-zinc-200 truncate flex-1 text-left"
                                                title={file.fileName}
                                            >
                                                {file.fileName.split('/').pop()}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Diff View */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-3 border-b border-border/50 text-xs text-zinc-500 bg-surface/50">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded border border-red-500/30 bg-red-500/10 flex items-center justify-center text-red-400">
                                    <Check size={10} />
                                </span>
                                <span>Select to Keep (Repo Version)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded border border-green-500/30 bg-green-500/10 flex items-center justify-center text-green-400">
                                    <Check size={10} />
                                </span>
                                <span>Select to Add (PR Version)</span>
                            </div>
                        </div>

                        {/* --- NEW: Master Toggle --- */}
                        <div className="flex items-center gap-2 border-l border-zinc-700 pl-6">
                            <span className="font-semibold text-zinc-400 uppercase tracking-wider">Selection Mode:</span>
                            <div className="flex items-center bg-zinc-800 rounded p-1 border border-zinc-700">
                                <button
                                    onClick={toggleGlobalMode}
                                    className={clsx(
                                        "px-3 py-1 text-xs rounded transition-colors font-medium",
                                        globalMode === 'single' ? "bg-zinc-600 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    Single
                                </button>
                                <button
                                    onClick={toggleGlobalMode}
                                    className={clsx(
                                        "px-3 py-1 text-xs rounded transition-colors font-medium",
                                        globalMode === 'block' ? "bg-zinc-600 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    Block
                                </button>
                            </div>
                        </div>
                    </div>
                    <DiffViewer
                        diffFiles={diffData}
                        selectedLines={selectedLines}
                        toggleBlock={toggleBlock}
                        toggleLine={toggleLine}
                        fileModes={fileModes}
                        onToggleFileMode={toggleFileMode}
                    />
                </div>
            </main>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default Dashboard;
