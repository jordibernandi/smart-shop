import React, { useEffect, useState } from 'react'
import Link from "next/link";
import {
    LayoutGrid,
    ChevronDown,
    Menu,
    X,
} from "lucide-react";
import HeaderActions from './headerActions';
import { DEPARTMENTS, NAV_LINKS } from 'apps/user-ui/src/configs/constants';

const HeaderBottom = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 80);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);
    return (
        <div
            className={`w-full sticky top-0 z-[100] transition-all duration-300 ${isScrolled
                ? "bg-white/95 backdrop-blur-md shadow-lg py-2"
                : "bg-white py-3 border-t border-gray-50"
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">

                {/* LEFT SIDE */}
                <div className="flex items-center gap-6">
                    {/* Departments */}
                    <div className="relative group">
                        <button className="flex items-center gap-3 bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-blue-600 transition-all duration-300 font-semibold text-sm">
                            <LayoutGrid size={18} />
                            <span>All Departments</span>
                            <ChevronDown
                                size={14}
                                className="group-hover:rotate-180 transition-transform opacity-70"
                            />
                        </button>

                        <div className="absolute top-[calc(100%+5px)] left-0 w-64 bg-white border border-gray-100 rounded-xl shadow-2xl opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-[110] py-2">
                            {DEPARTMENTS.map((dept) => (
                                <Link
                                    key={dept.name}
                                    href={dept.href}
                                    className="flex items-center justify-between px-5 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm font-medium text-gray-700"
                                >
                                    {dept.name}
                                    <ChevronDown
                                        size={14}
                                        className="-rotate-90 opacity-0 group-hover:opacity-100"
                                    />
                                </Link>
                            ))}
                        </div>
                    </div>

                    <nav className="hidden lg:flex items-center gap-1">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="px-4 py-2 text-[13px] font-bold text-gray-600 hover:text-blue-600 rounded-md hover:bg-gray-50 transition-all"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div
                    className={`transition-all duration-500 ${isScrolled
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 translate-x-10 pointer-events-none"
                        }`}
                >
                    <HeaderActions />
                </div>

                {/* Mobile Toggle */}
                <button
                    className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() =>
                        setIsMobileMenuOpen(!isMobileMenuOpen)
                    }
                >
                    {isMobileMenuOpen ? (
                        <X size={26} />
                    ) : (
                        <Menu size={26} />
                    )}
                </button>
            </div>
        </div>
    )
}

export default HeaderBottom