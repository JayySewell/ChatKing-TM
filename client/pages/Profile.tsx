import React, { useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Switch } from "../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { Camera, Edit, Save, X, Shield, Bell, Palette, Globe, Zap, Calendar, MessageSquare, Search, Calculator, Award, User, Mail, Key, Eye, EyeOff } from "lucide-react";
import { toast } from "../hooks/use-toast";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  profileImage?: string;
  isOwner: boolean;
  isVerified: boolean;
  isActive: boolean;
  googleWorkspaceId?: string;
  createdAt: string;
  lastLogin: string;
  preferences: {
    theme: 'dark' | 'light' | 'auto';
    language: string;
    aiModel: string;
    searchEngine: string;
    contentFilter: boolean;
    ageVerified: boolean;
    notifications: {
      email: boolean;
      push: boolean;
      security: boolean;
    };
  };
  stats: {
    totalChats: number;
    totalSearches: number;
    totalCalculations: number;
    joinedAt: string;
    lastActive: string;
    strikes: number;
    reputation: number;
  };
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    bio: "",
    preferences: {
      theme: "auto" as const,
      language: "en",
      aiModel: "google/gemma-2-9b-it:free",
      searchEngine: "brave",
      contentFilter: true,
      notifications: {
        email: true,
        push: true,
        security: true,
      },
    },
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    showCurrent: false,
    showNew: false,
    showConfirm: false,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");
      if (!userId) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/auth/profile/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to load profile");
      }

      const profileData = await response.json();
      setProfile(profileData);
      setFormData({
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        username: profileData.username || "",
        bio: profileData.bio || "",
        preferences: {
          ...profileData.preferences,
        },
      });
    } catch (error) {
      console.error("Failed to load profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const userId = localStorage.getItem("userId");
      if (!userId) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/auth/profile/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setImageUploading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('profileImage', file);
      formData.append('userId', localStorage.getItem("userId") || "");

      const response = await fetch('/api/auth/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();
      
      // Update profile with new image URL
      if (profile) {
        setProfile({
          ...profile,
          profileImage: result.imageUrl,
        });
      }

      toast({
        title: "Success",
        description: "Profile image updated successfully",
      });
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile image",
        variant: "destructive",
      });
    } finally {
      setImageUploading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: localStorage.getItem("userId"),
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        showCurrent: false,
        showNew: false,
        showConfirm: false,
      });
      setShowPasswordChange(false);

      toast({
        title: "Success",
        description: "Password changed successfully",
      });
    } catch (error) {
      console.error('Failed to change password:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string, username?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (username) {
      return username.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              </div>
              <div className="lg:col-span-2">
                <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Profile Not Found
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Unable to load your profile information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Profile Settings
          </h1>
          <div className="flex items-center gap-2">
            {profile.isOwner && (
              <Badge variant="secondary" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                <Shield className="w-3 h-3 mr-1" />
                Owner
              </Badge>
            )}
            {profile.isVerified && (
              <Badge variant="secondary" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <Award className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Settings</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Image Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Profile Photo
                  </CardTitle>
                  <CardDescription>
                    Update your profile picture
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="w-32 h-32">
                      <AvatarImage src={profile.profileImage} alt={profile.username} />
                      <AvatarFallback className="text-2xl">
                        {getInitials(profile.firstName, profile.lastName, profile.username)}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-0 right-0 rounded-full p-2 h-8 w-8"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={imageUploading}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  {imageUploading && (
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Uploading...
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">
                      {profile.firstName && profile.lastName 
                        ? `${profile.firstName} ${profile.lastName}`
                        : profile.username
                      }
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {profile.email}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      Last active: {formatLastActive(profile.lastLogin)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Information Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Personal Information
                      </CardTitle>
                      <CardDescription>
                        Update your personal details
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Enter your username"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Tell us a bit about yourself..."
                      rows={4}
                      maxLength={500}
                    />
                    <div className="text-xs text-slate-500 mt-1">
                      {formData.bio.length}/500 characters
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                      >
                        {saving ? (
                          <>Saving...</>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Appearance Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Appearance
                  </CardTitle>
                  <CardDescription>
                    Customize your interface appearance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={formData.preferences.theme}
                      onValueChange={(value: 'dark' | 'light' | 'auto') => 
                        setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, theme: value }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={formData.preferences.language}
                      onValueChange={(value) => 
                        setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, language: value }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* AI & Search Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    AI & Search
                  </CardTitle>
                  <CardDescription>
                    Configure AI model and search preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="aiModel">Default AI Model</Label>
                    <Select
                      value={formData.preferences.aiModel}
                      onValueChange={(value) => 
                        setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, aiModel: value }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google/gemma-2-9b-it:free">Gemma 2 9B (Free)</SelectItem>
                        <SelectItem value="meta-llama/llama-3.1-8b-instruct:free">Llama 3.1 8B (Free)</SelectItem>
                        <SelectItem value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="openai/gpt-4o-mini">GPT-4o Mini</SelectItem>
                        <SelectItem value="anthropic/claude-3-haiku">Claude 3 Haiku</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="searchEngine">Search Engine</Label>
                    <Select
                      value={formData.preferences.searchEngine}
                      onValueChange={(value) => 
                        setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, searchEngine: value }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brave">Brave Search</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="bing">Bing</SelectItem>
                        <SelectItem value="duckduckgo">DuckDuckGo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="contentFilter">Content Filtering</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Enable content filtering for safe browsing
                      </p>
                    </div>
                    <Switch
                      id="contentFilter"
                      checked={formData.preferences.contentFilter}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, contentFilter: checked }
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notifications
                  </CardTitle>
                  <CardDescription>
                    Manage your notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications">Email Notifications</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Receive updates via email
                      </p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={formData.preferences.notifications.email}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          preferences: {
                            ...formData.preferences,
                            notifications: {
                              ...formData.preferences.notifications,
                              email: checked
                            }
                          }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pushNotifications">Push Notifications</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Receive browser notifications
                      </p>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={formData.preferences.notifications.push}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          preferences: {
                            ...formData.preferences,
                            notifications: {
                              ...formData.preferences.notifications,
                              push: checked
                            }
                          }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="securityNotifications">Security Alerts</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Important security notifications
                      </p>
                    </div>
                    <Switch
                      id="securityNotifications"
                      checked={formData.preferences.notifications.security}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          preferences: {
                            ...formData.preferences,
                            notifications: {
                              ...formData.preferences.notifications,
                              security: checked
                            }
                          }
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Save Preferences Button */}
              <Card className="lg:col-span-2">
                <CardContent className="pt-6">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? (
                      <>Saving Preferences...</>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Account Security */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Account Security
                  </CardTitle>
                  <CardDescription>
                    Manage your account security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{profile.email}</span>
                      {profile.isVerified && (
                        <Badge variant="secondary" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Last changed: {formatDate(profile.lastLogin)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPasswordChange(true)}
                      >
                        Change Password
                      </Button>
                    </div>
                  </div>

                  {profile.googleWorkspaceId && (
                    <div className="space-y-2">
                      <Label>Google Workspace</Label>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <span className="text-sm">Connected</span>
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Account Information
                  </CardTitle>
                  <CardDescription>
                    Your account details and status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-slate-500">Account Created</Label>
                      <p>{formatDate(profile.createdAt)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Last Login</Label>
                      <p>{formatDate(profile.lastLogin)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Account Status</Label>
                      <p className="flex items-center gap-1">
                        {profile.isActive ? (
                          <>
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Active
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            Inactive
                          </>
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Security Score</Label>
                      <p className="flex items-center gap-1">
                        {profile.stats.strikes === 0 ? (
                          <>
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Excellent
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            {profile.stats.strikes} warning{profile.stats.strikes !== 1 ? 's' : ''}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Password Change Dialog */}
            <AlertDialog open={showPasswordChange} onOpenChange={setShowPasswordChange}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Change Password</AlertDialogTitle>
                  <AlertDialogDescription>
                    Enter your current password and choose a new one.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={passwordData.showCurrent ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value
                        })}
                        placeholder="Enter current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setPasswordData({
                          ...passwordData,
                          showCurrent: !passwordData.showCurrent
                        })}
                      >
                        {passwordData.showCurrent ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={passwordData.showNew ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value
                        })}
                        placeholder="Enter new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setPasswordData({
                          ...passwordData,
                          showNew: !passwordData.showNew
                        })}
                      >
                        {passwordData.showNew ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={passwordData.showConfirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value
                        })}
                        placeholder="Confirm new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setPasswordData({
                          ...passwordData,
                          showConfirm: !passwordData.showConfirm
                        })}
                      >
                        {passwordData.showConfirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handlePasswordChange}
                    disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  >
                    {saving ? "Changing..." : "Change Password"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile.stats.totalChats.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    AI conversations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile.stats.totalSearches.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Web searches performed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Calculations</CardTitle>
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile.stats.totalCalculations.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Math operations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reputation</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile.stats.reputation}</div>
                  <p className="text-xs text-muted-foreground">
                    Community score
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Account Timeline</CardTitle>
                <CardDescription>
                  Your journey with ChatKing AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium">Account Created</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {formatDate(profile.stats.joinedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">First AI Chat</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Started your AI journey
                      </p>
                    </div>
                  </div>

                  {profile.isVerified && (
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                        <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium">Account Verified</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Email verification completed
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="font-medium">Last Activity</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {formatLastActive(profile.stats.lastActive)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
