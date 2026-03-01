import React from 'react';
import { Stethoscope, User, Building2, ArrowRight, Shield } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Button } from './Button';
const roles = [
    {
        id: 'individual',
        title: 'Individual',
        desc: 'Upload X-rays for AI analysis and get reports from verified doctors.',
        icon: <User size={32} />,
        color: 'from-blue-500 to-cyan-500',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        features: ['Upload X-rays', 'Track submission status', 'Receive doctor reports']
    },
    {
        id: 'doctor',
        title: 'Doctor',
        desc: 'Review patient X-rays with AI assistance, generate and send professional reports.',
        icon: <Stethoscope size={32} />,
        color: 'from-emerald-500 to-teal-500',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        features: ['AI-assisted diagnosis', 'Review pending cases', 'Send signed reports'],
        badge: 'Verification Required'
    },
    {
        id: 'authority',
        title: 'Hospital / Clinic',
        desc: 'Submit bulk X-rays for review by verified radiologists on the platform.',
        icon: <Building2 size={32} />,
        color: 'from-violet-500 to-purple-500',
        bg: 'bg-violet-50',
        border: 'border-violet-200',
        features: ['Bulk X-ray uploads', 'Track all submissions', 'Receive verified reports'],
        badge: 'Verification Required'
    }
];

const RoleSelectionPage = ({ setView, onRoleSelected }) => {
    const [loading, setLoading] = React.useState(null);

    const handleSelect = (roleId) => {
        // Save locally — instant, no network
        localStorage.setItem('radiai_role', roleId);

        // Background sync (fire-and-forget, never blocks UI)
        supabase.auth.updateUser({ data: { role: roleId } }).catch(() => { });

        // Proceed immediately
        onRoleSelected(roleId);
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-28 pb-12">
            <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold mb-4">
                        <Shield size={14} />
                        <span>SECURE ROLE SELECTION</span>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">How will you use RadiAI?</h1>
                    <p className="text-slate-500 text-lg max-w-xl mx-auto">Select your role to get started. Doctors and authorities require verification.</p>
                </div>

                {/* Role Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            className={`relative bg-white rounded-2xl border ${role.border} p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col`}
                            onClick={() => !loading && handleSelect(role.id)}
                        >
                            {/* Badge */}
                            {role.badge && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-amber-200 whitespace-nowrap">
                                        {role.badge}
                                    </span>
                                </div>
                            )}

                            {/* Icon */}
                            <div className={`w-16 h-16 ${role.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <div className={`bg-gradient-to-br ${role.color} bg-clip-text text-transparent`}>
                                    {React.cloneElement(role.icon, { className: `text-transparent bg-gradient-to-br ${role.color}`, style: { stroke: 'url(#grad)' } })}
                                </div>
                                <div className={`w-16 h-16 absolute ${role.bg} rounded-2xl flex items-center justify-center`}>
                                    {role.icon}
                                </div>
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{role.title}</h3>
                            <p className="text-sm text-slate-500 mb-4 flex-1">{role.desc}</p>

                            {/* Features */}
                            <ul className="space-y-2 mb-6">
                                {role.features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            {/* Button */}
                            <Button
                                disabled={loading === role.id}
                                className="w-full"
                            >
                                {loading === role.id ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>Continue as {role.title}</span>
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RoleSelectionPage;
