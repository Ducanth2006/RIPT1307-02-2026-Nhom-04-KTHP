export interface ICategory {
  id: number;
  name: string;
  description: string | null;
  parent_id: number | null;
  slug: string;
  status: "Active" | "Inactive";
  created_at: string;
}

export interface ICategoriesResponse {
  message: string;
  data: ICategory[];
}
