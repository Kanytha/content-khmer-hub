import { useState, useEffect, useRef } from 'react';
import {
    FiTarget,
    FiFilter,
    FiCheckCircle,
    FiSlash,
    FiList,
    FiSun
} from 'react-icons/fi';
import landingPic from "../assets/images/landing_pic.png";

function FadeIn({ children }) {
    const [isVisible, setIsVisible] = useState(false);
    const domRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.12 }
        );

        if (domRef.current) {
            observer.observe(domRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={domRef}
            className={`transition-all duration-1000 ease-out transform ${isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-12'
                }`}
        >
            {children}
        </div>
    );
}

export default function LandingPage() {
    const steps = [
        { step: "Step 1", title: "Tell CKH What Matters" },
        { step: "Step 2", title: "Bring Your Ideas" },
        { step: "Step 3", title: "Compare" },
        { step: "Step 4", title: "Decide" },
        { step: "Step 5", title: "Create" },
        { step: "Step 6", title: "Help CKH Learn" },
    ];

    return (
        <div className="pt-20 pb-12 px-6 md:px-8 lg:px-10 xl:px-10 2xl:px-12 max-w-[1400px] mx-auto space-y-16 overflow-hidden">

            <FadeIn>
                <section className="min-h-[calc(100vh-96px)] flex flex-col-reverse md:flex-row items-center justify-between gap-10 lg:gap-12 xl:gap-14">

                    <div className="w-full md:w-1/2 flex flex-col justify-center">

                        <h1 className="text-4xl md:text-5xl lg:text-5xl xl:text-[60px] 2xl:text-[64px] font-extrabold leading-[1.05] tracking-[-0.035em] shimmer-text max-w-[600px]">
                            Every Great <br />
                            Content Starts <br />
                            With A Better <br />
                            Decision.
                        </h1>

                        <p className="mt-5 text-base lg:text-lg text-[#64748B] max-w-[550px] leading-relaxed">
                            Have several content ideas but don't know which one is worth creating? CKH helps growing creators choose what to create based on their audience, goals, creator style, and what has worked before.
                        </p>

                        <div className="flex flex-wrap gap-4 pt-5">

                            <button
                                className="
                                    animate-float
                                    bg-[#5352ED]
                                    text-white
                                    px-6
                                    py-2.5
                                    text-sm
                                    rounded-full
                                    font-medium
                                    hover:shadow-[0_8px_20px_rgba(83,82,237,0.3)]
                                    hover:-translate-y-1
                                    transition-all
                                    duration-300
                                "
                            >
                                Get Started
                            </button>

                            <button
                                className="
                                    border-2
                                    border-[#E2E8F0]
                                    text-[#0F172A]
                                    px-6
                                    py-2.5
                                    text-sm
                                    rounded-full
                                    font-medium
                                    hover:border-[#5352ED]
                                    hover:text-[#5352ED]
                                    hover:-translate-y-1
                                    hover:shadow-md
                                    transition-all
                                    duration-300
                                "
                            >
                                See How CKH Works
                            </button>

                        </div>

                    </div>


                    <div className="w-full md:w-1/2 flex justify-end">

                        <div
                            className="
                                w-full
                                max-w-[420px]
                                lg:max-w-[480px]
                                xl:max-w-[520px]
                                2xl:max-w-[580px]
                                aspect-square
                                bg-[#E2E8F0]
                                rounded-3xl
                                overflow-hidden
                                shadow-2xl
                                hover:scale-[1.02]
                                transition-transform
                                duration-500
                            "
                        >
                            <img
                                src={landingPic}
                                alt="Content Khmer Hub Landing"
                                className="w-full h-full object-cover"
                            />
                        </div>

                    </div>

                </section>
            </FadeIn>


            <FadeIn>
                <section id="about" className="text-center space-y-8 scroll-mt-24">

                    <div className="space-y-3">

                        <h2 className="text-2xl md:text-3xl font-bold">
                            From Idea to Decision
                        </h2>

                        <p className="text-sm md:text-base text-[#64748B]">
                            We replace guesswork with a structured approach to creative decision-making.
                        </p>

                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        <div className="bg-white p-8 rounded-3xl border-2 border-[#E2E8F0] hover:border-[#5352ED] hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group flex flex-col items-center text-center">
                            <div className="w-10 h-10 bg-[#F8FAFC] text-[#5352ED] rounded-full flex items-center justify-center mx-auto mb-4 text-xl group-hover:scale-110 transition-transform">
                                <FiTarget />
                            </div>
                            <h3 className="text-lg font-bold mb-2">
                                Understand
                            </h3>
                            <p className="text-[#334155] text-sm mb-1.5">
                                Know what matters right now.
                            </p>
                            <p className="text-[#94A3B8] italic text-xs leading-relaxed">
                                CKH considers your audience, creator style, current goal, and recent content.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border-2 border-[#E2E8F0] hover:border-[#5352ED] hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group flex flex-col items-center text-center">
                            <div className="w-10 h-10 bg-[#F8FAFC] text-[#5352ED] rounded-full flex items-center justify-center mx-auto mb-4 text-xl group-hover:scale-110 transition-transform">
                                <FiFilter />
                            </div>
                            <h3 className="text-lg font-bold mb-2">
                                Compare
                            </h3>
                            <p className="text-[#334155] text-sm mb-1.5">
                                See which idea fits best.
                            </p>
                            <p className="text-[#94A3B8] italic text-xs leading-relaxed">
                                Compare your ideas against the factors that matter to you.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border-2 border-[#E2E8F0] hover:border-[#5352ED] hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group flex flex-col items-center text-center">
                            <div className="w-10 h-10 bg-[#F8FAFC] text-[#5352ED] rounded-full flex items-center justify-center mx-auto mb-4 text-xl group-hover:scale-110 transition-transform">
                                <FiCheckCircle />
                            </div>
                            <h3 className="text-lg font-bold mb-2">
                                Decide
                            </h3>
                            <p className="text-[#334155] text-sm mb-1.5">
                                Choose with a reason.
                            </p>
                            <p className="text-[#94A3B8] italic text-xs leading-relaxed">
                                CKH recommends the strongest fit and explains why.
                            </p>
                        </div>

                    </div>

                </section>
            </FadeIn>


            <FadeIn>
                <section id="how-it-works" className="w-full bg-white rounded-3xl p-8 md:p-10 lg:p-12 shadow-sm border border-[#E2E8F0] scroll-mt-24">

                    <div className="text-center mb-10">

                        <h2 className="text-2xl md:text-3xl font-bold">
                            How CKH Learns With You
                        </h2>

                    </div>


                    <div className="hidden md:block w-full">

                        <div className="grid grid-cols-6 relative">

                            <div className="absolute top-[60px] left-[8.33%] right-[8.33%] h-[2px] bg-[#E2E8F0]"></div>


                            {steps.map((item, i) => (
                                <div
                                    key={i}
                                    className="relative flex flex-col items-center text-center"
                                >

                                    <div className="h-8 flex items-center justify-center">
                                        <span className="text-xs font-bold text-[#475569] whitespace-nowrap">
                                            {item.step}
                                        </span>
                                    </div>


                                    <div className="h-[60px] flex items-center justify-center relative z-10">

                                        <div className="w-3 h-3 rounded-full bg-[#5352ED] border-[5px] border-white box-content shadow-sm"></div>

                                    </div>


                                    <div className="min-h-[40px] flex items-start justify-center px-2">

                                        <span className="text-xs font-medium text-[#64748B] leading-[1.25] max-w-[110px]">
                                            {item.title}
                                        </span>

                                    </div>

                                </div>
                            ))}

                        </div>

                    </div>


                    <div className="md:hidden flex flex-col gap-6 pl-5 border-l-2 border-[#E2E8F0] ml-4">

                        {steps.map((item, i) => (
                            <div
                                key={i}
                                className="relative"
                            >

                                <div className="absolute -left-[27px] top-1 w-2.5 h-2.5 rounded-full bg-[#5352ED] border-[3px] border-white box-content"></div>

                                <p className="text-xs font-bold text-[#475569] mb-1">
                                    {item.step}
                                </p>

                                <p className="text-sm font-medium text-[#64748B]">
                                    {item.title}
                                </p>

                            </div>
                        ))}

                    </div>

                </section>
            </FadeIn>


            <FadeIn>
                <section className="text-center space-y-8">

                    <h2 className="text-2xl md:text-3xl font-bold">
                        Your Creativity Stays Yours
                    </h2>


                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left items-stretch">

                        <div className="bg-white p-8 md:p-10 rounded-3xl border-2 border-[#E2E8F0] hover:border-[#5352ED] hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(83,82,237,0.15)] transition-all duration-300 group cursor-pointer flex flex-col">

                            <div className="text-[24px] text-[#64748B] group-hover:text-[#5352ED] transition-colors mb-4">
                                <FiSlash />
                            </div>

                            <h3 className="text-lg font-bold mb-3 text-[#0F172A]">
                                You bring the ideas
                            </h3>

                            <p className="text-sm text-[#64748B] leading-relaxed flex-grow">
                                CKH doesn't create your identity for you. You bring the ideas, experience, and creative voice.
                            </p>

                        </div>


                        <div className="bg-white p-8 md:p-10 rounded-3xl border-2 border-[#E2E8F0] hover:border-[#5352ED] hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(83,82,237,0.15)] transition-all duration-300 group cursor-pointer flex flex-col">

                            <div className="text-[24px] text-[#64748B] group-hover:text-[#5352ED] transition-colors mb-4">
                                <FiList />
                            </div>

                            <h3 className="text-lg font-bold mb-3 text-[#0F172A]">
                                You stay in control
                            </h3>

                            <p className="text-sm text-[#64748B] leading-relaxed flex-grow">
                                It compares the options you are considering and shows which one fits your current situation best.
                            </p>

                        </div>


                        <div className="bg-white p-8 md:p-10 rounded-3xl border-2 border-[#E2E8F0] hover:border-[#5352ED] hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(83,82,237,0.15)] transition-all duration-300 group cursor-pointer flex flex-col">

                            <div className="text-[24px] text-[#64748B] group-hover:text-[#5352ED] transition-colors mb-4">
                                <FiSun />
                            </div>

                            <h3 className="text-lg font-bold mb-3 text-[#0F172A]">
                                You can see why
                            </h3>

                            <p className="text-sm text-[#64748B] leading-relaxed flex-grow">
                                Every recommendation is based on information CKH has about your audience, goals, style, and previous content.
                            </p>

                        </div>

                    </div>

                </section>
            </FadeIn>


            <FadeIn>
                <section className="w-full bg-[#5352ED] rounded-3xl p-8 md:p-10 lg:p-12 text-center text-white shadow-[0_20px_40px_-15px_rgba(83,82,237,0.5)]">

                    <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white leading-tight">
                        Decide with clarity. Stop Guessing. Start Deciding With Clarity.
                    </h2>

                    <p className="text-[#E2E8F0] mb-6 text-sm max-w-2xl mx-auto">
                        Bring your next content decision to CKH. Compare your ideas, understand why one fits better, and move forward with confidence.
                    </p>

                    <button className="animate-float bg-white text-[#5352ED] px-7 py-2.5 rounded-full font-bold text-sm hover:bg-[#F8FAFC] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                        Get Started Now
                    </button>

                </section>
            </FadeIn>

        </div>
    );
}