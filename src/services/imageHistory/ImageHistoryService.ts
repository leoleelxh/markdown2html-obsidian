import { nanoid } from 'nanoid';
import { ImageRecord, ImageHistoryFilter, ImageHistoryStats } from './types';

const STORAGE_KEY = 'markdown_image_history';
const MAX_HISTORY_ITEMS = 1000; // 最大历史记录数

export class ImageHistoryService {
  private static instance: ImageHistoryService;
  private records: ImageRecord[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): ImageHistoryService {
    if (!ImageHistoryService.instance) {
      ImageHistoryService.instance = new ImageHistoryService();
    }
    return ImageHistoryService.instance;
  }

  // 加载历史记录
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.records = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load image history:', error);
      this.records = [];
    }
  }

  // 保存历史记录
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    } catch (error) {
      console.error('Failed to save image history:', error);
    }
  }

  // 添加新记录
  async addRecord(record: Omit<ImageRecord, 'id' | 'uploadTime'>): Promise<ImageRecord> {
    const newRecord: ImageRecord = {
      ...record,
      id: nanoid(),
      uploadTime: new Date().toISOString(),
    };

    this.records.unshift(newRecord);

    // 限制历史记录数量
    if (this.records.length > MAX_HISTORY_ITEMS) {
      this.records = this.records.slice(0, MAX_HISTORY_ITEMS);
    }

    this.saveToStorage();
    return newRecord;
  }

  // 删除记录
  deleteRecord(id: string): boolean {
    const initialLength = this.records.length;
    this.records = this.records.filter(record => record.id !== id);
    
    if (this.records.length !== initialLength) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // 获取记录列表
  getRecords(filter?: ImageHistoryFilter): ImageRecord[] {
    let filtered = [...this.records];

    if (filter) {
      if (filter.bedType) {
        filtered = filtered.filter(record => record.bedType === filter.bedType);
      }

      if (filter.startDate) {
        filtered = filtered.filter(record => 
          new Date(record.uploadTime) >= filter.startDate!
        );
      }

      if (filter.endDate) {
        filtered = filtered.filter(record => 
          new Date(record.uploadTime) <= filter.endDate!
        );
      }

      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        filtered = filtered.filter(record =>
          record.filename.toLowerCase().includes(searchLower) ||
          record.url.toLowerCase().includes(searchLower)
        );
      }
    }

    return filtered;
  }

  // 获取统计信息
  getStats(): ImageHistoryStats {
    const stats: ImageHistoryStats = {
      totalCount: this.records.length,
      totalSize: 0,
      bedTypeCounts: {},
    };

    if (this.records.length > 0) {
      stats.lastUploadTime = this.records[0].uploadTime;
    }

    this.records.forEach(record => {
      stats.totalSize += record.size;
      stats.bedTypeCounts[record.bedType] = (stats.bedTypeCounts[record.bedType] || 0) + 1;
    });

    return stats;
  }

  // 清除所有记录
  clearHistory(): void {
    this.records = [];
    this.saveToStorage();
  }

  // 导出历史记录
  exportHistory(): string {
    return JSON.stringify(this.records, null, 2);
  }

  // 导入历史记录
  importHistory(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData) as ImageRecord[];
      if (Array.isArray(data)) {
        this.records = data;
        this.saveToStorage();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import image history:', error);
      return false;
    }
  }
}
