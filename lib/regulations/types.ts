export type RegulationsDocument = {
  id: string;
  title: string;
  docketId: string | null;
  documentId: string | null;
  agency: string | null;
  postedDate: string | null;
  commentDueDate: string | null;
  url: string | null;
};
