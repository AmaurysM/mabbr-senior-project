"use client";
import { useEffect, useState } from "react";
import { toast } from '@/app/hooks/use-toast';
import { CheckIcon, PencilIcon } from "lucide-react";
import { XMarkIcon } from "@heroicons/react/24/solid";



const EditableField= ({ value, label, onSave, requireConfirmation = false }:{
    value: string;
    label: string;
    onSave: (value: string) => Promise<void>;
    requireConfirmation?: boolean;
} ) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newValue, setNewValue] = useState(value);
    const [confirmValue, setConfirmValue] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setNewValue(value);
    }, [value]);

    const handleSave = async () => {
        if (requireConfirmation && newValue !== confirmValue) {
            setError('Values do not match');
            return;
        }

        try {
            setIsSaving(true);
            await onSave(newValue);
            setIsEditing(false);
            setError('');
            toast({
                title: "Success",
                description: `${label} updated successfully`,
            });
        } catch (error) {
            console.error(`Error updating ${label}:`, error);
            setError(`Failed to update ${label}`);
            toast({
                title: "Error",
                description: `Failed to update ${label}`,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setNewValue(value);
        setConfirmValue('');
        setError('');
    };

    return (
        <div className="group relative">
            <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-400">{label}</label>
                <button
                    onClick={() => setIsEditing(true)}
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <PencilIcon className="h-4 w-4 text-blue-400 hover:text-blue-500" />
                </button>
            </div>

            {!isEditing ? (
                <div className="text-white">{value}</div>
            ) : (
                <div className="space-y-2 mt-2">
                    <input
                        type="text"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700/30 rounded-lg border border-white/5 focus:border-blue-500/50 focus:outline-none transition-colors text-white"
                    />
                    {requireConfirmation && (
                        <input
                            type="text"
                            value={confirmValue}
                            onChange={(e) => setConfirmValue(e.target.value)}
                            placeholder={`Confirm ${label.toLowerCase()}`}
                            className="w-full px-3 py-2 bg-gray-700/30 rounded-lg border border-white/5 focus:border-blue-500/50 focus:outline-none transition-colors text-white"
                        />
                    )}
                    {error && <div className="text-red-400 text-sm">{error}</div>}
                    <div className="flex space-x-2">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <CheckIcon className="h-4 w-4" />
                            )}
                        </button>
                        <button
                            onClick={handleCancel}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditableField;