import { useState } from "react";
import { FaPencilAlt } from "react-icons/fa";

interface NoteSectionProps {
  title: string;
  content: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (text: string) => void;
  onCancel: () => void;
}

const NoteSection = ({ 
  title, 
  content,
  isEditing,
  onEdit,
  onSave,
  onCancel
}: NoteSectionProps) => {
  const [text, setText] = useState(content);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">{title}</h3>
        {!isEditing ? (
          <button
            onClick={onEdit}
            className="p-2 hover:bg-gray-700/30 rounded-xl transition-colors group"
          >
            <FaPencilAlt className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => onSave(text)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setText(content);
                onCancel();
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      {isEditing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full min-h-[100px] p-3 bg-gray-700/30 text-white rounded-xl border border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={`Write your ${title.toLowerCase()} here...`}
        />
      ) : (
        <div className="min-h-[100px] text-gray-400">
          {content || 'No note added yet'}
        </div>
      )}
    </div>
  );
};

export default NoteSection;