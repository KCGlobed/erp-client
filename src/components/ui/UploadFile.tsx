import { Upload } from "lucide-react";

interface FileUploadProps {
  label?: string;
  file: File | null;
  accept?: string;
  onChange: (file: File | null) => void;
}

export const FileUpload = ({
  label,
  file,
  accept,
  onChange,
}: FileUploadProps) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-semibold text-gray-700">
          {label}
        </label>
      )}

      <label className="block cursor-pointer">
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:border-[var(--primary)] transition-all">
          <div className="flex flex-col items-center justify-center text-center gap-2">
            <Upload className="w-8 h-8 text-gray-400" />

            <p className="text-sm font-medium text-gray-700">
              Click to upload
            </p>

            {/* <p className="text-xs text-gray-500">
              or drag and drop files here
            </p>

            <p className="text-xs text-gray-400">
              PDF, Excel, Images, Videos, Documents
            </p> */}

            {file && (
              <div className="mt-3 px-3 py-1 rounded bg-green-50 text-green-600 text-xs">
                {file.name}
              </div>
            )}
          </div>

          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => onChange(e.target.files?.[0] || null)}
          />
        </div>
      </label>
    </div>
  );
};