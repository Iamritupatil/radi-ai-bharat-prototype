import React, { useState, useEffect, useRef } from 'react';
import { Upload, Clock, CheckCircle, AlertCircle, FileText, Eye, Loader2, Send, RefreshCw } from 'lucide-react';
import { supabase } from './supabaseClient';

const STATUS_STYLES = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: <Clock size={14} />, label: 'Pending' },
    in_review: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: <Eye size={14} />, label: 'In Review' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle size={14} />, label: 'Completed' },
};

const IndividualDashboard = ({ userProfile }) => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    // Upload form
    const [patientName, setPatientName] = useState('');
    const [xrayType, setXrayType] = useState('');
    const [notes, setNotes] = useState('');
    const [xrayFile, setXrayFile] = useState(null);
    const [xrayPreview, setXrayPreview] = useState(null);
    const fileRef = useRef(null);

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = () => {
        setLoading(true);
        try {
            const saved = JSON.parse(localStorage.getItem('radiai_submissions') || '[]');
            setSubmissions(saved);
        } catch {
            setSubmissions([]);
        }
        setLoading(false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setXrayFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setXrayPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleUpload = (e) => {
        e.preventDefault();
        if (!xrayFile || !patientName.trim()) {
            alert('Please provide patient name and X-ray image.');
            return;
        }
        setUploading(true);

        // Create submission locally — instant, no network
        const newSubmission = {
            id: Date.now().toString(),
            patient_name: patientName,
            xray_url: xrayPreview, // base64 preview as the image
            xray_type: xrayType || null,
            notes: notes || null,
            status: 'pending',
            created_at: new Date().toISOString(),
            reports: []
        };

        const existing = JSON.parse(localStorage.getItem('radiai_submissions') || '[]');
        const updated = [newSubmission, ...existing];
        localStorage.setItem('radiai_submissions', JSON.stringify(updated));
        setSubmissions(updated);

        // Reset form
        setShowUpload(false);
        setXrayFile(null);
        setXrayPreview(null);
        setPatientName('');
        setXrayType('');
        setNotes('');
        setUploading(false);

        // Fire-and-forget: try to sync to Supabase in background
        supabase.auth.getUser().then(({ data }) => {
            if (data?.user) {
                const xrayPath = `${data.user.id}/${Date.now()}_upload.jpg`;
                supabase.storage.from('xrays').upload(xrayPath, xrayFile).catch(() => { });
            }
        }).catch(() => { });
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">My X-Ray Dashboard</h1>
                    <p className="text-slate-400 mt-1">Upload X-rays and track your submissions</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchSubmissions}
                        className="p-2.5 rounded-xl border border-white/20 text-slate-300 hover:bg-white/10 transition-all"
                    >
                        <RefreshCw size={18} />
                    </button>
                    <button
                        onClick={() => setShowUpload(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all"
                    >
                        <Upload size={16} />
                        Upload X-Ray
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total', count: submissions.length, color: 'text-white' },
                    { label: 'Pending', count: submissions.filter(s => s.status === 'pending' || s.status === 'in_review').length, color: 'text-white' },
                    { label: 'Completed', count: submissions.filter(s => s.status === 'completed').length, color: 'text-white' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                        <p className={`text-3xl font-bold ${stat.color}`}>{stat.count}</p>
                        <p className="text-sm text-slate-400">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Upload Modal */}
            {showUpload && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Upload X-Ray for Review</h2>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Patient Name *</label>
                                <input
                                    type="text"
                                    value={patientName}
                                    onChange={(e) => setPatientName(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="Full name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">X-Ray Type</label>
                                <select
                                    value={xrayType}
                                    onChange={(e) => setXrayType(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                    <option value="">Select type</option>
                                    <option value="Hand/Wrist">Hand / Wrist</option>
                                    <option value="Elbow">Elbow</option>
                                    <option value="Shoulder">Shoulder</option>
                                    <option value="Knee">Knee</option>
                                    <option value="Ankle/Foot">Ankle / Foot</option>
                                    <option value="Chest">Chest</option>
                                    <option value="Spine">Spine</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                                    rows={2}
                                    placeholder="Any symptoms or additional info..."
                                />
                            </div>

                            {/* X-ray upload */}
                            <div
                                onClick={() => fileRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:bg-slate-50 transition-all"
                            >
                                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
                                {xrayPreview ? (
                                    <img src={xrayPreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                                ) : (
                                    <>
                                        <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                                        <p className="text-sm text-slate-600 font-medium">Click to upload X-Ray image</p>
                                    </>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowUpload(false)}
                                    className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold text-slate-900">Diagnostic Report</h2>
                            <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-3 rounded-xl">
                                    <p className="text-xs text-slate-500">Prediction</p>
                                    <p className="font-bold text-slate-900">{selectedReport.prediction}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl">
                                    <p className="text-xs text-slate-500">Confidence</p>
                                    <p className="font-bold text-slate-900">{selectedReport.confidence}%</p>
                                </div>
                            </div>
                            {selectedReport.findings && (
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 mb-1">Findings</p>
                                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">{selectedReport.findings}</p>
                                </div>
                            )}
                            {selectedReport.impression && (
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 mb-1">Impression</p>
                                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">{selectedReport.impression}</p>
                                </div>
                            )}
                            {selectedReport.cam_image_url && (
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 mb-1">AI Analysis</p>
                                    <img src={selectedReport.cam_image_url} alt="CAM" className="rounded-xl border max-w-full" />
                                </div>
                            )}
                            {selectedReport.doctor_signature_url && (
                                <div className="text-right">
                                    <img src={selectedReport.doctor_signature_url} alt="Doctor Signature" className="inline-block max-h-16" />
                                    <p className="text-xs text-slate-400 mt-1">Verified Doctor Signature</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Submissions List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                </div>
            ) : submissions.length === 0 ? (
                <div className="text-center py-20 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                    <FileText size={48} className="mx-auto text-white/40 mb-4" />
                    <h3 className="text-lg font-semibold text-white">No submissions yet</h3>
                    <p className="text-slate-400 text-sm mt-1">Upload your first X-ray to get started</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {submissions.map((sub) => {
                        const status = STATUS_STYLES[sub.status] || STATUS_STYLES.pending;
                        const report = sub.reports?.[0];
                        return (
                            <div key={sub.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                                        <img src={sub.xray_url} alt="X-ray" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-white truncate">{sub.patient_name}</h4>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text} border ${status.border}`}>
                                                {status.icon}
                                                {status.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400">
                                            {sub.xray_type && `${sub.xray_type} • `}
                                            {new Date(sub.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                    {sub.status === 'completed' && report && (
                                        <button
                                            onClick={() => setSelectedReport(report)}
                                            className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-all flex items-center gap-1"
                                        >
                                            <Eye size={14} />
                                            View Report
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default IndividualDashboard;
