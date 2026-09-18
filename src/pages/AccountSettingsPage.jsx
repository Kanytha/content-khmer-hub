import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import logo from '../assets/images/LOGO1-removebg-preview.png';
import { 
  FiGrid, FiStar, FiEdit3, FiCompass, FiUser, 
  FiSettings, FiHelpCircle, FiX, FiMenu, FiArrowLeft, 
  FiEdit2, FiCheck, FiGlobe
} from 'react-icons/fi';

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [username, setUsername] = useState('Creator');
  const [initials, setInitials] = useState('CR');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [memberSince, setMemberSince] = useState('August 2026');
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  useEffect(() => {
    async function loadAccountData() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const authUser = session?.user;
        if (!authUser) {
          navigate('/');
          return;
        }
        setUser(authUser);

        // 1. Fetch profile from creator_profiles for accurate name & avatar
        const { data: profile } = await supabase
          .from('creator_profiles')
          .select('username, full_name, avatar_url')
          .eq('user_id', authUser.id)
          .maybeSingle();

        const meta = authUser.user_metadata || {};
        const currentName = 
          profile?.username || 
          profile?.full_name || 
          meta.username || 
          meta.full_name || 
          meta.name || 
          authUser.email?.split('@')[0] || 
          'Creator';

        setUsername(currentName);
        setNameInput(currentName);

        setEmail(authUser.email || '');
        setEmailInput(authUser.email || '');

        const parts = currentName.trim().split(/\s+/);
        const derivedInitials = parts.length > 1 
          ? (parts[0][0] + parts[1][0]).toUpperCase() 
          : currentName.slice(0, 2).toUpperCase();
        setInitials(derivedInitials);

        const currentAvatar = 
          profile?.avatar_url || 
          meta.avatar_url || 
          meta.picture || 
          localStorage.getItem('user_avatar_url');

        if (currentAvatar) {
          setAvatarUrl(currentAvatar);
        }

        if (authUser.created_at) {
          const date = new Date(authUser.created_at);
          const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          setMemberSince(monthYear);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadAccountData();
  }, [navigate]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setSaving(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('creator_assets')
        .upload(filePath, file, { upsert: true });

     if (uploadError) {
        console.error("Storage upload failed:", uploadError);
        alert("Upload error: " + uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('creator_assets')
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) return;

      setAvatarUrl(publicUrl);
      localStorage.setItem('user_avatar_url', publicUrl);

      // Keep Auth metadata synced
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl, picture: publicUrl }
      });

      // Update creator_profiles table so Dashboard always sees the photo
      await supabase
        .from('creator_profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveName = async () => {
    if (!nameInput.trim() || !user) return;
    try {
      setSaving(true);
      const updated = nameInput.trim();
      setUsername(updated);
      
      const parts = updated.split(/\s+/);
      const derivedInitials = parts.length > 1 
        ? (parts[0][0] + parts[1][0]).toUpperCase() 
        : updated.slice(0, 2).toUpperCase();
      setInitials(derivedInitials);

      // 1. Update auth user metadata
      await supabase.auth.updateUser({
        data: { username: updated, full_name: updated }
      });

      // 2. Update both username and full_name in creator_profiles
      await supabase
        .from('creator_profiles')
        .update({ 
          username: updated,
          full_name: updated
        })
        .eq('user_id', user.id);

      setIsEditingName(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!emailInput.trim() || emailInput === email) {
      setIsChangingEmail(false);
      return;
    }
    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({ email: emailInput.trim() });
      if (!error) {
        setEmail(emailInput.trim());
        setIsChangingEmail(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters.');
      return;
    }
    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (!error) {
        setPasswordMsg('Password updated successfully.');
        setTimeout(() => {
          setIsChangingPassword(false);
          setPasswordMsg('');
          setNewPassword('');
        }, 1500);
      } else {
        setPasswordMsg(error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOutAll = async () => {
    await supabase.auth.signOut({ scope: 'others' });
    alert('Signed out of other sessions.');
  };

  const handleCloseAccount = async () => {
    const confirm = window.confirm("Are you sure you want to close your account? This action is permanent and cannot be undone.");
    if (!confirm || !user) return;

    try {
      await Promise.all([
        supabase.from('content_ideas').delete().eq('user_id', user.id),
        supabase.from('idea_comparisons').delete().eq('user_id', user.id),
        supabase.from('creator_profiles').delete().eq('user_id', user.id),
        supabase.from('onboarding_responses').delete().eq('user_id', user.id),
        supabase.from('creator_observations').delete().eq('user_id', user.id)
      ]);
      await supabase.auth.signOut();
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  const SidebarContent = ({ onClose }) => (
    <div className="flex flex-col justify-between h-full py-8 px-4 font-normal">
      <div>
        <div className="px-2 mb-10 flex justify-between items-center">
          <img src={logo} alt="Logo" className="h-12 w-auto object-contain" />
          <button 
            type="button"
            onClick={onClose} 
            className="md:hidden text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <nav className="space-y-1 text-sm font-normal text-[#64748B]">
          <div 
            onClick={() => { onClose?.(); navigate('/dashboard'); }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300"
          >
            <FiGrid size={18} /> Dashboard
          </div>
          <div 
            onClick={() => { onClose?.(); navigate('/recommendations'); }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300"
          >
            <FiStar size={18} /> Recommendations
          </div>
          <div 
            onClick={() => { onClose?.(); navigate('/ideas'); }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300"
          >
            <FiEdit3 size={18} /> Ideas
          </div>
          <div 
            onClick={() => { onClose?.(); navigate('/opportunities'); }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300"
          >
            <FiCompass size={18} /> Opportunities
          </div>
          <div 
            onClick={() => { onClose?.(); navigate('/profile'); }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300"
          >
            <FiUser size={18} /> Profile
          </div>
        </nav>
      </div>

      <div className="space-y-1 text-sm font-normal text-[#64748B]">
        <div 
          onClick={() => { onClose?.(); navigate('/account'); }}
          className="flex items-center gap-3 bg-white text-[#5352ED] px-4 py-3 rounded-xl cursor-pointer shadow-xs transition-all duration-300 font-bold"
        >
          <FiSettings size={18} /> Settings
        </div>
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-white hover:text-[#0F172A] hover:shadow-xs rounded-xl cursor-pointer transition-all duration-300">
          <FiHelpCircle size={18} /> Support
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden text-[#0F172A] bg-white font-normal">
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[#E2E8F0] bg-white">
        <img src={logo} alt="Logo" className="h-10 w-auto object-contain" />
        <button 
          onClick={() => setIsMobileMenuOpen(true)} 
          className="text-[#0F172A] hover:text-[#5352ED] transition-colors"
        >
          <FiMenu size={24} />
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-[260px] max-w-sm bg-[#F5F2FF] h-full shadow-2xl">
            <SidebarContent onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="hidden md:block w-[250px] lg:w-[260px] h-full bg-[#F5F2FF] border-r border-[#E2E8F0] shrink-0 z-10">
        <SidebarContent onClose={() => {}} />
      </div>

      <div className="flex-1 h-full overflow-y-auto bg-white">
        <div className="w-full max-w-4xl mx-auto px-5 sm:px-8 lg:px-12 py-8 space-y-6">
          
          <button 
            type="button"
            onClick={() => navigate('/profile')}
            className="inline-flex items-center gap-2 text-xs text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            <FiArrowLeft size={14} /> Back to Profile
          </button>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F172A]">
              Edit Your Profile
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Manage the basic details connected to your CKH account.
            </p>
          </div>

          <div className="space-y-6">
            
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-7 space-y-6 shadow-2xs">
              <div className="space-y-1">
                <h2 className="text-base font-medium text-[#0F172A]">
                  Account Details
                </h2>
                <p className="text-xs text-[#64748B]">
                  Your basic account information.
                </p>
              </div>

              <div className="flex items-center gap-4 py-2 border-b border-gray-100">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarUpload} 
                  accept="image/*" 
                  className="hidden" 
                />

                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={username} 
                    className="w-16 h-16 rounded-full object-cover border border-[#E2E8F0] shadow-xs"
                    onError={() => setAvatarUrl(null)}
                  />
                ) : (
                  <div className="w-16 h-16 bg-[#FFF0F5] text-[#ED4B9E] rounded-full border border-pink-200 flex items-center justify-center font-medium text-xl shadow-xs">
                    {initials}
                  </div>
                )}

                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-[#1E293B]">Profile Photo</p>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                    className="text-xs text-[#5352ED] hover:underline font-normal cursor-pointer"
                  >
                    Change photo
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-gray-100">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-[#94A3B8] block">NAME</span>
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={nameInput} 
                        onChange={(e) => setNameInput(e.target.value)}
                        className="text-sm border border-[#5352ED] rounded-lg px-2.5 py-1 text-[#1E293B] focus:outline-none"
                      />
                      <button 
                        type="button" 
                        onClick={handleSaveName}
                        className="p-1.5 bg-[#5352ED] text-white rounded-lg hover:bg-[#4342D9] transition-colors cursor-pointer"
                      >
                        <FiCheck size={14} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-[#1E293B]">{username}</p>
                  )}
                </div>

                {!isEditingName && (
                  <button 
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0F172A] transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    <FiEdit2 size={12} /> Edit
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-[#94A3B8] block">EMAIL ADDRESS</span>
                  {isChangingEmail ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="email" 
                        value={emailInput} 
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="text-sm border border-[#5352ED] rounded-lg px-2.5 py-1 text-[#1E293B] focus:outline-none"
                      />
                      <button 
                        type="button" 
                        onClick={handleUpdateEmail}
                        className="p-1.5 bg-[#5352ED] text-white rounded-lg hover:bg-[#4342D9] transition-colors cursor-pointer"
                      >
                        <FiCheck size={14} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-[#1E293B]">{email || 'Not provided'}</p>
                  )}
                </div>

                {!isChangingEmail && (
                  <button 
                    type="button"
                    onClick={() => setIsChangingEmail(true)}
                    className="text-xs text-[#5352ED] hover:underline transition-colors self-start sm:self-auto font-normal cursor-pointer"
                  >
                    Change email
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xs">
              <div className="space-y-1">
                <h2 className="text-base font-medium text-[#0F172A]">
                  Security
                </h2>
                <p className="text-xs text-[#64748B]">
                  Manage how you sign in to your CKH account.
                </p>
              </div>

              <div className="divide-y divide-gray-100 text-xs">
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#94A3B8] block">PASSWORD</span>
                    {isChangingPassword ? (
                      <div className="space-y-2 pt-1">
                        <input 
                          type="password" 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password (min 6 chars)"
                          className="border border-[#5352ED] rounded-lg px-2.5 py-1 text-xs text-[#1E293B] focus:outline-none block w-full sm:w-64"
                        />
                        {passwordMsg && <p className="text-[11px] text-[#5352ED]">{passwordMsg}</p>}
                        <button 
                          type="button" 
                          onClick={handleUpdatePassword}
                          className="bg-[#5352ED] text-white px-3 py-1 rounded-lg text-xs hover:bg-[#4342D9] transition-colors cursor-pointer"
                        >
                          Confirm
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-[#1E293B]">Last changed: Never</p>
                    )}
                  </div>
                  {!isChangingPassword && (
                    <button 
                      type="button" 
                      onClick={() => setIsChangingPassword(true)}
                      className="text-xs text-[#5352ED] hover:underline self-start sm:self-auto font-normal cursor-pointer"
                    >
                      Change password
                    </button>
                  )}
                </div>

                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#94A3B8] block">SESSIONS</span>
                    <p className="text-xs text-[#1E293B]">1 device currently signed in</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => alert("Current session: Active Web Client")}
                    className="text-xs text-[#5352ED] hover:underline self-start sm:self-auto font-normal cursor-pointer"
                  >
                    View sessions
                  </button>
                </div>

                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 last:pb-0">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#94A3B8] block">SIGN OUT</span>
                    <p className="text-xs text-[#1E293B]">Sign out of CKH on all other devices</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleSignOutAll}
                    className="text-xs text-[#5352ED] hover:underline self-start sm:self-auto font-normal cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-4 shadow-2xs">
                <h3 className="text-base font-medium text-[#0F172A]">
                  Account Preferences
                </h3>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#F8F9FE] text-[#5352ED]">
                      <FiGlobe size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#94A3B8] block">LANGUAGE</span>
                      <p className="text-xs font-medium text-[#1E293B]">English</p>
                    </div>
                  </div>
                  <button type="button" className="text-xs text-[#5352ED] hover:underline font-normal cursor-pointer">
                    Change
                  </button>
                </div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-4 shadow-2xs">
                <h3 className="text-base font-medium text-[#0F172A]">
                  Account Information
                </h3>
                <div className="space-y-3 pt-2 text-xs divide-y divide-gray-100">
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-[10px] uppercase tracking-wider text-[#94A3B8]">ACCOUNT TYPE</span>
                    <span className="bg-[#F1F5F9] text-[#334155] px-2.5 py-0.5 rounded-md font-medium text-xs">
                      Free Plan
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] uppercase tracking-wider text-[#94A3B8]">MEMBER SINCE</span>
                    <span className="text-[#1E293B] font-medium">{memberSince}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-[#DC2626]">
                  Close Account
                </h4>
                <p className="text-xs text-[#64748B] max-w-lg leading-relaxed">
                  If you want to permanently delete your CKH account, you can do so from here. This action is irreversible.
                </p>
              </div>

              <button 
                type="button" 
                onClick={handleCloseAccount}
                className="px-5 py-2.5 rounded-xl border border-[#FECACA] text-[#DC2626] text-xs font-normal hover:bg-[#FEE2E2] transition-colors shadow-2xs shrink-0 cursor-pointer"
              >
                Close Account
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}