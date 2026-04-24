import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  CreditCard,
  Bell,
  Save,
  Loader2,
  Check,
  Crown,
  Zap,
  Eye,
  EyeOff,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { userApi, authApi } from '@/utils/api';
import { useNavigate } from 'react-router-dom';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'subscription', label: 'Subscription', icon: Crown },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileForm) => {
    setIsSaving(true);
    setSuccessMessage('');

    try {
      const response = await userApi.updateProfile(data);
      if (response.data.success) {
        updateUser(response.data.data.user);
        setSuccessMessage('Profile updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setIsSaving(true);
    setSuccessMessage('');

    try {
      const response = await userApi.changePassword(data);
      if (response.data.success) {
        setSuccessMessage('Password changed successfully');
        passwordForm.reset();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to change password:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCredits = async () => {
    try {
      const response = await userApi.addCredits(50);
      if (response.data.success) {
        updateUser({ credits: response.data.data.credits });
        setSuccessMessage('50 credits added!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to add credits:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      logout();
      navigate('/');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-display font-bold mb-8">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 p-1 rounded-xl bg-bg-tertiary w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-white/10 text-white'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Success message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 text-success flex items-center gap-2"
        >
          <Check className="w-5 h-5" />
          {successMessage}
        </motion.div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Avatar */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center text-3xl font-bold">
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-text-secondary text-sm">
                  Your avatar is automatically generated from your name.
                </p>
              </div>
            </div>
          </div>

          {/* Profile form */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <input
                  type="text"
                  {...profileForm.register('displayName')}
                  className="input-field"
                  placeholder="Your display name"
                />
                {profileForm.formState.errors.displayName && (
                  <p className="mt-2 text-sm text-error">
                    {profileForm.formState.errors.displayName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input-field opacity-60 cursor-not-allowed"
                />
                <p className="mt-2 text-sm text-text-muted">
                  Email cannot be changed
                </p>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Password change */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    {...passwordForm.register('currentPassword')}
                    className="input-field pr-12"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    {...passwordForm.register('newPassword')}
                    className="input-field pr-12"
                    placeholder="Enter new password (8+ characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Change Password
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Logout */}
          <div className="card p-6 border-error/20">
            <h2 className="text-lg font-semibold mb-2">Sign Out</h2>
            <p className="text-text-secondary text-sm mb-4">
              Sign out of your account on this device.
            </p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-error/50 text-error hover:bg-error/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </motion.div>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Current plan */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">Current Plan</h2>
                <p className="text-text-secondary text-sm">Your subscription details</p>
              </div>
              {user?.isPremium ? (
                <span className="px-3 py-1 rounded-full bg-warning/20 text-warning text-sm font-medium flex items-center gap-1">
                  <Crown className="w-4 h-4" />
                  Pro
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-bg-tertiary text-text-secondary text-sm">
                  Free
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-bg-tertiary">
                <div className="flex items-center gap-2 text-warning mb-1">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">Credits</span>
                </div>
                <p className="text-2xl font-bold">{user?.credits || 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-bg-tertiary">
                <div className="flex items-center gap-2 text-info mb-1">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <p className="text-lg font-bold">{user?.isPremium ? 'Premium' : 'Free'}</p>
              </div>
            </div>

            {/* Add credits (demo) */}
            {!user?.isPremium && (
              <div className="p-4 rounded-xl border border-accent-primary/20 bg-accent-primary/5">
                <h3 className="font-semibold mb-2">Add Credits</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Add more credits to continue creating amazing content.
                </p>
                <button
                  onClick={handleAddCredits}
                  className="btn-primary flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Add 50 Credits
                </button>
              </div>
            )}

            {user?.isPremium && (
              <div className="p-4 rounded-xl border border-success/20 bg-success/5">
                <h3 className="font-semibold text-success mb-2">Unlimited Access</h3>
                <p className="text-sm text-text-secondary">
                  You have unlimited generation capability with your Pro subscription.
                </p>
              </div>
            )}
          </div>

          {/* Features comparison */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Plan Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 font-medium">Feature</th>
                    <th className="text-center py-3 px-4 font-medium">Free</th>
                    <th className="text-center py-3 px-4 font-medium text-warning">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Credits', free: '100', pro: 'Unlimited' },
                    { feature: 'Image Generation', free: 'Yes', pro: 'Priority' },
                    { feature: 'Video Generation', free: 'Yes', pro: 'Priority' },
                    { feature: 'Text-to-Speech', free: 'Yes', pro: 'All voices' },
                    { feature: 'No Watermark', free: 'No', pro: 'Yes' },
                    { feature: 'Commercial Use', free: 'No', pro: 'Yes' },
                    { feature: 'Support', free: 'Community', pro: '24/7 Priority' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-3 px-4">{row.feature}</td>
                      <td className="py-3 px-4 text-center text-text-secondary">{row.free}</td>
                      <td className="py-3 px-4 text-center text-warning">{row.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
