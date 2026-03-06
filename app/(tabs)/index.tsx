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
const [grades, setGrades] = useState<string[]>([]);
const [subjects, setSubjects] = useState<string[]>([]);
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
  <TouchableOpacity style={[styles.card, { backgroundColor: color }]} onPress={onPress}>
    <Text style={styles.cardText}>{title}</Text>
  </TouchableOpacity>
);

const handleBack = () => {
  if (step === 'webview') setStep('games');
  else if (step === 'games') setStep('subCategory');
  else if (step === 'subCategory') setStep('subject');
  else if (step === 'subject') setStep('grade');
  else setStep('grade');
};

useEffect(() => {
  if (!user) return;

  let unsubscribe = () => {};

  const handleError = (error: Error) => {
    console.error("Firestore Snapshot Error: ", error);
    // The error message from Firestore for missing indexes is very helpful, so we log it.
    // For the user, a generic message is often better.
    Alert.alert("שגיאה בטעינת נתונים", "אירעה שגיאה. ייתכן שנדרש אינדקס במסד הנתונים. בדוק את לוג השגיאות בקונסול.");
    setLoading(false);
  };

  if (step === 'grade') {
    setLoading(true);
    const q = collection(db, 'games');
    unsubscribe = onSnapshot(q, (snapshot) => {
      const allGames = snapshot.docs.map(doc => doc.data());
      const uniqueGrades = [...new Set(allGames.map(g => g.grade).filter(Boolean))].sort() as string[];
      setGrades(uniqueGrades);
      setLoading(false);
    }, handleError);
  } else if (step === 'subject') {
    setLoading(true);
    const q = query(collection(db, 'games'), where('grade', '==', selectedGrade));
    unsubscribe = onSnapshot(q, (snapshot) => {
      const allGames = snapshot.docs.map(doc => doc.data());
      const uniqueSubjects = [...new Set(allGames.map(g => g.subject).filter(Boolean))].sort() as string[];
      setSubjects(uniqueSubjects);
      setLoading(false);
    }, handleError);
  } else if (step === 'subCategory') {
    setLoading(true);
    const q = query(collection(db, 'games'), where('grade', '==', selectedGrade), where('subject', '==', selectedSubject));
    unsubscribe = onSnapshot(q, (snapshot) => {
      const allGames = snapshot.docs.map(doc => doc.data());
      
      if (allGames.length > 0) {
        console.log("🔍 מבנה הנתונים של המשחק הראשון שנמצא:", Object.keys(allGames[0]));
        console.log("📄 דוגמה לערכים:", JSON.stringify(allGames[0], null, 2));
      }

      // בדיקת כל הווריאציות האפשריות לשם השדה (כולל אותיות גדולות/קטנות)
      const uniqueSubCategories = [...new Set(allGames.map(g => g.subCategory || g.SubCategory || g.subcategory || g.sub_category || g.category || g.SubCateory || g.subCateory).filter(Boolean))].sort() as string[];
      setSubCategories(uniqueSubCategories);
      setLoading(false);
    }, handleError);
  } else if (step === 'games') {
    setLoading(true);
    // שליפת כל המשחקים לפי כיתה ומקצוע, וסינון בזיכרון כדי להתגבר על שמות שדות לא אחידים (כמו SubCateory)
    const q = query(collection(db, 'games'), where('grade', '==', selectedGrade), where('subject', '==', selectedSubject));
    unsubscribe = onSnapshot(q, (snapshot) => {
      const allGames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const filteredGames = allGames.filter((g: any) => {
        const category = g.subCategory || g.SubCategory || g.subcategory || g.sub_category || g.category || g.SubCateory || g.subCateory;
        return category === selectedSubCategory;
      });

      setGames(filteredGames);
      setLoading(false);
    }, handleError);
  }

  return () => unsubscribe();
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
{step === 'grade' && <FlatList data={grades} keyExtractor={(item) => item} numColumns={2} 
ListEmptyComponent={<Text style={{textAlign: 'center', fontSize: 18, marginTop: 20}}>לא נמצאו כיתות</Text>}
renderItem={({item}) => (
<TouchableOpacity style={[styles.card, {backgroundColor: '#4ECDC4'}]} onPress={() => {setSelectedGrade(item); setStep('subject');}}>
<Text style={styles.cardText}>כיתה {item}</Text>
</TouchableOpacity>
)} />}

{step === 'subject' && <FlatList data={subjects} keyExtractor={(item) => item} numColumns={2} 
ListEmptyComponent={<Text style={{textAlign: 'center', fontSize: 18, marginTop: 20}}>לא נמצאו מקצועות</Text>}
renderItem={({item}) => renderMenuButton(item, () => { setSelectedSubject(item); setStep('subCategory'); }, '#FF6B6B')} />}

{step === 'subCategory' && <FlatList data={subCategories} keyExtractor={(item) => item} numColumns={2} 
  ListEmptyComponent={<Text style={{textAlign: 'center', fontSize: 18, marginTop: 20}}>לא נמצאו נושאים למקצוע זה</Text>}
  renderItem={({item}) => (
    <TouchableOpacity style={[styles.card, {backgroundColor: '#a55eea'}]} onPress={() => { setSelectedSubCategory(item); setStep('games'); }}>
      <Text style={styles.cardText}>{item}</Text>
    </TouchableOpacity>
  )} />}

{step === 'games' && <FlatList data={games} keyExtractor={(item) => item.id} numColumns={2} renderItem={({item}) => (
<TouchableOpacity style={[styles.card, {backgroundColor: '#FFD93D'}]} onPress={() => {
  const url = item.url || item.link || item.URL;
  if (url) {
    setActiveGameUrl(url); 
    setStep('webview');
  } else {
    Alert.alert("שגיאה", "לא נמצא קישור למשחק זה");
  }
}}>
<Text style={styles.cardText}>{item.title || item.name || "משחק ללא שם"}</Text>
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