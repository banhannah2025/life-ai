'use client';

import { useEffect, useMemo, useState } from "react";

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

import { SidebarTrigger } from "../ui/sidebar";
import { Button } from "../ui/button";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { isAdminEmail } from "@/lib/admin/config";
import { ensureFirebaseSignedIn } from "@/lib/firebase/client-auth";
import { getUserProfile } from "@/lib/firebase/profile";
import { hasCaseManagementAccess } from "@/lib/auth/roles";

const baseNavLinks = [
    { href: "/", label: "Home" },
    { href: "/library", label: "Library" },
    { href: "/social", label: "Social" },
    { href: "/ougm-restorative-justice", label: "OUGM Restorative Justice" },
];

export function NavBar() {
    const [isMounted, setIsMounted] = useState(false);
    const { user } = useUser();
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function resolveRole() {
            if (!user?.id) {
                if (!cancelled) {
                    setUserRole(null);
                }
                return;
            }

            try {
                await ensureFirebaseSignedIn();
                const profile = await getUserProfile(user.id);
                if (!cancelled) {
                    setUserRole(profile.role ?? null);
                }
            } catch (error) {
                console.error("Failed to resolve user role for navigation", error);
                if (!cancelled) {
                    setUserRole(null);
                }
            }
        }

        void resolveRole();

        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const links = useMemo(() => {
        const items = [...baseNavLinks];
        const emails = user?.emailAddresses ?? [];
        const isAdminUser = emails.some((address) => isAdminEmail(address.emailAddress));

        if (isMounted && isAdminUser) {
            items.push({ href: "/admin", label: "Admin" });
        }

        if (isMounted && (hasCaseManagementAccess(userRole) || isAdminUser)) {
            items.splice(1, 0, { href: "/case-management", label: "Cases" });
        }

        return items;
    }, [isMounted, user?.emailAddresses, userRole]);

    return (
        <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-10">
                <div className="flex items-center gap-3">
                    <SidebarTrigger className="md:hidden" />
                    <Link href="/" className="flex items-center gap-3 text-slate-900">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-semibold text-white">
                            LA
                        </span>
                        <span className="flex flex-col leading-tight">
                            <span className="text-sm font-semibold tracking-wide uppercase">Life-AI</span>
                            <span className="text-xs font-medium text-slate-500">by CCPROS</span>
                        </span>
                    </Link>
                </div>

                <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="transition-colors hover:text-slate-900"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    <nav className="flex items-center gap-4 text-sm font-medium text-slate-600 md:hidden">
                        {links
                            .filter((link) => link.href !== "/")
                            .map((link) => (
                                <Link key={link.href} href={link.href} className="transition-colors hover:text-slate-900">
                                    {link.label}
                                </Link>
                            ))}
                    </nav>
                    {isMounted ? (
                        <>
                            <SignedIn>
                                <UserButton
                                    appearance={{
                                        elements: {
                                            avatarBox: "h-9 w-9 border border-slate-200 shadow-sm",
                                        },
                                    }}
                                />
                            </SignedIn>
                            <SignedOut>
                                <div className="flex items-center gap-2">
                                    <Button asChild variant="outline" size="sm" className="h-10">
                                        <SignInButton />
                                    </Button>
                                    <Button asChild size="sm" className="h-10">
                                        <SignUpButton />
                                    </Button>
                                </div>
                            </SignedOut>
                        </>
                    ) : (
                        <Skeleton className="h-9 w-9 rounded-full" aria-hidden />
                    )}
                </div>
            </div>
        </header>
    );
}
