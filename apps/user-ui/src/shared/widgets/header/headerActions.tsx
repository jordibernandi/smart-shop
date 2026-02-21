import { Heart, ShoppingCart, User } from 'lucide-react';
import Link from 'next/link';
import React from 'react'

const HeaderActions = () => {
    return (
        <div className="flex items-center gap-2 text-gray-700">
            <Link
                href="/login"
                className="flex items-center gap-2.5 hover:text-blue-600 transition-colors group"
            >
                <div className="p-2 group-hover:bg-blue-50 rounded-full transition-colors">
                    <User size={22} />
                </div>
                <div className="hidden lg:block">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">
                        Account
                    </p>
                    <p className="text-sm font-bold">Sign In</p>
                </div>
            </Link>

            <Link
                href="/wishlist"
                className="relative group p-2 hover:bg-blue-50 rounded-full transition-colors"
            >
                <Heart size={22} className="group-hover:text-blue-600" />
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-white">
                    0
                </span>
            </Link>

            <Link
                href="/cart"
                className="relative group p-2 hover:bg-blue-50 rounded-full transition-colors"
            >
                <ShoppingCart
                    size={22}
                    className="group-hover:text-blue-600"
                />
                <span className="absolute top-1 right-1 bg-blue-600 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-white">
                    0
                </span>
            </Link>
        </div>
    );
};

export default HeaderActions