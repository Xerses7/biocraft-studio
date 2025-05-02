'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Shield, Mail, Calendar, Edit2, Save, User, Key } from 'lucide-react';

// Backend URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// User profile type definition
interface UserProfile {
  user_id: string;
  email: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  full_name?: string;
  organization?: string;
  role?: string;
  profile_picture?: string;
}

export default function AccountPage() {
  const router = useRouter();
  const { session, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editableProfile, setEditableProfile] = useState<Partial<UserProfile>>({});
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/?login=true');
    }
  }, [authLoading, isAuthenticated, router]);
  
  // Fetch user profile data when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session || !session.access_token) {
        console.log('No session or access token available');
        setIsLoading(false);
        setFetchError('You need to be logged in to view this page');
        return;
      }
      
      try {
        // Make sure we're using the correct backend URL
        const apiUrl = `${BACKEND_URL}/user/profile`;
        console.log('Fetching profile from:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          // Add to help with CORS issues
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Profile API error:', response.status, errorData);
          throw new Error(errorData.message || `API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        setUserProfile(data.profile);
        setEditableProfile({
          full_name: data.profile.full_name || '',
          organization: data.profile.organization || '',
        });
        setFetchError(null);
      } catch (error: any) {
        console.error('Error fetching user profile:', error);
        setFetchError(error.message || 'Failed to load your profile information');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load your profile information. Please try again later.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuthenticated && session) {
      fetchUserProfile();
    }
  }, [session, toast, isAuthenticated]);
  
  // Handle profile update
  const handleProfileUpdate = async () => {
    if (!session || !userProfile || !session.access_token) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Authentication required. Please log in again.',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/user/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editableProfile),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      setUserProfile({
        ...userProfile,
        ...data.profile,
      });
      
      toast({
        title: 'Profile updated',
        description: 'Your profile information has been successfully updated.',
      });
      
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update your profile information.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session || !session.access_token) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Authentication required. Please log in again.',
      });
      return;
    }
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }
    
    setIsChangingPassword(true);
    setPasswordError('');
    
    try {
      const response = await fetch(`${BACKEND_URL}/user/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `API responded with status: ${response.status}`);
      }
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast({
        title: 'Password Changed',
        description: 'Your password has been successfully updated.',
      });
    } catch (error: any) {
      console.error('Password change error:', error);
      setPasswordError(error.message || 'Failed to change password');
      toast({
        variant: 'destructive',
        title: 'Password Change Failed',
        description: error.message || 'Failed to change your password. Please try again.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  // Handle cancel edit
  const handleCancelEdit = () => {
    // Reset editable fields to current profile values
    if (userProfile) {
      setEditableProfile({
        full_name: userProfile.full_name || '',
        organization: userProfile.organization || '',
      });
    }
    setIsEditing(false);
  };
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Retry profile fetch
  const handleRetryFetch = () => {
    setIsLoading(true);
    setFetchError(null);
    
    // Force re-mount effect
    const timer = setTimeout(() => {
      if (isAuthenticated && session) {
        // This will trigger the useEffect again
        router.refresh();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  };
  
  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading account information...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }
  
  // Show error state with retry option
  if (fetchError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-md mx-auto bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Unable to load profile</h2>
          <p className="text-muted-foreground mb-4">{fetchError}</p>
          <div className="flex gap-4">
            <Button onClick={handleRetryFetch}>
              Retry
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Info Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  User Information
                </CardTitle>
                <CardDescription>
                  Your personal information and profile settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={editableProfile.full_name || ''}
                        onChange={(e) => setEditableProfile({
                          ...editableProfile,
                          full_name: e.target.value
                        })}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organization">Organization</Label>
                      <Input
                        id="organization"
                        value={editableProfile.organization || ''}
                        onChange={(e) => setEditableProfile({
                          ...editableProfile,
                          organization: e.target.value
                        })}
                        placeholder="Your organization"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="flex items-center mt-1">
                          <Mail className="mr-2 h-4 w-4 text-primary" />
                          {userProfile?.email || session?.user.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                        <p className="mt-1">{userProfile?.full_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Organization</p>
                        <p className="mt-1">{userProfile?.organization || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Role</p>
                        <p className="mt-1">{userProfile?.role || session?.user.role || 'Member'}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleProfileUpdate}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    disabled={isLoading}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </CardFooter>
            </Card>
            
            {/* Account Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Account Details
                </CardTitle>
                <CardDescription>
                  Information about your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Account Created</p>
                  <p className="mt-1 flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-primary" />
                    {formatDate(userProfile?.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="mt-1">{formatDate(userProfile?.updated_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Login</p>
                  <p className="mt-1">{formatDate(userProfile?.last_login)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User ID</p>
                  <p className="mt-1 text-xs text-muted-foreground truncate">
                    {userProfile?.user_id || session?.user.id}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Change Password Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="mr-2 h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      required
                    />
                  </div>
                  
                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Security Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline">Set Up</Button>
                </div>
                
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <p className="font-medium">Connected Accounts</p>
                    <p className="text-sm text-muted-foreground">
                      Manage accounts linked to your BioCraft profile
                    </p>
                  </div>
                  <Button variant="outline">Manage</Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button variant="destructive">Delete</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}