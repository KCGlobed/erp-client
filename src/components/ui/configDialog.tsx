type ActionType = 'present' | 'absent' | 'all-present';

interface ConfirmDialogProps {
    open: boolean;
    action: ActionType;
    studentName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog = ({
    open,
    action,
    studentName,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <h2 className="text-xl font-semibold">
                    Confirm Attendance
                </h2>

                <p className="mt-3 text-gray-600">
                    {action === 'all-present'
                        ? 'Do you want to mark all students as present?'
                        : `Do you want to mark ${studentName} as ${action}?`}
                </p>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-100 cursor-pointer"
                    >
                        No
                    </button>

                    <button
                        onClick={onConfirm}
                        className={`rounded-md px-4 py-2 text-sm font-medium text-white ${action === 'present' || action === 'all-present'
                                ? 'bg-primary hover:bg-primary/80 cursor-pointer'
                                : 'bg-red-600 hover:bg-red-700'
                            }`}
                    >
                        Yes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;