import React, { useState, useEffect } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import img from '../assets/about_robotics_hands.png';

const SplitAuth = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [interest, setInterest] = useState('Student');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // If user is already logged in, redirect to home page
    useEffect(() => {
        if (user && !authLoading) {
            navigate('/');
        }
    }, [user, authLoading, navigate]);

    const toggleAuthMode = () => {
        setIsLogin(!isLogin);
        setIsForgotPassword(false);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setName('');
        setInterest('Student');
        setError('');
        setSuccess('');
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (isForgotPassword) {
            if (!email.trim()) {
                setError('Please enter your email address.');
                return;
            }
            setSubmitting(true);
            try {
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                    redirectTo: window.location.origin + '/auth',
                });
                if (resetError) throw resetError;
                setSuccess('Password reset link sent! Check your inbox.');
                setEmail('');
            } catch (err) {
                setError(err.message || 'Failed to send password reset link.');
            } finally {
                setSubmitting(false);
            }
            return;
        }

        if (!email.trim() || !password) {
            setError('Please fill in all required fields.');
            return;
        }

        if (!isLogin) {
            if (!name.trim()) {
                setError('Please enter your full name.');
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match.');
                return;
            }
            if (password.length < 6) {
                setError('Password must be at least 6 characters long.');
                return;
            }
        }

        setSubmitting(true);

        try {
            if (isLogin) {
                // Log in
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password,
                });
                if (signInError) throw signInError;
                navigate('/');
            } else {
                // Sign up
                const { error: signUpError } = await supabase.auth.signUp({
                    email: email.trim(),
                    password,
                    options: {
                        data: {
                            full_name: name.trim(),
                            interest: interest,
                        },
                    },
                });
                if (signUpError) throw signUpError;
                setSuccess('Account created successfully! Check your email for a confirmation link.');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setName('');
                setInterest('Student');
            }
        } catch (err) {
            setError(err.message || 'An error occurred during authentication.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleAuth = async () => {
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            const { error: oauthError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                },
            });
            if (oauthError) throw oauthError;
        } catch (err) {
            setError(err.message || 'Failed to authenticate with Google.');
            setSubmitting(false);
        }
    };

    return (
        <div className="flex w-full min-h-screen bg-black overflow-hidden font-[sans-serif]">
            {/* Left Section - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative overflow-y-auto">
                <div className="w-full max-w-[450px] space-y-8 my-8">
                    <div className="space-y-4">
                        <h2 className="text-4xl font-bold tracking-tight text-white uppercase">
                            {isForgotPassword 
                                ? 'Reset Password' 
                                : isLogin 
                                ? 'Welcome Back' 
                                : 'Create Account'}
                        </h2>
                        <p className="text-gray-400 text-lg">
                            {isForgotPassword
                                ? 'Enter your email to receive a password reset link.'
                                : isLogin
                                ? 'Welcome back! Please enter your details.'
                                : 'Please enter your details to create an account.'}
                        </p>
                    </div>

                    {error && (
                        <div className="p-4 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-2 items-center">
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="p-4 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex gap-2 items-center">
                            <span>{success}</span>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleEmailAuth}>
                        {/* Name Input (Signup Only) */}
                        {!isLogin && !isForgotPassword && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-300">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors text-white placeholder:text-gray-600"
                                    required
                                />
                            </div>
                        )}

                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300">
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors text-white placeholder:text-gray-600"
                                required
                            />
                        </div>

                        {/* Password Input (Login/Signup Only) */}
                        {!isForgotPassword && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-300">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="**********"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors text-white placeholder:text-gray-600"
                                    required
                                />
                            </div>
                        )}

                        {/* Confirm Password Input (Signup Only) */}
                        {!isLogin && !isForgotPassword && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-300">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="**********"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors text-white placeholder:text-gray-600"
                                    required
                                />
                            </div>
                        )}

                        {/* Interest Select Dropdown (Signup Only) */}
                        {!isLogin && !isForgotPassword && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-300">
                                    Primary Interest / Role
                                </label>
                                <select
                                    value={interest}
                                    onChange={(e) => setInterest(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors text-zinc-300 cursor-pointer"
                                >
                                    <option value="Student">Student</option>
                                    <option value="Hobbyist">Hobbyist</option>
                                    <option value="Professional">Professional</option>
                                    <option value="Educator">Educator</option>
                                </select>
                            </div>
                        )}

                        {/* Actions (Login Only) */}
                        {isLogin && !isForgotPassword && (
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-red-500 focus:ring-red-500"
                                    />
                                    <span className="text-sm font-medium text-gray-400 select-none">Remember me</span>
                                </label>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setIsForgotPassword(true);
                                        setError('');
                                        setSuccess('');
                                    }}
                                    className="text-sm font-bold text-gray-300 hover:text-white hover:underline focus:outline-none bg-transparent border-0 cursor-pointer"
                                >
                                    Forgot password
                                </button>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="space-y-4 pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3.5 px-4 bg-[#ef4444] hover:bg-[#dc2626] text-white font-semibold rounded-lg transition-colors shadow-sm active:transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting 
                                    ? 'Please wait...' 
                                    : isForgotPassword 
                                    ? 'Send Reset Link' 
                                    : isLogin 
                                    ? 'Sign in' 
                                    : 'Sign up'}
                            </button>

                            {!isForgotPassword && (
                                <button
                                    type="button"
                                    onClick={handleGoogleAuth}
                                    disabled={submitting}
                                    className="w-full py-3.5 px-4 bg-white border border-gray-200 hover:bg-gray-100 text-gray-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm active:transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FcGoogle className="text-xl" />
                                    {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
                                </button>
                            )}
                        </div>

                        <div className="text-center pt-4">
                            <p className="text-sm text-gray-500">
                                {isForgotPassword ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsForgotPassword(false);
                                            setError('');
                                            setSuccess('');
                                        }}
                                        className="font-bold text-[#ef4444] hover:underline focus:outline-none bg-transparent border-0 cursor-pointer"
                                    >
                                        Back to Login
                                    </button>
                                ) : (
                                    <>
                                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                                        <button
                                            type="button"
                                            onClick={toggleAuthMode}
                                            className="font-bold text-[#ef4444] hover:underline focus:outline-none bg-transparent border-0 cursor-pointer"
                                        >
                                            {isLogin ? "Sign up for free!" : "Sign in"}
                                        </button>
                                    </>
                                )}
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right Section - Image */}
            <div className="hidden lg:block w-1/2 h-full relative bg-gray-100">
                <div className="absolute inset-0">
                    <img
                        src={img}
                        alt="Authentication Illustration"
                        className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-black/10 mix-blend-multiply pointer-events-none" />
                </div>
            </div>
        </div>
    );
};

export default SplitAuth;
