"use client";

import React, { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
    Eye, EyeOff, Mail, Lock, User, ArrowRight,
    ShieldCheck, Phone, Globe, AlertCircle,
    Store, MapPin, Clock, ExternalLink, CreditCard,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { CATEGORIES, COUNTRIES } from "apps/seller-ui/src/configs/constants";

type SellerSignupData = {
    name: string; email: string; phoneNumber: string; country: string; password: string;
    shopName: string; bio: string; address: string; openingHours: string;
    website?: string; category: string;
}

const SellerSignupPage = () => {
    const [currentStep, setCurrentStep] = useState<"account" | "otp" | "shop" | "bank">("account");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [timer, setTimer] = useState(0);
    const [sellerId, setSellerId] = useState<string | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const { register, handleSubmit, watch, getValues, formState: { errors } } = useForm<SellerSignupData>();
    const emailValue = watch("email");

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    // Mutations
    const registerMutation = useMutation({
        mutationFn: async (data: Partial<SellerSignupData>) => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/api/seller-registration`, data);
            return response.data;
        },
        onSuccess: () => { setCurrentStep("otp"); setTimer(60); }
    });

    const verifyOtpMutation = useMutation({
        mutationFn: async () => {
            const formData = getValues();

            const payload = {
                email: formData.email,
                otp: otp.join(""),
                password: formData.password,
                name: formData.name,
                phoneNumber: formData.phoneNumber,
                country: formData.country
            };

            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_SERVER_URI}/api/verify-seller`,
                payload
            );
            return response.data;
        },
        onSuccess: (data) => {
            setSellerId(data.sellerId);
            setCurrentStep("shop");
        }
    });
    console.log("SELLER ID: ", sellerId)
    const shopMutation = useMutation({
        mutationFn: async (data: Partial<SellerSignupData>) => {
            const payload = {
                name: data.shopName,
                bio: data.bio,
                address: data.address,
                openingHours: data.openingHours,
                website: data.website,
                category: data.category,
                sellerId: sellerId
            };

            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_SERVER_URI}/api/create-shop`,
                payload
            );
            return response.data;
        },
        onSuccess: () => setCurrentStep("bank")
    });

    const stripeMutation = useMutation({
        mutationFn: async () => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/api/create-stripe-link`);
            return response.data;
        },
        onSuccess: (data) => { if (data.url) window.location.href = data.url; }
    });

    const handleOtpChange = (value: string, index: number) => {
        if (isNaN(Number(value))) return;
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);
        if (value && index < 3) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
    };

    return (
        <div className="w-full min-h-[100vh] py-12 flex items-center justify-center bg-gray-50 px-4 font-sans text-gray-900">
            <div className="w-full max-w-[500px]">

                {/* Progress Tracker */}
                <div className="flex justify-between mb-10 px-4 relative">
                    <div className="absolute top-4 left-10 right-10 h-[2px] bg-gray-200 -z-0" />
                    {[
                        { label: "Account", key: "account" }, { label: "Verify", key: "otp" },
                        { label: "Shop", key: "shop" }, { label: "Bank", key: "bank" }
                    ].map((s, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 z-10">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black border-4 border-gray-50 transition-all ${currentStep === s.key ? "bg-blue-600 text-white scale-110" : "bg-gray-200 text-gray-500"}`}>
                                {i + 1}
                            </div>
                            <span className={`text-[9px] uppercase font-black tracking-tighter ${currentStep === s.key ? "text-blue-600" : "text-gray-400"}`}>{s.label}</span>
                        </div>
                    ))}
                </div>

                <div className="bg-white p-8 lg:p-10 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.06)] border border-gray-100 min-h-[520px] flex flex-col justify-center transition-all duration-500">

                    {/* STEP 1: ACCOUNT DETAILS */}
                    {currentStep === 'account' && (
                        <form onSubmit={handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <h2 className="text-2xl font-black mb-2">Create Seller Account</h2>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Full Name</label>
                                <div className="relative">
                                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.name ? 'text-red-500' : 'text-gray-400'}`} />
                                    <input {...register("name", { required: "Legal name is required" })} className={`w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 rounded-2xl outline-none text-sm transition-all ${errors.name ? 'border-red-100 focus:border-red-500' : 'border-transparent focus:bg-white focus:border-blue-500'}`} placeholder="Legal full name" />
                                </div>
                                {errors.name && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Email Address</label>
                                <div className="relative">
                                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.email ? 'text-red-500' : 'text-gray-400'}`} />
                                    <input {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid format" } })} type="email" className={`w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 rounded-2xl outline-none text-sm transition-all ${errors.email ? 'border-red-100 focus:border-red-500' : 'border-transparent focus:bg-white focus:border-blue-500'}`} placeholder="business@email.com" />
                                </div>
                                {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.email.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Phone</label>
                                    <div className="relative">
                                        <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.phoneNumber ? 'text-red-500' : 'text-gray-400'}`} />
                                        <input {...register("phoneNumber", { required: "Required" })} className={`w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 rounded-2xl outline-none text-sm transition-all ${errors.phoneNumber ? 'border-red-100 focus:border-red-500' : 'border-transparent focus:bg-white focus:border-blue-500'}`} placeholder="+1..." />
                                    </div>
                                    {errors.phoneNumber && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.phoneNumber.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Country</label>
                                    <div className="relative">
                                        <Globe className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${errors.country ? 'text-red-500' : 'text-gray-400'}`} />
                                        <select {...register("country", { required: "Required" })} className={`w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 rounded-2xl outline-none text-sm transition-all appearance-none cursor-pointer ${errors.country ? 'border-red-100 focus:border-red-500' : 'border-transparent focus:bg-white focus:border-blue-500'}`}>
                                            <option value="">Select...</option>
                                            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    {errors.country && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.country.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Password</label>
                                <div className="relative">
                                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.password ? 'text-red-500' : 'text-gray-400'}`} />
                                    <input {...register("password", { required: "Password required", minLength: { value: 8, message: "Min 8 chars" } })} type={passwordVisible ? "text" : "password"} className={`w-full pl-11 pr-12 py-3.5 bg-gray-50 border-2 rounded-2xl outline-none text-sm transition-all ${errors.password ? 'border-red-100 focus:border-red-500' : 'border-transparent focus:bg-white focus:border-blue-500'}`} placeholder="••••••••" />
                                    <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors">
                                        {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.password.message}</p>}
                            </div>

                            {registerMutation.isError && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold animate-in fade-in">
                                    <AlertCircle size={14} />
                                    {(registerMutation.error as AxiosError<{ message: string }>).response?.data?.message || "Registration failed"}
                                </div>
                            )}

                            <button disabled={registerMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 mt-2">
                                {registerMutation.isPending ? "Submitting..." : "Get Started"}
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    )}

                    {/* STEP 2: OTP (Errors handled via mutation state) */}
                    {currentStep === 'otp' && (
                        <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                            <div className="text-center">
                                <div className="bg-blue-50 p-5 rounded-full text-blue-600 w-fit mx-auto mb-4">
                                    <ShieldCheck size={40} />
                                </div>
                                <h3 className="text-xl font-black">Security Code</h3>
                                <p className="text-xs text-gray-500 mt-1 font-medium italic">
                                    We sent a 4-digit code to <span className="text-blue-600 font-bold">{emailValue}</span>
                                </p>
                            </div>

                            <div className="flex justify-between gap-3">
                                {otp.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={(el) => { inputRefs.current[idx] = el }}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                                        onKeyDown={(e) => handleKeyDown(e, idx)}
                                        className={`w-16 h-16 text-center text-2xl font-black rounded-2xl outline-none transition-all border-2 
                                            ${verifyOtpMutation.isError ? 'bg-red-50 border-red-200 text-red-600 animate-shake' : 'bg-gray-50 border-transparent focus:border-blue-500 focus:bg-white'}`}
                                    />
                                ))}
                            </div>

                            <div className="space-y-4">
                                {verifyOtpMutation.isError && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold animate-in zoom-in duration-300">
                                        <AlertCircle size={14} />
                                        {(verifyOtpMutation.error as AxiosError<{ message: string }>).response?.data?.message || "Invalid OTP code"}
                                    </div>
                                )}

                                <button
                                    onClick={() => verifyOtpMutation.mutate()}
                                    disabled={verifyOtpMutation.isPending || otp.some(d => !d)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50"
                                >
                                    {verifyOtpMutation.isPending ? "Verifying..." : "Verify & Continue"}
                                </button>

                                <div className="text-center">
                                    {timer > 0 ? (
                                        <p className="text-sm text-gray-400 font-medium">
                                            Resend code in <span className="text-gray-900 font-bold">{timer}s</span>
                                        </p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (timer > 0) return;
                                                setTimer(60);
                                                setOtp(["", "", "", ""]);
                                                registerMutation.mutate(getValues());
                                            }}
                                            className="text-sm text-blue-600 font-bold hover:underline"
                                        >
                                            Resend Verification Code
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: SHOP SETUP */}
                    {currentStep === 'shop' && (
                        <form onSubmit={handleSubmit((data) => shopMutation.mutate(data))} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-2xl font-black mb-2">Configure Shop</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Shop Name</label>
                                    <div className="relative">
                                        <Store className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.shopName ? 'text-red-500' : 'text-gray-400'}`} />
                                        <input {...register("shopName", { required: "Name required" })} className={`w-full pl-11 pr-4 py-3 bg-gray-50 border-2 rounded-xl outline-none text-sm transition-all ${errors.shopName ? 'border-red-100 focus:border-red-500' : 'border-transparent focus:bg-white focus:border-blue-500'}`} placeholder="Store name" />
                                    </div>
                                    {errors.shopName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.shopName.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Category</label>
                                    <select {...register("category", { required: "Pick one" })} className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl outline-none text-sm transition-all appearance-none cursor-pointer ${errors.category ? 'border-red-100 focus:border-red-500' : 'border-transparent focus:bg-white focus:border-blue-500'}`}>
                                        <option value="">Choose...</option>
                                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                    {errors.category && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.category.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Shop Address</label>
                                <div className="relative">
                                    <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.address ? 'text-red-500' : 'text-gray-400'}`} />
                                    <input {...register("address", { required: "Address is required" })} className={`w-full pl-11 pr-4 py-3 bg-gray-50 border-2 rounded-xl outline-none text-sm transition-all ${errors.address ? 'border-red-100 focus:border-red-500' : 'border-transparent focus:bg-white focus:border-blue-500'}`} placeholder="Street, City, State" />
                                </div>
                                {errors.address && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.address.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">About the Shop</label>
                                <textarea {...register("bio", { required: "Write a short bio" })} className={`w-full p-4 bg-gray-50 border-2 rounded-xl outline-none text-sm transition-all h-24 resize-none ${errors.bio ? 'border-red-100 focus:border-red-500' : 'border-transparent focus:bg-white focus:border-blue-500'}`} placeholder="Describe your shop..." />
                                {errors.bio && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.bio.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Opening Hours</label>
                                    <div className="relative">
                                        <Clock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.openingHours ? 'text-red-500' : 'text-gray-400'}`} />
                                        <input {...register("openingHours", { required: "Required" })} className={`w-full pl-11 pr-4 py-3 bg-gray-50 border-2 rounded-xl outline-none text-sm transition-all ${errors.openingHours ? 'border-red-100 focus:border-red-500' : 'border-transparent focus:bg-white focus:border-blue-500'}`} placeholder="e.g. 24/7" />
                                    </div>
                                    {errors.openingHours && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.openingHours.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Website</label>
                                    <div className="relative">
                                        <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input {...register("website")} className="w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent border-2 rounded-xl focus:bg-white focus:border-blue-500 outline-none text-sm transition-all" placeholder="Optional" />
                                    </div>
                                </div>
                            </div>

                            {shopMutation.isError && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-bold">
                                    {(shopMutation.error as AxiosError<{ message: string }>).response?.data?.message || "Failed to create shop"}
                                </div>
                            )}

                            <button disabled={shopMutation.isPending} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg transition-all disabled:opacity-50 mt-2">
                                {shopMutation.isPending ? "Processing..." : "Finish Registration"}
                            </button>
                        </form>
                    )}

                    {/* STEP 4: BANK */}
                    {currentStep === 'bank' && (
                        <div className="space-y-6 text-center animate-in fade-in zoom-in">
                            <div className="bg-emerald-50 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto text-emerald-600">
                                <CreditCard size={40} />
                            </div>
                            <h3 className="text-2xl font-black">Payments Setup</h3>
                            <p className="text-sm text-gray-500 px-6 font-medium">Connect your shop to Stripe to start receiving customer payments securely.</p>

                            <button onClick={() => stripeMutation.mutate()} disabled={stripeMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50">
                                {stripeMutation.isPending ? "Redirecting..." : "Connect with Stripe"}
                                <ExternalLink size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
                select { appearance: none; }
            `}</style>
        </div>
    );
};

export default SellerSignupPage;