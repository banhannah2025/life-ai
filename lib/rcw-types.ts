export interface RCWSection {
  sectionNumber: string;   // "7.105.225"
  caption: string;         // "Grant of order, denial of order, and improper grounds."
  bodyHtml: string;        // statute HTML body, rendered as-is
  history?: string;        // "[ 2024 c 298 s 12; ... ]"
}

export interface RCWChapter {
  chapterNumber: string;   // "7.105"
  chapterTitle: string;    // "CIVIL PROTECTION ORDERS"
  sections: RCWSection[];
}

export interface RCWTitle {
  titleNumber: string;     // "7", "9A", "62A", etc.
  titleName: string;       // "SPECIAL PROCEEDINGS AND ACTIONS"
  chapters: RCWChapter[];
}
