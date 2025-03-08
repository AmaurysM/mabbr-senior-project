import { Pencil, Save, X } from "lucide-react";
import { MouseEventHandler } from "react";


const NoteSection = ({
    title,
    editing,
    text,
    setText,
    note,
    onEdit,
    onSave,
    onCancel,
    saveLoading,
  } : {
    title: string,
    editing: boolean,
    text: string,
    setText: React.Dispatch<React.SetStateAction<string>>,
    note: string | null,
    onEdit: MouseEventHandler<HTMLButtonElement> | undefined,
    onSave: MouseEventHandler<HTMLButtonElement> | undefined,
    onCancel: MouseEventHandler<HTMLButtonElement> | undefined,
    saveLoading: boolean,
  }) => {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-gray-800">{title}</h3>
          {!editing ? (
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
            >
              <Pencil size={18} />
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={onSave}
                disabled={saveLoading}
                className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 flex items-center"
              >
                <Save size={18} />
              </button>
              <button
                onClick={onCancel}
                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>
        {editing ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-3 border rounded-md min-h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`Enter ${title.toLowerCase()}...`}
          />
        ) : (
          <div className="bg-gray-50 p-3 rounded min-h-32">
            {note ? (
              <p className="whitespace-pre-line">{note}</p>
            ) : (
              <p className="text-gray-400 italic">No {title.toLowerCase()} added</p>
            )}
          </div>
        )}
      </div>
    );
  };

  export default NoteSection;