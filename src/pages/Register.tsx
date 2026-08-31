import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Heart, User, Mail, Phone, Eye, EyeOff, ShieldAlert, 
  ArrowLeft, ArrowRight, UserCheck, Loader2, 
  MapPin, ShieldCheck, ClipboardCheck, Calendar, 
  Building2, ShieldAlert as AlertIcon
} from 'lucide-react';
import { authService } from '../services/auth';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Wizard states
  // 1 = Basic Info, 2 = Capability Selection, 3 = Dynamic Profile Forms, 4 = Confirmation
  const [step, setStep] = useState(1);
  const [formIndex, setFormIndex] = useState(0); // Tracks current sub-form inside Step 3
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // User Capability Flags
  const [wantToDonate, setWantToDonate] = useState(false);
  const [wantToRequest, setWantToRequest] = useState(false);
  const [isHospitalAccount, setIsHospitalAccount] = useState(false);

  // Profile Details
  const [donorProfile, setDonorProfile] = useState({
    bloodGroup: '',
    location: '',
    availabilityStatus: 'AVAILABLE' as 'AVAILABLE' | 'UNAVAILABLE' | 'TEMPORARILY_UNAVAILABLE',
    preferredRadius: '10',
    lastDonationDate: '',
  });

  const [receiverProfile, setReceiverProfile] = useState({
    location: '',
    emergencyContact: '',
  });

  const [hospitalProfile, setHospitalProfile] = useState({
    hospitalName: '',
    hospitalAddress: '',
    contactNumber: '',
    registrationNumber: '',
  });

  // Parse query parameters to pre-select capabilities
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam) {
      const paramVal = roleParam.toLowerCase();
      if (paramVal === 'donor') {
        setWantToDonate(true);
        setWantToRequest(false);
        setIsHospitalAccount(false);
      } else if (paramVal === 'receiver') {
        setWantToDonate(false);
        setWantToRequest(true);
        setIsHospitalAccount(false);
      } else if (paramVal === 'hospital') {
        setWantToDonate(false);
        setWantToRequest(false);
        setIsHospitalAccount(true);
      }
    }
  }, [searchParams]);

  // Determine which forms to show in Step 3 based on capabilities
  const getActiveForms = (): Array<'DONOR' | 'RECEIVER' | 'HOSPITAL'> => {
    const forms: Array<'DONOR' | 'RECEIVER' | 'HOSPITAL'> = [];
    if (isHospitalAccount) {
      forms.push('HOSPITAL');
    } else {
      if (wantToDonate) forms.push('DONOR');
      if (wantToRequest) forms.push('RECEIVER');
    }
    return forms;
  };

  const activeForms = getActiveForms();

  // Validate Basic Info (Step 1)
  const validateStep1 = (): boolean => {
    setError('');
    const { name, email, phone, password, confirmPassword } = basicInfo;

    if (!name || !email || !phone || !password || !confirmPassword) {
      setError('Please fill in all basic registration fields.');
      return false;
    }

    // Email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please provide a valid email address.');
      return false;
    }

    // Phone regex
    const phoneRegex = /^\+?[1-9]\d{1,14}$|^[0-9]{10}$/;
    if (!phoneRegex.test(phone.replace(/[\s-()]/g, ''))) {
      setError('Please provide a valid phone number (at least 10 digits).');
      return false;
    }

    // Password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your entries.');
      return false;
    }

    return true;
  };

  // Validate Current Form in Step 3
  const validateCurrentForm = (formType: 'DONOR' | 'RECEIVER' | 'HOSPITAL'): boolean => {
    setError('');
    if (formType === 'DONOR') {
      const { bloodGroup, location, preferredRadius } = donorProfile;
      if (!bloodGroup) {
        setError('Please select your Blood Group.');
        return false;
      }
      if (!location.trim()) {
        setError('Please enter your primary location or city.');
        return false;
      }
      const radiusNum = Number(preferredRadius);
      if (isNaN(radiusNum) || radiusNum <= 0) {
        setError('Please enter a valid radius distance.');
        return false;
      }
    } else if (formType === 'RECEIVER') {
      const { location, emergencyContact } = receiverProfile;
      if (!location.trim()) {
        setError('Please specify your current location or area.');
        return false;
      }
      if (!emergencyContact.trim()) {
        setError('Please specify an emergency contact phone number.');
        return false;
      }
    } else if (formType === 'HOSPITAL') {
      const { hospitalName, hospitalAddress, contactNumber, registrationNumber } = hospitalProfile;
      if (!hospitalName.trim() || !hospitalAddress.trim() || !contactNumber.trim() || !registrationNumber.trim()) {
        setError('All hospital details, including verification licenses, are required.');
        return false;
      }
    }
    return true;
  };

  // Traversal clicks
  const handleNextStep1 = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleNextStep2 = () => {
    setError('');
    if (!isHospitalAccount && !wantToDonate && !wantToRequest) {
      setError('Please select at least one capability (Donate Blood and/or Request Blood), or choose Hospital account.');
      return;
    }
    setStep(3);
    setFormIndex(0);
  };

  const handleBack = () => {
    setError('');
    if (step === 3 && formIndex > 0) {
      setFormIndex(formIndex - 1);
    } else {
      setStep((prev) => Math.max(1, prev - 1));
    }
  };

  // Handle Form Progress in Step 3 / Registration Submission
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const currentFormType = activeForms[formIndex];
    if (!validateCurrentForm(currentFormType)) return;

    // Check if there's another form to show in Step 3 (e.g. user selected BOTH donor & receiver)
    if (formIndex + 1 < activeForms.length) {
      setFormIndex(formIndex + 1);
      return;
    }

    // If it was the last form, submit to database
    setIsLoading(true);
    try {
      const payload: any = {};
      if (wantToDonate) {
        payload.donorProfile = donorProfile;
      }
      if (wantToRequest) {
        payload.receiverProfile = receiverProfile;
      }
      if (isHospitalAccount) {
        payload.hospitalProfile = hospitalProfile;
      }

      await authService.register(
        {
          name: basicInfo.name,
          email: basicInfo.email,
          phone: basicInfo.phone,
          password: basicInfo.password,
          role: isHospitalAccount ? 'HOSPITAL' : 'USER',
        },
        payload
      );

      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDashboardRedirect = () => {
    if (isHospitalAccount) {
      navigate('/hospital/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const togglePublicCapability = (type: 'DONATE' | 'REQUEST') => {
    setIsHospitalAccount(false);
    if (type === 'DONATE') {
      setWantToDonate(!wantToDonate);
    } else {
      setWantToRequest(!wantToRequest);
    }
  };

  const toggleHospitalAccount = () => {
    setIsHospitalAccount(!isHospitalAccount);
    setWantToDonate(false);
    setWantToRequest(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-rose-200/20 blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-100/20 blur-3xl -z-10" />

      {/* Back to Home button */}
      {step < 4 && (
        <div className="absolute top-6 left-6">
          <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      )}

      {/* Header Info */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-rose-600 p-2.5 rounded-2xl text-white shadow-lg flex items-center justify-center">
            <Heart className="h-6 w-6 fill-current animate-pulse" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Create Your Account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Step {step} of 4 • {step === 1 ? 'Credentials' : step === 2 ? 'Capabilities' : step === 3 ? `Onboarding (${formIndex + 1}/${activeForms.length})` : 'Confirmation'}
        </p>
        
        {/* Progress Indicator Bar */}
        <div className="mt-4 max-w-xs mx-auto bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-rose-600 h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow-xl border border-slate-100 sm:rounded-2xl sm:px-10">
          
          {/* Display Errors */}
          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-xl flex items-start gap-2.5 text-sm font-medium">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Full Name</label>
                <div className="mt-1.5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={basicInfo.name}
                    onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                    placeholder="Rahul Sharma"
                    className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Email Address</label>
                <div className="mt-1.5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={basicInfo.email}
                    onChange={(e) => setBasicInfo({ ...basicInfo, email: e.target.value })}
                    placeholder="rahul@example.com"
                    className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Phone Number</label>
                <div className="mt-1.5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={basicInfo.phone}
                    onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                    placeholder="+919876543210"
                    className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Password</label>
                  <div className="mt-1.5 relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={basicInfo.password}
                      onChange={(e) => setBasicInfo({ ...basicInfo, password: e.target.value })}
                      placeholder="Min 6 chars"
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">Confirm Password</label>
                  <div className="mt-1.5 relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={basicInfo.confirmPassword}
                      onChange={(e) => setBasicInfo({ ...basicInfo, confirmPassword: e.target.value })}
                      placeholder="Confirm password"
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Already registered? <Link to="/login" className="text-rose-600 font-bold hover:underline">Log in</Link></span>
                <button
                  onClick={handleNextStep1}
                  className="bg-rose-600 text-white font-bold py-3 px-5 rounded-xl hover:bg-rose-700 shadow flex items-center gap-1.5 transition-all text-sm animate-pulse"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Capability Selection (Dual Option Configuration) */}
          {step === 2 && (
            <div>
              <div className="border-b border-slate-100 pb-3 mb-5">
                <h3 className="text-lg font-bold text-slate-900">
                  How would you like to use Raktsetu?
                </h3>
                <p className="text-xs text-slate-400 mt-1">Select one or both capabilities. You can toggle these preferences later.</p>
              </div>

              <div className="space-y-4">
                {/* 1. Donate Blood Checkbox */}
                <label 
                  className={`p-5 rounded-2xl border flex items-start gap-4 transition-all cursor-pointer ${
                    wantToDonate 
                      ? 'border-rose-600 bg-rose-50/20 ring-2 ring-rose-600/10' 
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={wantToDonate}
                    onChange={() => togglePublicCapability('DONATE')}
                    className="h-5 w-5 text-rose-600 focus:ring-rose-500 rounded mt-1 cursor-pointer border-slate-350"
                  />
                  <div>
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-1.5 select-none">
                      🩸 Donate Blood
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed select-none">
                      Help others by donating when you are healthy and medically eligible. Keep track of availability.
                    </p>
                  </div>
                </label>

                {/* 2. Request Blood Checkbox */}
                <label 
                  className={`p-5 rounded-2xl border flex items-start gap-4 transition-all cursor-pointer ${
                    wantToRequest 
                      ? 'border-rose-600 bg-rose-50/20 ring-2 ring-rose-600/10' 
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={wantToRequest}
                    onChange={() => togglePublicCapability('REQUEST')}
                    className="h-5 w-5 text-rose-600 focus:ring-rose-500 rounded mt-1 cursor-pointer border-slate-350"
                  />
                  <div>
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-1.5 select-none">
                      🆘 Request Blood
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed select-none">
                      Create and manage blood requirements when you or someone you are helping needs blood support.
                    </p>
                  </div>
                </label>

                {/* Separator */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-100" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-slate-400 font-bold select-none">Or Facility Portal</span>
                  </div>
                </div>

                {/* 3. Hospital Card Option */}
                <label 
                  className={`p-5 rounded-2xl border flex items-start gap-4 transition-all cursor-pointer ${
                    isHospitalAccount 
                      ? 'border-rose-600 bg-rose-50/20 ring-2 ring-rose-600/10' 
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isHospitalAccount}
                    onChange={toggleHospitalAccount}
                    className="h-5 w-5 text-rose-600 focus:ring-rose-500 rounded mt-1 cursor-pointer border-slate-350"
                  />
                  <div>
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-1.5 select-none">
                      🏥 Hospital / Blood Bank
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed select-none">
                      Register as an authorized healthcare or inventory facility. Undergoes manual coordinator verification.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-8 flex justify-between">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold text-sm"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                
                <button
                  onClick={handleNextStep2}
                  className="bg-rose-600 text-white font-bold py-3 px-5 rounded-xl hover:bg-rose-700 shadow flex items-center gap-1.5 transition-all text-sm"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Dynamic Profile Forms (Sequence activeForms) */}
          {step === 3 && activeForms.length > 0 && (
            <form onSubmit={handleStep3Submit} className="space-y-5">
              
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                  <span>Profile Form Onboarding ({formIndex + 1}/{activeForms.length}):</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 border border-rose-100 text-rose-700 uppercase">
                    {activeForms[formIndex]}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Please provide specific details to initialize this capability.</p>
              </div>

              {/* 🩸 DONOR FORM SUB-VIEW */}
              {activeForms[formIndex] === 'DONOR' && (
                <div className="space-y-4">
                  {/* Medical Eligibility Disclaimer */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 font-semibold leading-relaxed">
                      Please ensure you are medically eligible to donate blood. <strong>Raktsetu does not provide medical clearance.</strong> Consult your doctor if you have any health concerns before donating.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Blood Group</label>
                      <select
                        required
                        value={donorProfile.bloodGroup}
                        onChange={(e) => setDonorProfile({ ...donorProfile, bloodGroup: e.target.value })}
                        className="mt-1.5 block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                      >
                        <option value="">Select Group</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Initial Availability</label>
                      <select
                        value={donorProfile.availabilityStatus}
                        onChange={(e) => setDonorProfile({ ...donorProfile, availabilityStatus: e.target.value as any })}
                        className="mt-1.5 block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                      >
                        <option value="AVAILABLE">Active / Online</option>
                        <option value="UNAVAILABLE">Busy / Offline</option>
                        <option value="TEMPORARILY_UNAVAILABLE">Temporarily Unavailable</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Donor Location (City / Area)</label>
                    <div className="mt-1.5 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <MapPin className="h-4.5 w-4.5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={donorProfile.location}
                        onChange={(e) => setDonorProfile({ ...donorProfile, location: e.target.value })}
                        placeholder="e.g. Salt Lake, Kolkata"
                        className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Preferred Radius (km)</label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        required
                        value={donorProfile.preferredRadius}
                        onChange={(e) => setDonorProfile({ ...donorProfile, preferredRadius: e.target.value })}
                        className="mt-1.5 block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Last Donation Date</label>
                      <div className="mt-1.5 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Calendar className="h-4.5 w-4.5" />
                        </div>
                        <input
                          type="date"
                          value={donorProfile.lastDonationDate}
                          onChange={(e) => setDonorProfile({ ...donorProfile, lastDonationDate: e.target.value })}
                          className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Leave empty if this is your first donation.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 🆘 RECEIVER FORM SUB-VIEW */}
              {activeForms[formIndex] === 'RECEIVER' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Receiver Location (City / Base)</label>
                    <div className="mt-1.5 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <MapPin className="h-4.5 w-4.5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={receiverProfile.location}
                        onChange={(e) => setReceiverProfile({ ...receiverProfile, location: e.target.value })}
                        placeholder="e.g. Salt Lake, Kolkata"
                        className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Emergency Contact Number</label>
                    <div className="mt-1.5 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="h-4.5 w-4.5" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={receiverProfile.emergencyContact}
                        onChange={(e) => setReceiverProfile({ ...receiverProfile, emergencyContact: e.target.value })}
                        placeholder="Guardian / standby relative phone number"
                        className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 🏥 HOSPITAL FORM SUB-VIEW */}
              {activeForms[formIndex] === 'HOSPITAL' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Hospital / Facility Name</label>
                    <div className="mt-1.5 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Building2 className="h-4.5 w-4.5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={hospitalProfile.hospitalName}
                        onChange={(e) => setHospitalProfile({ ...hospitalProfile, hospitalName: e.target.value })}
                        placeholder="City General Blood Center"
                        className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Facility Address</label>
                    <div className="mt-1.5 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <MapPin className="h-4.5 w-4.5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={hospitalProfile.hospitalAddress}
                        onChange={(e) => setHospitalProfile({ ...hospitalProfile, hospitalAddress: e.target.value })}
                        placeholder="Full physical facility address"
                        className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Official Contact Number</label>
                      <input
                        type="tel"
                        required
                        value={hospitalProfile.contactNumber}
                        onChange={(e) => setHospitalProfile({ ...hospitalProfile, contactNumber: e.target.value })}
                        placeholder="Direct desk or landline"
                        className="mt-1.5 block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700">License / Registration Number</label>
                      <input
                        type="text"
                        required
                        value={hospitalProfile.registrationNumber}
                        onChange={(e) => setHospitalProfile({ ...hospitalProfile, registrationNumber: e.target.value })}
                        placeholder="e.g. HOS-8921-WB"
                        className="mt-1.5 block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-800 leading-relaxed font-semibold">
                    <AlertIcon className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <span>Verification Pending:</span> <br />
                      Hospital registrations undergo mandatory documentation vetting. Once submitted, your profile remains in PENDING status until verification completes.
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 flex justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold text-sm"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md flex items-center gap-1.5 transition-all text-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : formIndex + 1 < activeForms.length ? (
                    <>
                      Next Details
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : activeForms[formIndex] === 'HOSPITAL' ? (
                    <>
                      Submit for Verification
                      <ClipboardCheck className="h-4.5 w-4.5" />
                    </>
                  ) : (
                    <>
                      Register Account
                      <UserCheck className="h-4.5 w-4.5" />
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

          {/* STEP 4: Success Confirmation */}
          {step === 4 && (
            <div className="text-center py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-6 mx-auto border-2 border-emerald-100">
                <ShieldCheck className="h-8 w-8 animate-bounce" />
              </div>

              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
                Registration Successful!
              </h3>
              
              <p className="text-sm text-slate-500 leading-relaxed mb-8 max-w-sm mx-auto">
                {isHospitalAccount 
                  ? 'Your hospital credentials have been submitted for verification. You can access your pending dashboard to check status details.'
                  : 'Your Raktsetu account is now set up. You can manage your donor eligibility and create blood requests from your unified dashboard.'}
              </p>

              <button
                onClick={handleDashboardRedirect}
                className="w-full bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-slate-800 transition-colors shadow-md text-sm"
              >
                Go to Dashboard
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
