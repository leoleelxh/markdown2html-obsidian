import { useState, useEffect, useCallback } from 'react';
import { ImageRecord, ImageHistoryFilter, ImageHistoryStats } from '../../../services/imageHistory/types';
import { ImageHistoryService } from '../../../services/imageHistory/ImageHistoryService';

interface UseImageHistoryResult {
  records: ImageRecord[];
  stats: ImageHistoryStats;
  loading: boolean;
  error: string | null;
  addRecord: (record: Omit<ImageRecord, 'id' | 'uploadTime'>) => Promise<ImageRecord>;
  deleteRecord: (id: string) => boolean;
  filterRecords: (filter: ImageHistoryFilter) => void;
  clearHistory: () => void;
  exportHistory: () => string;
  importHistory: (jsonData: string) => boolean;
}

export function useImageHistory(): UseImageHistoryResult {
  const [records, setRecords] = useState<ImageRecord[]>([]);
  const [stats, setStats] = useState<ImageHistoryStats>({
    totalCount: 0,
    totalSize: 0,
    bedTypeCounts: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<ImageHistoryFilter | undefined>();

  const historyService = ImageHistoryService.getInstance();

  // 加载记录
  const loadRecords = useCallback(() => {
    try {
      const filteredRecords = historyService.getRecords(currentFilter);
      setRecords(filteredRecords);
      setStats(historyService.getStats());
      setError(null);
    } catch (err) {
      setError('Failed to load image history');
      console.error('Load image history failed:', err);
    } finally {
      setLoading(false);
    }
  }, [currentFilter]);

  // 初始加载
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // 添加记录
  const addRecord = async (record: Omit<ImageRecord, 'id' | 'uploadTime'>) => {
    try {
      const newRecord = await historyService.addRecord(record);
      loadRecords();
      return newRecord;
    } catch (err) {
      setError('Failed to add image record');
      throw err;
    }
  };

  // 删除记录
  const deleteRecord = (id: string) => {
    try {
      const success = historyService.deleteRecord(id);
      if (success) {
        loadRecords();
      }
      return success;
    } catch (err) {
      setError('Failed to delete image record');
      return false;
    }
  };

  // 过滤记录
  const filterRecords = (filter: ImageHistoryFilter) => {
    setCurrentFilter(filter);
  };

  // 清除历史
  const clearHistory = () => {
    try {
      historyService.clearHistory();
      loadRecords();
    } catch (err) {
      setError('Failed to clear image history');
    }
  };

  // 导出历史
  const exportHistory = () => {
    return historyService.exportHistory();
  };

  // 导入历史
  const importHistory = (jsonData: string) => {
    try {
      const success = historyService.importHistory(jsonData);
      if (success) {
        loadRecords();
      }
      return success;
    } catch (err) {
      setError('Failed to import image history');
      return false;
    }
  };

  return {
    records,
    stats,
    loading,
    error,
    addRecord,
    deleteRecord,
    filterRecords,
    clearHistory,
    exportHistory,
    importHistory,
  };
}
