export type Entry = {
  id: string;
  user_id: string;
  week_start: string; // ISO date
  title: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
};

export type EntryDay = {
  id: string;
  entry_id: string;
  day_date: string; // ISO date
  notes: string | null;
};

export type Metric = {
  id: string;
  day_id: string;
  name: string;
  value: number;
  unit: string;
};

export type Photo = {
  id: string;
  day_id: string;
  storage_path: string;
  caption: string | null;
};

export type Tag = {
  id: string;
  day_id: string;
  label: string;
};

export type Homework = {
  id: string;
  entry_id: string;
  description: string;
  done: boolean;
};

export type HomeworkAttachment = {
  id: string;
  homework_id: string;
  storage_path: string;
};

export type EntryDayWithRelations = EntryDay & {
  metrics: Metric[];
  photos: Photo[];
  tags: Tag[];
};

export type HomeworkWithAttachments = Homework & {
  homework_attachments: HomeworkAttachment[];
};

export type EntryWithRelations = Entry & {
  entry_days: EntryDayWithRelations[];
  homework: HomeworkWithAttachments[];
};
