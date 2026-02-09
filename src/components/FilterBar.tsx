interface FilterBarProps {
  availableTags: string[];
  selectedTags: Set<string>;
  onToggleTag: (tag: string) => void;
  projectCount: number;
  totalCount: number;
}

export function FilterBar({
  availableTags,
  selectedTags,
  onToggleTag,
  projectCount,
  totalCount,
}: FilterBarProps) {
  return (
    <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-6 mb-3">
          <span className="text-sm text-neutral-600 font-mono">
            {projectCount === totalCount
              ? `${totalCount} projects`
              : `${projectCount} of ${totalCount} projects`}
          </span>
          {selectedTags.size > 0 && (
            <button
              onClick={() => selectedTags.forEach((tag) => onToggleTag(tag))}
              className="text-xs text-neutral-500 hover:text-neutral-900 font-mono transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => {
            const isSelected = selectedTags.has(tag);
            return (
              <button
                key={tag}
                onClick={() => onToggleTag(tag)}
                className={`px-3 py-1.5 text-sm font-mono rounded border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800'
                    : 'bg-white text-neutral-600 border-neutral-300 hover:border-neutral-400 hover:text-neutral-900'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
