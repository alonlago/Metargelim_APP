import { Auth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface AuthScreenProps {
  onGoogleSignIn: () => void;
  auth: Auth;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onGoogleSignIn, auth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .catch((error) => Alert.alert("שגיאה בכניסה", error.message));
  };

  const handleRegister = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        sendEmailVerification(userCredential.user)
          .then(() => {
            Alert.alert("הצלחה", "נרשמת בהצלחה! שלחנו לך מייל אימות. אנא אשר אותו כדי שתוכל להיכנס.");
            auth.signOut();
          });
      })
      .catch((error) => Alert.alert("שגיאה בהרשמה", error.message));
  };

  return (
    <View style={styles.loginContainer}>
      <Text style={styles.header}>
        {isRegistering ? 'יצירת חשבון חדש 📝' : 'כניסה למערכת 👋'}
      </Text>
      
      <TextInput 
        placeholder="אימייל" 
        style={styles.input} 
        onChangeText={setEmail} 
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput 
        placeholder="סיסמה" 
        style={styles.input} 
        secureTextEntry 
        onChangeText={setPassword} 
      />
      
      <TouchableOpacity 
        style={[styles.loginButton, {backgroundColor: isRegistering ? '#2ecc71' : '#0984e3'}]} 
        onPress={isRegistering ? handleRegister : handleLogin}
      >
        <Text style={styles.buttonText}>{isRegistering ? 'הירשם עכשיו' : 'כניסה'}</Text>
      </TouchableOpacity>

      <View style={styles.separator}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>או</Text>
        <View style={styles.separatorLine} />
      </View>

      <TouchableOpacity 
        style={[styles.loginButton, styles.googleButton]} 
        onPress={onGoogleSignIn}
      >
        <Text style={styles.googleButtonText}>כניסה מהירה עם Google G</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={{ marginTop: 25 }}>
        <Text style={styles.switchText}>
          {isRegistering ? 'כבר יש לכם חשבון? להתחברות' : 'משתמשים חדשים? לחצו להרשמה'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  loginContainer: { flex: 1, justifyContent: 'center', padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 10, textAlign: 'right' },
  loginButton: { padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  separatorLine: { flex: 1, height: 1, backgroundColor: '#eee' },
  separatorText: { marginHorizontal: 10, color: '#999' },
  googleButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  googleButtonText: { color: '#444', fontWeight: 'bold' },
  switchText: { color: '#0984e3', textAlign: 'center' },
});