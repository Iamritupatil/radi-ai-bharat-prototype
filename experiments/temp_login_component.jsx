
const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        // Future Supabase connection here
        console.log("Login attempt:", { email, password });
        navigate('dashboard'); // Simulate login success
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-cyan-50"></div>

            {/* Main Login Container */}
            <div className="relative w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-1000 z-10">
                {/* Glass Card - Light Mode Adaptation */}
                <div className="relative backdrop-blur-xl bg-white/70 border border-white/50 rounded-3xl shadow-2xl overflow-hidden">

                    {/* Split Layout */}
                    <div className="flex flex-col lg:flex-row min-h-[600px]">
                        {/* Left Side - Login Form */}
                        <div className="flex-1 p-8 space-y-6 flex flex-col justify-center">
                            {/* Header */}
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl mx-auto shadow-lg flex items-center justify-center mb-4">
                                    <Lock className="text-white w-8 h-8" />
                                </div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
                                <p className="text-slate-500 text-sm">Sign in to your doctor account</p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleLogin} className="space-y-5">
                                {/* Email Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 block">Email address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300"
                                            placeholder="Enter your email"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 block">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300"
                                            placeholder="Enter your password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Remember Me & Forgot Password */}
                                <div className="flex items-center justify-between text-sm">
                                    <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        <span>Remember me</span>
                                    </label>
                                    <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Forgot password?</a>
                                </div>

                                {/* Login Button */}
                                <button type="submit" className="w-full hover:shadow-lg hover:shadow-blue-500/20 transform hover:scale-[1.02] transition-all duration-300 flex font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl py-3 px-4 shadow-md space-x-2 items-center justify-center">
                                    <span>Sign in</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="relative flex items-center">
                                <div className="flex-1 border-t border-slate-200"></div>
                                <span className="px-3 text-slate-400 text-sm">or</span>
                                <div className="flex-1 border-t border-slate-200"></div>
                            </div>

                            {/* Social Login */}
                            <div className="space-y-3">
                                <button className="w-full py-3 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-all duration-300 flex items-center justify-center space-x-2">
                                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path>
                                    </svg>
                                    <span>Continue with Google</span>
                                </button>
                            </div>
                        </div>

                        {/* Vertical Divider */}
                        <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent"></div>

                        {/* Right Side - Welcome Content */}
                        <div className="flex-1 p-8 flex flex-col justify-center space-y-6 bg-blue-50/50">
                            <div className="space-y-4">
                                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-lg border border-blue-100">
                                    <Brain className="w-10 h-10 text-blue-600" />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Join RadiAI Network</h2>
                                <p className="text-slate-600 text-lg leading-relaxed">Experience the next generation of AI-assisted radiology designed to streamline your workflow.</p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { title: "Advanced Analytics", desc: "Detailed insights into diagnostic performance" },
                                    { title: "Real-time Collaboration", desc: "Consult with peers instantly" },
                                    { title: "Enterprise Security", desc: "HIPAA compliant data protection" }
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-start space-x-3">
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-slate-900 font-medium">{feature.title}</h3>
                                            <p className="text-slate-500 text-sm">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
