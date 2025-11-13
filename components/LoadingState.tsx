import React from 'react';

interface LoadingStateProps {
    status: string;
    progress: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ status, progress }) => {
    const messages = [
        "Mixing potions of creativity...",
        "Consulting the crystal ball...",
        "Stitching scenes together...",
        "Summoning whimsical characters...",
        "Painting with moonlight...",
        "Polishing every sparkle...",
    ];
    const [randomMessage, setRandomMessage] = React.useState(messages[0]);

    React.useEffect(() => {
        const intervalId = setInterval(() => {
            setRandomMessage(messages[Math.floor(Math.random() * messages.length)]);
        }, 2500);

        return () => clearInterval(intervalId);
    }, []);


    return (
        <div className="flex flex-col items-center justify-center text-center p-8 w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-teal-400 mb-6 animate-pulse">Generating Your Magical Storybook</h2>
            
            <div className="w-full bg-slate-700 rounded-full h-4 mb-2 overflow-hidden border-2 border-slate-600 shadow-inner">
                <div
                    className="bg-gradient-to-r from-teal-400 to-purple-500 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <p className="text-slate-400 text-lg mb-4 h-6">{status || 'Initializing...'}</p>
            <p className="text-slate-500 text-md italic h-6">{randomMessage}</p>
        </div>
    );
}