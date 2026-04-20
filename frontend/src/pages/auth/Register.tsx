import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToastNotify } from '@/components/Toast';
import { validateEmail, validatePassword, validateName, validatePhone } from '@/utils/validators';
import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { cn } from '@/lib/utils';

interface Hostel {
  _id: string;
  name: string;
}

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToastNotify();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [room, setRoom] = useState('');
  const [hostelId, setHostelId] = useState('');
  const [role, setRole] = useState<'student' | 'owner'>('student');
  const [hostels, setHostels] = useState<Hostel[]>([]);
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchHostels = async () => {
      try {
        const response = await api.get<Hostel[]>(ENDPOINTS.HOSTELS.LIST);
        if (response.data) {
          setHostels(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch hostels:', err);
      }
    };
    fetchHostels();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const nameValidation = validateName(name);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const phoneValidation = validatePhone(phone);
    
    const newErrors: Record<string, string> = {};
    if (!nameValidation.valid) newErrors.name = nameValidation.error!;
    if (!emailValidation.valid) newErrors.email = emailValidation.error!;
    if (!passwordValidation.valid) newErrors.password = passwordValidation.error!;
    if (!phoneValidation.valid) newErrors.phone = phoneValidation.error!;
    if (!hostelId) newErrors.hostelId = 'Please select a hostel';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setIsLoading(true);

    const result = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim() || undefined,
      room: room.trim() || undefined,
      hostelId,
      role,
    });
    
    if (result.success) {
      toast.success('Account created successfully!');
      navigate(role === 'owner' ? '/owner' : '/products', { replace: true });
    } else {
      toast.error(result.error || 'Registration failed');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Home className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold text-foreground">HostelBite</span>
        </Link>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-foreground">Create account</h1>
            <p className="text-sm text-muted-foreground mt-1">Join HostelBite today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg border transition-all',
                    role === 'student'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-input hover:border-primary/50'
                  )}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg border transition-all',
                    role === 'owner'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-input hover:border-primary/50'
                  )}
                >
                  Shop Owner
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                autoComplete="name"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Hostel Selection */}
            <div>
              <label htmlFor="hostel" className="block text-sm font-medium text-foreground mb-1.5">
                Hostel *
              </label>
              <select
                id="hostel"
                value={hostelId}
                onChange={(e) => setHostelId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">Select your hostel</option>
                {hostels.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name}
                  </option>
                ))}
              </select>
              {errors.hostelId && (
                <p className="mt-1 text-xs text-destructive">{errors.hostelId}</p>
              )}
            </div>

            <div className="grid gap-4 grid-cols-2">
              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  autoComplete="tel"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-destructive">{errors.phone}</p>
                )}
              </div>

              {/* Room */}
              <div>
                <label htmlFor="room" className="block text-sm font-medium text-foreground mb-1.5">
                  Room
                </label>
                <input
                  type="text"
                  id="room"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g., A-101"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </div>

        {/* Sign In Link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/auth/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
