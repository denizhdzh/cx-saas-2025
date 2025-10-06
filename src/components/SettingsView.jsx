import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from 'firebase/auth';
import { auth } from '../firebase';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserIcon,
  LockPasswordIcon,
  Delete02Icon,
  ArrowLeft01Icon,
  Mail01Icon,
  Camera01Icon
} from '@hugeicons/core-free-icons';

export default function SettingsView({ onBack }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const [activeSection, setActiveSection] = useState('account');
  const [accountForm, setAccountForm] = useState({
    displayName: '',
    email: '',
    photoURL: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();

        setAccountForm({
          displayName: userData?.displayName || user.displayName || '',
          email: user.email || '',
          photoURL: userData?.photoURL || user.photoURL || ''
        });
        setLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const sections = [
    { id: 'account', title: 'Account', icon: UserIcon },
    { id: 'password', title: 'Password', icon: LockPasswordIcon },
    { id: 'delete', title: 'Delete Account', icon: Delete02Icon }
  ];

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showNotification('Image size must be less than 2MB', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setAccountForm({ ...accountForm, photoURL: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAccountSave = async () => {
    try {
      // Update Firebase Auth profile (only displayName, photoURL is too long for base64)
      await updateProfile(auth.currentUser, {
        displayName: accountForm.displayName
      });

      // Update Firestore user document (includes base64 photoURL)
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: accountForm.displayName,
        photoURL: accountForm.photoURL,
        updatedAt: new Date().toISOString()
      });

      showNotification('Account updated successfully!', 'success');

      // Refresh user context to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Error updating account:', error);
      showNotification('Error updating account: ' + error.message, 'error');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotification('New passwords do not match!', 'error');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showNotification('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordForm.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update password
      await updatePassword(auth.currentUser, passwordForm.newPassword);

      showNotification('Password changed successfully!', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        showNotification('Current password is incorrect', 'error');
      } else {
        showNotification('Error changing password: ' + error.message, 'error');
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      showNotification('Please type DELETE to confirm', 'error');
      return;
    }

    try {
      // Delete all user's agents
      const agentsQuery = query(collection(db, 'agents'), where('userId', '==', user.uid));
      const agentsSnapshot = await getDocs(agentsQuery);

      for (const agentDoc of agentsSnapshot.docs) {
        await deleteDoc(doc(db, 'agents', agentDoc.id));
      }

      // Delete user document
      await deleteDoc(doc(db, 'users', user.uid));

      // Delete Firebase Auth account
      await deleteUser(auth.currentUser);

      showNotification('Account deleted successfully', 'success');
      navigate('/signin');
    } catch (error) {
      console.error('Error deleting account:', error);
      showNotification('Error deleting account: ' + error.message, 'error');
    }
  };

  const renderAccountSection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Profile Picture */}
        <div>
          <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">
            Profile Picture
          </label>
          <div className="flex items-center gap-4">
            <div className="relative">
              {accountForm.photoURL ? (
                <img
                  src={accountForm.photoURL}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-stone-200 dark:border-stone-700"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
                  <span className="text-2xl font-bold text-stone-500">
                    {accountForm.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="absolute bottom-0 right-0 p-1.5 bg-stone-800 dark:bg-stone-100 rounded-full cursor-pointer hover:opacity-90 transition-opacity"
              >
                <HugeiconsIcon icon={Camera01Icon} className="w-3 h-3 text-stone-50 dark:text-stone-900" />
              </label>
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400">
              Click the camera icon to upload a new photo (max 2MB)
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={accountForm.displayName}
            onChange={(e) => setAccountForm({ ...accountForm, displayName: e.target.value })}
            className="form-input text-sm bg-transparent border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-50"
            placeholder="Your Name"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
            Email Address
          </label>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Mail01Icon} className="w-4 h-4 text-stone-400" />
            <input
              type="email"
              value={accountForm.email}
              disabled
              className="form-input text-sm bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400 cursor-not-allowed flex-1"
            />
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Email cannot be changed
          </p>
        </div>

        <div className="pt-4">
          <button
            onClick={handleAccountSave}
            className="btn-primary text-sm py-2 px-4"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );

  const renderPasswordSection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
            Current Password
          </label>
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            className="form-input text-sm bg-transparent border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-50"
            placeholder="Enter current password"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
            New Password
          </label>
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            className="form-input text-sm bg-transparent border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-50"
            placeholder="Enter new password (min 6 characters)"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            className="form-input text-sm bg-transparent border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-50"
            placeholder="Confirm new password"
          />
        </div>

        <div className="pt-4">
          <button
            onClick={handlePasswordChange}
            className="btn-primary text-sm py-2 px-4"
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  );

  const renderDeleteSection = () => (
    <div className="space-y-6">
      <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
        <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">⚠️ Danger Zone</h4>
        <p className="text-xs text-stone-700 dark:text-stone-300 mb-4">
          Once you delete your account, there is no going back. This will permanently delete your account, all agents, analytics data, and conversations.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Type <span className="font-bold">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="form-input text-sm bg-transparent border border-red-300 dark:border-red-700 text-stone-900 dark:text-stone-50"
              placeholder="DELETE"
            />
          </div>

          <button
            onClick={handleDeleteAccount}
            disabled={deleteConfirmation !== 'DELETE'}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Delete Account Permanently
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-stone-50"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 p-2 text-stone-900 dark:text-stone-50 hover:text-stone-500 transition-colors rounded-lg hover:bg-stone-200 dark:md:hover:bg-stone-800 cursor-pointer"
            title="Back to Dashboard"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
            <span className="text-xs text-stone-500">Back</span>
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-thin text-stone-900 dark:text-stone-50">Settings</h1>
            <div className="w-12 h-px bg-stone-900 dark:bg-stone-100 mt-4"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-8">
        {/* Left Sidebar - Section Navigation */}
        <div className="w-64 bg-transparent p-1">
          <div className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-1 px-4 py-2 text-left rounded-lg hover:bg-stone-800 dark:md:hover:bg-stone-100 hover:text-white dark:md:hover:text-stone-900 transition-colors group ${
                    activeSection === section.id ? 'bg-stone-800 dark:bg-stone-100 text-white dark:text-black' : ''
                  }`}
                >
                  <HugeiconsIcon
                    icon={Icon}
                    className={`w-4 h-4 transition-colors ${
                      activeSection === section.id ? 'text-white dark:text-black' : 'text-stone-500 group-hover:text-white dark:md:group-hover:text-stone-900'
                    }`}
                  />
                  <span className={`text-sm font-medium transition-colors ${
                    activeSection === section.id ? 'text-white dark:text-black' : 'text-stone-900 dark:text-stone-50 dark:md:group-hover:text-stone-900 group-hover:text-white'
                  }`}>{section.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content - Section Content */}
        <div className="flex-1 bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <h2 className="text-lg font-medium text-stone-900 dark:text-stone-50 mb-6">
            {sections.find(s => s.id === activeSection)?.title}
          </h2>

          {activeSection === 'account' && renderAccountSection()}
          {activeSection === 'password' && renderPasswordSection()}
          {activeSection === 'delete' && renderDeleteSection()}
        </div>
      </div>
    </div>
  );
}
