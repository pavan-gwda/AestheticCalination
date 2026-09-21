export type Entry = {
  id: string;
  user_id: string;
  week_start: string; // ISO date
  title: string | null;
  notes: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
};

export type Metric = {
  id: string;
  entry_id: string;
  name: string;
  value: number;
  unit: string;
};

export type Photo = {
  id: string;
  entry_id: string;
  storage_path: string;
  caption: string | null;
};

export type Tag = {
  id: string;
  entry_id: string;
  label: string;
};

export type Homework = {
  id: string;
  entry_id: string;
  description: string;
  done: boolean;
};

export type EntryWithRelations = Entry & {
  metrics: Metric[];
  photos: Photo[];
  tags: Tag[];
  homework: Homework[];
};
