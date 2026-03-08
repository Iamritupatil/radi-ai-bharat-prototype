import React, { useState, useEffect, useRef } from 'react';
import {
    User, Building2, Stethoscope, Upload, Eye, Scan, Brain,
    CheckCircle, Loader2, ChevronRight, Share2
} from 'lucide-react';
import { Button } from './Button';

const DEMO_KEY = 'demo_submissions';

// Seed data if nothing in localStorage
const SEED_DATA = [
    { id: 's1', patient_name: 'Ravi Kumar', xray_type: 'Hand/Wrist', status: 'pending', created_at: '2026-02-24T10:30:00Z', xray_url: '', notes: 'Pain after fall', source: 'individual' },
    { id: 's2', patient_name: 'Ananya Sharma', xray_type: 'Chest', status: 'pending', created_at: '2026-02-25T09:15:00Z', xray_url: '', notes: 'Persistent cough', source: 'authority' },
];

const STATUS_MAP = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Pending' },
    in_review: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'In Review' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Completed' },
};

const PROFILES = {
    individual: { name: 'Demo Patient', email: 'patient@demo.com', role: 'Individual', desc: 'Upload your X-rays for AI-assisted diagnosis', avatar: '👤' },
    authority: { name: 'City General Hospital', email: 'admin@cityhospital.in', role: 'Authority / Organization', desc: 'Manage patient X-ray submissions and track reports', avatar: '🏥' },
    doctor: { name: 'Dr. Anjali Desai', email: 'dr.desai@cityhospital.in', role: 'Doctor • MD (Radiology)', desc: 'Review X-rays, run AI analysis, and send reports to patients', avatar: '🩺' },
};

const DemoDashboard = ({ navigate }) => {
    const [demoRole, setDemoRole] = useState('individual');
    const [submissions, setSubmissions] = useState([]);
    const [demoAnalyzing, setDemoAnalyzing] = useState(null);
    const [demoResult, setDemoResult] = useState(null);
    const [showUpload, setShowUpload] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    // Upload form state
    const [patientName, setPatientName] = useState('');
    const [patientAge, setPatientAge] = useState('');
    const [patientGender, setPatientGender] = useState('Male');
    const [xrayType, setXrayType] = useState('');
    const [notes, setNotes] = useState('');
    const [xrayPreview, setXrayPreview] = useState(null);
    const fileRef = useRef(null);

    // Load submissions from localStorage (or seed data)
    const loadSubmissions = () => {
        try {
            const saved = JSON.parse(localStorage.getItem(DEMO_KEY));
            if (saved && saved.length > 0) {
                setSubmissions(saved);
            } else {
                localStorage.setItem(DEMO_KEY, JSON.stringify(SEED_DATA));
                setSubmissions(SEED_DATA);
            }
        } catch {
            localStorage.setItem(DEMO_KEY, JSON.stringify(SEED_DATA));
            setSubmissions(SEED_DATA);
        }
    };

    useEffect(() => { loadSubmissions(); }, []);

    // Reload when switching tabs (so doctor sees latest uploads)
    useEffect(() => { loadSubmissions(); }, [demoRole]);

    // Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setXrayPreview(reader.result);
        reader.readAsDataURL(file);
    };

    // Upload X-ray (saves to localStorage)
    const handleUpload = (e) => {
        e.preventDefault();
        if (!patientName.trim()) {
            alert('Please enter patient name.');
            return;
        }

        const newSub = {
            id: 'u' + Date.now(),
            patient_id: `P-${Math.floor(1000 + Math.random() * 9000)}`,
            patient_name: patientName,
            patient_age: patientAge || '30',
            patient_gender: patientGender,
            xray_type: xrayType || 'General',
            status: 'pending',
            created_at: new Date().toISOString(),
            xray_url: xrayPreview || '',
            notes: notes || '',
            source: demoRole === 'authority' ? 'authority' : 'individual',
        };

        const updated = [newSub, ...submissions];
        localStorage.setItem(DEMO_KEY, JSON.stringify(updated));
        setSubmissions(updated);

        // Reset
        setShowUpload(false);
        setPatientName('');
        setXrayType('');
        setNotes('');
        setXrayPreview(null);
    };

    // Real AI analysis using the FastAPI backend
    const handleAnalyze = async (sub) => {
        setDemoAnalyzing(sub.id);
        setDemoResult(null);

        // Mark as in_review
        const updated = submissions.map(s => s.id === sub.id ? { ...s, status: 'in_review' } : s);
        localStorage.setItem(DEMO_KEY, JSON.stringify(updated));
        setSubmissions(updated);

        try {
            if (!sub.xray_url) {
                throw new Error("No X-ray image uploaded for this patient. Please upload an image first.");
            }

            // Convert base64 data url from localStorage to a File object manually
            // (Using fetch() on data URLs gets blocked by some browsers)
            const [header, base64Data] = sub.xray_url.split(',');
            const mimeMatch = header.match(/:([^;]+);/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

            const byteCharacters = atob(base64Data);
            const byteArrays = [];
            for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                const slice = byteCharacters.slice(offset, offset + 512);
                const byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }
            const blob = new Blob(byteArrays, { type: mimeType });
            const file = new File([blob], 'xray_demo.png', { type: mimeType });

            const formData = new FormData();
            formData.append('file', file);

            const analysisResponse = await fetch('https://preference-managed-rug-pct.trycloudflare.com/analyze', {
                method: 'POST',
                body: formData,
            });

            if (!analysisResponse.ok) {
                const errText = await analysisResponse.text();
                throw new Error(`AI analysis failed: ${errText}`);
            }

            const result = await analysisResponse.json();

            setDemoResult({
                id: sub.id,
                patient: sub.patient_name,
                xray_type: sub.xray_type,
                prediction: result.prediction, // "Fracture" or "Normal"
                confidence: result.confidence / 100, // Demo rendering expects a decimal 0..1
                cam_image: result.cam_image,
                findings: result.prediction === 'Fracture'
                    ? `AI analysis detected a potential fracture with ${result.confidence}% confidence. A red bounding box highlights the detected localized region.`
                    : `AI analysis indicates normal findings with ${result.confidence}% confidence. No obvious fracture was detected.`,
            });
        } catch (err) {
            console.error('Analysis error:', err);
            alert(`Analysis failed: ${err.message}`);
        } finally {
            setDemoAnalyzing(null);
        }
    };

    // Doctor sends report → marks as completed
    const sendReport = (subId) => {
        const updated = submissions.map(s => s.id === subId ? {
            ...s,
            status: 'completed',
            report: {
                prediction: demoResult.prediction,
                confidence: demoResult.confidence * 100,
                findings: demoResult.findings,
                cam_image: demoResult.cam_image
            }
        } : s);
        localStorage.setItem(DEMO_KEY, JSON.stringify(updated));
        setSubmissions(updated);
        setDemoResult(null);
    };

    const profile = PROFILES[demoRole];
    const mySubmissions = demoRole === 'individual'
        ? submissions.filter(s => s.source === 'individual')
        : demoRole === 'authority'
            ? submissions.filter(s => s.source === 'authority')
            : submissions;

    return (
        <div className="max-w-5xl mx-auto pt-[80px] px-6 pb-6 space-y-6">
            {/* Demo Banner */}
            <div className="bg-[#18181b] border border-[#2a2a2a] rounded-2xl p-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center border border-[#3f3f46]">
                        <Eye size={16} className="text-violet-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">Demo Mode — Fully Interactive</p>
                        <p className="text-xs text-slate-400">Upload as patient → switch to Doctor tab → see it appear instantly. No sign-in needed.</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate && navigate('login')}
                    className="px-4 py-2 text-sm text-white bg-[#2a2a2a] border border-[#3f3f46] rounded-xl font-medium hover:bg-[#3f3f46] hover:text-white transition-all shadow-sm"
                >
                    Exit Demo
                </button>
            </div>

            {/* Role Toggle */}
            <div className="flex gap-1 bg-[#18181b] rounded-xl p-1 border border-[#2a2a2a]">
                {[
                    { id: 'individual', label: 'Patient', icon: <User size={15} /> },
                    { id: 'authority', label: 'Hospital', icon: <Building2 size={15} /> },
                    { id: 'doctor', label: 'Doctor', icon: <Stethoscope size={15} /> },
                ].map(r => (
                    <button
                        key={r.id}
                        onClick={() => { setDemoRole(r.id); setDemoResult(null); setDemoAnalyzing(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${demoRole === r.id ? 'bg-white/10 shadow-sm text-white border border-white/10' : 'text-slate-400 hover:text-white'}`}
                    >
                        {r.icon}
                        {r.label}
                    </button>
                ))}
            </div>

            {/* Profile Card */}
            <div className="bg-[#18181b] rounded-2xl border border-[#2a2a2a] p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/5 flex items-center justify-center text-3xl">
                    {profile.avatar}
                </div>
                <div className="flex-1">
                    <h2 className="text-lg font-bold text-white">{profile.name}</h2>
                    <p className="text-sm text-slate-300">{profile.role} &bull; {profile.email}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{profile.desc}</p>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    <CheckCircle size={12} /> Verified
                </span>
            </div>

            {/* ====== PATIENT / AUTHORITY UPLOAD VIEW ====== */}
            {(demoRole === 'individual' || demoRole === 'authority') && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white">
                                {demoRole === 'individual' ? 'My X-Rays' : 'Organization Dashboard'}
                            </h1>
                            <p className="text-slate-400 mt-1">
                                {demoRole === 'individual' ? 'Upload X-rays and track results' : 'Submit patient X-rays for review'}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowUpload(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_20px_rgba(37,99,235,0.6)] transition-all"
                        >
                            <Upload size={16} />
                            Upload X-Ray
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-[#18181b] rounded-2xl p-4 border border-[#2a2a2a]">
                            <p className="text-3xl font-bold text-white">{mySubmissions.length}</p>
                            <p className="text-sm text-slate-400">Total</p>
                        </div>
                        <div className="bg-[#18181b] rounded-2xl p-4 border border-[#2a2a2a]">
                            <p className="text-3xl font-bold text-white">{mySubmissions.filter(s => s.status === 'pending' || s.status === 'in_review').length}</p>
                            <p className="text-sm text-slate-400">Pending</p>
                        </div>
                        <div className="bg-[#18181b] rounded-2xl p-4 border border-[#2a2a2a]">
                            <p className="text-3xl font-bold text-white">{mySubmissions.filter(s => s.status === 'completed').length}</p>
                            <p className="text-sm text-slate-400">Completed</p>
                        </div>
                    </div>

                    {/* Submissions List */}
                    {mySubmissions.length === 0 ? (
                        <div className="text-center py-16 bg-[#18181b] rounded-2xl border border-[#2a2a2a]">
                            <Upload size={40} className="mx-auto text-white/30 mb-3" />
                            <p className="text-white font-medium">No submissions yet</p>
                            <p className="text-sm text-slate-400 mt-1">Click "Upload X-Ray" to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {mySubmissions.map(sub => {
                                const st = STATUS_MAP[sub.status] || STATUS_MAP.pending;
                                return (
                                    <div
                                        key={sub.id}
                                        className="w-full bg-neutral-900/95 border-neutral-800 border rounded-3xl p-5 shadow-2xl backdrop-blur space-y-4 hover:bg-neutral-800/80 cursor-pointer transition-all duration-300 group"
                                        onClick={() => {
                                            if (sub.status === 'completed' && sub.report) {
                                                setSelectedReport(sub);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-4 border-b border-neutral-800/70 pb-4">
                                            {sub.xray_url ? (
                                                <img
                                                    className="h-16 w-16 rounded-full object-cover border border-neutral-800 group-hover:border-blue-500/30 transition-colors"
                                                    src={sub.xray_url}
                                                    alt="X-ray"
                                                />
                                            ) : (
                                                <div className="h-16 w-16 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                                                    <Scan size={24} className="text-neutral-500" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-sm font-semibold tracking-tight text-neutral-50 font-sans">
                                                            {sub.patient_name}
                                                        </p>
                                                        <p className="text-xs text-neutral-400 font-sans mt-0.5">
                                                            {sub.xray_type} Scan
                                                        </p>
                                                    </div>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${sub.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : sub.status === 'in_review' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                                        {st.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-xs text-neutral-400 font-sans italic line-clamp-2">
                                            {sub.notes || "No clinical notes provided with this scan."}
                                        </p>

                                        <div className="flex items-center justify-between text-center text-xs text-neutral-300 border-y border-neutral-800/70 py-3">
                                            <div className="flex-1">
                                                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-sans">Date</p>
                                                <p className="mt-1 text-neutral-50 font-medium font-sans">
                                                    {new Date(sub.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </p>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-sans">Type</p>
                                                <p className="mt-1 text-neutral-50 font-medium font-sans">{sub.source === 'individual' ? 'Direct' : 'Hospital'}</p>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-sans">Status</p>
                                                <p className={`mt-1 font-medium font-sans ${sub.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                    {sub.status === 'completed' ? 'Analyzed' : 'Awaiting'}
                                                </p>
                                            </div>
                                        </div>

                                        {sub.status === 'completed' && (
                                            <button
                                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-medium hover:bg-emerald-500/20 transition outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500/80"
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (sub.report) setSelectedReport(sub);
                                                }}
                                            >
                                                <CheckCircle size={16} />
                                                <span className="font-sans font-bold">View Diagnostic Report</span>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ====== REPORT MODAL (PATIENT/AUTHORITY VIEW) ====== */}
            {selectedReport && selectedReport.report && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-10 z-[100] print-area">
                    <div className="bg-[#18181b] rounded-xl border border-[#2a2a2a] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 print:max-h-none print:h-auto">

                        {/* Header Area */}
                        <div className="flex justify-between items-center p-6 border-b border-[#2a2a2a] bg-[#1c1c21]">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                    <Brain className="text-blue-500" size={24} />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-bold text-white tracking-widest uppercase mb-0.5">RadiAI Medical Report</h2>
                                    <p className="text-xs text-blue-400 font-medium tracking-wide">Digital AI Diagnostic Analysis &bull; Confidential</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] hover:bg-[#3f3f46] border border-[#3f3f46] rounded-lg text-slate-300 transition-colors font-medium text-sm" title="Print Report">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                                    Print
                                </button>
                                <button onClick={() => setSelectedReport(null)} className="p-2 bg-[#2a2a2a] hover:bg-rose-500/20 hover:text-rose-400 border border-[#3f3f46] hover:border-rose-500/30 rounded-lg text-slate-400 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        </div>

                        {/* Report Body */}
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            {/* Patient Info Bar */}
                            <div className="flex flex-wrap items-center justify-between p-5 bg-[#2a2a2a]/40 rounded-xl border border-[#2a2a2a] mb-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                                <div className="relative z-10 w-full sm:w-auto mb-4 sm:mb-0">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Patient Name</p>
                                    <p className="text-lg font-semibold text-white">{selectedReport.patient_name}</p>
                                    <p className="text-xs text-slate-400 mt-0.5 font-medium">{selectedReport.patient_id} &bull; {selectedReport.patient_age} Yrs &bull; {selectedReport.patient_gender}</p>
                                </div>
                                <div className="relative z-10 w-1/2 sm:w-auto mb-4 sm:mb-0">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Study Type</p>
                                    <p className="text-base font-semibold text-white">{selectedReport.xray_type} X-Ray</p>
                                </div>
                                <div className="relative z-10 w-1/2 sm:w-auto">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Date of Study</p>
                                    <p className="text-base font-semibold text-white">{new Date(selectedReport.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                </div>
                                <div className="relative z-10 w-full sm:w-auto mt-4 sm:mt-0 text-left sm:text-right">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Report ID</p>
                                    <p className="text-base font-mono font-semibold text-white">{selectedReport.id.toUpperCase()}</p>
                                </div>
                            </div>

                            {/* AI Diagnostic Results Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-8">
                                {/* Left Col: Text Findings */}
                                <div className="md:col-span-7 space-y-8">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-[#2a2a2a] pb-3 mb-4">AI Impression</h4>
                                        <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-xl border ${selectedReport.report.prediction === 'Fracture' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                                            {selectedReport.report.prediction === 'Fracture' ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                                            ) : (
                                                <CheckCircle size={24} />
                                            )}
                                            <span className="text-2xl font-bold uppercase tracking-wider">{selectedReport.report.prediction} Detected</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-[#2a2a2a] pb-3 mb-4">Diagnostic Findings</h4>
                                        <div className="bg-[#202024] p-5 rounded-xl border border-[#2a2a2a] relative">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50 rounded-l-xl"></div>
                                            <p className="text-slate-300 text-[15px] leading-relaxed whitespace-pre-line pl-2">
                                                {selectedReport.report.findings}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-[#2a2a2a] pb-3 mb-4">Neural Network Confidence</h4>
                                        <div className="flex items-center gap-6 bg-[#1c1c21] p-5 rounded-xl border border-[#2a2a2a]">
                                            <span className="text-5xl font-light text-white w-24">{selectedReport.report.confidence.toFixed(1)}<span className="text-2xl text-slate-500">%</span></span>
                                            <div className="flex-1">
                                                <div className="h-3 bg-[#2a2a2a] rounded-full overflow-hidden shadow-inner">
                                                    <div className={`h-full rounded-full transition-all duration-1000 ${selectedReport.report.prediction === 'Fracture' ? 'bg-gradient-to-r from-rose-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`} style={{ width: `${selectedReport.report.confidence}%` }}></div>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">
                                                    <span>Low</span>
                                                    <span>Moderate</span>
                                                    <span>High</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Col: Imaging */}
                                {selectedReport.report.cam_image && (
                                    <div className="md:col-span-5">
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-[#2a2a2a] pb-3 mb-4">Class Activation Map (CAM)</h4>
                                        <div className="bg-[#111] p-3 rounded-xl border border-[#2a2a2a] flex flex-col items-center shadow-lg relative group">
                                            <img src={`data:image/png;base64,${selectedReport.report.cam_image}`} alt="AI Output" className="max-w-full h-auto rounded-lg border border-[#3f3f46]" />
                                            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none"></div>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-4 leading-relaxed bg-[#1c1c21] p-3 rounded-lg border border-[#2a2a2a]">
                                            <strong className="text-slate-400">Scan Metadata:</strong><br />
                                            The bounding box highlights areas of high neural network activation contributing to the prediction. A red bounding box indicates an anomaly corresponding to the predicted class.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Signatures & Stamps */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-t border-[#2a2a2a] pt-8 mt-4 gap-4 sm:gap-0">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500/30">
                                        <CheckCircle size={24} className="text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Digitally Signed & Verified By</p>
                                        <p className="text-lg font-bold text-white mb-0.5">Dr. Anjali Desai, MD</p>
                                        <p className="text-sm text-slate-400">Chief of Radiology, City General Hospital</p>
                                        <p className="text-xs text-emerald-500 font-mono mt-1">✓ SIGNATURE VERIFIED: {new Date().toISOString().split('T')[0]}</p>
                                    </div>
                                </div>
                                <div className="text-left sm:text-right flex flex-col items-start sm:items-end w-full sm:w-auto p-4 sm:p-0 bg-[#202024] sm:bg-transparent rounded-xl border border-[#2a2a2a] sm:border-none">
                                    <span className="flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest rounded-full mb-3">
                                        <Scan size={14} /> HIPAA Compliant
                                    </span>
                                    <p className="text-xs text-slate-500 font-mono">Generated by RadiAI Core v4.2</p>
                                    <p className="text-[10px] text-slate-600 font-mono mt-1">Ref: {Math.random().toString(36).substring(2, 10).toUpperCase()}-{selectedReport.id.toUpperCase()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== DOCTOR VIEW ====== */}
            {demoRole === 'doctor' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Stethoscope className="text-emerald-400" />
                            Doctor Dashboard
                        </h1>
                        <p className="text-slate-400 mt-1">Dr. Anjali Desai &bull; MD (Radiology) &bull; City General Hospital</p>
                    </div>

                    {/* AI Analysis Result */}
                    {demoResult && (
                        <div className="bg-[#18181b] rounded-2xl border border-[#2a2a2a] shadow-[0_0_50px_rgba(0,0,0,0.5)] p-6 space-y-4 animate-in slide-in-from-top-4 duration-300 relative z-40">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Brain className="text-blue-500" size={20} />
                                    AI Analysis — {demoResult.patient}
                                </h3>
                                <button onClick={() => setDemoResult(null)} className="text-sm text-slate-400 hover:text-white">&times; Close</button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Prediction</p>
                                    <p className="text-lg font-bold text-rose-500">{demoResult.prediction}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Confidence</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-3 bg-[#2a2a2a] rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000" style={{ width: `${demoResult.confidence * 100}%` }}></div>
                                        </div>
                                        <span className="text-lg font-bold text-white">{(demoResult.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#202024] rounded-xl p-4 border border-[#2a2a2a]">
                                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">AI Findings</p>
                                <p className="text-slate-300 text-sm leading-relaxed">{demoResult.findings}</p>
                            </div>

                            {demoResult.cam_image && (
                                <div className="mt-4 p-4 bg-[#202024] rounded-xl border border-[#2a2a2a] flex flex-col items-center">
                                    <p className="text-xs text-slate-500 uppercase font-semibold mb-3 self-start">AI Detection Box</p>
                                    <img src={`data:image/png;base64,${demoResult.cam_image}`} alt="AI Result" className="max-h-80 w-auto object-contain rounded-xl border border-[#2a2a2a] shadow-sm" />
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => sendReport(demoResult.id)}
                                    className="flex-1 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-medium text-sm hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Share2 size={14} /> Send Report to Patient
                                </button>
                                <button onClick={() => setDemoResult(null)} className="px-4 py-2.5 bg-[#2a2a2a] text-slate-300 border border-[#3f3f46] rounded-xl font-medium text-sm hover:bg-[#3f3f46] hover:text-white transition-all">
                                    Back
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Pending Reviews */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                            Pending Reviews ({submissions.filter(s => s.status === 'pending' || s.status === 'in_review').length})
                        </h3>
                        {submissions.filter(s => s.status === 'pending' || s.status === 'in_review').length === 0 ? (
                            <div className="text-center py-12 bg-[#18181b] rounded-2xl border border-[#2a2a2a]">
                                <Scan size={40} className="mx-auto text-slate-500 mb-3" />
                                <p className="text-white font-medium">No pending cases</p>
                                <p className="text-sm text-slate-400 mt-1">Switch to Patient tab and upload an X-ray — it will appear here!</p>
                            </div>
                        ) : (
                            submissions.filter(s => s.status !== 'completed').map(sub => (
                                <div
                                    key={sub.id}
                                    className="bg-[#18181b] rounded-xl border border-[#2a2a2a] p-4 hover:shadow-md hover:bg-[#202024] hover:border-[#3f3f46] transition-all cursor-pointer group"
                                    onClick={() => !demoAnalyzing && handleAnalyze(sub)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-[#2a2a2a] border border-[#3f3f46] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {sub.xray_url ? (
                                                <img src={sub.xray_url} alt="X-ray" className="w-full h-full object-cover" />
                                            ) : (
                                                <Scan size={22} className="text-slate-500" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-white">{sub.patient_name}</h4>
                                            <p className="text-sm text-slate-400">{sub.xray_type} &bull; {new Date(sub.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            {sub.notes && <p className="text-xs text-slate-500 mt-0.5">{sub.notes}</p>}
                                        </div>
                                        {demoAnalyzing === sub.id ? (
                                            <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
                                                <Loader2 size={16} className="animate-spin" />
                                                Analyzing...
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Brain size={16} />
                                                Analyze with AI
                                                <ChevronRight size={16} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Completed */}
                    {submissions.filter(s => s.status === 'completed').length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Completed Reviews</h3>
                            {submissions.filter(s => s.status === 'completed').map(sub => (
                                <div key={sub.id} className="bg-[#18181b] rounded-xl border border-[#2a2a2a] p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-[#2a2a2a] border border-[#3f3f46] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {sub.xray_url ? (
                                                <img src={sub.xray_url} alt="X-ray" className="w-full h-full object-cover" />
                                            ) : (
                                                <Scan size={22} className="text-slate-500" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-white">{sub.patient_name}</h4>
                                            <p className="text-sm text-slate-400">{sub.xray_type} &bull; {new Date(sub.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            <CheckCircle size={14} /> Report Sent
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ====== UPLOAD MODAL ====== */}
            {showUpload && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#18181b] border border-[#2a2a2a] rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold text-white mb-4">
                            {demoRole === 'authority' ? 'Submit Patient X-Ray' : 'Upload Your X-Ray'}
                        </h2>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-300 block mb-1">
                                    {demoRole === 'authority' ? 'Patient Name *' : 'Your Name *'}
                                </label>
                                <input
                                    type="text"
                                    value={patientName}
                                    onChange={(e) => setPatientName(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[#202024] text-white border border-[#2a2a2a] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="Full name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300 block mb-1">X-Ray Type</label>
                                <select
                                    value={xrayType}
                                    onChange={(e) => setXrayType(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[#202024] text-white border border-[#2a2a2a] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                    <option value="">Select type</option>
                                    <option value="Hand/Wrist">Hand / Wrist</option>
                                    <option value="Elbow">Elbow</option>
                                    <option value="Shoulder">Shoulder</option>
                                    <option value="Knee">Knee</option>
                                    <option value="Chest">Chest</option>
                                    <option value="Spine">Spine</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300 block mb-1">Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[#202024] text-white border border-[#2a2a2a] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                                    rows={2}
                                    placeholder="Symptoms or additional info..."
                                />
                            </div>
                            <div
                                onClick={() => fileRef.current?.click()}
                                className="border-2 border-dashed border-[#3f3f46] rounded-xl p-6 text-center cursor-pointer hover:bg-[#202024] transition-all bg-[#1b1b1f]"
                            >
                                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
                                {xrayPreview ? (
                                    <img src={xrayPreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                                ) : (
                                    <>
                                        <Upload size={24} className="mx-auto text-slate-500 mb-2" />
                                        <p className="text-sm text-slate-300 font-medium">Click to upload X-Ray image</p>
                                        <p className="text-xs text-slate-500">(Optional for demo)</p>
                                    </>
                                )}
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowUpload(false)}
                                    className="flex-1 py-3 border border-[#3f3f46] bg-[#2a2a2a] rounded-xl text-slate-300 font-medium hover:bg-[#3f3f46] hover:text-white transition-all"
                                >
                                    Cancel
                                </button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                >
                                    <Upload size={16} />
                                    Submit
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DemoDashboard;
