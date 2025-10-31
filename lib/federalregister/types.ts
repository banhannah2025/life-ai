export type FederalRegisterDocument = {
  id: string;
  title: string;
  abstract: string | null;
  documentType: string | null;
  agencies: string[];
  publicationDate: string | null;
  htmlUrl: string | null;
  pdfUrl: string | null;
};
