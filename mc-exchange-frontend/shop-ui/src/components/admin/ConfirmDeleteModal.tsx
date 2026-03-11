import React from "react";

interface ConfirmDeleteModalProps {
  show: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  userName: string;
}
export default function ConfirmDeleteModal({
  show,
  onCancel,
  onConfirm,
  userName,
}: ConfirmDeleteModalProps) {
  if (!show) return null;
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-gray-800 p-6 rounded shadow-md max-w-sm w-full">
        <h3 className="text-lg font-semibold mb-4">Remove Owner</h3>
        <p>
          Are you sure you want to remove <span className="font-bold">{userName}</span> from this region?
        </p>
        <div className="flex gap-2 mt-6 justify-end">
          <button
            className="bg-gray-700 px-4 py-2 rounded"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
            onClick={onConfirm}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}