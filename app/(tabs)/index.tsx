import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, onAuthStateChanged, sendEmailVerification, signInWithCredential, signInWithEmailAndPassword, User } from 'firebase/auth';
import { collection, getFirestore, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

WebBrowser.maybeCompleteAuthSession();

const firebaseConfig = {
apiKey: "AIzaSyBysVQkKlX4CkK8Sgm7bAq3jvKV5sQr5XU",
authDomain: "metargelimelementaryschool.firebaseapp.com",
projectId: "metargelimelementaryschool",
storageBucket: "metargelimelementaryschool.firebasestorage.app",
messagingSenderId: "260885991646",
appId: "1:260885991646:web:8c55f291b9382c94a0b24f",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export default function App() {
const [step, setStep] = useState('grade');
const [selectedGrade, setSelectedGrade] = useState('');
const [selectedSubject, setSelectedSubject] = useState('');
const [selectedSubCategory, setSelectedSubCategory] = useState('');
const [subCategories, setSubCategories] = useState<string[]>([]);
const [activeGameUrl, setActiveGameUrl] = useState<string | null>(null);
const [games, setGames] = useState<any[]>([]);
const [loading, setLoading] = useState(false);
const [user, setUser] = useState<User | null>(null);
const [initializing, setInitializing] = useState(true);
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [isRegistering, setIsRegistering] = useState(false);

const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: "260885991646-j5dak1pduqbeb1nj41mec5hjoiqukb62.apps.googleusercontent.com",
  iosClientId: "במידה_ויש",
  androidClientId: "במידה_ויש",
});

// 1. האזנה כללית למצב המשתמש (נשאר כמעט אותו דבר)
useEffect(() => {
const unsubscribe = onAuthStateChanged(auth, (u) => {
setUser(u);
if (initializing) setInitializing(false);
});
return unsubscribe;
}, []);

// 2. האזנה ספציפית לתגובה מגוגל (התוספת החדשה)
useEffect(() => {
if (response?.type === 'success') {
const { id_token } = response.params;
const credential = GoogleAuthProvider.credential(id_token);
signInWithCredential(auth, credential)
.then((userCredential) => {
// כאן המשתמש נכנס בהצלחה דרך גוגל
console.log("Logged in with Google:", userCredential.user.email);
})
.catch((error) => {
alert("שגיאה בחיבור עם גוגל: " + error.message);
});
}
}, [response]);

const handleLogin = () => {
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // ביטלנו את הבדיקה של emailVerified זמנית כדי שתוכל להתקדם
      setUser(userCredential.user); 
    })
    .catch((error) => alert(error.message));
};

const handleRegister = () => {
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // שליחת מייל האימות
      sendEmailVerification(userCredential.user)
        .then(() => {
          Alert.alert("הצלחה", "נרשמת בהצלחה! שלחנו לך מייל אימות. אנא אשר אותו כדי שתוכל להיכנס.");
          auth.signOut(); // ננתק אותו כדי שיצטרך להתחבר אחרי האישור
        });
    })
    .catch((error) => Alert.alert("שגיאה", error.message));
};

const handleGoogleSignIn = () => {
  promptAsync();
};

const renderMenuButton = (title: string, onPress: () => void, color: string) => (
  <TouchableOpacity key={title} style={[styles.card, { backgroundColor: color }]} onPress={onPress}>
    <Text style={styles.cardText}>{title}</Text>
  </TouchableOpacity>
);

const handleBack = () => {
  if (step === 'games') setStep('subCategory');
  else if (step === 'subCategory') setStep('subject');
  else if (step === 'subject') setStep('grade');
  else setStep('grade');
};

useEffect(() => {
  if (!user) return;

  if (step === 'subCategory') {
    setLoading(true);
    // שליפת כל המשחקים המתאימים לכיתה ולמקצוע כדי לחלץ תת-קטגוריות
    const q = query(collection(db, 'games'), where('grade', '==', selectedGrade), where('subject', '==', selectedSubject));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allGames = snapshot.docs.map(doc => doc.data());
      console.log(`נמצאו ${allGames.length} משחקים עבור כיתה ${selectedGrade} במקצוע ${selectedSubject}`);
      if (allGames.length > 0) console.log("דוגמה למשחק ראשון:", JSON.stringify(allGames[0], null, 2));

      // חילוץ רשימה ייחודית של subCategory
      const uniqueSubCategories = [...new Set(allGames.map(g => g.subCategory).filter(Boolean))];
      setSubCategories(uniqueSubCategories as string[]);
      setLoading(false);
    });
    return () => unsubscribe();
  } else if (step === 'games') {
    setLoading(true);
    // שליפת המשחקים הסופית לפי כל הסינונים
    const q = query(collection(db, 'games'), where('grade', '==', selectedGrade), where('subject', '==', selectedSubject), where('subCategory', '==', selectedSubCategory));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGames(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }
}, [step, user, selectedGrade, selectedSubject, selectedSubCategory]);

if (initializing) return <View style={styles.centered}><ActivityIndicator size="large" color="#4ECDC4" /></View>;

if (!user) {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.loginContainer}>
        <Text style={styles.header}>
          {isRegistering ? 'יצירת חשבון חדש 📝' : 'כניסה למערכת 👋'}
        </Text>
        
        {/* שדות הקלט (אימייל וסיסמה) */}
        <TextInput 
          placeholder="אימייל" 
          style={styles.input} 
          onChangeText={setEmail} 
          autoCapitalize="none"
        />
        <TextInput 
          placeholder="סיסמה" 
          style={styles.input} 
          secureTextEntry 
          onChangeText={setPassword} 
        />
        
        {/* כפתור הפעולה העיקרי (כניסה או הרשמה) */}
        <TouchableOpacity 
          style={[styles.loginButton, {backgroundColor: isRegistering ? '#2ecc71' : '#0984e3'}]} 
          onPress={isRegistering ? handleRegister : handleLogin}
        >
          <Text style={styles.buttonText}>{isRegistering ? 'הירשם עכשיו' : 'כניסה'}</Text>
        </TouchableOpacity>

        {/* קו מפריד "או" */}
        <View style={{flexDirection: 'row', alignItems: 'center', marginVertical: 20}}>
          <View style={{flex: 1, height: 1, backgroundColor: '#eee'}} />
          <Text style={{marginHorizontal: 10, color: '#999'}}>או</Text>
          <View style={{flex: 1, height: 1, backgroundColor: '#eee'}} />
        </View>

        {/* כפתור גוגל - מופיע תמיד */}
        <TouchableOpacity 
          style={[styles.loginButton, {backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd'}]} 
          onPress={handleGoogleSignIn}
        >
          <Text style={{color: '#444', fontWeight: 'bold'}}>כניסה מהירה עם Google G</Text>
        </TouchableOpacity>

        {/* כפתור החלפה בין המסכים */}
        <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={{ marginTop: 25 }}>
          <Text style={{ color: '#0984e3', textAlign: 'center' }}>
            {isRegistering ? 'כבר יש לכם חשבון? להתחברות' : 'משתמשים חדשים? לחצו להרשמה'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

return (
<SafeAreaProvider><SafeAreaView style={styles.container}>
<View style={styles.topRow}>
{step !== 'grade' && <TouchableOpacity onPress={handleBack}><Text style={styles.backText}>⬅ חזור</Text></TouchableOpacity>}
<TouchableOpacity onPress={() => auth.signOut()}><Text style={{color: 'red'}}>יציאה</Text></TouchableOpacity>
</View>
<Text style={styles.header}>שלום {user?.email}</Text>

{loading ? <ActivityIndicator size="large" color="#0000ff" style={{marginTop: 20}} /> : <>
{step === 'grade' && <FlatList data={['א', 'ב', 'ג', 'ד', 'ה', 'ו']} keyExtractor={(item) => item} numColumns={2} renderItem={({item}) => (
<TouchableOpacity style={[styles.card, {backgroundColor: '#4ECDC4'}]} onPress={() => {setSelectedGrade(item); setStep('subject');}}>
<Text style={styles.cardText}>כיתה {item}</Text>
</TouchableOpacity>
)} />}

{step === 'subject' && <View>{['שפה', 'חשבון', 'אנגלית'].map(sub => 
  renderMenuButton(sub, () => { setSelectedSubject(sub); setStep('subCategory'); }, '#FF6B6B')
)}</View>}

{step === 'subCategory' && <FlatList data={subCategories} keyExtractor={(item) => item} numColumns={2} 
  ListEmptyComponent={<Text style={{textAlign: 'center', fontSize: 18, marginTop: 20}}>לא נמצאו נושאים למקצוע זה</Text>}
  renderItem={({item}) => 
    renderMenuButton(item, () => { setSelectedSubCategory(item); setStep('games'); }, '#a55eea')
  } />}

{step === 'games' && <FlatList data={games} keyExtractor={(item) => item.id} numColumns={2} renderItem={({item}) => (
<TouchableOpacity style={[styles.card, {backgroundColor: '#FFD93D'}]} onPress={() => {setActiveGameUrl(item.url); setStep('webview');}}>
<Text style={styles.cardText}>{item.title}</Text>
</TouchableOpacity>
)} />}
{step === 'webview' && <WebView source={{uri: activeGameUrl ?? ''}} style={{flex: 1}} />}</>}
</SafeAreaView></SafeAreaProvider>
);
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: '#F8F9FA', padding: 10 },
centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
header: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
card: { flex: 1, margin: 10, height: 100, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
cardText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
loginContainer: { flex: 1, justifyContent: 'center', padding: 20 },
input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 10, textAlign: 'right' },
loginButton: { backgroundColor: '#0984e3', padding: 15, borderRadius: 10, alignItems: 'center' },
buttonText: { color: '#fff', fontWeight: 'bold' },
topRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 10 },
backText: { color: '#0984e3', fontWeight: 'bold' }
});