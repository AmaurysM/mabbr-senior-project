import { useState, useEffect } from "react";
import { Pencil, Save, X } from "lucide-react";

interface NoteSectionProps {
  title: string;
  content: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (text: string) => void;
  onCancel: () => void;
  isfriends?: boolean;
  placeholder?: string;
}

const NoteSection = ({
  title,
  content,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  isfriends = false,
  placeholder,
}: NoteSectionProps) => {
  // For privacy, we don't display actual content in friends mode
  const displayContent = isfriends ? "" : content;
  const [text, setText] = useState(content);
  const [textareaHeight, setTextareaHeight] = useState("min-h-[100px]");

  // Keep content in sync when props change
  useEffect(() => {
    setText(isfriends ? "" : content);
  }, [content, isfriends]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (isEditing) {
      const lines = (text || "").split("\n").length;
      const baseHeight = 100;
      const lineHeight = 20;
      const calculatedHeight = Math.max(baseHeight, lines * lineHeight);
      setTextareaHeight(`min-h-[${calculatedHeight}px]`);
    }
  }, [text, isEditing]);

  const handleKeyDown = (e) => {
    // Save on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      onSave(text);
    }
    // Cancel on Escape
    if (e.key === "Escape") {
      setText(content);
      onCancel();
    }
  };

  const customPlaceholder = placeholder || `Write your ${title.toLowerCase()} here...`;
  if (isfriends && title == "Private Note") return null;
  return (
    <div
      className={`rounded-2xl p-4 md:p-6 shadow-lg border mb-6 transition-all duration-200 
          bg-gray-800/50 backdrop-blur-sm border-white/10 hover:border-white/20"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">{title}</h3>
        <div className="flex gap-2">
          {!isEditing && !isfriends && (
            <button
              onClick={onEdit}
              aria-label="Edit note"
              className="p-2 hover:bg-gray-700/50 rounded-full transition-colors group focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Pencil className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
            </button>
          )}
          {isEditing && !isfriends && (
            <>
              <button
                onClick={() => onSave(text)}
                aria-label="Save note"
                className="px-3 py-1 md:px-4 md:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Save className="w-4 h-4" />
                <span className="hidden md:inline">Save</span>
              </button>
              <button
                onClick={() => {
                  setText(content);
                  onCancel();
                }}
                aria-label="Cancel editing"
                className="px-3 py-1 md:px-4 md:py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <X className="w-4 h-4" />
                <span className="hidden md:inline">Cancel</span>
              </button>
            </>
          )}
        </div>
      </div>
      {isEditing && !isfriends ? (
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[100px] p-3 bg-gray-700/30 text-white rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            placeholder={customPlaceholder}
            aria-label={`${title} content`}
          />
          <div className="mt-2 text-xs text-gray-500">
            Ctrl+Enter to save • Esc to cancel
          </div>
        </div>
      ) : (
        <div
          className={`p-3 rounded-xl min-h-[100px] ${
            displayContent ? "" : "flex items-center justify-center"
          } ${
            isfriends 
              ? "text-gray-500 italic bg-gray-800/30" 
              : "text-gray-300 bg-gray-800/20"
          }`}
        >
          {displayContent ? (
            <div className="whitespace-pre-wrap break-words">{displayContent}</div>
          ) : (
            <span className="text-gray-500 italic">
              {isfriends ? "No notes shared" : "No note added yet"}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default NoteSection;