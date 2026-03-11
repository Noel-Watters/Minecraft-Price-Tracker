export interface User {
  id: string;
  name: string;
  created_at: string; 
  role: string;
  regions?: string[];
}
