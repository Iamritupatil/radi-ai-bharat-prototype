import React, { useState, useRef } from 'react';
import { Stethoscope, Upload, ArrowRight, ArrowLeft, Loader2, CheckCircle, AlertCircle, FileText, PenTool } from 'lucide-react';
import { supabase } from './supabaseClient';

// Indian Medical Validation
const VALID_QUALIFICATIONS = [
    'MBBS', 'MD', 'MS', 'DNB', 'DM', 'MCh', 'BDS', 'MDS',
    'BAMS', 'BHMS', 'BUMS', 'BNYS',
    'MD (Radiodiagnosis)', 'MD (Radiology)', 'DMRD',
    'DNB (Radiodiagnosis)', 'FRCR'
];

const STATE_COUNCILS = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
    'Chandigarh', 'Andaman & Nicobar', 'Dadra & Nagar Haveli', 'Lakshadweep'
];

const validateNMC = (num) => /^\d{5,7}$/.test(num.trim());
const validateSMC = (num) => /^[A-Z]{2}\/\d{3,7}$/i.test(num.trim());

const DoctorVerificationPage = ({ setView, onVerified }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        qualification: '',
        councilType: 'NMC',
        stateCouncil: '',
        registrationNumber: '',
        hospitalName: '',
    });

    const [licenceFile, setLicenceFile] = useState(null);
    const [signatureFile, setSignatureFile] = useState(null);
    const [signaturePreview, setSignaturePreview] = useState(null);

    const licenceRef = useRef(null);
    const signatureRef = useRef(null);

    const updateField = (key, val) => {
        setFormData(prev => ({ ...prev, [key]: val }));
        setErrors(prev => ({ ...prev, [key]: null }));
    };

    // Step 1: Validate personal info
    const validateStep1 = () => {
        const errs = {};
        if (!formData.fullName.trim()) errs.fullName = 'Name is required';
        if (!formData.qualification) errs.qualification = 'Select a qualification';
        if (!formData.hospitalName.trim()) errs.hospitalName = 'Hospital/Clinic name is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // Step 2: Validate registration
    const validateStep2 = () => {
        const errs = {};
        const regNum = formData.registrationNumber.trim();

        if (!regNum) {
            errs.registrationNumber = 'Registration number is required';
        } else if (formData.councilType === 'NMC') {
            if (!validateNMC(regNum)) {
                errs.registrationNumber = 'NMC number must be 5-7 digits (e.g., 12345)';
            }
        } else {
            if (!validateSMC(regNum)) {
                errs.registrationNumber = 'SMC format: STATE_CODE/DIGITS (e.g., MH/12345)';
            }
            if (!formData.stateCouncil) {
                errs.stateCouncil = 'Select your state medical council';
            }
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // Step 3: Validate uploads
    const validateStep3 = () => {
        const errs = {};
        if (!licenceFile) errs.licence = 'Medical licence is required';
        if (!signatureFile) errs.signature = 'Signature is required for reports';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSignatureChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSignatureFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setSignaturePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!validateStep3()) return;
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Upload licence
            let licenceUrl = null;
            if (licenceFile) {
                const licencePath = `${user.id}/licence_${Date.now()}.${licenceFile.name.split('.').pop()}`;
                const { error: uploadErr } = await supabase.storage
                    .from('licences')
                    .upload(licencePath, licenceFile);
                if (uploadErr) throw uploadErr;
                const { data: urlData } = supabase.storage.from('licences').getPublicUrl(licencePath);
                licenceUrl = urlData.publicUrl;
            }

            // Upload signature
            let signatureUrl = null;
            if (signatureFile) {
                const sigPath = `${user.id}/signature_${Date.now()}.${signatureFile.name.split('.').pop()}`;
                const { error: uploadErr } = await supabase.storage
                    .from('signatures')
                    .upload(sigPath, signatureFile);
                if (uploadErr) throw uploadErr;
                const { data: urlData } = supabase.storage.from('signatures').getPublicUrl(sigPath);
                signatureUrl = urlData.publicUrl;
            }

            // Insert verification record
            const { error: insertErr } = await supabase.from('doctor_verifications').insert({
                user_id: user.id,
                full_name: formData.fullName,
                qualification: formData.qualification,
                registration_number: formData.registrationNumber,
                council_type: formData.councilType,
                state_council: formData.councilType === 'SMC' ? formData.stateCouncil : null,
                hospital_name: formData.hospitalName,
                licence_url: licenceUrl,
                signature_url: signatureUrl,
                status: 'verified' // Auto-verify for hackathon demo
            });

            if (insertErr) throw insertErr;

            // Update profile as verified
            await supabase.from('profiles').update({ verified: true, full_name: formData.fullName }).eq('id', user.id);
            await supabase.auth.updateUser({ data: { full_name: formData.fullName, verified: true } });

            onVerified();
        } catch (err) {
            console.error('Verification error:', err);
            alert(`Verification failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (step === 1 && validateStep1()) setStep(2);
        else if (step === 2 && validateStep2()) setStep(3);
        else if (step === 3) handleSubmit();
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                    <div className="relative z-10 flex items-center justify-center gap-3 mb-2">
                        <Stethoscope size={28} className="text-white" />
                        <h2 className="text-3xl font-bold text-white">Doctor Verification</h2>
                    </div>
                    <p className="text-emerald-100 relative z-10">Verify your credentials to access the doctor dashboard</p>

                    {/* Progress bar */}
                    <div className="flex gap-2 mt-6 max-w-xs mx-auto relative z-10">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${s <= step ? 'bg-white' : 'bg-white/30'}`} />
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-emerald-100 max-w-xs mx-auto relative z-10">
                        <span>Personal</span>
                        <span>Registration</span>
                        <span>Documents</span>
                    </div>
                </div>

                <div className="p-8">
                    {/* Step 1: Personal Info */}
                    {step === 1 && (
                        <div className="space-y-5 animate-in fade-in duration-300">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Full Name (as per registration)</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => updateField('fullName', e.target.value)}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${errors.fullName ? 'border-red-300' : 'border-slate-200'}`}
                                    placeholder="e.g. Dr. Anjali Desai"
                                />
                                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Qualification</label>
                                <select
                                    value={formData.qualification}
                                    onChange={(e) => updateField('qualification', e.target.value)}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${errors.qualification ? 'border-red-300' : 'border-slate-200'}`}
                                >
                                    <option value="">Select qualification</option>
                                    {VALID_QUALIFICATIONS.map(q => (
                                        <option key={q} value={q}>{q}</option>
                                    ))}
                                </select>
                                {errors.qualification && <p className="text-red-500 text-xs mt-1">{errors.qualification}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Hospital / Clinic Name</label>
                                <input
                                    type="text"
                                    value={formData.hospitalName}
                                    onChange={(e) => updateField('hospitalName', e.target.value)}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${errors.hospitalName ? 'border-red-300' : 'border-slate-200'}`}
                                    placeholder="e.g. Apollo Hospital, New Delhi"
                                />
                                {errors.hospitalName && <p className="text-red-500 text-xs mt-1">{errors.hospitalName}</p>}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Registration */}
                    {step === 2 && (
                        <div className="space-y-5 animate-in fade-in duration-300">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Registration Council</label>
                                <div className="flex gap-3">
                                    {['NMC', 'SMC'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => updateField('councilType', type)}
                                            className={`flex-1 py-3 rounded-xl border font-medium transition-all ${formData.councilType === type
                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                                }`}
                                        >
                                            {type === 'NMC' ? 'National Medical Commission' : 'State Medical Council'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {formData.councilType === 'SMC' && (
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-700">State Medical Council</label>
                                    <select
                                        value={formData.stateCouncil}
                                        onChange={(e) => updateField('stateCouncil', e.target.value)}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${errors.stateCouncil ? 'border-red-300' : 'border-slate-200'}`}
                                    >
                                        <option value="">Select state</option>
                                        {STATE_COUNCILS.map(s => (
                                            <option key={s} value={s}>{s} Medical Council</option>
                                        ))}
                                    </select>
                                    {errors.stateCouncil && <p className="text-red-500 text-xs mt-1">{errors.stateCouncil}</p>}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Registration Number</label>
                                <input
                                    type="text"
                                    value={formData.registrationNumber}
                                    onChange={(e) => updateField('registrationNumber', e.target.value)}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono ${errors.registrationNumber ? 'border-red-300' : 'border-slate-200'}`}
                                    placeholder={formData.councilType === 'NMC' ? 'e.g. 12345' : 'e.g. MH/12345'}
                                />
                                {errors.registrationNumber && <p className="text-red-500 text-xs mt-1">{errors.registrationNumber}</p>}
                                <p className="text-xs text-slate-400 mt-1">
                                    {formData.councilType === 'NMC'
                                        ? 'NMC registration: 5-7 digit number'
                                        : 'SMC format: STATE_CODE/DIGITS (e.g., MH/12345)'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Documents */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Licence Upload */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <FileText size={16} className="text-emerald-500" />
                                    Medical Licence
                                </label>
                                <div
                                    onClick={() => licenceRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-slate-50 ${errors.licence ? 'border-red-300' : 'border-slate-200'}`}
                                >
                                    <input
                                        ref={licenceRef}
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        hidden
                                        onChange={(e) => {
                                            setLicenceFile(e.target.files[0]);
                                            setErrors(prev => ({ ...prev, licence: null }));
                                        }}
                                    />
                                    {licenceFile ? (
                                        <div className="flex items-center justify-center gap-2 text-emerald-600">
                                            <CheckCircle size={20} />
                                            <span className="font-medium">{licenceFile.name}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                                            <p className="text-sm text-slate-600 font-medium">Upload Medical Licence</p>
                                            <p className="text-xs text-slate-400">PDF, JPG or PNG</p>
                                        </>
                                    )}
                                </div>
                                {errors.licence && <p className="text-red-500 text-xs">{errors.licence}</p>}
                            </div>

                            {/* Signature Upload */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <PenTool size={16} className="text-emerald-500" />
                                    Doctor's Signature (used in reports)
                                </label>
                                <div
                                    onClick={() => signatureRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-slate-50 ${errors.signature ? 'border-red-300' : 'border-slate-200'}`}
                                >
                                    <input
                                        ref={signatureRef}
                                        type="file"
                                        accept=".jpg,.jpeg,.png"
                                        hidden
                                        onChange={handleSignatureChange}
                                    />
                                    {signaturePreview ? (
                                        <div className="space-y-2">
                                            <img src={signaturePreview} alt="Signature" className="max-h-20 mx-auto" />
                                            <p className="text-xs text-emerald-600 font-medium">Signature uploaded</p>
                                        </div>
                                    ) : (
                                        <>
                                            <PenTool size={24} className="mx-auto text-slate-400 mb-2" />
                                            <p className="text-sm text-slate-600 font-medium">Upload Signature Image</p>
                                            <p className="text-xs text-slate-400">Clear image on white background (JPG, PNG)</p>
                                        </>
                                    )}
                                </div>
                                {errors.signature && <p className="text-red-500 text-xs">{errors.signature}</p>}
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8">
                        {step > 1 ? (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                            >
                                <ArrowLeft size={16} />
                                Back
                            </button>
                        ) : (
                            <button
                                onClick={() => setView('role-select')}
                                className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                            >
                                <ArrowLeft size={16} />
                                Change Role
                            </button>
                        )}

                        <button
                            onClick={nextStep}
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-70"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : step === 3 ? (
                                <>Submit Verification <CheckCircle size={16} /></>
                            ) : (
                                <>Continue <ArrowRight size={16} /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorVerificationPage;
