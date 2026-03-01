import React, { useState, useRef } from 'react';
import { User, Loader2, Upload, Camera, FileText, Award, Briefcase } from 'lucide-react';
import { supabase } from './supabaseClient';

const ProfileSetupPage = ({ setView }) => {
    const [fullName, setFullName] = useState('');
    const [profession, setProfession] = useState('');
    const [degree, setDegree] = useState('');
    const [loading, setLoading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(null); // Preview URL
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Create a preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // In a real app, we would upload the file to Supabase Storage 'avatars' bucket here
            // and get the public URL. For now, we'll store the textual data.
            // If the avatarUrl is huge (base64), we might not want to store it in metadata directly due to size limits.
            // As a fallback/demo, we can store it if small, or better, skip storing the actual image in metadata
            // and assume we'd implement storage later. However, for "wow" factor locally, local state is fine,
            // but refreshing loses it.
            // Let's store the text fields properly.

            const updates = {
                full_name: fullName,
                profession: profession || 'Medical Professional',
                degree: degree,
                avatar_url: null // Placeholder for future storage URL
            };

            const { error } = await supabase.auth.updateUser({
                data: updates
            });

            if (error) throw error;
            setView('landing');
        } catch (error) {
            console.error("Profile update error", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                {/* Header Section with Gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <h2 className="text-3xl font-bold text-white relative z-10">Complete Your Profile</h2>
                    <p className="text-blue-100 relative z-10 mt-1">Let's set up your professional identity</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSaveProfile} className="space-y-6">

                        {/* Avatar Upload (Centrally aligned) */}
                        <div className="flex flex-col items-center justify-center mb-6 -mt-16">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                                <div className={`w-32 h-32 rounded-full border-4 border-white shadow-lg flex items-center justify-center overflow-hidden bg-slate-100 ${avatarUrl ? '' : 'text-slate-400'}`}>
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={64} className="opacity-50" />
                                    )}
                                </div>
                                <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-sm">
                                    <Camera size={18} />
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-2 font-medium uppercase tracking-wide">Upload Photo</p>
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                            {/* Full Name */}
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <User size={16} className="text-blue-500" />
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 placeholder-slate-400"
                                    placeholder="e.g. Dr. Anjali Desai"
                                    required
                                />
                            </div>

                            {/* Profession */}
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Briefcase size={16} className="text-blue-500" />
                                    Profession / Role
                                </label>
                                <input
                                    type="text"
                                    value={profession}
                                    onChange={(e) => setProfession(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 placeholder-slate-400"
                                    placeholder="e.g. Senior Radiologist"
                                />
                            </div>

                            {/* Degree */}
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Award size={16} className="text-blue-500" />
                                    Degree / Qualification
                                </label>
                                <input
                                    type="text"
                                    value={degree}
                                    onChange={(e) => setDegree(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 placeholder-slate-400"
                                    placeholder="e.g. MBBS, MD (Radiodiagnosis)"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white font-medium py-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-slate-800 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Complete Profile</span>}
                            {!loading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileSetupPage;
