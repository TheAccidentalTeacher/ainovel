/**
 * Debug Utility
 * 
 * Provides comprehensive debugging for API calls and app state
 */

export class DebugLogger {
  private static instance: DebugLogger;
  private enabled = true;

  private constructor() {
    // Log environment on initialization
    this.logEnvironment();
  }

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  private logEnvironment() {
    console.group('🔧 [DEBUG] Environment Configuration');
    console.log('Mode:', import.meta.env.MODE);
    console.log('Production:', import.meta.env.PROD);
    console.log('Development:', import.meta.env.DEV);
    console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('Window Location:', {
      origin: window.location.origin,
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol,
    });
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }

  apiRequest(method: string, url: string, data?: any, config?: any) {
    if (!this.enabled) return;
    
    console.group(`🌐 [API REQUEST] ${method.toUpperCase()} ${url}`);
    console.log('Full URL:', config?.baseURL ? `${config.baseURL}${url}` : url);
    console.log('Timestamp:', new Date().toISOString());
    if (data) {
      console.log('Request Data:', data);
    }
    if (config?.params) {
      console.log('Query Params:', config.params);
    }
    if (config?.headers) {
      console.log('Headers:', config.headers);
    }
    console.groupEnd();
  }

  apiResponse(method: string, url: string, status: number, data?: any, duration?: number) {
    if (!this.enabled) return;
    
    const emoji = status >= 200 && status < 300 ? '✅' : '❌';
    console.group(`${emoji} [API RESPONSE] ${method.toUpperCase()} ${url} - ${status}`);
    console.log('Timestamp:', new Date().toISOString());
    if (duration) {
      console.log('Duration:', `${duration}ms`);
    }
    if (data) {
      if (Array.isArray(data)) {
        console.log('Response Data:', `Array(${data.length})`);
        console.log('Sample:', data.slice(0, 3));
      } else if (typeof data === 'object') {
        console.log('Response Data:', data);
      } else {
        console.log('Response Data:', data);
      }
    }
    console.groupEnd();
  }

  apiError(method: string, url: string, error: any) {
    if (!this.enabled) return;
    
    console.group(`❌ [API ERROR] ${method.toUpperCase()} ${url}`);
    console.log('Timestamp:', new Date().toISOString());
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Status Text:', error.response.statusText);
      console.error('Response Data:', error.response.data);
      console.error('Response Headers:', error.response.headers);
    }
    
    if (error.config) {
      console.error('Request Config:', {
        method: error.config.method,
        url: error.config.url,
        baseURL: error.config.baseURL,
        fullURL: `${error.config.baseURL}${error.config.url}`,
        params: error.config.params,
        data: error.config.data,
      });
    }
    
    console.error('Full Error:', error);
    
    // Provide helpful debugging hints
    if (error.code === 'ERR_NETWORK') {
      console.error('💡 HINT: Network error - server may be unreachable or CORS issue');
    } else if (error.code === 'ERR_CONNECTION_REFUSED') {
      console.error('💡 HINT: Connection refused - check if server is running');
    } else if (error.response?.status === 404) {
      console.error('💡 HINT: 404 Not Found - endpoint may not exist or routing issue');
      console.error('   Check that API routes are not being intercepted by static file serving');
    } else if (error.response?.status === 500) {
      console.error('💡 HINT: 500 Server Error - check backend logs');
    } else if (error.response?.status === 401) {
      console.error('💡 HINT: 401 Unauthorized - authentication required');
    }
    
    console.groupEnd();
  }

  component(name: string, action: string, data?: any) {
    if (!this.enabled) return;
    
    console.log(`🎨 [${name}] ${action}`, data || '');
  }

  hook(name: string, action: string, data?: any) {
    if (!this.enabled) return;
    
    console.log(`🪝 [${name}] ${action}`, data || '');
  }

  state(component: string, stateName: string, value: any) {
    if (!this.enabled) return;
    
    console.log(`📊 [STATE] ${component}.${stateName}`, value);
  }

  error(context: string, error: any) {
    console.error(`❌ [ERROR] ${context}`, error);
  }

  warn(context: string, message: string) {
    console.warn(`⚠️ [WARNING] ${context}`, message);
  }

  info(context: string, message: string, data?: any) {
    if (!this.enabled) return;
    
    console.info(`ℹ️ [INFO] ${context}`, message, data || '');
  }

  success(context: string, message: string) {
    if (!this.enabled) return;
    
    console.log(`✅ [SUCCESS] ${context}`, message);
  }
}

export const debug = DebugLogger.getInstance();

// Make it available globally for debugging in console
(window as any).__debug = debug;
console.log('🔍 Debug logger available globally as window.__debug');
