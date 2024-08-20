import React, { useState } from 'react';
import { Card, YStack, Stack, Text, Input } from 'tamagui';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import IUser from '../../../../types/user.type';
import axios from 'axios';
import { blue } from '@mui/material/colors';
import { Button as MUIButton } from '@mui/material';

interface SettingsProps {
  currentUser: IUser & { accessToken: string };
  onUpdateUser: (updatedUser: IUser & { accessToken: string }) => void;
}

const Settings: React.FC<SettingsProps> = ({ currentUser, onUpdateUser }) => {
  const [username, setUsername] = useState(currentUser.username || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [password, setPassword] = useState(''); // Add state for password
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false); // Add state for password editing
  const [loading, setLoading] = useState(false);

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      const updatedUser = {
        ...currentUser,
        username,
        email,
        password: isEditingPassword ? password : undefined, // Only send password if it was edited
      };

      const response = await axios.put(
        'http://127.0.0.1:8080/api/auth/update',
        {
          id: currentUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          password: updatedUser.password,
        },
        {
          headers: {
            Authorization: `Bearer ${currentUser.accessToken}`,
          },
        }
      );

      if (response.data) {
        const updatedUserData = { ...updatedUser, accessToken: currentUser.accessToken };
        localStorage.setItem('user', JSON.stringify(updatedUserData));
        onUpdateUser(updatedUserData);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile.');
    } finally {
      setLoading(false);
      setIsEditingPassword(false); // Reset password editing state
    }
  };

  const maskValue = (value: string) => {
    if (value.length > 5) {
      return value.substring(0, 5) + '****';
    }
    return value;
  };

  const translateRole = (role: string) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return 'Admin';
      case 'ROLE_USER':
        return 'Client';
      default:
        return role;
    }
  };

  return (
    <Card backgroundColor="$gray9" padding="$4" borderRadius="$4" width="100%" style={{ maxWidth: '1000px' }}>
      <YStack space="$4">
        <Stack>
          <div style={{ marginLeft: '8px' }}>
            <Text style={{ fontSize: '32px', fontWeight: 'bold' }}>
              <strong>Profile</strong>
            </Text>
          </div>
        </Stack>
        <div style={{ marginLeft: '16px', marginTop: '16px' }}>
          <Text marginTop="$6">
            <strong>Account ID:</strong> {currentUser.id}
          </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '16px', marginTop: '20px' }}>
          <Text style={{ marginRight: '8px' }}><strong>Authorities:</strong></Text>
          <YStack space="$2">
            {currentUser.roles?.map((role, index) => (
              <Text key={index}>{translateRole(role)}</Text>
            ))}
          </YStack>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '16px', marginTop: '16px' }}>
          <Text style={{ marginRight: '8px' }}><strong>Username:</strong></Text>
          <Input
            placeholder="Username"
            value={isEditingUsername ? username : maskValue(username)}
            onChangeText={(value) => setUsername(value ?? '')} // Handle null or undefined values
            disabled={!isEditingUsername}
          />
          <IconButton onClick={() => setIsEditingUsername(!isEditingUsername)}>
            <EditIcon />
          </IconButton>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '16px', marginTop: '16px' }}>
          <Text style={{ marginRight: '8px' }}><strong>Email:</strong></Text>
          <Input
            placeholder="Email"
            value={isEditingEmail ? email : maskValue(email)}
            onChangeText={(value) => setEmail(value ?? '')} // Handle null or undefined values
            disabled={!isEditingEmail}
          />
          <IconButton onClick={() => setIsEditingEmail(!isEditingEmail)}>
            <EditIcon />
          </IconButton>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '16px', marginTop: '16px' }}>
          <Text style={{ marginRight: '8px' }}><strong>Password:</strong></Text>
          <Input
            placeholder="********"
            value={isEditingPassword ? password : '********'}
            onChangeText={(value) => setPassword(value ?? '')} // Handle null or undefined values
            disabled={!isEditingPassword}
          />
          <IconButton onClick={() => setIsEditingPassword(!isEditingPassword)}>
            <EditIcon />
          </IconButton>
        </div>
        <MUIButton
          variant="contained"
          style={{ backgroundColor: blue[500], color: 'white', marginTop: '16px' }}
          onClick={handleSaveChanges}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </MUIButton>
      </YStack>
    </Card>
  );
};

export default Settings;
