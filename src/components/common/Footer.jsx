import logo from "../../assets/images/LOGO1.png";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-[#E2E8F0] pt-12 pb-6 px-6 mt-12">
      <div className="w-full max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 xl:px-10 2xl:px-12">

        <div className="flex flex-col items-center">

          <div className="flex items-center justify-center mb-4">
            <img
              src={logo}
              alt="Content Khmer Hub Logo"
              className="w-64 h-auto object-contain"
            />
          </div>

          <p className="text-center text-[#64748B] text-sm max-w-[520px] mb-12 leading-relaxed">
            Helping creators make informed content decisions through personalized insights and meaningful opportunities.
          </p>

          <div className="w-full border-t border-[#E2E8F0] pt-6 flex flex-col md:flex-row justify-between items-center gap-4">

            <p className="text-xs text-[#64748B]">
              © 2026 Content Khmer Hub. All rights reserved.
            </p>

            <button className="flex items-center gap-2 text-xs text-[#0F172A] font-medium border border-[#E2E8F0] rounded-full px-4 py-2 hover:bg-[#F8FAFC] transition-colors">
              🌐 English / ខ្មែរ
            </button>

          </div>

        </div>

      </div>
    </footer>
  );
}