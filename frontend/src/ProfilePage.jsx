import React, { useState, useEffect } from 'react';
import {
    User,
    Mail,
    Briefcase,
    Award,
    MapPin,
    Calendar,
    Edit2,
    Save,
    X,
    Camera,
    Activity,
    FileText,
    CheckCircle,
    Loader2
} from 'lucide-react';
import { supabase } from './supabaseClient';

const ProfilePage = ({ user, setView }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState({
        fullName: user?.user_metadata?.full_name || '',
        profession: user?.user_metadata?.profession || 'Medical Professional',
        degree: user?.user_metadata?.degree || '',
        email: user?.email || '',
        location: user?.user_metadata?.location || 'New Delhi, India',
        joinDate: new Date(user?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    });
    const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || null);
    const fileInputRef = React.useRef(null);

    // Stats Placeholder
    const stats = [
        { label: 'Scans Analyzed', value: '142', icon: <Activity size={20} className="text-blue-600" />, bg: 'bg-blue-50' },
        { label: 'Reports Generated', value: '89', icon: <FileText size={20} className="text-purple-600" />, bg: 'bg-purple-50' },
        { label: 'Accuracy Rate', value: '98%', icon: <CheckCircle size={20} className="text-emerald-600" />, bg: 'bg-emerald-50' },
    ];

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Helper to resize image for metadata storage (keeps it small)
    const resizeImage = (base64Str, maxWidth = 150, maxHeight = 150) => {
        return new Promise((resolve) => {
            let img = new Image();
            img.src = base64Str;
            img.onload = () => {
                let canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                let ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL());
            };
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            let finalAvatarUrl = avatarUrl;

            // If avatarUrl is a long base64 string (newly uploaded), resize it
            if (avatarUrl && avatarUrl.startsWith('data:image')) {
                finalAvatarUrl = await resizeImage(avatarUrl);
            }

            const updates = {
                full_name: profileData.fullName,
                profession: profileData.profession,
                degree: profileData.degree,
                location: profileData.location,
                avatar_url: finalAvatarUrl
            };

            const { error } = await supabase.auth.updateUser({
                data: updates
            });

            if (error) throw error;
            setIsEditing(false);
            // Optional: trigger a page reload or user update if context isn't auto-refreshing, 
            // but onAuthStateChange in App.jsx should catch it.
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 pb-12">
            <style>{`
                .realism-button {
                    cursor: pointer;
                    font-size: 1rem;
                    border-radius: 16px;
                    border: none;
                    padding: 2px;
                    background: radial-gradient(circle 80px at 80% -10%, #ffffff, #181b1b);
                    position: relative;
                    transition: transform 0.1s ease;
                }
                .realism-button:active {
                    transform: scale(0.96);
                }
                .realism-button::after {
                    content: "";
                    position: absolute;
                    width: 65%;
                    height: 60%;
                    border-radius: 120px;
                    top: 0;
                    right: 0;
                    box-shadow: 0 0 20px #ffffff38;
                    z-index: 0;
                }

                .realism-button .blob1 {
                    position: absolute;
                    width: 70px;
                    height: 100%;
                    border-radius: 16px;
                    bottom: 0;
                    left: 0;
                    background: radial-gradient(
                        circle 60px at 0% 100%,
                        #3fe9ff,
                        #0000ff80,
                        transparent
                    );
                    box-shadow: -10px 10px 30px #0051ff2d;
                    z-index: 1;
                }
                
                .realism-button .blob2 {
                    /* Blob2 styling was missing in snippet, keeping placeholder if needed later */
                    position: absolute;
                    z-index: 1;
                }

                .realism-button .inner {
                    padding: 12px 24px;
                    border-radius: 14px;
                    color: #fff;
                    z-index: 3;
                    position: relative;
                    background: radial-gradient(circle 80px at 80% -50%, #777777, #0f1111);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 500;
                }
                .realism-button .inner::before {
                    content: "";
                    width: 100%;
                    height: 100%;
                    left: 0;
                    top: 0;
                    border-radius: 14px;
                    background: radial-gradient(
                        circle 60px at 0% 100%,
                        #00e1ff1a,
                        #0000ff11,
                        transparent
                    );
                    position: absolute;
                }
            `}</style>

            {/* Header / Hero Section */}
            <div className="relative h-64 bg-slate-900 rounded-b-[3rem] overflow-hidden -mx-4 md:-mx-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-slate-900 opacity-90"></div>
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                        backgroundSize: '40px 40px'
                    }}
                ></div>
                <div className="flex justify-end p-6 relative z-10">
                    <button
                        onClick={() => setView('landing')}
                        className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-24 relative z-20">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-6 md:p-10">

                        {/* Profile Header */}
                        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-8 pb-8 border-b border-slate-100">
                            <div className="relative group">
                                <div
                                    className="w-32 h-32 rounded-2xl bg-white p-1 shadow-lg cursor-pointer"
                                    onClick={() => isEditing && fileInputRef.current?.click()}
                                >
                                    <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-50 flex items-center justify-center text-blue-600 font-bold text-4xl">
                                                {profileData.fullName.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>
                                {isEditing && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg transition-transform hover:scale-110"
                                    >
                                        <Camera size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 w-full">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={profileData.fullName}
                                                onChange={handleInputChange}
                                                className="text-3xl font-bold text-slate-900 bg-slate-50 border border-blue-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-auto"
                                            />
                                        ) : (
                                            <h1 className="text-3xl font-bold text-slate-900">{profileData.fullName}</h1>
                                        )}
                                        <div className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="profession"
                                                    value={profileData.profession}
                                                    onChange={handleInputChange}
                                                    className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-sm"
                                                    placeholder="Profession"
                                                />
                                            ) : (
                                                <span>{profileData.profession}</span>
                                            )}
                                            {(!isEditing && profileData.degree) && (
                                                <>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs border border-blue-100 font-semibold">{profileData.degree}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        {isEditing ? (
                                            <div className="flex flex-col md:flex-row gap-4 items-center">
                                                <button
                                                    onClick={() => setIsEditing(false)}
                                                    className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                                                >
                                                    Cancel
                                                </button>

                                                <button
                                                    onClick={handleSave}
                                                    disabled={loading}
                                                    className="realism-button"
                                                >
                                                    <div className="blob1" />
                                                    <div className="blob2" />
                                                    <div className="inner">
                                                        {loading ? <Loader2 size={16} className="animate-spin text-white" /> : <Save size={16} className="text-white" />}
                                                        <span>Save Changes</span>
                                                    </div>
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="realism-button"
                                            >
                                                <div className="blob1" />
                                                <div className="blob2" />
                                                <div className="inner">
                                                    <Edit2 size={16} className="text-white" />
                                                    <span>Edit Profile</span>
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                            {/* Left Column: Details */}
                            <div className="md:col-span-2 space-y-8">
                                <section>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Personal Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-100 transition-colors">
                                            <div className="flex items-center gap-3 mb-1 text-slate-500 text-sm font-medium">
                                                <Mail size={16} />
                                                Email Address
                                            </div>
                                            <div className="text-slate-900 font-medium break-all">{profileData.email}</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-100 transition-colors">
                                            <div className="flex items-center gap-3 mb-1 text-slate-500 text-sm font-medium">
                                                <MapPin size={16} />
                                                Location
                                            </div>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="location"
                                                    value={profileData.location}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            ) : (
                                                <div className="text-slate-900 font-medium">{profileData.location}</div>
                                            )}
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-100 transition-colors">
                                            <div className="flex items-center gap-3 mb-1 text-slate-500 text-sm font-medium">
                                                <Award size={16} />
                                                Qualification
                                            </div>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="degree"
                                                    value={profileData.degree}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            ) : (
                                                <div className="text-slate-900 font-medium">{profileData.degree}</div>
                                            )}
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-100 transition-colors">
                                            <div className="flex items-center gap-3 mb-1 text-slate-500 text-sm font-medium">
                                                <Calendar size={16} />
                                                Joined Since
                                            </div>
                                            <div className="text-slate-900 font-medium">{profileData.joinDate}</div>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Account Settings</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer text-slate-700">
                                            <span className="font-medium">Change Password</span>
                                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Not implemented</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer text-slate-700">
                                            <span className="font-medium">Notification Preferences</span>
                                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Default</span>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Right Column: Stats */}
                            <div className="md:col-span-1">
                                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden mb-6">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
                                    <h3 className="text-lg font-bold mb-6 relative z-10">Workstation Stats</h3>
                                    <div className="space-y-4 relative z-10">
                                        {stats.map((stat, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                                                        {stat.icon}
                                                    </div>
                                                    <span className="text-sm text-slate-300">{stat.label}</span>
                                                </div>
                                                <span className="font-bold text-lg">{stat.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50">
                                    <h4 className="font-bold text-slate-900 mb-2">Need Help?</h4>
                                    <p className="text-sm text-slate-500 mb-4">Contact IT support for account access issues or software bugs.</p>
                                    <button className="w-full py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:border-slate-300 transition-colors text-sm">
                                        Contact Support
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
