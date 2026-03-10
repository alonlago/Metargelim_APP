import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthScreen } from '../../components/AuthScreen';
import { GameNavigator } from '../../components/GameNavigator';
import { auth } from '../../firebaseConfig';

WebBrowser.maybeCompleteAuthSession();

export default function IndexScreen() {
const [user, setUser] = useState<User | null>(null);
const [initializing, setInitializing] = useState(true);

const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: "260885991646-j5dak1pduqbeb1nj41mec5hjoiqukb62.apps.googleusercontent.com",
  iosClientId: "במידה_ויש",
  androidClientId: "במידה_ויש",
});

useEffect(() => {
const unsubscribe = onAuthStateChanged(auth, (u) => {
setUser(u);
if (initializing) setInitializing(false);
});
return unsubscribe;
}, [initializing]);

useEffect(() => {
if (response?.type === 'success') {
const { id_token } = response.params;
const credential = GoogleAuthProvider.credential(id_token);
signInWithCredential(auth, credential)
.catch((error) => {
alert("שגיאה בחיבור עם גוגל: " + error.message);
});
}
}, [response]);

if (initializing) {
  return <View style={styles.centered}><ActivityIndicator size="large" color="#4ECDC4" /></View>;
}

return (
  <SafeAreaView style={styles.container}>
    {!user ? (
      <AuthScreen auth={auth} onGoogleSignIn={() => promptAsync()} />
    ) : (
      <GameNavigator user={user} />
    )}
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: '#F8F9FA' },
centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});