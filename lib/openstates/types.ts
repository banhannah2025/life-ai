export type OpenStatesBill = {
  id: string;
  identifier: string;
  title: string;
  jurisdiction: string | null;
  session: string | null;
  latestAction: string | null;
  latestActionDate: string | null;
  subjects: string[];
  url: string | null;
};
