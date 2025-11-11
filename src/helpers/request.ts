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
      'Cookie': "buvid3=A803DA52-1E61-7CA5-1596-2A73463B0A8854065infoc; b_nut=1739732654; _uuid=5BF11442-24102-8105B-E131-D21010CBA4F83554389infoc; rpdid=|(ku|k~lJmlu0J'u~Jm~JkYll; DedeUserID=35025955; DedeUserID__ckMd5=9ab31cd06bec9518; header_theme_version=CLOSE; enable_web_push=DISABLE; enable_feed_channel=ENABLE; fingerprint=8854a7d7359094c441357460546596b0; buvid_fp_plain=undefined; buvid_fp=7b81f341d6613b14ffa1ce710e0baa02; CURRENT_QUALITY=32; buvid4=750D1C1C-1C7D-7FEC-CD50-67219529097754838-025021619-/VeV4MPMVGrC1zIdrS20ww%3D%3D; theme-tip-show=SHOWED; home_feed_column=5; CURRENT_FNVAL=2000; SESSDATA=1b19ab66%2C1778341916%2C38a4e%2Ab2CjBrTdm6Qs8LHIz4dbp9mBkKCfHhODrU60WTRSs_j99DQ5eUDMMHaKIiXELjqnJL4-cSVk9KVEQ3RnBpUmNEdDRyemN1YlNqaHhZSE1tZERhQmZCbTEzVVhhRWU0YjZTc01oc3BPUUZINS1sNXdmUU90WlFQaW43bjdOOUhlelpicm1RN1JhZGxBIIEC; bili_jct=b0120c298f9e2fd737321aa864321047; theme-avatar-tip-show=SHOWED; opus-goback=1; bili_ticket=eyJhbGciOiJIUzI1NiIsImtpZCI6InMwMyIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjMwNTAwOTAsImlhdCI6MTc2Mjc5MDgzMCwicGx0IjotMX0.oJiXamKpFJjrsSaQa6KVF4OM_a_zTkS2gH6r8ZgZgps; bili_ticket_expires=1763050030; sid=n5bu4rrh; browser_resolution=1447-745; b_lsid=96981721_19A70CF842D",
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