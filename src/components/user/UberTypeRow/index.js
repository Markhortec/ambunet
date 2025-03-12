import React from 'react';
import { View, Image, Text,StyleSheet, Pressable } from 'react-native';
// import styles from './styles.js';
import Ionicons from 'react-native-vector-icons/Ionicons';

const UberTypeRow = ({ type, onPress, isSelected, distance, calculatePrice, currentTime }) => {
  // Function to get the image based on the Uber type
  const getImage = (type) => {
    if (type === 'Haice + AC + Oxy') {
      return require('../../../assets/images/a2.png');
    }
    else if (type === 'Haice + AC') {
      return require('../../../assets/images/a2.png');
    }
    else if (type === 'Haice + Oxy') {
      return require('../../../assets/images/a2.png');
    }
    else if (type === 'Haice') {
      return require('../../../assets/images/a2.png');
    }
    else if (type === 'Every + AC ') {
      return require('../../../assets/images/a2.png');
    }
    else if(type === 'Every + Oxy') {
      return require('../../../assets/images/a2.png');
    }
    else if (type === 'Every ') {
      return require('../../../assets/images/a2.png');
    }
    else{
      return require('../../../assets/images/a1.png');
    }
   
  };

  const estimatedPrice = calculatePrice(type.baseRatePerKm, distance);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, isSelected && styles.selected]}  // Apply selected style
    >
      {/* Uber Type Image */}
      <Image style={styles.image} source={getImage(type.type)} />

      {/* Middle Section (Uber Type Info) */}
      <View style={styles.middleContainer}>
        <Text style={styles.type}>
          {type.type}{' '}
          <Ionicons name="person" size={16} color="red" /> {type.capacity} 
        </Text>
        <Text style={styles.time}>{currentTime} drop-off</Text>
      </View>

      {/* Price Section */}
      <View style={styles.rightContainer}>
        <Ionicons name="pricetag" size={18} color="#42d742" />
        <Text style={styles.price}>Rs.{estimatedPrice}</Text>
      </View>
    </Pressable>
  );
};


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    borderWidth: 0.3,
    borderColor: '#e0e0e0',
  },
  image: {
    height: 80,
    width: 90,
    resizeMode: 'contain',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  middleContainer: {
    flex: 1,
    marginHorizontal: 20,
    justifyContent: 'center',
  },
  type: {
    fontFamily: 'Roboto-Bold',
    fontSize: 18,
    marginBottom: 5,
    color: '#333',
    fontWeight: '700',
  },
  time: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#5d5d5d',
    marginTop: 3,
  },
  rightContainer: {
    width: 120,
    justifyContent: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontFamily: 'Roboto-Bold',
    fontSize: 18,
    marginLeft: 10,
    color: 'black',
  },
  selected: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 5,
  }
});


export default UberTypeRow;