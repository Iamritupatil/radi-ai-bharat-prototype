import React, { useState, useEffect } from 'react';
import {
    Activity,
    Upload,
    FileText,
    User,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    Scan,
    Brain,
    Stethoscope,
    ArrowRight,
    ClipboardCheck,
    Share2,
    Lock,
    Mail,
    Eye,
    EyeOff,
    Github,
    Loader2,
    LogOut,
    Building2
} from 'lucide-react';
import { supabase } from './supabaseClient';
import DarkVeil from './components/DarkVeil';
import LoginPage from './LoginPage';
import ProfileSetupPage from './ProfileSetupPage';
import ProfilePage from './ProfilePage';
import RoleSelectionPage from './RoleSelectionPage';
import DoctorVerificationPage from './DoctorVerificationPage';
import AuthorityVerificationPage from './AuthorityVerificationPage';
import IndividualDashboard from './IndividualDashboard';
import DoctorDashboard from './DoctorDashboard';
import DemoDashboard from './DemoDashboard';
import { Button } from './Button';

// --- Reusable UI Components ---

const BackgroundPattern = () => {
    return (
        <div className="fixed inset-0 -z-10 w-full h-full pointer-events-none">
            <DarkVeil
                hueShift={30}
                noiseIntensity={0}
                scanlineIntensity={0}
                speed={0.8}
                scanlineFrequency={0}
                warpAmount={0}
                resolutionScale={1.25}
            />
        </div>
    );
};



const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-6 ${className}`}>
        {children}
    </div>
);

// Gradient Feature Card Component
const GradientFeatureCard = ({ icon, title, desc, highlight = false }) => {
    return (
        <div className={`relative overflow-hidden rounded-[2rem] p-8 flex flex-col justify-between w-full max-w-sm h-72 border border-[#2a2f4c] shadow-2xl transition-all duration-300 group ${highlight ? 'bg-[#15234b]' : 'bg-[#0f111a]'}`}>

            {/* Ambient Background Glow (Rage Effect) */}
            <div className={`absolute -left-20 top-10 w-64 h-64 rounded-full blur-[80px] opacity-60 pointer-events-none transition-opacity duration-500 ${highlight ? 'bg-blue-600' : 'bg-blue-900/30 group-hover:bg-blue-900/50'}`}></div>

            <div className="relative z-10">
                {/* Icon Container */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${highlight ? 'bg-[#294285] border border-[#3d5ba5]' : 'bg-[#1e2235] border border-[#2a2f4c]'}`}>
                    {React.cloneElement(icon, { size: 28, className: highlight ? 'text-white' : 'text-slate-300' })}
                </div>

                {/* Text Content */}
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{title}</h3>
                <p className="text-[15px] font-medium text-slate-400 leading-relaxed pr-6">
                    {desc}
                </p>
            </div>

            {/* Bottom Section: Active Monitor */}
            <div className="relative z-10 pt-6 mt-4 border-t border-[#2a2f4c]/80 flex items-center gap-2.5">
                <div className="relative flex items-center justify-center">
                    <div className="absolute w-3 h-3 bg-cyan-400/40 rounded-full animate-ping"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 relative z-10 shadow-[0_0_8px_rgba(34,211,238,1)]"></div>
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em]">Active Monitor</span>
            </div>
        </div>
    );
};

const Badge = ({ children, type = 'info' }) => {
    const styles = {
        info: "bg-blue-50 text-blue-700 border-blue-100",
        success: "bg-emerald-50 text-emerald-700 border-emerald-100",
        warning: "bg-amber-50 text-amber-700 border-amber-100",
        danger: "bg-rose-50 text-rose-700 border-rose-100",
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[type]}`}>
            {children}
        </span>
    );
};

// --- Mock X-Ray Component ---
const XRayPlaceholder = ({ highlighted = false }) => (
    <div className="relative w-full h-64 md:h-96 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border-4 border-slate-200">
        <svg viewBox="0 0 200 300" className="w-full h-full opacity-80" fill="none" stroke="white" strokeWidth="2">
            <path d="M70,250 L70,180 Q60,160 50,130 L40,80 Q40,60 60,60 L70,80 L75,130" stroke="rgba(255,255,255,0.7)" />
            <path d="M90,250 L90,180 Q90,160 85,130 L80,70 Q80,50 100,50 L110,70 L105,130" stroke="rgba(255,255,255,0.7)" />
            <path d="M110,250 L110,180 Q115,160 120,130 L125,75 Q125,55 145,55 L155,75 L145,130" stroke="rgba(255,255,255,0.7)" />
            <path d="M130,250 L130,190 Q140,170 150,140 L160,90 Q160,70 180,70 L190,90 L180,140" stroke="rgba(255,255,255,0.7)" />
            <circle cx="100" cy="270" r="15" fill="rgba(255,255,255,0.5)" stroke="none" />
            <circle cx="75" cy="265" r="12" fill="rgba(255,255,255,0.5)" stroke="none" />
            <circle cx="125" cy="265" r="12" fill="rgba(255,255,255,0.5)" stroke="none" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent animate-scan pointer-events-none" />
        {highlighted && (
            <div className="absolute top-[20%] left-[35%] w-16 h-16 border-4 border-rose-500 rounded-lg shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse flex items-center justify-center">
                <div className="bg-rose-500 text-white text-[10px] font-bold px-1 absolute -top-6 left-1/2 -translate-x-1/2 rounded whitespace-nowrap">
                    Fracture Detected (92%)
                </div>
            </div>
        )}
        <div className="absolute bottom-4 right-4 text-xs text-slate-400 font-mono">
            IMG_XR_2024_8892.DICOM
        </div>
    </div>
);

// --- Main App Component ---

export default function RadiAIApp() {
    const [view, setView] = useState('landing');
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [formData, setFormData] = useState({
        patientId: 'P-2024-001',
        name: 'Ravi Kumar',
        age: '45',
        gender: 'Male',
        type: 'Hand (Right)',
        notes: 'Patient complains of pain after fall.'
    });

    // NEW: Backend Integration State
    const [xrayFile, setXrayFile] = useState(null);
    const [xrayPreview, setXrayPreview] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);

    // Fetch user profile from Supabase (role, verification status)
    const fetchUserProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
            return data;
        } catch (err) {
            console.error('Profile fetch error:', err);
            return null;
        }
    };

    // Determine correct view based on profile state
    const resolveView = (profile) => {
        if (!profile || !profile.role) return 'role-select';
        if (profile.role === 'doctor' && !profile.verified) return 'doctor-verify';
        if (profile.role === 'authority' && !profile.verified) return 'authority-verify';
        // Verified or individual â€” go to their dashboard
        if (profile.role === 'individual') return 'individual-dashboard';
        if (profile.role === 'doctor') return 'doctor-dashboard';
        if (profile.role === 'authority') return 'individual-dashboard'; // authorities use same upload UI
        return 'landing';
    };

    useEffect(() => {
        // Build local profile from user + localStorage (no DB calls)
        const buildLocalProfile = (sessionUser) => {
            const savedRole = localStorage.getItem('radiai_role') || sessionUser?.user_metadata?.role;
            if (!savedRole) return null;
            return {
                id: sessionUser.id,
                full_name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'User',
                role: savedRole,
                verified: savedRole === 'individual',
            };
        };

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                const profile = buildLocalProfile(session.user);
                if (profile) {
                    setUserProfile(profile);
                    setView(resolveView(profile));
                } else {
                    setView('role-select');
                }
            }
        }).catch(() => {
            setView('landing');
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                const profile = buildLocalProfile(session.user);
                if (profile) {
                    setUserProfile(profile);
                    if (view === 'login') {
                        setView(resolveView(profile));
                    }
                } else {
                    setView('role-select');
                }
            } else if (_event === 'SIGNED_OUT') {
                setUserProfile(null);
                localStorage.removeItem('radiai_role');
                setView('landing');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUserProfile(null);
        setView('landing');
    };

    const navigate = (newView) => {
        window.scrollTo(0, 0);
        setView(newView);
    };

    // Role-based callbacks
    const handleRoleSelected = (role) => {
        // Build profile locally — don't wait for DB
        const localProfile = {
            id: user?.id,
            full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
            role: role,
            verified: role === 'individual',
        };
        setUserProfile(localProfile);
        localStorage.setItem('radiai_role', role);

        if (role === 'individual') {
            navigate('individual-dashboard');
        } else if (role === 'doctor') {
            navigate('doctor-verify');
        } else if (role === 'authority') {
            navigate('authority-verify');
        }
    };

    const handleVerified = () => {
        const role = userProfile?.role || localStorage.getItem('radiai_role');
        const verifiedProfile = { ...userProfile, verified: true };
        setUserProfile(verifiedProfile);
        navigate(resolveView(verifiedProfile));
    };

    const simulateProcessing = (nextView) => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            navigate(nextView);
        }, 2500);
    };

    // NEW: Backend Analysis Function
    const analyzeXrayBackend = async () => {
        if (!xrayFile) {
            alert("Please upload an X-ray image first.");
            return;
        }

        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("file", xrayFile);

            const url = "https://spot-themselves-reflects-attributes.trycloudflare.com/analyze"; // Secure Deployed AWS Backend
            console.log("ðŸš€ Sending request to:", url);

            const response = await fetch(url, {
                method: "POST",
                body: formData,
            }
            );

            // â— DO NOT read response.text()
            // â— DO NOT manually throw here

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Server returned ${response.status}: ${errText}`);
            }

            const result = await response.json();

            console.log("Backend response:", result);

            // Safety validation
            if (!result || !result.cam_image) {
                throw new Error("Invalid backend response: Missing cam_image");
            }

            setAnalysisResult(result);
            setXrayPreview(null);
            navigate("analysis");

        } catch (error) {
            console.error("Analyze error:", error);
            alert(`Backend analysis failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };



    const LandingPage = () => (
        <div className="animate-in fade-in duration-500">
            <div className="text-center max-w-2xl mx-auto pt-8 pb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/10 border border-blue-400/20 text-blue-400 text-xs font-medium mb-6 backdrop-blur-sm">
                    <Brain size={14} />
                    <span>AI Model v2.4 Active</span>
                </div>
                <h1 className="text-5xl md:text-[64px] font-[900] text-white tracking-[-0.03em] leading-[1.05] mb-6">
                    AI-assisted X-ray diagnosis
                </h1>
                <p className="text-[17px] md:text-[19px] text-[#a1a1aa] font-medium tracking-normal mb-10 leading-[1.6] max-w-2xl mx-auto">
                    RadiAI Bharat is an AI-powered radiology assistant that helps hospitals process X-ray scans faster by highlighting possible fracture and abnormality regions for doctors to review.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={() => user ? navigate('upload') : navigate('login')} className="flex items-center justify-center gap-2 text-lg px-8 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full backdrop-blur-md transition-all shadow-lg">
                        {user ? 'Upload X-Ray' : 'Sign In To Upload'}
                        <ArrowRight size={20} />
                    </button>
                    <button onClick={() => navigate('demo-dashboard')} className="flex items-center justify-center gap-2 text-lg px-8 py-3 bg-blue-600/80 hover:bg-blue-600 text-white border border-blue-500/50 rounded-full backdrop-blur-md transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                        Try Demo Dashboard
                        <Scan size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4 mt-8 place-items-center md:place-items-stretch">
                <GradientFeatureCard
                    icon={<Scan size={24} />}
                    title="Instant Analysis"
                    desc="Get results in seconds with 99% uptime."
                />
                <GradientFeatureCard
                    icon={<Brain size={24} />}
                    title="Deep Learning"
                    desc="Trained on 1M+ validated medical datasets."
                />
                <GradientFeatureCard
                    icon={<ClipboardCheck size={24} />}
                    title="Doctor Verified"
                    desc="Human-in-the-loop verification workflow."
                />
            </div>
        </div>
    );

    const UploadPage = () => (
        <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pt-8">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-white">Upload Patient X-Ray</h2>
                <p className="text-slate-400 mt-2">Enter patient details and attach the DICOM or JPG file.</p>
            </div>

            <div className="bg-[#18181b] rounded-2xl border border-[#2a2a2a] shadow-xl p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Patient ID (Auto-Generated)</label>
                        <div className="w-full px-3 py-2.5 border border-[#3f3f46] bg-[#0f111a] rounded-xl text-slate-500 font-mono text-sm h-[44px] flex items-center cursor-not-allowed">
                            {formData.patientId}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Full Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#0f111a] text-white rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-600"
                            placeholder="e.g. Ravi Kumar"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Age</label>
                        <input
                            type="number"
                            value={formData.age}
                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                            className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#0f111a] text-white rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
                            placeholder="e.g. 45"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Gender</label>
                        <select
                            className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#0f111a] text-white rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-300">X-Ray Type</label>
                        <select
                            className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#0f111a] text-white rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option>Chest (PA View)</option>
                            <option>Hand (Right)</option>
                            <option>Leg (Tibia/Fibula)</option>
                            <option>Skull (Lateral)</option>
                        </select>
                    </div>
                </div>

                <label className="block border-2 border-dashed border-[#3f3f46] rounded-2xl p-10 mb-8 text-center bg-[#0f111a]/50 hover:bg-[#1e2235]/50 hover:border-blue-500/50 transition-all cursor-pointer group">
                    <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.dcm"
                        hidden
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;

                            setXrayFile(file);

                            // Only create preview for images (not DICOM)
                            if (file.type.startsWith("image/")) {
                                setXrayPreview(URL.createObjectURL(file));
                            } else {
                                setXrayPreview(null);
                            }
                        }}
                    />


                    <div className="w-16 h-16 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.15)]">
                        <Upload size={24} />
                    </div>
                    {!xrayFile && (
                        <>
                            <p className="text-white font-semibold text-lg">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-sm text-slate-400 mt-2">
                                PNG, JPG or DICOM (Max 10MB)
                            </p>
                        </>
                    )}

                    {xrayFile && (
                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-emerald-600">
                                âœ” Uploaded: {xrayFile.name}
                            </p>

                            {xrayPreview && (
                                <img
                                    src={xrayPreview}
                                    alt="X-ray preview"
                                    className="mx-auto max-h-48 rounded-lg border border-slate-200 shadow-sm"
                                />
                            )}

                            {!xrayPreview && (
                                <p className="text-xs text-slate-500">
                                    DICOM file uploaded (preview not available)
                                </p>
                            )}
                        </div>
                    )}

                </label>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#2a2a2a]">
                    <Button variant="secondary" onClick={() => navigate('landing')} className="bg-[#2a2a2a] text-white hover:bg-[#3f3f46] border-none">Cancel</Button>
                    <button
                        onClick={analyzeXrayBackend}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_20px_rgba(37,99,235,0.6)] transition-all"
                    >
                        Analyze with AI
                        <Brain size={18} />
                    </button>
                </div>
            </div>
        </div>
    );

    const AnalysisPage = () => {
        if (!analysisResult) {
            return (
                <div className="text-center text-slate-500">
                    No analysis data available.
                </div>
            );
        }

        return (
            <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Brain className="text-blue-600" />
                        AI Analysis Result
                    </h2>
                    <Badge type="info">Confidence Score: 92%</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="bg-black rounded-xl overflow-hidden shadow-lg">
                            {analysisResult ? (
                                <img
                                    src={`data:image/png;base64,${analysisResult.cam_image}`}
                                    className="w-full rounded-xl border border-slate-200"
                                />
                            ) : (
                                <XRayPlaceholder highlighted={true} />
                            )}
                        </div>
                        <div className="text-xs text-center text-slate-500">
                            AI Overlay Layer: <span className="text-rose-500 font-semibold">Active</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Card className="h-full flex flex-col">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Diagnostic Findings</h3>
                            <div className="space-y-4 flex-1">
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg flex gap-3 items-start">
                                    <AlertCircle className="text-rose-600 shrink-0 mt-1" size={20} />
                                    <div>
                                        <h4 className="font-semibold text-rose-800">Abnormality Detected</h4>
                                        <p className="text-rose-700 text-sm mt-1">
                                            Possible fracture detected in right metacarpal region (3rd metacarpal shaft).
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>Fracture Probability</span>
                                        <span className="font-medium text-slate-900">92%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-500 w-[92%] rounded-full" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>Image Quality</span>
                                        <span className="font-medium text-slate-900">High</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[98%] rounded-full" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <p className="text-xs text-slate-500 mb-4">
                                    *AI results are preliminary. Final diagnosis must be confirmed by a certified radiologist.
                                </p>
                                <Button className="w-full" onClick={() => navigate('dashboard')}>
                                    Send to Radiologist Review
                                    <ChevronRight size={18} />
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    };

    const DashboardPage = () => (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Radiologist Review Panel</h2>
                    <p className="text-slate-500">Dr. Anjali Desai â€¢ Senior Radiologist â€¢ ID: RAD-882</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Share2 size={16} /> Share
                    </Button>
                    <Button variant="secondary">Previous Case</Button>
                    <Button variant="secondary">Next Case</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
                                {formData.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{formData.name}</h3>
                                <p className="text-sm text-slate-500">ID: {formData.patientId}</p>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500">Age/Gender</span>
                                <span className="font-medium">{formData.age} / {formData.gender}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500">Scan Type</span>
                                <span className="font-medium">{formData.type}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500">Date</span>
                                <span className="font-medium">Jan 15, 2026</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h4 className="text-xs font-uppercase font-bold text-slate-400 mb-2">AI PRE-SCREENING</h4>
                            <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
                                <div className="flex items-center gap-2 text-rose-700 font-semibold mb-1">
                                    <AlertCircle size={16} />
                                    Positive Finding
                                </div>
                                <p className="text-xs text-rose-600">High confidence (92%) for fracture.</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Card className="overflow-hidden p-0 bg-black border-slate-800">
                        <div className="p-4 bg-slate-800 flex justify-between items-center text-white/80">
                            <span className="text-sm font-mono">VIEWER_MODE: ENHANCED</span>
                            <div className="flex gap-2">
                                <button className="hover:text-white"><Scan size={18} /></button>
                            </div>
                        </div>
                        <div className="p-4 flex justify-center bg-black min-h-[400px]">
                            <div className="w-full max-w-md">
                                <XRayPlaceholder highlighted={true} />
                            </div>
                        </div>
                    </Card>

                    <div className="flex flex-wrap gap-4">
                        <Button
                            variant="success"
                            className="flex-1"
                            onClick={() => simulateProcessing('report')}
                        >
                            <CheckCircle size={18} />
                            Confirm AI Result & Generate Report
                        </Button>
                        <Button variant="secondary" className="flex-1">
                            Edit Diagnosis
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    const ReportPage = () => (
        <div className="max-w-[800px] mx-auto animate-in slide-in-from-bottom-8 duration-500 pb-20 mt-8 print:mt-0 print:pb-0 print-area">
            <div className="bg-white shadow-2xl rounded-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none font-serif text-black">

                {/* Classic Report Body - A4 style */}
                <div className="p-10 md:p-14 min-h-[1000px] relative">

                    <h1 className="text-center text-xl font-bold uppercase underline tracking-widest mb-10">
                        X-Rays Reporting Formate
                    </h1>

                    {/* Patient Header Grid */}
                    <div className="grid grid-cols-2 gap-y-4 gap-x-12 mb-10 text-[15px] font-semibold tracking-wide">
                        <div className="flex">
                            <span className="w-40 italic flex justify-between pr-2">PATIENT NAME<span>:</span></span>
                            <span className="uppercase" contentEditable="plaintext-only" suppressContentEditableWarning>{formData.name}</span>
                        </div>
                        <div className="flex">
                            <span className="w-32 italic flex justify-between pr-2">AGE / SEX<span>:</span></span>
                            <span className="uppercase" contentEditable="plaintext-only" suppressContentEditableWarning>{formData.age} / {formData.gender.toUpperCase()}</span>
                        </div>
                        <div className="flex">
                            <span className="w-40 italic flex justify-between pr-2">REF. BY DR<span>:</span></span>
                            <span className="uppercase" contentEditable="plaintext-only" suppressContentEditableWarning>Dr. S. Gupta</span>
                        </div>
                        <div className="flex">
                            <span className="w-32 italic flex justify-between pr-2">DATE<span>:</span></span>
                            <span className="uppercase" contentEditable="plaintext-only" suppressContentEditableWarning>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
                        </div>
                        <div className="flex">
                            <span className="w-40 italic flex justify-between pr-2">X-RAY NO<span>:</span></span>
                            <span className="uppercase" contentEditable="plaintext-only" suppressContentEditableWarning>{formData.patientId.toUpperCase()}</span>
                        </div>
                    </div>

                    <h2 className="text-center text-lg font-bold uppercase italic underline tracking-wider mb-8" contentEditable="plaintext-only" suppressContentEditableWarning>
                        X-RAY {formData.type.toUpperCase()} VIEW
                    </h2>

                    {/* Editable Sections */}
                    <div className="space-y-6 text-[15px] leading-relaxed">

                        <div>
                            <p className="font-bold mb-1 italic">Clinical Information:</p>
                            <div className="outline-none focus:bg-blue-50/50 p-1 -ml-1 rounded transition-colors" contentEditable="plaintext-only" suppressContentEditableWarning>
                                {formData.notes || "Trauma, evaluate for fracture."}
                            </div>
                        </div>

                        <div>
                            <p className="font-bold mb-1 italic">Technique:</p>
                            <div className="outline-none focus:bg-blue-50/50 p-1 -ml-1 rounded transition-colors" contentEditable="plaintext-only" suppressContentEditableWarning>
                                Initial radiographic evaluation obtained in AP and lateral projections.
                            </div>
                        </div>

                        <div>
                            <p className="font-bold mb-1 italic">Comparison:</p>
                            <div className="outline-none focus:bg-blue-50/50 p-1 -ml-1 rounded transition-colors" contentEditable="plaintext-only" suppressContentEditableWarning>
                                ___________
                            </div>
                        </div>

                        <div>
                            <p className="font-bold mb-1 italic underline">Findings:</p>
                            <div className="outline-none focus:bg-blue-50/50 p-1 -ml-1 rounded transition-colors" contentEditable="plaintext-only" suppressContentEditableWarning>
                                The visualized osseous structures, joint spaces, and soft tissues have been examined.
                                <br /><br />
                                There is a visible fracture line through the mid-shaft of the 3rd metacarpal.
                                <br /><br />
                                The adjacent joint spaces are preserved. No gross dislocation is identified. The visualized soft tissues appear unremarkable. No foreign body is seen.
                                <br /><br />
                                RadiAI v2.4 Note: Neural network confirms fracture morphology with 92% confidence.
                            </div>
                        </div>

                        <div className="flex gap-2 font-bold">
                            <span className="italic">Conclusion:</span>
                            <span className="outline-none focus:bg-blue-50/50 flex-1 transition-colors" contentEditable="plaintext-only" suppressContentEditableWarning>
                                Acute non-displaced fracture of the right 3rd metacarpal shaft.
                            </span>
                        </div>

                        <div className="flex gap-2 font-bold">
                            <span className="italic">Adv:</span>
                            <span className="outline-none focus:bg-blue-50/50 flex-1 transition-colors" contentEditable="plaintext-only" suppressContentEditableWarning>
                                Orthopedic consultation suggested.
                            </span>
                        </div>

                    </div>

                    {/* Footer Signature */}
                    <div className="absolute bottom-14 left-14 font-bold italic uppercase tracking-wider">
                        THANKS FOR THE REFERAL,
                    </div>
                </div>

                {/* Action Bar (Hidden when printing) */}
                <div className="bg-slate-100 p-4 border-t border-slate-300 flex justify-between items-center print:hidden font-sans">
                    <Button variant="secondary" size="sm" onClick={() => navigate('dashboard')}>
                        Back to Dashboard
                    </Button>
                    <div className="flex gap-2 items-center">
                        <span className="text-xs text-slate-500 mr-4 italic uppercase tracking-widest">Ã¢Å“Â Click any text above to edit</span>
                        <Button variant="secondary" onClick={() => window.print()} className="bg-white text-slate-900 border-slate-300 shadow-sm hover:bg-slate-50">
                            Print Report
                        </Button>
                        <Button onClick={() => {
                            setFormData({
                                patientId: '', name: '', age: '', gender: '', type: 'Chest', notes: ''
                            });
                            navigate('landing');
                        }}>
                            New Scan
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    // ============ DEMO DASHBOARD (no auth required) ============
    // DemoDashboard is now in ./DemoDashboard.jsx
    const _unusedDemoPlaceholder = null;
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
                <BackgroundPattern />
                <div className="relative w-24 h-24 mb-8 z-10">
                    <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    <Brain className="absolute inset-0 m-auto text-blue-600 animate-pulse" size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 animate-pulse z-10">Analysing X-Ray Image...</h2>
                <p className="text-slate-500 mt-2 z-10">Running Neural Network Models (DenseNet-121)</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full text-slate-900 selection:bg-blue-100 selection:text-blue-900 flex flex-col">
            <BackgroundPattern />

            {/* Navbar */}
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-800 rounded-full border border-slate-700 pl-6 pr-1.5 h-[52px] flex items-center justify-between w-[95%] max-w-3xl shadow-[0_8px_30px_rgb(0,0,0,0.8)]">
                <div
                    className="cursor-pointer flex items-center gap-2"
                    onClick={() => navigate('landing')}
                >
                    {/* Logo Image in Navbar */}
                    <img
                        src="/logo.png"
                        alt="RadiAI Logo"
                        className="h-8 w-auto object-contain rounded-lg"
                    />
                    <div className="flex items-center gap-2 text-lg font-bold text-white">
                        <span>RadiAI <span className="text-blue-600">Bharat</span></span>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
                    <span className={`cursor-pointer hover:text-white transition-colors ${view === 'landing' ? 'text-white' : ''}`} onClick={() => navigate('landing')}>Home</span>
                    {userProfile?.role === 'doctor' && userProfile?.verified && (
                        <span className={`cursor-pointer hover:text-white transition-colors ${view === 'doctor-dashboard' ? 'text-white' : ''}`} onClick={() => navigate('doctor-dashboard')}>Doctor Dashboard</span>
                    )}
                    {(userProfile?.role === 'individual' || userProfile?.role === 'authority') && userProfile?.verified && (
                        <span className={`cursor-pointer hover:text-white transition-colors ${view === 'individual-dashboard' ? 'text-white' : ''}`} onClick={() => navigate('individual-dashboard')}>My Dashboard</span>
                    )}
                    <span className={`cursor-pointer hover:text-white transition-colors ${view === 'upload' ? 'text-white' : ''}`} onClick={() => navigate('upload')}>Upload</span>
                </div>

                {user ? (
                    <div
                        className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors group relative"
                        title="Profile"
                    >
                        <div className="hidden sm:flex flex-col items-end text-xs mr-2">
                            <span className="font-bold text-slate-900">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</span>
                            <span className="text-slate-500">{userProfile?.role ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1) : (user?.user_metadata?.role ? user.user_metadata.role.charAt(0).toUpperCase() + user.user_metadata.role.slice(1) : '')}</span>
                        </div>
                        <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors overflow-hidden">
                            {user?.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={18} />
                            )}
                        </div>

                        {/* Hover Dropdown for Logout */}
                        <div className="absolute top-full right-0 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-2 transform origin-top-right">
                                <button
                                    onClick={() => navigate('profile')}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors mb-1"
                                >
                                    <User size={16} />
                                    My Profile
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                    <LogOut size={16} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <span className="cursor-pointer hover:text-white transition-colors text-sm font-medium text-slate-400" onClick={() => navigate('login')}>
                            Sign In
                        </span>
                        <button onClick={() => navigate('login')} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all">
                            Dashboard
                        </button>
                    </div>
                )}
            </nav>

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-8 relative">
                {view === 'login' && <LoginPage setView={setView} />}
                {view === 'profile-setup' && <ProfileSetupPage setView={setView} />}
                {view === 'role-select' && <RoleSelectionPage setView={setView} onRoleSelected={handleRoleSelected} />}
                {view === 'doctor-verify' && <DoctorVerificationPage setView={setView} onVerified={handleVerified} />}
                {view === 'authority-verify' && <AuthorityVerificationPage setView={setView} onVerified={handleVerified} />}
                {view === 'individual-dashboard' && <IndividualDashboard userProfile={userProfile} />}
                {view === 'doctor-dashboard' && <DoctorDashboard userProfile={userProfile} />}
                {view === 'landing' && <LandingPage />}
                {view === 'upload' && <UploadPage />}
                {view === 'analysis' && <AnalysisPage />}
                {view === 'dashboard' && <DashboardPage />}
                {view === 'report' && <ReportPage />}
                {view === 'demo-dashboard' && <DemoDashboard navigate={navigate} />}
                {view === 'profile' && <ProfilePage user={user} setView={setView} />}
            </main>

            <footer className="bg-[#111111] border-t border-slate-800 py-6 text-center text-slate-500 text-sm">
                <p>Â© 2026 RadiAI Bharat. A frontend demo application.</p>
                <p className="mt-1 text-xs text-slate-600">HIPAA & GDPR Compliant Architecture</p>
            </footer>

            <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          height: 20%;
          animation: scan 2s linear infinite;
          background: linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.5), transparent);
          border-bottom: 2px solid rgba(59, 130, 246, 0.8);
        }
        .font-script {
          font-family: 'Brush Script MT', cursive;
        }

        /* Realism Button Styles */
        @keyframes border-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .realism-button {
          cursor: pointer;
          font-size: 1rem;
          border-radius: 16px;
          border: none;
          padding: 2px;
          background: #181b1b; /* Fallback */
          position: relative;
          transition: transform 0.2s;
          overflow: hidden; /* Essential for containing the rotating border */
          z-index: 1;
        }
        
        /* Rotating Glow Border */
        .realism-button::before {
          content: "";
          position: absolute;
          width: 200%;
          height: 200%;
          top: -50%;
          left: -50%;
          background: conic-gradient(
            from 90deg at 50% 50%,
            #000000 0%,
            #000000 40%,
            #3fe9ff 50%,
            #000000 60%,
            #000000 100%
          );
          animation: border-rotate 4s linear infinite;
          z-index: -2;
        }

        .realism-button:active {
          transform: scale(0.95);
        }
        
        /* Top right highlight */
        .realism-button::after {
          content: "";
          position: absolute;
          width: 65%;
          height: 60%;
          border-radius: 120px;
          top: 0;
          right: 0;
          box-shadow: 0 0 20px #ffffff38;
          z-index: -1;
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
          z-index: -1;
        }
        
        .realism-button .inner {
          padding: 12px 20px;
          border-radius: 14px;
          color: #fff;
          z-index: 10;
          position: relative;
          background: radial-gradient(circle 80px at 80% -50%, #777777, #0f1111);
          height: 100%;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
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
          z-index: -1;
        }

        /* NEW: Gradient Feature Card Styles - Updated to Blue Theme */
        .gradient-card {
          --white: hsl(0, 0%, 100%);
          --black: hsl(240, 15%, 9%);
          --paragraph: hsl(210, 20%, 83%);
          --line: hsl(210, 15%, 25%);
          --primary: hsl(210, 92%, 58%); /* Blue */

          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1.5rem;
          width: 100%;
          max-width: 19rem;
          
          /* Main Background - Adjusted to Blue/Cyan Hues */
          background-color: hsla(220, 20%, 10%, 1);
          background-image: radial-gradient(
              at 88% 40%,
              hsla(220, 20%, 10%, 1) 0px,
              transparent 85%
            ),
            radial-gradient(at 49% 30%, hsla(220, 20%, 10%, 1) 0px, transparent 85%),
            radial-gradient(at 14% 26%, hsla(220, 20%, 10%, 1) 0px, transparent 85%),
            radial-gradient(at 0% 64%, hsla(210, 93%, 56%, 1) 0px, transparent 85%), /* Blue */
            radial-gradient(at 41% 94%, hsla(190, 100%, 84%, 1) 0px, transparent 85%), /* Cyan */
            radial-gradient(at 100% 99%, hsla(230, 100%, 57%, 1) 0px, transparent 85%); /* Deep Blue */

          border-radius: 1rem;
          box-shadow: 0px -16px 24px 0px rgba(255, 255, 255, 0.1) inset;
          /* Removed Hover Transform */
        }
        
        /* Removed .gradient-card:hover selector */

        /* Animated Border - Updated to Blue/Cyan */
        .gradient-card .card__border {
          overflow: hidden;
          pointer-events: none;
          position: absolute;
          z-index: -10;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 1rem;
        }

        .gradient-card .card__border::before {
          content: "";
          position: absolute;
          z-index: 200;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 200%;
          height: 200%;
          background-image: linear-gradient(
            0deg,
            hsla(0, 0%, 100%, 0) 0%,
            hsl(210, 95%, 60%) 40%, /* Blue */
            hsl(210, 95%, 60%) 60%, /* Blue */
            hsla(0, 0%, 40%, 0) 100%
          );
          animation: rotate 8s linear infinite;
        }

        .gradient-card .card_title__container {
           display: flex;
           flex-direction: column;
        }

        .gradient-card .card_title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--white);
        }

        .gradient-card .card_paragraph {
          margin-top: 0.5rem;
          font-size: 0.9rem;
          color: var(--paragraph);
          line-height: 1.5;
        }

        .gradient-card .line {
          width: 100%;
          height: 0.1rem;
          background-color: var(--line);
          border: none;
        }
        
        @keyframes rotate {
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
      `}</style>
        </div>
    );
}
