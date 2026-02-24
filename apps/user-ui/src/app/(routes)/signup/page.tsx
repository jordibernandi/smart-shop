"use client";

import { useRouter } from 'next/navigation';
import React, { useRef, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';

type SignupFormData = {
    name: string,
    email: string,
    password: string
}

const SignupPage = () => {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [timer, setTimer] = useState(0);
    const [userData, setUserData] = useState<SignupFormData | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const router = useRouter();
    const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupFormData>();
    const emailValue = watch("email");

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const signUpMutation = useMutation({
        mutationFn: async (data: SignupFormData) => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/api/user-registration`, data);
            return response.data;
        },
        onSuccess: (_, formData) => {
            setUserData(formData);
            setShowOtp(true);
            setTimer(60);
        }
    });

    const verifyOtpMutation = useMutation({
        mutationFn: async () => {
            if (!userData) return;
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_SERVER_URI}/api/verify-user`,
                { ...userData, otp: otp.join("") }
            );
            return response.data;
        },
        onSuccess: () => {
            router.push("/login");
        }
    });

    const onSubmit = (data: SignupFormData) => {
        signUpMutation.mutate(data);
    };

    const handleOtpChange = (value: string, index: number) => {
        if (isNaN(Number(value))) return;
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <div className="w-full h-[calc(100vh-150px)] flex items-center justify-center bg-gray-50 overflow-hidden px-4 font-sans">
            <div className="w-full max-w-[440px] animate-in fade-in zoom-in duration-500">

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                        {showOtp ? "Verify Email" : "Create Account"}
                    </h2>
                    <p className="text-gray-500 mt-2 font-medium">
                        {showOtp ? `Sent to ${emailValue}` : (
                            <>Already have an account? <Link href="/login" className="text-blue-600 hover:underline font-bold">Sign In</Link></>
                        )}
                    </p>
                </div>

                <div className="bg-white p-8 lg:p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 min-h-[460px] flex flex-col justify-center">
                    {!showOtp ? (
                        /* REGISTRATION FORM */
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                            {/* Name Field */}
                            <div className="space-y-1">
                                <label className="text-xs font-black uppercase tracking-wider text-gray-400 ml-1">Full Name</label>
                                <div className="relative">
                                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.name ? 'text-red-400' : 'text-gray-400'}`} />
                                    <input
                                        {...register("name", { required: "Please enter your name" })}
                                        className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 rounded-xl transition-all outline-none text-sm ${errors.name ? 'border-red-100 focus:border-red-500' : 'border-transparent focus:bg-white focus:border-blue-500'}`}
                                        placeholder="John Doe"
                                    />
                                </div>
                                {errors.name && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.name.message}</p>}
                            </div>

                            {/* Email Field */}
                            <div className="space-y-1">
                                <label className="text-xs font-black uppercase tracking-wider text-gray-400 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.email ? 'text-red-400' : 'text-gray-400'}`} />
                                    <input
                                        {...register("email", {
                                            required: "Email is required",
                                            pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" }
                                        })}
                                        type="email"
                                        className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 rounded-xl transition-all outline-none text-sm ${errors.email ? 'border-red-100 focus:border-red-500' : 'border-transparent focus:bg-white focus:border-blue-500'}`}
                                        placeholder="your@email.com"
                                    />
                                </div>
                                {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.email.message}</p>}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1">
                                <label className="text-xs font-black uppercase tracking-wider text-gray-400 ml-1">Password</label>
                                <div className="relative">
                                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
                                    <input
                                        {...register("password", {
                                            required: "Password is required",
                                            minLength: { value: 8, message: "Must be at least 8 characters" }
                                        })}
                                        type={passwordVisible ? "text" : "password"}
                                        className={`w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 rounded-xl transition-all outline-none text-sm ${errors.password ? 'border-red-100 focus:border-red-500' : 'border-transparent focus:bg-white focus:border-blue-500'}`}
                                        placeholder="••••••••"
                                    />
                                    <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors">
                                        {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.password.message}</p>}
                            </div>

                            {/* Server Error for Signup */}
                            {signUpMutation.isError && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                                    <AlertCircle size={14} />
                                    {(signUpMutation.error as AxiosError<{ message: string }>).response?.data?.message || "Sign up failed"}
                                </div>
                            )}

                            <button disabled={signUpMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50">
                                {signUpMutation.isPending ? "Sending OTP..." : "Create Account"}
                                {!signUpMutation.isPending && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </form>
                    ) : (
                        /* OTP FORM */
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex flex-col items-center">
                                <div className="bg-blue-50 p-4 rounded-full text-blue-600 mb-2">
                                    <ShieldCheck size={40} />
                                </div>
                                <h3 className="font-bold text-gray-900">Security Check</h3>
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
                                        className={`w-16 h-16 text-center text-2xl font-black rounded-2xl outline-none transition-all border-2 ${verifyOtpMutation.isError ? 'bg-red-50 border-red-200 text-red-600 animate-shake' : 'bg-gray-50 border-transparent focus:border-blue-500 focus:bg-white'}`}
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
                                        <p className="text-sm text-gray-400 font-medium">Resend code in <span className="text-gray-900 font-bold">{timer}s</span></p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTimer(60);
                                                setOtp(["", "", "", ""]);
                                                signUpMutation.mutate(userData!);
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
                </div>
            </div>

            {/* Custom Style for Shake Animation */}
            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
            `}</style>
        </div>
    );
};

export default SignupPage;