"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import Image from "next/image";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/admin/login";

    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        const checkUser = () => {
            try {
                const storedUser = sessionStorage.getItem("user");
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                } else {
                    setUser(null);
                }
            } catch (e) {
                console.error("Error parsing user from session storage:", e);
            }
        };

        checkUser();
        window.addEventListener("user-login", checkUser);

        return () => window.removeEventListener("user-login", checkUser);
    }, []);

    if (isLoginPage) {
        return (
            <div className="min-h-screen bg-muted/20 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                {children}
                <Toaster />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
            <header className="sticky top-0 z-10 w-full pt-4 px-4 sm:px-6 lg:px-8 pb-2">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
                    {/* Logo Pill */}
                    <Link href="/admin/dashboard" className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-full pl-2 pr-6 py-1.5 flex items-center gap-3 shrink-0 group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        {/* <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center group-hover:scale-105 transition-transform"> */}
                        <Image src="/Logo-sqare.png" alt="Logo" width={150} height={120} />

                        {/* </div> */}
                        {/* <span className="font-bold text-xl tracking-tight text-primary">MotorSelect</span> */}
                    </Link>

                    {/* Navigation Pill */}

                    {/* Actions & Profile Area */}
                    <div className="flex items-center space-x-4 shrink-0">
                        {/* Circular Action Icons */}
                        <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-full px-2 py-1.5 flex items-center space-x-1 shrink-0">
                            <Link
                                href="/admin/dashboard"
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${pathname === '/admin/dashboard' ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/admin/products"
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${pathname.startsWith('/admin/products') ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                            >
                                Products
                                {/* <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="m6 9 6 6 6-6" /></svg> */}
                            </Link>
                            <Link
                                href="/admin/companies"
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${pathname.startsWith('/admin/companies') ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                            >
                                Companies
                            </Link>
                            <Link
                                href="/admin/brands"
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${pathname.startsWith('/admin/brands') ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                            >
                                Brands
                            </Link>
                            <Link
                                href="/admin/series"
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${pathname.startsWith('/admin/series') ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                            >
                                Series
                            </Link>
                            <Link
                                href="/admin/equations"
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${pathname === '/admin/equations' ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                            >
                                Equations
                                {/* <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="m6 9 6 6 6-6" /></svg> */}
                            </Link>
                        </div>


                        {/* User Pill */}
                        <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-full pl-1.5 pr-4 py-1.5 flex items-center gap-3 relative group cursor-pointer">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-primary overflow-hidden shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-none mb-1">{user?.email}</span>
                                <span className="text-[10px] text-slate-500 uppercase font-medium leading-none">{user?.role}</span>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 ml-1"><path d="m6 9 6 6 6-6" /></svg>

                            {/* Dropdown Menu (hidden by default) */}
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden z-50">
                                <button
                                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2"
                                    onClick={() => {
                                        sessionStorage.clear();
                                        window.location.href = "/admin/login";
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main className="max-w-[1600px] w-full mx-auto py-6 px-4 sm:px-6 lg:px-8 flex-1">
                {children}
            </main>
            <Toaster />
        </div>
    );
}
