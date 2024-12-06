import React from 'react';
import './UploadIndicator.css';

interface UploadIndicatorProps {
  uploading: boolean;
  progress: number;
  error?: string;
}

export const UploadIndicator: React.FC<UploadIndicatorProps> = ({
  uploading,
  progress,
  error,
}) => {
  if (!uploading && !error) {
    return null;
  }

  return (
    <div className="upload-indicator-container">
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-text">{`${Math.round(progress)}%`}</div>
        </div>
      )}
      {error && <div className="upload-error">{error}</div>}
    </div>
  );
};
