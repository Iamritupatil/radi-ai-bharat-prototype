import React, { useState, useRef } from 'react';
import { Building2, Upload, ArrowRight, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from './supabaseClient';

const AuthorityVerificationPage = ({ setView, onVerified }) => {
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        orgName: '',
        registrationNumber: '',
    });
    const [certificateFile, setCertificateFile] = useState(null);
    const certRef = useRef(null);

    const updateField = (key, val) => {
        setFormData(prev => ({ ...prev, [key]: val }));
        setErrors(prev => ({ ...prev, [key]: null }));
    };

    const validate = () => {
        const errs = {};
        if (!formData.orgName.trim()) errs.orgName = 'Organization name is required';
        if (!formData.registrationNumber.trim()) {
            errs.registrationNumber = 'Registration number is required';
        } else if (!/^[A-Za-z0-9\-\/]{3,20}$/.test(formData.registrationNumber.trim())) {
            errs.registrationNumber = 'Invalid registration format';
        }
        if (!certificateFile) errs.certificate = 'Registration certificate is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Upload certificate
            let certificateUrl = null;
            if (certificateFile) {
                const certPath = `${user.id}/certificate_${Date.now()}.${certificateFile.name.split('.').pop()}`;
                const { error: uploadErr } = await supabase.storage
                    .from('certificates')
                    .upload(certPath, certificateFile);
                if (uploadErr) throw uploadErr;
                const { data: urlData } = supabase.storage.from('certificates').getPublicUrl(certPath);
                certificateUrl = urlData.publicUrl;
            }

            // Insert verification record
            const { error: insertErr } = await supabase.from('authority_verifications').insert({
                user_id: user.id,
                org_name: formData.orgName,
                registration_number: formData.registrationNumber,
                certificate_url: certificateUrl,
                status: 'verified' // Auto-verify for hackathon demo
            });

            if (insertErr) throw insertErr;

            // Update profile
            await supabase.from('profiles').update({
                verified: true,
                full_name: formData.orgName
            }).eq('id', user.id);

            await supabase.auth.updateUser({ data: { full_name: formData.orgName, verified: true } });

            onVerified();
        } catch (err) {
            console.error('Verification error:', err);
            alert(`Verification failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-500 p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                    <div className="relative z-10 flex items-center justify-center gap-3 mb-2">
                        <Building2 size={28} className="text-white" />
                        <h2 className="text-3xl font-bold text-white">Authority Verification</h2>
                    </div>
                    <p className="text-violet-100 relative z-10">Verify your organization to start submitting X-rays</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700">Hospital / Clinic Name</label>
                        <input
                            type="text"
                            value={formData.orgName}
                            onChange={(e) => updateField('orgName', e.target.value)}
                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${errors.orgName ? 'border-red-300' : 'border-slate-200'}`}
                            placeholder="e.g. Apollo Hospital, New Delhi"
                        />
                        {errors.orgName && <p className="text-red-500 text-xs mt-1">{errors.orgName}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700">Registration Number</label>
                        <input
                            type="text"
                            value={formData.registrationNumber}
                            onChange={(e) => updateField('registrationNumber', e.target.value)}
                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all font-mono ${errors.registrationNumber ? 'border-red-300' : 'border-slate-200'}`}
                            placeholder="e.g. NABH-12345"
                        />
                        {errors.registrationNumber && <p className="text-red-500 text-xs mt-1">{errors.registrationNumber}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Registration Certificate</label>
                        <div
                            onClick={() => certRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-slate-50 ${errors.certificate ? 'border-red-300' : 'border-slate-200'}`}
                        >
                            <input
                                ref={certRef}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                hidden
                                onChange={(e) => {
                                    setCertificateFile(e.target.files[0]);
                                    setErrors(prev => ({ ...prev, certificate: null }));
                                }}
                            />
                            {certificateFile ? (
                                <div className="flex items-center justify-center gap-2 text-violet-600">
                                    <CheckCircle size={20} />
                                    <span className="font-medium">{certificateFile.name}</span>
                                </div>
                            ) : (
                                <>
                                    <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                                    <p className="text-sm text-slate-600 font-medium">Upload Registration Certificate</p>
                                    <p className="text-xs text-slate-400">PDF, JPG or PNG</p>
                                </>
                            )}
                        </div>
                        {errors.certificate && <p className="text-red-500 text-xs">{errors.certificate}</p>}
                    </div>

                    <div className="flex justify-between pt-4">
                        <button
                            type="button"
                            onClick={() => setView('role-select')}
                            className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Change Role
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-70"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : (
                                <>Submit Verification <CheckCircle size={16} /></>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthorityVerificationPage;
