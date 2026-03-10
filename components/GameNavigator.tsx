import { User } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { auth, db } from '../firebaseConfig';

interface GameNavigatorProps {
  user: User;
}

type Step = 'grade' | 'subject' | 'subCategory' | 'games' | 'webview';

export const GameNavigator: React.FC<GameNavigatorProps> = ({ user }) => {
  const [step, setStep] = useState<Step>('grade');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [grades, setGrades] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [activeGameUrl, setActiveGameUrl] = useState<string | null>(null);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    if (step === 'webview') {
        setActiveGameUrl(null);
        setStep('games');
    }
    else if (step === 'games') setStep('subCategory');
    else if (step === 'subCategory') setStep('subject');
    else if (step === 'subject') setStep('grade');
  };

  useEffect(() => {
    if (!user || step === 'webview') return;

    let unsubscribe = () => {};
    const handleError = (error: Error) => {
      console.error("Firestore Snapshot Error: ", error);
      Alert.alert("שגיאה בטעינת נתונים", "אירעה שגיאה. ייתכן שנדרש אינדקס במסד הנתונים. בדוק את לוג השגיאות בקונסול.");
      setLoading(false);
    };

    setLoading(true);
    if (step === 'grade') {
      const q = collection(db, 'games');
      unsubscribe = onSnapshot(q, (snapshot) => {
        const allGames = snapshot.docs.map(doc => doc.data());
        const uniqueGrades = [...new Set(allGames.map(g => g.grade).filter(Boolean))].sort() as string[];
        setGrades(uniqueGrades);
        setLoading(false);
      }, handleError);
    } else if (step === 'subject') {
      const q = query(collection(db, 'games'), where('grade', '==', selectedGrade));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const allGames = snapshot.docs.map(doc => doc.data());
        const uniqueSubjects = [...new Set(allGames.map(g => g.subject).filter(Boolean))].sort() as string[];
        setSubjects(uniqueSubjects);
        setLoading(false);
      }, handleError);
    } else if (step === 'subCategory') {
      const q = query(collection(db, 'games'), where('grade', '==', selectedGrade), where('subject', '==', selectedSubject));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const allGames = snapshot.docs.map(doc => doc.data());
        const uniqueSubCategories = [...new Set(allGames.map(g => g.subCategory || g.SubCategory || g.subcategory || g.sub_category || g.category || g.SubCateory || g.subCateory).filter(Boolean))].sort() as string[];
        setSubCategories(uniqueSubCategories);
        setLoading(false);
      }, handleError);
    } else if (step === 'games') {
      const q = query(collection(db, 'games'), where('grade', '==', selectedGrade), where('subject', '==', selectedSubject));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const allGames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const filteredGames = allGames.filter((g: any) => {
            const category = g.subCategory || g.SubCategory || g.subcategory || g.sub_category || g.category || g.SubCateory || g.subCateory;
            return category && category.trim() === selectedSubCategory.trim();
        });
        setGames(filteredGames);
        setLoading(false);
      }, handleError);
    }

    return () => unsubscribe();
  }, [step, user, selectedGrade, selectedSubject, selectedSubCategory]);

  const renderMenuButton = (title: string, onPress: () => void, color: string) => (
    <TouchableOpacity style={[styles.card, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.cardText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {step !== 'grade' && <TouchableOpacity onPress={handleBack}><Text style={styles.backText}>⬅ חזור</Text></TouchableOpacity>}
        <TouchableOpacity onPress={() => auth.signOut()}><Text style={{ color: 'red' }}>יציאה</Text></TouchableOpacity>
      </View>

      {step === 'webview' && activeGameUrl ? (
        <WebView source={{ uri: activeGameUrl }} style={{ flex: 1 }} />
      ) : (
        <>
          <Text style={styles.header}>שלום {user?.email}</Text>

          {loading ? <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} /> : <>
            {step === 'grade' && <FlatList data={grades} keyExtractor={(item) => item} numColumns={2}
              ListEmptyComponent={<Text style={styles.emptyText}>לא נמצאו כיתות</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.card, { backgroundColor: '#4ECDC4' }]} onPress={() => { setSelectedGrade(item); setStep('subject'); }}>
                  <Text style={styles.cardText}>כיתה {item}</Text>
                </TouchableOpacity>
              )} />}

            {step === 'subject' && <FlatList data={subjects} keyExtractor={(item) => item} numColumns={2}
              ListEmptyComponent={<Text style={styles.emptyText}>לא נמצאו מקצועות</Text>}
              renderItem={({ item }) => renderMenuButton(item, () => { setSelectedSubject(item); setStep('subCategory'); }, '#FF6B6B')} />}

            {step === 'subCategory' && <FlatList data={subCategories} keyExtractor={(item) => item} numColumns={2}
              ListEmptyComponent={<Text style={styles.emptyText}>לא נמצאו נושאים למקצוע זה</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.card, { backgroundColor: '#a55eea' }]} onPress={() => { setSelectedSubCategory(item); setStep('games'); }}>
                  <Text style={styles.cardText}>{item}</Text>
                </TouchableOpacity>
              )} />}

            {step === 'games' && <FlatList data={games} keyExtractor={(item) => item.id} numColumns={2}
              ListEmptyComponent={<Text style={styles.emptyText}>לא נמצאו משחקים לנושא זה</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.card, { backgroundColor: '#FFD93D' }]} onPress={() => {
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
          </>}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 10 },
  header: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
  card: { flex: 1, margin: 10, height: 100, borderRadius: 15, justifyContent: 'center', alignItems: 'center', padding: 5 },
  cardText: { fontSize: 18, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 10 },
  backText: { color: '#0984e3', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', fontSize: 18, marginTop: 20 },
});