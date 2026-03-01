import React, { useState, useEffect } from 'react';
import { Stethoscope, Eye, Loader2, Send, RefreshCw, Clock, CheckCircle, Brain, FileText, AlertCircle, ChevronRight } from 'lucide-react';
import { supabase } from './supabaseClient';

const DoctorDashboard = ({ userProfile }) => {
    const [tab, setTab] = useState('pending');
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [reportForm, setReportForm] = useState({ findings: '', impression: '' });
    const [sendingReport, setSendingReport] = useState(false);
    const [doctorInfo, setDoctorInfo] = useState(null);

    useEffect(() => {
        fetchSubmissions();
        fetchDoctorInfo();
    }, [tab]);

    const fetchDoctorInfo = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data } = await supabase.from('doctor_verifications').select('*').eq('user_id', user.id).single();
            setDoctorInfo(data);
        } catch (err) {
            console.error('Doctor info error:', err);
        }
    };

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            let query;

            if (tab === 'pending') {
                // Fetch unassigned pending submissions
                query = supabase
                    .from('xray_submissions')
                    .select('*')
                    .eq('status', 'pending')
                    .order('created_at', { ascending: true });
            } else {
                // Fetch completed by this doctor
                query = supabase
                    .from('xray_submissions')
                    .select('*, reports(*)')
                    .eq('assigned_doctor_id', user.id)
                    .eq('status', 'completed')
                    .order('created_at', { ascending: false });
            }

            const { data, error } = await query;
            if (error) throw error;
            setSubmissions(data || []);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async (submission) => {
        setSelectedCase(submission);
        setAnalyzing(true);
        setAnalysisResult(null);
        setReportForm({ findings: '', impression: '' });

        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Assign to this doctor and update status
            await supabase
                .from('xray_submissions')
                .update({ assigned_doctor_id: user.id, status: 'in_review' })
                .eq('id', submission.id);

            // Fetch the X-ray image and send to AI backend
            const response = await fetch(submission.xray_url);
            const blob = await response.blob();
            const file = new File([blob], 'xray.png', { type: blob.type });

            const formData = new FormData();
            formData.append('file', file);

            const analysisResponse = await fetch('https://spot-themselves-reflects-attributes.trycloudflare.com/analyze', {
                method: 'POST',
                body: formData,
            });

            if (!analysisResponse.ok) {
                const errText = await analysisResponse.text();
                throw new Error(`AI analysis failed: ${errText}`);
            }

            const result = await analysisResponse.json();
            setAnalysisResult(result);

            // Pre-fill findings based on AI result
            const autoFindings = result.prediction === 'Fracture'
                ? `AI analysis detected a potential fracture with ${result.confidence}% confidence. Further clinical correlation is recommended.`
                : `AI analysis indicates normal findings with ${result.confidence}% confidence. No obvious fracture detected.`;
            setReportForm({ findings: autoFindings, impression: '' });

        } catch (err) {
            console.error('Analysis error:', err);
            alert(`Analysis failed: ${err.message}`);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSendReport = async () => {
        if (!reportForm.findings.trim()) {
            alert('Please provide findings before sending the report.');
            return;
        }
        setSendingReport(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Save CAM image to storage if available
            let camImageUrl = null;
            if (analysisResult?.cam_image) {
                const camBlob = await fetch(`data:image/png;base64,${analysisResult.cam_image}`).then(r => r.blob());
                const camPath = `reports/${selectedCase.id}_cam_${Date.now()}.png`;
                await supabase.storage.from('xrays').upload(camPath, camBlob);
                const { data: urlData } = supabase.storage.from('xrays').getPublicUrl(camPath);
                camImageUrl = urlData.publicUrl;
            }

            // Create report
            const { error: reportErr } = await supabase.from('reports').insert({
                submission_id: selectedCase.id,
                doctor_id: user.id,
                prediction: analysisResult?.prediction || 'Pending Review',
                confidence: analysisResult?.confidence || 0,
                cam_image_url: camImageUrl,
                findings: reportForm.findings,
                impression: reportForm.impression || null,
                doctor_signature_url: doctorInfo?.signature_url || null,
            });

            if (reportErr) throw reportErr;

            // Update submission status to completed
            await supabase
                .from('xray_submissions')
                .update({ status: 'completed' })
                .eq('id', selectedCase.id);

            setSelectedCase(null);
            setAnalysisResult(null);
            fetchSubmissions();
        } catch (err) {
            console.error('Report error:', err);
            alert(`Failed to send report: ${err.message}`);
        } finally {
            setSendingReport(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Stethoscope className="text-emerald-500" />
                        Doctor Dashboard
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {doctorInfo ? `${doctorInfo.full_name} • ${doctorInfo.qualification} • ${doctorInfo.hospital_name}` : 'Loading...'}
                    </p>
                </div>
                <button
                    onClick={fetchSubmissions}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
                {[
                    { id: 'pending', label: 'Pending Reviews', icon: <Clock size={16} /> },
                    { id: 'completed', label: 'Completed', icon: <CheckCircle size={16} /> },
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {t.icon}
                        {t.label}
                        {t.id === 'pending' && submissions.length > 0 && tab === 'pending' && (
                            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{submissions.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Analysis Panel */}
            {selectedCase && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Case Review</h2>
                                <p className="text-slate-500 text-sm">Patient: {selectedCase.patient_name} {selectedCase.xray_type && `• ${selectedCase.xray_type}`}</p>
                            </div>
                            <button
                                onClick={() => { setSelectedCase(null); setAnalysisResult(null); }}
                                className="text-slate-400 hover:text-slate-600 text-xl"
                            >✕</button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left: X-ray + AI Result */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 mb-2">Original X-Ray</p>
                                    <img src={selectedCase.xray_url} alt="X-ray" className="w-full rounded-xl border" />
                                </div>

                                {analyzing && (
                                    <div className="bg-blue-50 rounded-xl p-6 text-center">
                                        <Brain size={32} className="mx-auto text-blue-500 animate-pulse mb-2" />
                                        <p className="text-blue-700 font-medium">AI is analyzing the X-Ray...</p>
                                    </div>
                                )}

                                {analysisResult && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className={`p-3 rounded-xl ${analysisResult.prediction === 'Fracture' ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                                                <p className="text-xs text-slate-500">AI Prediction</p>
                                                <p className={`font-bold ${analysisResult.prediction === 'Fracture' ? 'text-red-700' : 'text-emerald-700'}`}>{analysisResult.prediction}</p>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <p className="text-xs text-slate-500">Confidence</p>
                                                <p className="font-bold text-slate-900">{analysisResult.confidence}%</p>
                                            </div>
                                        </div>
                                        {analysisResult.cam_image && (
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700 mb-2">AI Heatmap</p>
                                                <img src={`data:image/png;base64,${analysisResult.cam_image}`} alt="CAM" className="w-full rounded-xl border" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Right: Report Form */}
                            <div className="space-y-4">
                                {selectedCase.notes && (
                                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                                        <p className="text-xs text-amber-600 font-semibold mb-1">Patient Notes</p>
                                        <p className="text-sm text-amber-800">{selectedCase.notes}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-semibold text-slate-700 block mb-1">Findings *</label>
                                    <textarea
                                        value={reportForm.findings}
                                        onChange={(e) => setReportForm(prev => ({ ...prev, findings: e.target.value }))}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                                        rows={5}
                                        placeholder="Describe the radiological findings..."
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-slate-700 block mb-1">Impression</label>
                                    <textarea
                                        value={reportForm.impression}
                                        onChange={(e) => setReportForm(prev => ({ ...prev, impression: e.target.value }))}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                                        rows={3}
                                        placeholder="Summary diagnosis or recommendation..."
                                    />
                                </div>

                                {doctorInfo?.signature_url && (
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <p className="text-xs text-slate-500 mb-1">Your Signature (auto-attached)</p>
                                        <img src={doctorInfo.signature_url} alt="Signature" className="max-h-12" />
                                    </div>
                                )}

                                <button
                                    onClick={handleSendReport}
                                    disabled={sendingReport || !analysisResult}
                                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {sendingReport ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    Send Report to Patient
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Submissions List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-emerald-500" />
                </div>
            ) : submissions.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
                    <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700">
                        {tab === 'pending' ? 'No pending reviews' : 'No completed reviews'}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">
                        {tab === 'pending' ? 'New submissions will appear here' : 'Reviewed cases will show here'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {submissions.map((sub) => (
                        <div
                            key={sub.id}
                            className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-all cursor-pointer group"
                            onClick={() => tab === 'pending' && handleAnalyze(sub)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                    <img src={sub.xray_url} alt="X-ray" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-slate-900">{sub.patient_name}</h4>
                                    <p className="text-sm text-slate-500">
                                        {sub.xray_type && `${sub.xray_type} • `}
                                        {new Date(sub.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                {tab === 'pending' ? (
                                    <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Brain size={16} />
                                        Analyze with AI
                                        <ChevronRight size={16} />
                                    </div>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle size={14} />
                                        Report Sent
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DoctorDashboard;
