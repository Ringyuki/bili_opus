export const request = async <T>(url: string, options: RequestInit = {}): Promise<{
  get: () => Promise<T>;
  post: (data: any) => Promise<T>;
  put: (data: any) => Promise<T>;
  delete: (data: any) => Promise<T>;
}> => {
  const req = new Request(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Cookie': process.env.COOKIE!,
      ...options.headers,
    },
  });
  return {
    get: async () => {
      const response = await fetch(req, {
        method: 'GET',
      });
      return response.json();
    },
    post: async (data: any) => {
      const response = await fetch(req, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },    
    put: async (data: any) => { 
      const response = await fetch(req, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    delete: async (data: any) => {
      const response = await fetch(req, {
        method: 'DELETE',
        body: JSON.stringify(data),
      });
      return response.json();
    },
  };
};