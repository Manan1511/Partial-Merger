import React from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';

const DiffViewer = ({ diffFiles, selectedLines, toggleBlock, toggleLine, fileModes, onToggleFileMode }) => {
    if (!diffFiles || diffFiles.length === 0) {
        return <div className="text-zinc-500 text-center mt-10">No diff parsing results.</div>;
    }

    const toggleMode = (fileName) => {
        if (onToggleFileMode) {
            onToggleFileMode(fileName);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-background p-4 space-y-8">
            {diffFiles.map((file) => {
                const mode = (fileModes && fileModes[file.fileName]) || 'block'; // Default to block if undefined

                return (
                    <div key={file.fileName} id={file.fileName} className="border border-border rounded-lg overflow-hidden bg-surface scroll-mt-20">
                        <div className="bg-zinc-900/50 px-4 py-2 border-b border-border flex justify-between items-center">
                            <span className="font-mono text-sm text-zinc-300">{file.fileName}</span>
                            <div className="flex items-center space-x-2">
                                {/* Mode Toggle */}
                                <div className="flex items-center bg-zinc-800 rounded p-0.5 border border-zinc-700">
                                    <button
                                        onClick={() => toggleMode(file.fileName)}
                                        className={clsx(
                                            "px-2 py-0.5 text-xs rounded transition-colors",
                                            mode === 'single' ? "bg-zinc-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                                        )}
                                    >
                                        Single
                                    </button>
                                    <button
                                        onClick={() => toggleMode(file.fileName)}
                                        className={clsx(
                                            "px-2 py-0.5 text-xs rounded transition-colors",
                                            mode === 'block' ? "bg-zinc-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                                        )}
                                    >
                                        Block
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <tbody>
                                    {mode === 'block' ? (
                                        // Block Mode Logic
                                        (() => {
                                            const groups = [];
                                            file.lines.forEach(line => {
                                                const lastGroup = groups[groups.length - 1];
                                                if (lastGroup && lastGroup.type === line.type && line.type !== 'chunk') {
                                                    lastGroup.lines.push(line);
                                                } else {
                                                    groups.push({ type: line.type, lines: [line] });
                                                }
                                            });

                                            return groups.map((group, groupIdx) => {
                                                if (group.type === 'chunk') {
                                                    return group.lines.map((line, i) => (
                                                        <tr key={`${groupIdx}-${i}`} className="bg-zinc-800/30">
                                                            <td colSpan={4} className="py-1 px-4 font-mono text-xs text-zinc-500">
                                                                {line.content}
                                                            </td>
                                                        </tr>
                                                    ));
                                                }

                                                const isSelectable = group.type === 'addition' || group.type === 'deletion';
                                                const isSelected = group.lines.some(l => selectedLines.has(l.id));
                                                const groupIds = group.lines.map(l => l.id);

                                                return group.lines.map((line, lineIdx) => (
                                                    <tr
                                                        key={line.id}
                                                        onClick={() => isSelectable && toggleBlock(groupIds)}
                                                        className={clsx(
                                                            "font-mono text-xs transition-colors select-none",
                                                            isSelectable && "hover:bg-white/5 cursor-pointer",
                                                            line.type === 'addition' && "bg-green-500/10 text-green-100",
                                                            line.type === 'deletion' && "bg-red-500/10 text-red-100",
                                                            line.type === 'context' && "text-zinc-400",
                                                            isSelected && "bg-primary/20"
                                                        )}
                                                    >
                                                        {lineIdx === 0 ? (
                                                            <td
                                                                rowSpan={group.lines.length}
                                                                className="w-8 px-2 text-center border-r border-border/10 align-middle relative"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (isSelectable) toggleBlock(groupIds);
                                                                }}
                                                            >
                                                                {isSelectable && (
                                                                    <div className={clsx(
                                                                        "w-4 h-4 rounded border flex items-center justify-center transition-all mx-auto z-10 relative",
                                                                        isSelected ? "bg-primary border-primary" : "border-zinc-600 hover:border-zinc-400"
                                                                    )}>
                                                                        {isSelected && <Check size={10} className="text-white" />}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        ) : null}

                                                        <td className="w-10 px-2 text-right text-zinc-600 select-none border-r border-border/10">{line.oldLine || ' '}</td>
                                                        <td className="w-10 px-2 text-right text-zinc-600 select-none border-r border-border/10">{line.newLine || ' '}</td>
                                                        <td className="px-4 py-0.5 whitespace-pre">
                                                            <span className={clsx(line.type === 'addition' && "text-green-300", line.type === 'deletion' && "text-red-300 opacity-70")}>
                                                                {line.content}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ));
                                            });
                                        })()
                                    ) : (
                                        // Single Line Mode Logic (Previous implementation)
                                        file.lines.map((line, idx) => {
                                            if (line.type === 'chunk') {
                                                return (
                                                    <tr key={idx} className="bg-zinc-800/30">
                                                        <td colSpan={4} className="py-1 px-4 font-mono text-xs text-zinc-500">{line.content}</td>
                                                    </tr>
                                                );
                                            }
                                            const isSelected = selectedLines.has(line.id);
                                            const isSelectable = line.type === 'addition' || line.type === 'deletion';

                                            return (
                                                <tr
                                                    key={line.id || idx}
                                                    onClick={() => isSelectable && toggleLine(line.id)}
                                                    className={clsx(
                                                        "font-mono text-xs transition-colors select-none",
                                                        isSelectable && "hover:bg-white/5 cursor-pointer",
                                                        line.type === 'addition' && "bg-green-500/10 text-green-100",
                                                        line.type === 'deletion' && "bg-red-500/10 text-red-100",
                                                        line.type === 'context' && "text-zinc-400",
                                                        isSelected && "bg-primary/20"
                                                    )}
                                                >
                                                    <td className="w-8 px-2 text-center border-r border-border/10">
                                                        {isSelectable && (
                                                            <div className={clsx(
                                                                "w-4 h-4 rounded border flex items-center justify-center transition-all mx-auto z-10 relative",
                                                                isSelected ? "bg-primary border-primary" : "border-zinc-600 hover:border-zinc-400"
                                                            )}>
                                                                {isSelected && <Check size={10} className="text-white" />}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="w-10 px-2 text-right text-zinc-600 select-none border-r border-border/10">{line.oldLine || ' '}</td>
                                                    <td className="w-10 px-2 text-right text-zinc-600 select-none border-r border-border/10">{line.newLine || ' '}</td>
                                                    <td className="px-4 py-0.5 whitespace-pre">
                                                        <span className={clsx(line.type === 'addition' && "text-green-300", line.type === 'deletion' && "text-red-300 opacity-70")}>
                                                            {line.content}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DiffViewer;
