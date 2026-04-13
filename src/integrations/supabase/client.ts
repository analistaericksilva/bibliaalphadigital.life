// BibleAlpha - API Client (substitui Supabase)
// Todas as chamadas redirecionam para a API PHP local

const API_BASE = '/api';

class ApiClient {
  private baseUrl = API_BASE;
  
  from(table: string) {
    return {
      select: (columns: string = '*') => ({
        eq: (field: string, value: any) => ({
          maybeSingle: async () => {
            const response = await fetch(`${this.baseUrl}/${table}.php?${field}=${value}`);
            const data = await response.json();
            return { data: data.data, error: null };
          },
          order: () => ({
            limit: async (n: number) => {
              const response = await fetch(`${this.baseUrl}/${table}.php?limit=${n}`);
              const data = await response.json();
              return { data: data.data, error: null };
            }
          }),
          execute: async () => {
            const response = await fetch(`${this.baseUrl}/${table}.php?${field}=${value}`);
            const data = await response.json();
            return { data: data.data, error: null };
          }
        }),
        order: () => ({
          limit: async (n: number) => {
            const response = await fetch(`${this.baseUrl}/${table}.php?limit=${n}`);
            const data = await response.json();
            return { data: data.data, error: null };
          }
        })
      }),
      insert: async (data: any) => {
        const response = await fetch(`${this.baseUrl}/${table}.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', ...data })
        });
        return { data: await response.json(), error: null };
      },
      update: (data: any) => ({
        eq: (field: string, value: any) => ({
          execute: async () => {
            const response = await fetch(`${this.baseUrl}/${table}.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'update', field, value, ...data })
            });
            return { data: await response.json(), error: null };
          }
        })
      }),
      delete: () => ({
        eq: (field: string, value: any) => ({
          execute: async () => {
            await fetch(`${this.baseUrl}/${table}.php?${field}=${value}`, { method: 'DELETE' });
            return { data: null, error: null };
          }
        })
      })
    };
  }
  
  auth = {
    getSession: async () => {
      const token = localStorage.getItem('biblia_token');
      if (token) {
        return { data: { session: { user: { id: token } } }, error: null };
      }
      return { data: { session: null }, error: null };
    },
    onAuthStateChange: (callback: any) => {
      const token = localStorage.getItem('biblia_token');
      if (token) callback('SIGNED_IN', { user: { id: token } });
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signOut: async () => {
      localStorage.removeItem('biblia_token');
      return { error: null };
    }
  };
  
  functions = {
    invoke: async (name: string, options?: any) => {
      const response = await fetch(`${this.baseUrl}/${name}.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options?.body || {})
      });
      return { data: await response.json(), error: null };
    }
  };

  runRpc(func: string, params: any) {
    return this.rpcImpl(func, params);
  }

  private async rpcImpl(func: string, params: any) {
    const response = await fetch(`${this.baseUrl}/rpc.php?func=${func}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return { data: await response.json(), error: null };
  }
}

export const supabase = new ApiClient();