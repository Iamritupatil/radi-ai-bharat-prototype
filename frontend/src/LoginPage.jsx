import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Button } from './Button';
const LoginPage = ({ setView }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSignUp, setIsSignUp] = useState(false);

    const checkRedirect = (session) => {
        if (!session) return;
        if (session.user?.user_metadata?.full_name) {
            setView('landing');
        } else {
            setView('profile-setup');
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true); // Immediate feedback
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
        } catch (error) {
            console.error("Google login error:", error.message);
            setError(error.message);
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Try sign-in first
            const signInResult = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (signInResult.error) {
                // Sign-in failed — auto-register instead of showing error
                console.log("Sign-in failed, auto-registering...");
                const signUpResult = await supabase.auth.signUp({
                    email: email,
                    password: password,
                });

                if (signUpResult.error) throw signUpResult.error;

                if (signUpResult.data?.session) {
                    console.log("Auto-registration successful");
                    checkRedirect(signUpResult.data.session);
                } else {
                    // Email confirmation required
                    setError("Account created! Please check your email for the confirmation link.");
                    setLoading(false);
                }
            } else {
                // Sign-in succeeded
                console.log("Login successful");
                if (signInResult.data.session) {
                    checkRedirect(signInResult.data.session);
                }
            }
        } catch (error) {
            console.error("Auth error:", error.message);
            setError(error.message);
            setLoading(false);
        }
    };

    // Handle OAuth Redirect manually if needed, though App.jsx usually handles it.
    // We add this for robustness in case App.jsx is slow.
    useEffect(() => {
        if (window.location.hash.includes('access_token')) {
            setLoading(true);
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) checkRedirect(session);
            });
        }
    }, [setView]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-28 pb-12 relative overflow-hidden">
            {/* Main Login Container */}
            <div className="relative w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000 z-10">
                {/* Glass Card - Light Theme */}
                <div className="relative backdrop-blur-xl bg-white/80 border border-white/50 rounded-3xl shadow-2xl overflow-hidden">

                    {/* Split Layout */}
                    <div className="flex flex-col lg:flex-row min-h-[500px]">
                        {/* Left Side - Login Form */}
                        <div className="flex-1 p-8 space-y-6 flex flex-col justify-center">
                            <div className="w-full max-w-md mx-auto space-y-6">
                                {/* Header */}
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 bg-white rounded-2xl mx-auto shadow-lg flex items-center justify-center mb-4 border border-blue-100 overflow-hidden">
                                        <img src="/logo.png" alt="RadiAI" className="w-full h-full object-cover" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{isSignUp ? 'Create Account' : 'Welcome back'}</h1>
                                    <p className="text-slate-500 text-sm">{isSignUp ? 'Join the RadiAI Network today' : 'Sign in to your doctor account'}</p>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleLogin} className="space-y-5">
                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                                            <AlertCircle size={16} />
                                            {error}
                                        </div>
                                    )}
                                    {/* Email Input */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 block">Email address</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300"
                                                placeholder="Enter your email"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Password Input */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 block">Password</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full pl-10 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300"
                                                placeholder="Enter your password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Remember Me & Forgot Password */}
                                    <div className="flex items-center justify-between text-sm">
                                        <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
                                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                            <span>Remember me</span>
                                        </label>
                                        <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Forgot password?</a>
                                    </div>

                                    {/* Login Button */}
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Signing in...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>{isSignUp ? 'Sign Up' : 'Sign in'}</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </Button>
                                </form>

                                <div className="flex-1 border-t border-slate-200"></div>

                                {/* Social Login - Corrected Logic */}
                                <div className="space-y-3">
                                    <button
                                        onClick={handleGoogleLogin}
                                        className="w-full py-3 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-all duration-300 flex items-center justify-center space-x-2 group"
                                    >
                                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path>
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path>
                                        </svg>
                                        <span>Continue with Google</span>
                                    </button>
                                    <div className="mt-2 text-center text-sm text-slate-600">
                                        {isSignUp ? "Already have an account? " : "Don't have an account? "}
                                        <button
                                            type="button"
                                            onClick={() => setIsSignUp(!isSignUp)}
                                            className="text-blue-600 font-medium hover:underline focus:outline-none"
                                        >
                                            {isSignUp ? "Sign In" : "Sign Up"}
                                        </button>
                                    </div>

                                    {/* Demo User Link */}
                                    <div className="mt-5 pt-4 border-t border-dashed border-slate-200">
                                        <button
                                            type="button"
                                            onClick={() => setView('demo-dashboard')}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors group"
                                        >
                                            <svg className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            Continue as Demo User
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Vertical Divider */}
                        <div className="hidden lg:block w-px bg-slate-200 my-8"></div>

                        {/* Right Side - Welcome Content */}
                        <div className="flex-1 p-8 flex flex-col justify-center space-y-6 bg-blue-50/50">
                            <div className="space-y-4">
                                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-lg border border-blue-100 overflow-hidden">
                                    <img src="/logo.png" alt="RadiAI" className="w-full h-full object-cover" />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Join RadiAI Network</h2>
                                <p className="text-slate-600 text-lg leading-relaxed">Experience the next generation of AI-assisted radiology designed to streamline your workflow.</p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { title: "Advanced Analytics", desc: "Detailed insights into diagnostic performance" },
                                    { title: "Real-time Collaboration", desc: "Consult with peers instantly" },
                                    { title: "Enterprise Security", desc: "HIPAA compliant data protection" }
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-start space-x-3">
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-slate-900 font-medium">{feature.title}</h3>
                                            <p className="text-slate-500 text-sm">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
