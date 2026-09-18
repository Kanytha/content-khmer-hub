import { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import logo from "../../assets/images/LOGO1.png";
import { Link } from 'react-router-dom';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoginHovered, setIsLoginHovered] = useState(false);

    return (
        <nav className="fixed top-0 left-0 w-full bg-white border-b border-[#E2E8F0] z-[100]">

            <div className="w-full max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 xl:px-10 2xl:px-12 py-4">

                <div className="hidden md:flex items-center w-full">

                    <div className="flex items-center shrink-0">
                        <Link to="/">
                            <img
                                src={logo}
                                alt="Content Khmer Hub Logo"
                                className="w-[240px] lg:w-[260px] h-auto object-contain"
                            />
                        </Link>
                    </div>


                    <div className="flex items-center gap-10 text-[#64748B] font-medium absolute left-1/2 -translate-x-1/2">

                        <a
                            href="#about"
                            className="
                                hover:text-[#5352ED]
                                transition-colors
                            "
                        >
                            About
                        </a>

                        <a
                            href="#how-it-works"
                            className="
                                hover:text-[#5352ED]
                                transition-colors
                            "
                        >
                            How It Works
                        </a>


                    </div>


                    <div className="ml-auto flex items-center">

                        <div
                            className="relative flex items-center h-[42px]"
                            onMouseLeave={() => setIsLoginHovered(false)}
                        >

                            <div
                                className={`
                                    absolute
                                    top-0
                                    h-[42px]
                                    rounded-full
                                    bg-[#5352ED]
                                    pointer-events-none
                                    transition-all
                                    duration-300
                                    ease-out
                                    ${
                                        isLoginHovered
                                            ? 'left-0 w-[68px]'
                                            : 'left-[68px] w-[98px]'
                                    }
                                `}
                            />


                            <Link
                                to="/login"
                                onMouseEnter={() => setIsLoginHovered(true)}
                                className={`
                                    relative
                                    z-10
                                    w-[68px]
                                    h-[42px]
                                    flex
                                    items-center
                                    justify-center
                                    rounded-full
                                    font-medium
                                    transition-colors
                                    duration-300
                                    ${
                                        isLoginHovered
                                            ? 'text-white'
                                            : 'text-[#0F172A]'
                                    }
                                `}
                            >
                                Login
                            </Link>


                            <Link
                                to="/signup"
                                onMouseEnter={() => setIsLoginHovered(false)}
                                className={`
                                    relative
                                    z-10
                                    w-[98px]
                                    h-[42px]
                                    flex
                                    items-center
                                    justify-center
                                    rounded-full
                                    font-medium
                                    transition-colors
                                    duration-300
                                    ${
                                        isLoginHovered
                                            ? 'text-[#0F172A]'
                                            : 'text-white'
                                    }
                                `}
                            >
                                Sign Up
                            </Link>

                        </div>

                    </div>

                </div>


                <div className="md:hidden flex items-center justify-between">

                    <Link to="/">
                        <img
                            src={logo}
                            alt="Content Khmer Hub Logo"
                            className="w-[180px] h-auto object-contain"
                        />
                    </Link>

                    <button
                        className="text-2xl text-[#0F172A]"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label={isOpen ? "Close menu" : "Open menu"}
                    >
                        {isOpen ? <FiX /> : <FiMenu />}
                    </button>

                </div>

            </div>


            {isOpen && (
                <div
                    className="
                        absolute
                        top-full
                        left-0
                        w-full
                        bg-white
                        shadow-xl
                        flex
                        flex-col
                        p-6
                        gap-4
                        md:hidden
                        border-b
                        border-[#E2E8F0]
                        z-[99]
                    "
                >

                    <a
                        href="#about"
                        className="text-[#64748B] font-medium"
                        onClick={() => setIsOpen(false)}
                    >
                        About
                    </a>

                    <a
                        href="#how-it-works"
                        className="text-[#64748B] font-medium"
                        onClick={() => setIsOpen(false)}
                    >
                        How It Works
                    </a>

                    <hr className="border-[#E2E8F0] my-2" />

                    <Link
                        to="/login"
                        onClick={() => setIsOpen(false)}
                        className="text-[#0F172A] font-medium"
                    >
                        Login
                    </Link>

                    <Link
                        to="/signup"
                        onClick={() => setIsOpen(false)}
                        className="
                            bg-[#5352ED]
                            text-white
                            px-6
                            py-2.5
                            rounded-full
                            font-medium
                            hover:bg-[#4342D9]
                            transition-all
                            hover:shadow-lg
                            hover:-translate-y-0.5
                            inline-block
                            text-center
                        "
                    >
                        Sign Up
                    </Link>

                </div>
            )}

        </nav>
    );
}