/**
 * Enhanced console logging utilities with visual indicators
 * for tracking generation pipeline in browser DevTools
 */

export const consoleLogger = {
  // Lifecycle events
  start: (component: string, action: string, data?: any) => {
    console.group(`🚀 [${component}] ${action}`);
    console.log('⏱️ Started at:', new Date().toISOString());
    if (data) console.log('📦 Data:', data);
    console.groupEnd();
  },

  success: (component: string, action: string, data?: any) => {
    console.group(`✅ [${component}] ${action}`);
    console.log('⏱️ Completed at:', new Date().toISOString());
    if (data) console.log('📦 Result:', data);
    console.groupEnd();
  },

  error: (component: string, action: string, error: any) => {
    console.group(`❌ [${component}] ${action}`);
    console.error('⏱️ Failed at:', new Date().toISOString());
    console.error('🔥 Error:', error);
    console.error('📚 Stack:', error?.stack);
    console.groupEnd();
  },

  // Progress tracking
  progress: (component: string, current: number, total: number, message?: string) => {
    const percent = Math.round((current / total) * 100);
    const bar = '█'.repeat(percent / 5) + '░'.repeat(20 - percent / 5);
    console.log(
      `📊 [${component}] ${bar} ${percent}% (${current}/${total})${message ? ` - ${message}` : ''}`
    );
  },

  // API calls
  apiCall: (method: string, url: string, data?: any) => {
    console.log(`🌐 API ${method} ${url}`, data ? data : '');
  },

  apiResponse: (method: string, url: string, status: number, data?: any) => {
    const icon = status >= 200 && status < 300 ? '✅' : '❌';
    console.log(`${icon} API ${method} ${url} [${status}]`, data ? data : '');
  },

  // State changes
  stateChange: (component: string, before: any, after: any) => {
    console.group(`🔄 [${component}] State Change`);
    console.log('Before:', before);
    console.log('After:', after);
    console.log('Diff:', getDiff(before, after));
    console.groupEnd();
  },

  // Connection tracking
  connection: {
    open: (type: string, url: string) => {
      console.log(`🔌 [Connection] ${type} opened:`, url);
    },
    close: (type: string, reason?: string) => {
      console.log(`🔌 [Connection] ${type} closed${reason ? `: ${reason}` : ''}`);
    },
    error: (type: string, error: any) => {
      console.error(`🔥 [Connection] ${type} error:`, error);
    },
    message: (type: string, data: any) => {
      console.log(`📨 [Connection] ${type} message:`, data);
    },
  },

  // Debugging
  debug: (component: string, message: string, data?: any) => {
    console.log(`🐛 [${component}] ${message}`, data ? data : '');
  },

  // Warning
  warn: (component: string, message: string, data?: any) => {
    console.warn(`⚠️ [${component}] ${message}`, data ? data : '');
  },

  // Summary
  summary: (component: string, title: string, stats: Record<string, any>) => {
    console.group(`📈 [${component}] ${title}`);
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.groupEnd();
  },
};

// Helper to get diff between objects
function getDiff(before: any, after: any): Record<string, any> {
  const diff: Record<string, any> = {};
  
  // Check all keys in after
  Object.keys(after).forEach(key => {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      diff[key] = {
        before: before[key],
        after: after[key],
      };
    }
  });
  
  return diff;
}

// Export a connection health checker
export const checkBackendHealth = async (baseUrl: string = 'http://localhost:8000'): Promise<boolean> => {
  try {
    const response = await fetch(`${baseUrl}/api/health`);
    const healthy = response.ok;
    
    if (healthy) {
      consoleLogger.success('HealthCheck', 'Backend is healthy');
    } else {
      consoleLogger.error('HealthCheck', 'Backend returned unhealthy status', response.status);
    }
    
    return healthy;
  } catch (error) {
    consoleLogger.error('HealthCheck', 'Failed to reach backend', error);
    return false;
  }
};
