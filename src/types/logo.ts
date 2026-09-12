export interface Logo {
  id: number;
  name: string;
  file_name: string;
  file_data: string;
  file_type: string;
  file_size: number;
  is_default: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface LogoCreateInput {
  name: string;
  file_name: string;
  file_data: string;
  file_type?: string;
  file_size?: number;
  is_default?: boolean;
}

export interface LogoUpdateInput {
  name?: string;
  is_default?: boolean;
  is_archived?: boolean;
}
