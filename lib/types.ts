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

export type Client = {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type ParqAnswers = {
  id: string;
  client_id: string;
  q1_heart_condition: boolean;
  q2_chest_pain_activity: boolean;
  q3_chest_pain_rest: boolean;
  q4_dizziness_balance: boolean;
  q5_bone_joint_problem: boolean;
  q6_bp_or_heart_drugs: boolean;
  q7_other_reason: boolean;
  cleared: boolean;
  notes: string | null;
  assessed_at: string; // ISO date
};

export type ClientMetric = {
  id: string;
  client_id: string;
  name: string;
  value: number;
  unit: string;
  category: string;
  notes: string | null;
  recorded_at: string; // ISO date
};

export type MovementScreen = {
  id: string;
  client_id: string;
  years_training: number | null;
  current_goal: string | null;
  injury_notes: string | null;
  assessed_at: string; // ISO date
};

export type MovementFinding = {
  id: string;
  client_id: string;
  label: string;
  restricted: boolean;
};

export type MovementScreenMetric = ClientMetric;

export type ClientWithRelations = Client & {
  parq_answers: ParqAnswers | null;
  movement_screens: MovementScreen | null;
  movement_findings: MovementFinding[];
  movement_screen_metrics: MovementScreenMetric[];
  client_metrics: ClientMetric[];
};
