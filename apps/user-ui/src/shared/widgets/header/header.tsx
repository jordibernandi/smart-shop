"use client"

import React from "react";
import Link from "next/link";
import {
    Search,
    Store,
} from "lucide-react";
import HeaderActions from "./headerActions";
import HeaderBottom from "./headerBottom";

const Header = () => {
    return (
        <>
            <header className="w-full bg-white font-sans">
                {/* HEADER TOP */}
                <div className="bg-white py-5">
                    <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-10">
                        <Link href="/" className="flex items-center gap-2 text-2xl font-black text-blue-600 shrink-0 tracking-tighter">
                            <Store size={34} strokeWidth={2.5} />
                            <span>NEXUS</span>
                        </Link>

                        <div className="flex-1 max-w-xl hidden md:block">
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-5 pr-12 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
                                />
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-1.5 rounded-md hover:bg-blue-700 transition-colors">
                                    <Search size={18} />
                                </button>
                            </div>
                        </div>

                        <HeaderActions />
                    </div>
                </div>
            </header >
            {/* HEADER BOTTOM */}
            <HeaderBottom />
        </>
    );
};

export default Header;