import { useState, useEffect } from 'react';
import { FiEye, FiEyeOff, FiMail, FiLock, FiFileText } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate } from 'react-router-dom';

import logo from "../assets/images/LOGO1-removebg-preview.png";
import { supabase } from "../services/supabaseClient";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const animatedWords = [
    "Creating",
    "Ideas",
    "Growth"
  ];

  const [wordIndex, setWordIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // check if user already has saved in the browser
        const { data: profileData } = await supabase
          .from('creator_profiles')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (profileData) {
          navigate('/dashboard');
        } else {
          navigate('/onboarding');
        }
      }
    };

    checkUserSession();
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);

      setTimeout(() => {
        setWordIndex(
          (current) => (current + 1) % animatedWords.length
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password
      });

      if (error) {
        throw error;
      }

      console.log("Login successful:", data);

      const { data: profileData } = await supabase
        .from('creator_profiles')
        .select('id')
        .eq('user_id', data.user.id)
        .single();

      // 3. Navigate based on what we found
      if (profileData) {
        // Folder exists! They finished onboarding before.
        navigate('/dashboard');
      } else {
        // No folder found. It's their first time!
        navigate('/onboarding');
      }

    } catch (error) {
      console.error("Login error:", error);
      setError(
        error.message || "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes skeletonShimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }

          .animate-shine {
            background: linear-gradient(
              90deg,
              #E2E8F0 25%,
              #F8FAFC 50%,
              #E2E8F0 75%
            );
            background-size: 200% 100%;
            animation: skeletonShimmer 2s infinite linear;
          }
        `}
      </style>

      <div className="h-screen w-full flex bg-white font-sans overflow-hidden">
        {/* LEFT SIDE */}
        <div className="hidden lg:flex lg:w-[35%] bg-[#F5F2FF] flex-col px-8 py-6 lg:py-8 2xl:py-10 animate-page-enter relative h-full">
          <div className="shrink-0">
            <img
              src={logo}
              alt="Content Khmer Hub Logo"
              className="h-10 xl:h-12 w-auto object-contain"
            />
          </div>

          <div className="flex flex-col justify-center flex-1 py-4">
            <div className="max-w-[560px]">
              <h1 className="font-heading text-[28px] lg:text-[36px] xl:text-[42px] font-bold text-[#0F172A] leading-[1.1] tracking-[-0.03em]">
                Continue <br />
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

              <p className="mt-3 text-[#475569] text-xs xl:text-sm leading-relaxed max-w-[400px]">
                Your ideas, goals, and content history are still here. Come back when you're ready to decide what to create next.
              </p>
            </div>

            <div className="flex flex-col gap-4 mt-8 max-w-[360px] z-10 relative pl-4">
              <div className="bg-white p-4 lg:p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white relative z-20">
                <div className="flex items-center gap-3 mb-3">
                  <FiFileText className="text-[#5352ED] text-lg lg:text-xl" />
                  <span className="font-bold text-[#0F172A] text-xs lg:text-sm">
                    Content Decision
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="h-2 w-3/4 rounded-full animate-shine"></div>
                  <div className="h-2 w-1/2 rounded-full animate-shine"></div>
                  <div className="h-2 w-5/6 rounded-full animate-shine"></div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm p-4 lg:p-5 rounded-2xl shadow-sm border border-white/50 -ml-4 z-10">
                <h4 className="font-bold text-[#0F172A] text-xs lg:text-sm mb-1.5">
                  Creator Context
                </h4>

                <p className="text-[#64748B] text-[11px] lg:text-xs italic leading-relaxed">
                  Your audience, goals, creator style, and content history shape your recommendations.
                </p>
              </div>

              <div className="bg-white/70 backdrop-blur-sm p-4 lg:p-5 rounded-2xl shadow-sm border border-white/50 -ml-4 z-0">
                <h4 className="font-bold text-[#0F172A] text-xs lg:text-sm mb-1.5">
                  Content Insights
                </h4>

                <p className="text-[#64748B] text-[11px] lg:text-xs italic leading-relaxed">
                  See what you've learned from previous content and use it to make your next decision.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-full lg:w-[65%] flex items-center justify-center px-7 py-6 sm:px-10 lg:px-14 xl:px-16 2xl:px-20 h-full">
          <div className="w-full max-w-[480px] animate-page-enter-delay">

            {/* MOBILE */}
            <div className="flex lg:hidden items-center justify-center mb-8 gap-2">
              <img
                src={logo}
                alt="Content Khmer Hub Logo"
                className="h-12 xl:h-14 2xl:h-16 w-auto object-contain"
              />

            </div>

            <div className="mb-8 text-center">
              <h2 className="font-heading shimmer-text text-2xl lg:text-3xl xl:text-4xl font-bold leading-[1.1] tracking-[-0.025em] mb-2">
                Welcome Back
              </h2>

              <p className="text-[#64748B] text-xs xl:text-sm leading-relaxed">
                Continue making confident content decisions.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-[11px] lg:text-xs font-bold text-[#334155]"
                >
                  Email Address
                </label>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                    <FiMail size={16} />
                  </div>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] text-xs lg:text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#5352ED] focus:ring-1 focus:ring-[#5352ED] transition-all disabled:bg-[#F8FAFC] disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-[11px] lg:text-xs font-bold text-[#334155]"
                >
                  Password
                </label>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                    <FiLock size={16} />
                  </div>

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full pl-11 pr-11 py-3 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] text-xs lg:text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#5352ED] focus:ring-1 focus:ring-[#5352ED] transition-all disabled:bg-[#F8FAFC] disabled:cursor-not-allowed"
                    required
                  />

                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] transition-colors"
                  >

                    {showPassword ? (
                      <FiEyeOff size={16} />
                    ) : (
                      <FiEye size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <input
                    id="remember"
                    type="checkbox"
                    disabled={loading}
                    className="w-3.5 h-3.5 rounded border-[#E2E8F0] text-[#5352ED] focus:ring-[#5352ED] cursor-pointer shrink-0"
                  />

                  <label
                    htmlFor="remember"
                    className="text-[11px] lg:text-xs text-[#64748B] cursor-pointer"
                  >
                    Remember Me
                  </label>
                </div>

                <a
                  href="#"
                  className="text-[11px] lg:text-xs text-[#5352ED] hover:underline"
                >
                  Forgot Password?
                </a>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                  <p className="text-xs text-red-600">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#5352ED] text-white py-3 rounded-lg font-bold text-xs lg:text-sm hover:bg-[#4342D9] transition-all hover:shadow-md mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Logging In..." : "Log In"}
              </button>
            </form>

            <div className="relative flex items-center my-5">
              <div className="flex-grow border-t border-[#E2E8F0]" />
              <span className="flex-shrink-0 mx-4 text-[#94A3B8] text-[10px] lg:text-xs font-medium">
                OR
              </span>
              <div className="flex-grow border-t border-[#E2E8F0]" />
            </div>

            <button
              type="button"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 lg:gap-3 border border-[#E2E8F0] bg-white text-[#0F172A] py-3 rounded-lg font-bold text-xs lg:text-sm hover:bg-[#F8FAFC] transition-all shadow-sm mb-6 disabled:opacity-60 disabled:cursor-not-allowed"
            >

              <FcGoogle size={18} />
              Continue with Google
            </button>

            <p className="text-center text-[11px] lg:text-xs text-[#64748B]">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-[#5352ED] font-bold hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}