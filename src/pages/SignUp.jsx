import { useState, useEffect } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate } from 'react-router-dom';

import logo from "../assets/images/LOGO1-removebg-preview.png";
import signupImage from "../assets/images/Sign UP.png";

import { supabase } from "../services/supabaseClient";


export default function SignUp() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });


    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');


    // ANIMATED WORDS

    const animatedWords = [
        "Confidence",
        "Ideas",
        "Purpose",
        "Consistency"
    ];

    const [wordIndex, setWordIndex] = useState(0);
    const [fade, setFade] = useState(true);


    useEffect(() => {
        const interval = setInterval(() => {

            setFade(false);
            setTimeout(() => {
                setWordIndex(
                    (current) =>
                        (current + 1) % animatedWords.length
                );
                setFade(true);
            }, 500);
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

        setError('');
        setSuccess('');
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email.trim(),
                password: formData.password,
                options: {
                    data: {
                        username: formData.username.trim()
                    }
                }
            });
            
            if (error) {
                throw error;
            }

            console.log("Supabase signup successful:", data);


            navigate('/onboarding');

            if (!data.session) {
                setSuccess(
                    "Account created! Please check your email to confirm your account before logging in."
                );
            } else {
                setSuccess(
                    "Account created successfully! You can now continue."
                );
            }

            setFormData({
                fullName: formData.fullName,
                email: formData.email,
                password: '',
                confirmPassword: ''
            });

        } catch (error) {
            console.error("Signup error:", error);
            setError(
                error.message || "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };


    return (

        <div className="min-h-screen lg:h-screen flex w-full bg-white font-sans overflow-hidden">

            {/*LEFT SIDE*/}

            <div className="hidden lg:flex lg:w-[35%] bg-[#F5F2FF] flex-col px-8 py-9 xl:px-10 xl:py-10 2xl:px-12 2xl:py-12 animate-page-enter">


                <div className="shrink-0">
                    <img
                        src={logo}
                        alt="Content Khmer Hub Logo"
                        className="h-12 xl:h-14 2xl:h-16 w-auto object-contain"
                    />
                </div>


                <div className="flex flex-col justify-center flex-1 py-8 xl:py-10">
                    <div className="max-w-[560px]">
                        <h1 className="font-heading text-[32px] xl:text-[38px] 2xl:text-[44px] font-bold text-[#0F172A] leading-[1.08] tracking-[-0.03em]">
                            Start Creating With
                            <br />
                            <span
                                className={`
                                    text-[#5352ED]
                                    inline-block
                                    transition-opacity
                                    duration-500
                                    ease-in-out
                                    ${fade ? 'opacity-100' : 'opacity-0'}
                                `}
                            >
                                {animatedWords[wordIndex]}
                            </span>
                        </h1>

                        <p className="mt-4 text-[#64748B] text-sm xl:text-base leading-[1.55] max-w-[540px]">

                            You bring the ideas. CKH helps you understand which ones fit your audience, goals, and creator style.

                        </p>
                    </div>
                </div>


                <div className="w-full shrink-0 mt-2">
                    <img
                        src={signupImage}
                        alt="Workspace Mockup"
                        className="w-full h-auto object-contain rounded-none opacity-[58%] transition-opacity duration-500 hover:opacity-100"
                    />
                </div>
            </div>



            {/*RIGHT SIDE / FORM*/}

            <div className="w-full lg:w-[65%] flex items-center justify-center px-7 py-6 sm:px-10 lg:px-14 xl:px-16 2xl:px-20 h-full">

                <div className="w-full max-w-[400px] animate-page-enter-delay">
                    {/* MOBILE LOGO */}
                    <div className="flex lg:hidden items-center justify-center mb-6">
                        <img
                            src={logo}
                            alt="Content Khmer Hub Logo"
                            className="h-12 w-auto object-contain"
                        />
                    </div>



                    <div className="mb-5">
                        <h2 className="font-heading shimmer-text text-3xl xl:text-4xl font-bold text-[#0F172A] leading-[1.1] tracking-[-0.025em] mb-2">
                            Create Your Account
                        </h2>

                        <p className="text-[#64748B] text-sm leading-relaxed">

                            Create your account and start making more confident content decisions.
                        </p>
                    </div>


                    <form
                        onSubmit={handleSubmit}
                        className="space-y-3"
                    >

                        <div className="space-y-1">
                            <label
                                htmlFor="fullName"
                                className="block text-xs font-bold text-[#0F172A]"
                            >
                                Username
                            </label>

                            <input
                                id="fullName"
                                type="text"
                                name="fullName"
                                placeholder="Sokha Reach"
                                value={formData.fullName}
                                onChange={handleChange}
                                disabled={loading}
                                className="w-full px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#5352ED] focus:ring-1 focus:ring-[#5352ED] transition-all disabled:bg-[#F8FAFC] disabled:cursor-not-allowed"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="email"
                                className="block text-xs font-bold text-[#0F172A]"
                            >
                                Email Address
                            </label>

                            <input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={loading}
                                className="w-full px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#5352ED] focus:ring-1 focus:ring-[#5352ED] transition-all disabled:bg-[#F8FAFC] disabled:cursor-not-allowed"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="password"
                                className="block text-xs font-bold text-[#0F172A]"
                            >
                                Password
                            </label>

                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Create a password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="w-full px-4 py-2 pr-12 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#5352ED] focus:ring-1 focus:ring-[#5352ED] transition-all disabled:bg-[#F8FAFC] disabled:cursor-not-allowed"
                                    required
                                />

                                <button
                                    type="button"
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    disabled={loading}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] transition-colors"
                                >
                                    {showPassword ? (
                                        <FiEyeOff size={16} />
                                    ) : (
                                        <FiEye size={16} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="confirmPassword"
                                className="block text-xs font-bold text-[#0F172A]"
                            >
                                Confirm Password
                            </label>

                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    type={showConfirm ? "text" : "password"}
                                    name="confirmPassword"
                                    placeholder="Repeat your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="w-full px-4 py-2 pr-12 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#5352ED] focus:ring-1 focus:ring-[#5352ED] transition-all disabled:bg-[#F8FAFC] disabled:cursor-not-allowed"
                                    required
                                />

                                <button
                                    type="button"
                                    aria-label={
                                        showConfirm
                                            ? "Hide confirm password"
                                            : "Show confirm password"
                                    }
                                    onClick={() =>
                                        setShowConfirm(!showConfirm)
                                    }
                                    disabled={loading}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] transition-colors"
                                >
                                    {showConfirm ? (
                                        <FiEyeOff size={16} />
                                    ) : (
                                        <FiEye size={16} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 pt-1">
                            <input
                                id="terms"
                                type="checkbox"
                                required
                                disabled={loading}
                                className="mt-0.5 w-4 h-4 rounded border-[#E2E8F0] text-[#5352ED] focus:ring-[#5352ED] cursor-pointer shrink-0"
                            />

                            <label
                                htmlFor="terms"
                                className="text-[11px] text-[#64748B] leading-relaxed cursor-pointer"
                            >
                                I agree to the{" "}
                                <a
                                    href="#"
                                    className="text-[#5352ED] font-semibold hover:underline"
                                >
                                    Terms of Service
                                </a>
                                {" "}and{" "}
                                <a
                                    href="#"
                                    className="text-[#5352ED] font-semibold hover:underline"
                                >
                                    Privacy Policy
                                </a>.
                            </label>
                        </div>

                        {error && (

                            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">

                                <p className="text-xs text-red-600">
                                    {error}
                                </p>

                            </div>

                        )}

                        {success && (

                            <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2">

                                <p className="text-xs text-green-600">
                                    {success}
                                </p>

                            </div>

                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#5352ED] text-white py-2.5 rounded-lg font-bold text-sm hover:bg-[#4342D9] transition-all hover:shadow-md mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading
                                ? "Creating Account..."
                                : "Create Account"
                            }
                        </button>
                    </form>


                    <div className="relative flex items-center mt-5 mb-4">
                        <div className="flex-grow border-t border-[#E2E8F0]" />
                        <span className="flex-shrink-0 mx-4 text-[#94A3B8] text-[10px] font-semibold tracking-[0.2em]">
                            OR
                        </span>
                        <div className="flex-grow border-t border-[#E2E8F0]" />
                    </div>

                    <button
                        type="button"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 border border-[#E2E8F0] bg-white text-[#0F172A] py-2 rounded-lg font-bold text-sm hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <FcGoogle size={18} />
                        Continue with Google
                    </button>


                    <p className="text-center text-xs text-[#64748B]">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="text-[#5352ED] font-bold hover:underline"
                        >
                            Log In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}