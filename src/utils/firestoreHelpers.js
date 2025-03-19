// utils/firestoreHelpers.js
import firestore from '@react-native-firebase/firestore';

export const fetchUserData = async (userId) => {
  const userDoc = await firestore().collection('users').doc(userId).get();
  return userDoc.exists ? userDoc.data() : null;
};

export const fetchBusinessData = async (userId) => {
  const businessDoc = await firestore()
    .collection('businesses')
    .where('userId', '==', userId)
    .get();
  return !businessDoc.empty ? businessDoc.docs[0].data() : null;
};