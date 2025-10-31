"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, ExternalLink, FileText, Gavel, Landmark, Loader2, Newspaper, Scale, ScrollText, Search } from "lucide-react";
import { useUser } from "@clerk/nextjs";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PostList } from "@/components/social/PostList";
import type { SocialPostDTO, SocialChannelDTO } from "@/lib/social/client";
import type { CourtListenerOpinion, CourtListenerRecapDocket } from "@/lib/courtlistener/types";
import { formatOpinionTitle } from "@/lib/courtlistener/format";
import type { EcfrDocument } from "@/lib/ecfr/types";
import type { FederalRegisterDocument } from "@/lib/federalregister/types";
import type { GovInfoDocument } from "@/lib/govinfo/types";
import type { LibraryOfCongressItem } from "@/lib/loc/types";
import type { RegulationsDocument } from "@/lib/regulations/types";
import type { OpenStatesBill } from "@/lib/openstates/types";
import { fetchRelationships } from "@/lib/social/client";
import { searchDirectory, type ProfileSearchResult } from "@/lib/search/client";
import { FriendshipButton } from "@/components/social/FriendshipButton";
import type { FriendRelationshipStatus } from "@/components/social/PostList";
import type {
  RcwSectionSearchResult,
  UsCodeDownloadSearchResult,
  WaCourtRuleSearchResult,
  WashingtonCourtOpinionSearchResult,
} from "@/lib/library/datasets";

type SearchResultsState = {
  profiles: ProfileSearchResult[];
  posts: SocialPostDTO[];
  channels: SocialChannelDTO[];
  opinions: CourtListenerOpinion[];
  recapDockets: CourtListenerRecapDocket[];
  govDocuments: GovInfoDocument[];
  libraryItems: LibraryOfCongressItem[];
  federalRegisterDocuments: FederalRegisterDocument[];
  ecfrDocuments: EcfrDocument[];
  regulationsDocuments: RegulationsDocument[];
  openStatesBills: OpenStatesBill[];
  waOpinions: WashingtonCourtOpinionSearchResult[];
  rcwSections: RcwSectionSearchResult[];
  uscodeTitles: UsCodeDownloadSearchResult[];
  waCourtRules: WaCourtRuleSearchResult[];
};

const initialResults: SearchResultsState = {
  profiles: [],
  posts: [],
  channels: [],
  opinions: [],
  recapDockets: [],
  govDocuments: [],
  libraryItems: [],
  federalRegisterDocuments: [],
  ecfrDocuments: [],
  regulationsDocuments: [],
  openStatesBills: [],
  waOpinions: [],
  rcwSections: [],
  uscodeTitles: [],
  waCourtRules: [],
};

type SearchViewProps = {
  mode?:
    | "all"
    | "profiles"
    | "posts"
    | "channels"
    | "opinions"
    | "recap"
    | "waopinions"
    | "rcw"
    | "uscode"
    | "courtrules"
    | "govinfo"
    | "loc"
    | "federalregister"
    | "ecfr"
    | "regulations"
    | "openstates";
  heading?: string;
  placeholder?: string;
  variant?: "standalone" | "inline";
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

type ProfileCardProps = {
  profile: ProfileSearchResult;
  viewerId?: string | null;
  relationshipStatus?: FriendRelationshipStatus | null;
  isFollower?: boolean;
  onRelationshipChange?: (userId: string, following: boolean) => void;
};

function ProfileResultCard({ profile, viewerId, relationshipStatus = null, isFollower = false, onRelationshipChange }: ProfileCardProps) {
  const initials = useMemo(() => getInitials(profile.fullName), [profile.fullName]);

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={profile.avatarUrl || undefined} />
            <AvatarFallback>{initials || "LA"}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900">{profile.fullName}</h3>
            {profile.headline ? <p className="text-sm text-slate-600">{profile.headline}</p> : null}
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              {profile.role ? <Badge variant="outline">{profile.role}</Badge> : null}
              {profile.company ? <Badge variant="outline">{profile.company}</Badge> : null}
              {profile.location ? <span>{profile.location}</span> : null}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {viewerId && viewerId !== profile.id && relationshipStatus ? (
            <FriendshipButton
              targetId={profile.id}
              targetName={profile.fullName}
              targetAvatarUrl={profile.avatarUrl}
              status={relationshipStatus}
              isFollower={isFollower}
              onStatusChange={(_status, following) => onRelationshipChange?.(profile.id, following)}
            />
          ) : null}
          <Button asChild variant="outline">
            <Link href={`/people/${profile.id}`}>View profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type ChannelCardProps = {
  channel: SocialChannelDTO;
};

function ChannelResultCard({ channel }: ChannelCardProps) {
  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-slate-900">{channel.name}</h3>
            <Badge variant="secondary">{channel.type === "project" ? "Project" : "Topic"}</Badge>
            {channel.isDefault ? <Badge variant="outline">Default</Badge> : null}
            <Badge variant="outline">{channel.memberCount} members</Badge>
          </div>
          {channel.description ? <p className="text-sm text-slate-600">{channel.description}</p> : null}
        </div>
        <Button asChild variant={channel.isMember ? "outline" : "default"} size="sm">
          <Link href={`/social?channel=${channel.id}`}>{channel.isMember ? "Open" : "View channel"}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function formatDisplayDate(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatFileSize(bytes: number | null): string | null {
  if (!bytes || bytes <= 0) {
    return null;
  }
  const megabytes = bytes / (1024 * 1024);
  if (megabytes < 1) {
    const kilobytes = bytes / 1024;
    return `${kilobytes.toFixed(1)} KB`;
  }
  return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`;
}

type OpinionResultCardProps = {
  opinion: CourtListenerOpinion;
};

function OpinionResultCard({ opinion }: OpinionResultCardProps) {
  const formattedDate = useMemo(() => formatDisplayDate(opinion.dateFiled), [opinion.dateFiled]);
  const formattedTitle = formatOpinionTitle(opinion);
  const shouldShowFullName = opinion.caseName && opinion.caseNameShort ? opinion.caseName.trim() !== opinion.caseNameShort.trim() : false;
  const snippetHtml = opinion.snippetHighlighted ?? null;
  const snippetText = opinion.snippet ?? null;

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Gavel className="mt-1 h-4 w-4 flex-shrink-0 text-slate-500" aria-hidden />
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-900">{formattedTitle}</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              {formattedDate ? <span>{formattedDate}</span> : null}
              {opinion.year && (!formattedDate || !formattedDate.includes(opinion.year)) ? <span>{opinion.year}</span> : null}
              {opinion.precedentialStatus ? <Badge variant="secondary">{opinion.precedentialStatus}</Badge> : null}
            </div>
            {shouldShowFullName ? <p className="text-sm text-slate-500">{opinion.caseName}</p> : null}
            {snippetHtml ? (
              <p
                className="text-sm leading-relaxed text-slate-600"
                dangerouslySetInnerHTML={{ __html: snippetHtml }}
              />
            ) : snippetText ? (
              <p className="text-sm leading-relaxed text-slate-600">{snippetText}</p>
            ) : null}
          </div>
        </div>
        {opinion.absoluteUrl ? (
          <Button variant="outline" size="sm" asChild>
            <a href={opinion.absoluteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
              View opinion
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

type RecapDocketResultCardProps = {
  docket: CourtListenerRecapDocket;
};

function RecapDocketResultCard({ docket }: RecapDocketResultCardProps) {
  const formattedDate = useMemo(() => formatDisplayDate(docket.dateFiled), [docket.dateFiled]);
  const snippet = docket.snippet ?? docket.natureOfSuit ?? docket.cause ?? null;
  const courtLabel = docket.courtName ?? docket.courtId ?? "Court";

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <ScrollText className="mt-1 h-4 w-4 flex-shrink-0 text-slate-500" aria-hidden />
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-900">{docket.caseName}</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              {formattedDate ? <span>{formattedDate}</span> : null}
              {docket.docketNumber ? <span>Docket {docket.docketNumber}</span> : null}
              <Badge variant="outline">{courtLabel}</Badge>
              {docket.assignedTo ? <Badge variant="secondary">Judge {docket.assignedTo}</Badge> : null}
            </div>
            {docket.caseNameShort && docket.caseNameShort !== docket.caseName ? (
              <p className="text-sm text-slate-500">{docket.caseNameShort}</p>
            ) : null}
            {snippet ? <p className="text-sm leading-relaxed text-slate-600">{snippet}</p> : null}
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              {docket.natureOfSuit ? <span>Nature: {docket.natureOfSuit}</span> : null}
              {docket.cause ? <span>Cause: {docket.cause}</span> : null}
              {docket.appealFrom ? <span>Appeal from {docket.appealFrom}</span> : null}
              {docket.stateCode ? <span>{docket.stateCode}</span> : null}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:min-w-[160px]">
          {docket.absoluteUrl ? (
            <Button variant="outline" size="sm" asChild>
              <a href={docket.absoluteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                View docket
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            </Button>
          ) : null}
          {docket.docketEntriesUrl ? (
            <Button variant="outline" size="sm" asChild>
              <a
                href={docket.docketEntriesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                Docket entries
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

type WaOpinionResultCardProps = {
  opinion: WashingtonCourtOpinionSearchResult;
};

function WaOpinionResultCard({ opinion }: WaOpinionResultCardProps) {
  const formattedDate = useMemo(() => formatDisplayDate(opinion.fileDate), [opinion.fileDate]);

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Gavel className="mt-1 h-4 w-4 flex-shrink-0 text-slate-500" aria-hidden />
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-900">{opinion.caseTitle}</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              {formattedDate ? <span>{formattedDate}</span> : null}
              <Badge variant="outline">{opinion.courtLabel}</Badge>
              {opinion.division ? <Badge variant="secondary">Division {opinion.division}</Badge> : null}
              <span>Docket {opinion.docketNumber}</span>
            </div>
            <p className="text-sm text-slate-500">{opinion.fileContains}</p>
            <p className="text-sm leading-relaxed text-slate-600">{opinion.summary}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:min-w-[160px]">
          {opinion.detailUrl ? (
            <Button variant="outline" size="sm" asChild>
              <a href={opinion.detailUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                Opinion detail
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            </Button>
          ) : null}
          {opinion.pdfUrl ? (
            <Button variant="outline" size="sm" asChild>
              <a href={opinion.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                Download PDF
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

type RcwSectionResultCardProps = {
  section: RcwSectionSearchResult;
};

function RcwSectionResultCard({ section }: RcwSectionResultCardProps) {
  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-1 h-4 w-4 flex-shrink-0 text-slate-500" aria-hidden />
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-900">
              RCW {section.sectionNumber} – {section.heading}
            </h3>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span>Title {section.titleNumber}</span>
              <span>Chapter {section.chapterNumber}</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">{section.summary}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:min-w-[160px]">
          <Button variant="outline" size="sm" asChild>
            <Link href={section.appPath} className="inline-flex items-center gap-2">
              Open in workspace
              <ExternalLink className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={section.officialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
              View on legislature site
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type WaCourtRuleResultCardProps = {
  rule: WaCourtRuleSearchResult;
};

function WaCourtRuleResultCard({ rule }: WaCourtRuleResultCardProps) {
  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <ScrollText className="mt-1 h-4 w-4 flex-shrink-0 text-slate-500" aria-hidden />
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-900">
              {rule.ruleNumber} – {rule.title}
            </h3>
            <div className="text-sm text-slate-600">
              {rule.setAbbreviation}
              {rule.setAbbreviation !== rule.setName ? ` • ${rule.setName}` : ""} • {rule.groupName}
            </div>
            {rule.category ? <div className="text-xs text-slate-500">{rule.category}</div> : null}
          </div>
        </div>
        {rule.pdfUrl ? (
          <Button variant="outline" size="sm" asChild>
            <a href={rule.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
              View PDF
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

type UsCodeDownloadResultCardProps = {
  item: UsCodeDownloadSearchResult;
};

function UsCodeDownloadResultCard({ item }: UsCodeDownloadResultCardProps) {
  const formattedSize = useMemo(() => formatFileSize(item.fileSize), [item.fileSize]);

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <FileText className="mt-1 h-4 w-4 flex-shrink-0 text-slate-500" aria-hidden />
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-900">
              {item.titleLabel} – Release {item.releaseLabel}
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              {item.titleNumber ? <span>Title {item.titleNumber}</span> : null}
              {formattedSize ? <span>{formattedSize}</span> : null}
              {item.localPath ? <span>Cached locally</span> : <span>Remote download</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:min-w-[160px]">
          <Button variant="outline" size="sm" asChild>
            <a href={item.remoteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
              Download XML bundle
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type GovInfoResultCardProps = {
  document: GovInfoDocument;
};

function GovInfoResultCard({ document }: GovInfoResultCardProps) {
  const formattedDate = useMemo(() => formatDisplayDate(document.documentDate), [document.documentDate]);

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <FileText className="mt-1 h-4 w-4 flex-shrink-0 text-slate-500" aria-hidden />
          <div className="space-y-2">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900">{document.title}</h3>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                {formattedDate ? <span>{formattedDate}</span> : null}
                {document.collectionName ? <span>{document.collectionName}</span> : null}
                {document.congress ? <span>{document.congress} Congress</span> : null}
              </div>
            </div>
            {document.citation ? <p className="text-sm text-slate-500">{document.citation}</p> : null}
          </div>
        </div>
        {document.url ? (
          <Button variant="outline" size="sm" asChild>
            <a href={document.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
              View document
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

type LibraryResultCardProps = {
  item: LibraryOfCongressItem;
};

type FederalRegisterResultCardProps = {
  document: FederalRegisterDocument;
};

type RegulationsResultCardProps = {
  document: RegulationsDocument;
};

type OpenStatesResultCardProps = {
  bill: OpenStatesBill;
};

type EcfrResultCardProps = {
  document: EcfrDocument;
};

function FederalRegisterResultCard({ document }: FederalRegisterResultCardProps) {
  const formattedDate = useMemo(() => formatDisplayDate(document.publicationDate), [document.publicationDate]);
  const agencies = document.agencies.slice(0, 3);

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Newspaper className="mt-1 h-4 w-4 flex-shrink-0 text-slate-500" aria-hidden />
          <div className="space-y-2">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900">{document.title}</h3>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                {formattedDate ? <span>{formattedDate}</span> : null}
                {document.documentType ? <span>{document.documentType}</span> : null}
                {agencies.length ? <span>{agencies.join(" · ")}</span> : null}
              </div>
            </div>
            {document.abstract ? <p className="text-sm text-slate-500">{document.abstract}</p> : null}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:min-w-[160px]">
          {document.htmlUrl ? (
            <Button variant="outline" size="sm" asChild>
              <a href={document.htmlUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                View online
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            </Button>
          ) : null}
          {document.pdfUrl ? (
            <Button variant="outline" size="sm" asChild>
              <a href={document.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                Download PDF
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function RegulationsResultCard({ document }: RegulationsResultCardProps) {
  const formattedPosted = useMemo(() => formatDisplayDate(document.postedDate), [document.postedDate]);
  const formattedCommentDue = useMemo(
    () => formatDisplayDate(document.commentDueDate),
    [document.commentDueDate]
  );

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Scale className="mt-1 h-4 w-4 flex-shrink-0 text-slate-500" aria-hidden />
          <div className="space-y-2">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900">{document.title}</h3>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                {document.agency ? <span>{document.agency}</span> : null}
                {document.docketId ? <span>Docket {document.docketId}</span> : null}
                {document.documentId ? <span>Doc {document.documentId}</span> : null}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                {formattedPosted ? <span>Posted {formattedPosted}</span> : null}
                {formattedCommentDue ? <span>Comments due {formattedCommentDue}</span> : null}
              </div>
            </div>
          </div>
        </div>
        {document.url ? (
          <Button variant="outline" size="sm" asChild>
            <a href={document.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
              View docket
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function OpenStatesResultCard({ bill }: OpenStatesResultCardProps) {
  const formattedActionDate = useMemo(() => formatDisplayDate(bill.latestActionDate), [bill.latestActionDate]);
  const subjects = bill.subjects.slice(0, 3);

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Landmark className="mt-1 h-4 w-4 flex-shrink-0 text-slate-500" aria-hidden />
          <div className="space-y-2">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900">{bill.title}</h3>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                <span>{bill.identifier}</span>
                {bill.jurisdiction ? <span>{bill.jurisdiction}</span> : null}
                {bill.session ? <span>{bill.session}</span> : null}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                {formattedActionDate ? <span>Latest action {formattedActionDate}</span> : null}
                {bill.latestAction ? <span>{bill.latestAction}</span> : null}
              </div>
            </div>
            {subjects.length ? (
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => (
                  <Badge key={subject} variant="outline">
                    {subject}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        {bill.url ? (
          <Button variant="outline" size="sm" asChild>
            <a href={bill.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
              View bill
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function EcfrResultCard({ document }: EcfrResultCardProps) {
  const formattedDate = useMemo(() => formatDisplayDate(document.lastModified), [document.lastModified]);

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <ScrollText className="mt-1 h-4 w-4 flex-shrink-0 text-slate-500" aria-hidden />
          <div className="space-y-2">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900">{document.title}</h3>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                {document.citation ? <span>{document.citation}</span> : null}
                {document.section ? <span>{document.section}</span> : null}
                {document.titleNumber ? <span>Title {document.titleNumber}</span> : null}
                {formattedDate ? <span>{formattedDate}</span> : null}
              </div>
            </div>
          </div>
        </div>
        {document.url ? (
          <Button variant="outline" size="sm" asChild>
            <a href={document.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
              View regulation
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function LibraryResultCard({ item }: LibraryResultCardProps) {
  const formattedDate = useMemo(() => formatDisplayDate(item.date), [item.date]);
  const subjects = item.subjects.slice(0, 3);

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-1 h-4 w-4 flex-shrink-0 text-slate-500" aria-hidden />
          <div className="space-y-2">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                {formattedDate ? <span>{formattedDate}</span> : null}
                {subjects.length ? <span>{subjects.join(" · ")}</span> : null}
              </div>
            </div>
            {item.description ? <p className="text-sm text-slate-500">{item.description}</p> : null}
          </div>
        </div>
        {item.url ? (
          <Button variant="outline" size="sm" asChild>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
              View item
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function SearchView({
  mode = "all",
  heading = "Search the community",
  placeholder = "Search for people, posts, or topics…",
  variant = "standalone",
}: SearchViewProps) {
  const { user } = useUser();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultsState>(initialResults);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followerIds, setFollowerIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let ignore = false;

    async function bootstrapRelationships() {
      try {
        const relationshipData = await fetchRelationships();
        if (ignore) {
          return;
        }
        setFollowingIds(new Set(relationshipData.following.map((user) => user.id)));
        setFollowerIds(new Set(relationshipData.followers.map((user) => user.id)));
      } catch (relationshipError) {
        // Most likely unauthenticated; ignore silently.
        console.error(relationshipError);
      }
    }

    bootstrapRelationships();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) {
      setResults({ ...initialResults });
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await searchDirectory(query.trim(), mode);
      const includeProfiles = mode === "all" || mode === "profiles";
      const includePosts = mode === "all" || mode === "posts";
      const includeChannels = mode === "all" || mode === "channels";
      const includeOpinions = mode === "all" || mode === "opinions";
      const includeWaOpinions = mode === "all" || mode === "opinions" || mode === "waopinions";
      const includeRecap = mode === "all" || mode === "recap";
      const includeGovDocuments = mode === "all" || mode === "govinfo";
      const includeLibraryItems = mode === "all" || mode === "loc";
      const includeFederalRegister = mode === "all" || mode === "federalregister";
      const includeEcfr = mode === "all" || mode === "ecfr";
      const includeRegulations = mode === "all" || mode === "regulations";
      const includeOpenStates = mode === "all" || mode === "openstates";
      const includeRcw = mode === "all" || mode === "rcw";
      const includeUsCode = mode === "all" || mode === "uscode";
      const includeCourtRules = mode === "all" || mode === "courtrules";

      setResults({
        profiles: includeProfiles ? response.profiles : [],
        posts: includePosts ? response.posts : [],
        channels: includeChannels ? response.channels : [],
        opinions: includeOpinions ? response.opinions : [],
        waOpinions: includeWaOpinions ? response.waOpinions : [],
        recapDockets: includeRecap ? response.recapDockets : [],
        govDocuments: includeGovDocuments ? response.govDocuments : [],
        libraryItems: includeLibraryItems ? response.libraryItems : [],
        federalRegisterDocuments: includeFederalRegister ? response.federalRegisterDocuments : [],
        ecfrDocuments: includeEcfr ? response.ecfrDocuments : [],
        regulationsDocuments: includeRegulations ? response.regulationsDocuments : [],
        openStatesBills: includeOpenStates ? response.openStatesBills : [],
        rcwSections: includeRcw ? response.rcwSections : [],
        uscodeTitles: includeUsCode ? response.uscodeTitles : [],
        waCourtRules: includeCourtRules ? response.waCourtRules : [],
      });
    } catch (searchError) {
      console.error(searchError);
      setError(searchError instanceof Error ? searchError.message : "Search failed. Try again.");
    } finally {
      setIsSearching(false);
    }
  }

  function handlePostUpdated(postId: string, updates: Partial<SocialPostDTO>) {
    setResults((prev) => ({
      ...prev,
      posts: prev.posts.map((post) => (post.id === postId ? { ...post, ...updates } : post)),
    }));
  }

  function handleRelationshipChange(authorId: string, following: boolean) {
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (following) {
        next.add(authorId);
      } else {
        next.delete(authorId);
      }
      return next;
    });
  }

  function relationshipStatusFor(userId: string): FriendRelationshipStatus {
    const viewerFollows = followingIds.has(userId);
    const userFollowsViewer = followerIds.has(userId);
    if (viewerFollows && userFollowsViewer) {
      return "friends";
    }
    if (viewerFollows) {
      return "outgoing";
    }
    if (userFollowsViewer) {
      return "incoming";
    }
    return "none";
  }

  const form = (
    <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="flex-1"
      />
      <Button type="submit" disabled={isSearching} className="md:w-40">
        {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
        Search
      </Button>
    </form>
  );

  const hasResults =
    results.profiles.length > 0 ||
    results.posts.length > 0 ||
    results.channels.length > 0 ||
    results.opinions.length > 0 ||
    results.recapDockets.length > 0 ||
    results.govDocuments.length > 0 ||
    results.libraryItems.length > 0 ||
    results.federalRegisterDocuments.length > 0 ||
    results.ecfrDocuments.length > 0 ||
    results.regulationsDocuments.length > 0 ||
    results.openStatesBills.length > 0 ||
    results.waOpinions.length > 0 ||
    results.rcwSections.length > 0 ||
    results.uscodeTitles.length > 0 ||
    results.waCourtRules.length > 0;

  const resultsContent = (
    <>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!error && !isSearching && query && !hasResults ? (
        <p className="text-sm text-slate-500">No matches found. Try adjusting your search terms.</p>
      ) : null}

      {mode !== "channels" && results.profiles.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">People</h2>
            <span className="text-sm text-slate-500">{results.profiles.length} result{results.profiles.length === 1 ? "" : "s"}</span>
          </div>
          <div className="space-y-4">
            {results.profiles.map((profile) => (
              <ProfileResultCard
                key={profile.id}
                profile={profile}
                viewerId={user?.id}
                relationshipStatus={user ? relationshipStatusFor(profile.id) : null}
                isFollower={followerIds.has(profile.id)}
                onRelationshipChange={handleRelationshipChange}
              />
            ))}
          </div>
        </section>
      ) : null}

      {mode !== "profiles" && results.posts.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Posts</h2>
            <span className="text-sm text-slate-500">{results.posts.length} result{results.posts.length === 1 ? "" : "s"}</span>
          </div>
          <PostList
            posts={results.posts}
            followingIds={followingIds}
            followerIds={followerIds}
            onPostUpdated={handlePostUpdated}
            onRelationshipChange={handleRelationshipChange}
          />
        </section>
      ) : null}

      {mode !== "profiles" && mode !== "posts" && results.channels.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Channels</h2>
            <span className="text-sm text-slate-500">{results.channels.length} result{results.channels.length === 1 ? "" : "s"}</span>
          </div>
          <div className="space-y-3">
            {results.channels.map((channel) => (
              <ChannelResultCard key={channel.id} channel={channel} />
            ))}
          </div>
        </section>
      ) : null}

      {(mode === "all" || mode === "opinions") && results.opinions.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Legal opinions</h2>
            <span className="text-sm text-slate-500">{results.opinions.length} result{results.opinions.length === 1 ? "" : "s"}</span>
          </div>
          <div className="space-y-3">
            {results.opinions.map((opinion) => (
              <OpinionResultCard key={opinion.id} opinion={opinion} />
            ))}
          </div>
        </section>
      ) : null}

      {(mode === "all" || mode === "recap") && results.recapDockets.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">RECAP dockets</h2>
            <span className="text-sm text-slate-500">
              {results.recapDockets.length} result{results.recapDockets.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-3">
            {results.recapDockets.map((docket) => (
              <RecapDocketResultCard key={docket.id} docket={docket} />
            ))}
          </div>
        </section>
      ) : null}

      {(mode === "all" || mode === "opinions" || mode === "waopinions") && results.waOpinions.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Washington appellate opinions</h2>
            <span className="text-sm text-slate-500">
              {results.waOpinions.length} result{results.waOpinions.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-3">
            {results.waOpinions.map((opinion) => (
              <WaOpinionResultCard key={opinion.id} opinion={opinion} />
            ))}
          </div>
        </section>
      ) : null}

      {(mode === "all" || mode === "govinfo") && results.govDocuments.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Government documents</h2>
            <span className="text-sm text-slate-500">
              {results.govDocuments.length} result{results.govDocuments.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-3">
            {results.govDocuments.map((document) => (
              <GovInfoResultCard key={document.packageId} document={document} />
            ))}
          </div>
        </section>
      ) : null}

      {(mode === "all" || mode === "federalregister") && results.federalRegisterDocuments.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Federal Register</h2>
            <span className="text-sm text-slate-500">
              {results.federalRegisterDocuments.length} result{results.federalRegisterDocuments.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-3">
            {results.federalRegisterDocuments.map((document) => (
              <FederalRegisterResultCard key={document.id} document={document} />
            ))}
          </div>
        </section>
      ) : null}

      {(mode === "all" || mode === "regulations") && results.regulationsDocuments.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Regulations.gov</h2>
            <span className="text-sm text-slate-500">
              {results.regulationsDocuments.length} result{results.regulationsDocuments.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-3">
            {results.regulationsDocuments.map((document) => (
              <RegulationsResultCard key={document.id} document={document} />
            ))}
          </div>
        </section>
      ) : null}

      {(mode === "all" || mode === "openstates") && results.openStatesBills.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">State legislation</h2>
            <span className="text-sm text-slate-500">
              {results.openStatesBills.length} result{results.openStatesBills.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-3">
            {results.openStatesBills.map((bill) => (
              <OpenStatesResultCard key={bill.id} bill={bill} />
            ))}
          </div>
        </section>
      ) : null}

      {(mode === "all" || mode === "ecfr") && results.ecfrDocuments.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Code of Federal Regulations</h2>
            <span className="text-sm text-slate-500">
              {results.ecfrDocuments.length} result{results.ecfrDocuments.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-3">
            {results.ecfrDocuments.map((document) => (
              <EcfrResultCard key={document.id} document={document} />
            ))}
          </div>
        </section>
      ) : null}

      {(mode === "all" || mode === "rcw") && results.rcwSections.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">RCW sections</h2>
            <span className="text-sm text-slate-500">
              {results.rcwSections.length} result{results.rcwSections.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-3">
            {results.rcwSections.map((section) => (
              <RcwSectionResultCard key={section.id} section={section} />
            ))}
          </div>
        </section>
      ) : null}

      {(mode === "all" || mode === "uscode") && results.uscodeTitles.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">U.S. Code release bundles</h2>
            <span className="text-sm text-slate-500">
              {results.uscodeTitles.length} result{results.uscodeTitles.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-3">
            {results.uscodeTitles.map((item) => (
              <UsCodeDownloadResultCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      {(mode === "all" || mode === "courtrules") && results.waCourtRules.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Washington court rules</h2>
            <span className="text-sm text-slate-500">
              {results.waCourtRules.length} result{results.waCourtRules.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-3">
            {results.waCourtRules.map((rule) => (
              <WaCourtRuleResultCard key={rule.id} rule={rule} />
            ))}
          </div>
        </section>
      ) : null}

      {(mode === "all" || mode === "loc") && results.libraryItems.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Library of Congress</h2>
            <span className="text-sm text-slate-500">
              {results.libraryItems.length} result{results.libraryItems.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-3">
            {results.libraryItems.map((item) => (
              <LibraryResultCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );

  if (variant === "inline") {
    return (
      <div className="space-y-4">
        {form}
        {resultsContent}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <Search className="h-5 w-5 text-slate-500" />
            {heading}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 py-6">
          {form}
          {resultsContent}
        </CardContent>
      </Card>
    </div>
  );
}
