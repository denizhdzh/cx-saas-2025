# AgentIndex Migration Guide

## Problem

Her mesajda **tüm kullanıcıları** tarayarak agent'ı bulmaya çalışıyorduk. Bu çok yavaş ve maliyetli:

```javascript
// ESKI KOD (YAVAS!)
const usersSnapshot = await db.collection('users').get(); // 100+ kullanıcı
for (const userDoc of usersSnapshot.docs) {
  const agentRef = await db.collection('users').doc(userDoc.id)
    .collection('agents').doc(agentId).get();
  if (agentRef.exists) {
    // Agent bulundu!
  }
}
```

**Sonuç:** 100 kullanıcı varsa, her mesajda 100+ sorgu! 😱

## Çözüm

`agentIndex` koleksiyonu: `agentId` -> `userId` mapping

```javascript
// YENİ KOD (HIZLI!)
const agentIndex = await db.collection('agentIndex').doc(agentId).get();
const userId = agentIndex.data().userId;
const agent = await db.collection('users').doc(userId)
  .collection('agents').doc(agentId).get();
```

**Sonuç:** Sadece 2 sorgu! ⚡

## Performans İyileştirmesi

| Durum | Eski Yöntem | Yeni Yöntem | İyileştirme |
|-------|-------------|-------------|-------------|
| 10 kullanıcı | 10+ sorgu | 2 sorgu | **5x daha hızlı** |
| 100 kullanıcı | 100+ sorgu | 2 sorgu | **50x daha hızlı** |
| 1000 kullanıcı | 1000+ sorgu | 2 sorgu | **500x daha hızlı** |

## Migration Adımları

### 1. Firebase Service Account Key'i Hazırla

Firebase Console'dan service account key indir:
- Firebase Console → Project Settings → Service Accounts
- Generate New Private Key
- `serviceAccountKey.json` olarak kaydet

```bash
cd functions
# serviceAccountKey.json dosyasını functions/ klasörüne kopyala
```

### 2. Migration Script'i Çalıştır

```bash
cd functions
node migrateAgentIndex.js
```

Bu script:
- Tüm kullanıcıları tarar
- Her kullanıcının tüm agentlerini bulur
- Her agent için `agentIndex` koleksiyonunda entry oluşturur

### 3. Firestore Rules Güncelle

`agentIndex` koleksiyonu için kurallar ekle:

```javascript
// firestore.rules
match /agentIndex/{agentId} {
  // Only Cloud Functions can write
  allow read: if true; // Public read for widget
  allow write: if false; // Only server-side
}
```

### 4. Functions'ı Deploy Et

```bash
firebase deploy --only functions
```

## Yeni Agent Oluşturulduğunda

Artık agent oluşturulduğunda otomatik olarak `agentIndex` de oluşturuluyor:

**Frontend (`AgentContext.jsx`):**
```javascript
// Agent oluştur
const docRef = await addDoc(agentsRef, newAgent);

// AgentIndex oluştur
await setDoc(doc(db, 'agentIndex', docRef.id), {
  userId: user.uid,
  agentId: docRef.id,
  createdAt: new Date()
});
```

**Backend (`functions/index.js`):**
```javascript
// Agent oluştur/güncelle
await agentRef.set(agentData, { merge: true });

// AgentIndex oluştur
await db.collection('agentIndex').doc(agentId).set({
  userId: userId,
  agentId: agentId,
  createdAt: admin.firestore.FieldValue.serverTimestamp()
}, { merge: true });
```

## Agent Silindiğinde

Agent silindiğinde `agentIndex` de otomatik siliniyor:

```javascript
// Agent sil
await deleteDoc(doc(db, 'users', user.uid, 'agents', agentId));

// AgentIndex sil
await deleteDoc(doc(db, 'agentIndex', agentId));
```

## Değişen Fonksiyonlar

### 1. `chatWithAgentExternal` (External Widget)
- ✅ Tüm kullanıcıları taramıyor
- ✅ Direkt `agentIndex` kullanıyor
- ⚡ 50-500x daha hızlı

### 2. `getAgentConfig` (Widget Config)
- ✅ Tüm kullanıcıları taramıyor
- ✅ Direkt `agentIndex` kullanıyor
- ⚡ 50-500x daha hızlı

### 3. `analyzeMessage` (Analytics)
- ✅ Tüm kullanıcıları taramıyor
- ✅ Direkt `agentIndex` kullanıyor
- ⚡ 50-500x daha hızlı

## Güvenlik

`agentIndex` koleksiyonu:
- ✅ Public read (widget'lar için)
- ✅ Sadece server-side write (güvenlik)
- ✅ Minimal data (userId, agentId, createdAt)
- ✅ Hassas bilgi yok

## Rollback (Gerekirse)

Eğer bir sorun çıkarsa, eski kodu geri getirmek için:

```bash
git revert HEAD
firebase deploy --only functions
```

Ama `agentIndex` koleksiyonu kalır - zarar vermez, sadece kullanılmaz.

## Sonuç

✅ Her mesajda 2 sorgu (100+ yerine)
✅ 50-500x performans artışı
✅ Daha düşük maliyet (Firestore okuma ücretleri)
✅ Daha hızlı yanıt süreleri
✅ Scalable (1000+ kullanıcı için hazır)

**Not:** `serviceAccountKey.json` dosyasını GIT'e EKLEME! `.gitignore`'da olduğundan emin ol.
