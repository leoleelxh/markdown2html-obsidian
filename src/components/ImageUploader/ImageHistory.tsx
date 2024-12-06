import React, { useState } from 'react';
import { useImageHistory } from './hooks/useImageHistory';
import { ImageHistoryFilter } from '../../services/imageHistory/types';
import './ImageHistory.css';

interface ImageHistoryProps {
  onClose: () => void;
  onImageSelect?: (url: string) => void;
}

export const ImageHistory: React.FC<ImageHistoryProps> = ({ onClose, onImageSelect }) => {
  const {
    records,
    stats,
    loading,
    error,
    deleteRecord,
    filterRecords,
    clearHistory,
    exportHistory,
    importHistory,
  } = useImageHistory();

  const [filter, setFilter] = useState<ImageHistoryFilter>({});
  const [selectedBedType, setSelectedBedType] = useState<string>('all');

  const handleFilterChange = (newFilter: Partial<ImageHistoryFilter>) => {
    const updatedFilter = { ...filter, ...newFilter };
    setFilter(updatedFilter);
    filterRecords(updatedFilter);
  };

  const handleExport = () => {
    const jsonStr = exportHistory();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'image-history.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          importHistory(content);
        }
      };
      reader.readAsText(file);
    }
  };

  if (loading) {
    return <div className="image-history-loading">Loading...</div>;
  }

  if (error) {
    return <div className="image-history-error">{error}</div>;
  }

  return (
    <div className="image-history-container">
      <div className="image-history-header">
        <h2>Image Upload History</h2>
        <button onClick={onClose}>Close</button>
      </div>

      <div className="image-history-stats">
        <div>Total Images: {stats.totalCount}</div>
        <div>Total Size: {(stats.totalSize / 1024 / 1024).toFixed(2)} MB</div>
        <div>Last Upload: {stats.lastUploadTime ? new Date(stats.lastUploadTime).toLocaleString() : 'N/A'}</div>
      </div>

      <div className="image-history-filters">
        <select
          value={selectedBedType}
          onChange={(e) => {
            setSelectedBedType(e.target.value);
            handleFilterChange({ bedType: e.target.value === 'all' ? undefined : e.target.value });
          }}
        >
          <option value="all">All Services</option>
          {Object.entries(stats.bedTypeCounts).map(([type, count]) => (
            <option key={type} value={type}>
              {type} ({count})
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search by filename..."
          onChange={(e) => handleFilterChange({ searchText: e.target.value })}
        />

        <div className="image-history-actions">
          <button onClick={handleExport}>Export</button>
          <label className="import-button">
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all history?')) {
                clearHistory();
              }
            }}
            className="danger"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="image-history-grid">
        {records.map((record) => (
          <div key={record.id} className="image-item">
            <div className="image-preview">
              <img
                src={record.thumbnailUrl || record.url}
                alt={record.filename}
                onClick={() => onImageSelect?.(record.url)}
              />
            </div>
            <div className="image-info">
              <div className="filename" title={record.filename}>
                {record.filename}
              </div>
              <div className="details">
                <span>{new Date(record.uploadTime).toLocaleDateString()}</span>
                <span>{(record.size / 1024).toFixed(1)} KB</span>
              </div>
              <div className="actions">
                <button onClick={() => navigator.clipboard.writeText(record.url)}>
                  Copy URL
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Delete this image from history?')) {
                      deleteRecord(record.id);
                    }
                  }}
                  className="danger"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
