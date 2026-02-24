"use client";

import { useRouter } from 'next/navigation';
import React, { useRef, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, ArrowRight, ShieldCheck, AlertCircle, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';

type ForgotPasswordData = {
    email: string;
    password?: string;
    confirmPassword?: string;
}

const ForgotPasswordPage = () => {
    // Steps: 'email' | 'otp' | 'reset'
    const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [timer, setTimer] = useState(0);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const router = useRouter();
    const { register, handleSubmit, watch, formState: { errors } } = useForm<ForgotPasswordData>();
    const emailValue = watch("email");

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    // Step 1: Send OTP
    const sendOtpMutation = useMutation({
        mutationFn: async (data: { email: string }) => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/api/forgot-password-user`, data);
            return response.data;
        },
        onSuccess: () => {
            setStep('otp');
            setTimer(60);
        }
    });

    // Step 2: Verify OTP
    const verifyOtpMutation = useMutation({
        mutationFn: async () => {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_SERVER_URI}/api/verify-forgot-password-user`,
                { email: emailValue, otp: otp.join("") }
            );
            return response.data;
        },
        onSuccess: () => setStep('reset')
    });

    // Step 3: Final Reset
    const resetPasswordMutation = useMutation({
        mutationFn: async (data: ForgotPasswordData) => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/api/reset-password-user`, {
                email: emailValue,
                otp: otp.join(""),
                newPassword: data.password
            });
            return response.data;
        },
        onSuccess: () => {
            router.push("/login");
        }
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
        <div className="w-full h-[calc(100vh-150px)] flex items-center justify-center bg-gray-50 overflow-hidden px-4 font-sans text-gray-900">
            <div className="w-full max-w-[440px] animate-in fade-in zoom-in duration-500">

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black tracking-tight">
                        {step === 'email' && "Reset Password"}
                        {step === 'otp' && "Verify Identity"}
                        {step === 'reset' && "New Password"}
                    </h2>
                    <p className="text-gray-500 mt-2 font-medium">
                        {step === 'email' && "Enter your email to receive a recovery code"}
                        {step === 'otp' && `Enter the code sent to ${emailValue}`}
                        {step === 'reset' && "Please choose a strong new password"}
                    </p>
                </div>

                <div className="bg-white p-8 lg:p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 min-h-[440px] flex flex-col justify-center transition-all duration-500">

                    {/* STEP 1: EMAIL */}
                    {step === 'email' && (
                        <form onSubmit={handleSubmit((data) => sendOtpMutation.mutate(data))} className="space-y-6 animate-in fade-in slide-in-from-left-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-wider text-gray-400 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.email ? 'text-red-400' : 'text-gray-400'}`} />
                                    <input
                                        {...register("email", { required: "Email is required", pattern: /^\S+@\S+$/i })}
                                        className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 rounded-xl transition-all outline-none text-sm ${errors.email ? 'border-red-100' : 'border-transparent focus:bg-white focus:border-blue-500'}`}
                                        placeholder="your@email.com"
                                    />
                                </div>
                                {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1">Valid email required</p>}
                            </div>

                            {sendOtpMutation.isError && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold animate-shake">
                                    <AlertCircle size={14} />
                                    {(sendOtpMutation.error as AxiosError<{ message: string }>).response?.data?.message || "User not found"}
                                </div>
                            )}

                            <div className="space-y-3">
                                <button disabled={sendOtpMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50">
                                    {sendOtpMutation.isPending ? "Sending..." : "Send Reset Code"}
                                    {!sendOtpMutation.isPending && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                                </button>
                                <Link href="/login" className="block text-center text-sm font-bold text-gray-400 hover:text-gray-600">Back to Login</Link>
                            </div>
                        </form>
                    )}

                    {/* STEP 2: OTP */}
                    {step === 'otp' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                            <div className="flex flex-col items-center">
                                <div className="bg-blue-50 p-4 rounded-full text-blue-600 mb-2"><ShieldCheck size={40} /></div>
                                <h3 className="font-bold text-gray-900">Enter Code</h3>
                            </div>
                            <div className="flex justify-between gap-3">
                                {otp.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={(el) => { inputRefs.current[idx] = el }}
                                        type="text" maxLength={1} value={digit}
                                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                                        onKeyDown={(e) => handleKeyDown(e, idx)}
                                        className={`w-16 h-16 text-center text-2xl font-black rounded-2xl outline-none transition-all border-2 ${verifyOtpMutation.isError ? 'bg-red-50 border-red-200 text-red-600 animate-shake' : 'bg-gray-50 border-transparent focus:border-blue-500 focus:bg-white'}`}
                                    />
                                ))}
                            </div>
                            <div className="space-y-4">
                                {verifyOtpMutation.isError && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold"><AlertCircle size={14} /> Invalid Code</div>
                                )}
                                <button onClick={() => verifyOtpMutation.mutate()} disabled={verifyOtpMutation.isPending || otp.some(d => !d)} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50">
                                    {verifyOtpMutation.isPending ? "Verifying..." : "Verify Code"}
                                </button>
                                <div className="text-center space-y-2">
                                    {timer > 0 ? <p className="text-sm text-gray-400">Resend in <span className="text-gray-900 font-bold">{timer}s</span></p> : <button onClick={() => { setOtp(["", "", "", ""]); sendOtpMutation.mutate({ email: emailValue }); }} className="text-sm text-blue-600 font-bold">Resend Code</button>}
                                    <button onClick={() => setStep('email')} className="block w-full text-xs font-bold text-gray-400 uppercase tracking-widest">Change Email</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: NEW PASSWORD */}
                    {step === 'reset' && (
                        <form onSubmit={handleSubmit((data) => resetPasswordMutation.mutate(data))} className="space-y-5 animate-in fade-in zoom-in">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-wider text-gray-400 ml-1">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        {...register("password", { required: "Required", minLength: 8 })}
                                        type={passwordVisible ? "text" : "password"}
                                        className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-wider text-gray-400 ml-1">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        {...register("confirmPassword", {
                                            validate: (val) => val === watch('password') || "Passwords don't match"
                                        })}
                                        type="password"
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                {errors.confirmPassword && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.confirmPassword.message}</p>}
                            </div>

                            {resetPasswordMutation.isError && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold animate-shake">
                                    <AlertCircle size={14} />
                                    {(resetPasswordMutation.error as AxiosError<{ message: string }>).response?.data?.message || "Reset failed"}
                                </div>
                            )}

                            <button disabled={resetPasswordMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50">
                                {resetPasswordMutation.isPending ? "Updating..." : "Update Password"}
                                {!resetPasswordMutation.isPending && <CheckCircle2 size={18} />}
                            </button>
                            <Link href="/login" className="block text-center text-sm font-bold text-gray-400 hover:text-gray-600">Cancel & Return</Link>
                        </form>
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
            `}</style>
        </div>
    );
};

export default ForgotPasswordPage;