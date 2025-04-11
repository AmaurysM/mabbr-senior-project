const CommentFilters = ({
    activeFilter,
    setActiveFilter,
    commentTypes
}: {
    activeFilter: string;
    setActiveFilter: (filter: string) => void;
    commentTypes: { type: string; count: number }[];
}) => {
    return (
        <div className="mb-4 flex flex-wrap gap-2">
            <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
            ${activeFilter === 'ALL'
                        ? 'bg-white/10 text-white'
                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800/70'}`}
            >
                All
            </button>

            {commentTypes.map(({ type, count }) => (
                <button
                    key={type}
                    onClick={() => setActiveFilter(type)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center
              ${activeFilter === type
                            ? 'bg-white/10 text-white'
                            : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800/70'}`}
                >
                    {type}
                    <span className="ml-1 bg-gray-700/50 px-1.5 py-0.5 rounded-full text-gray-300 text-xs">
                        {count}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default CommentFilters;