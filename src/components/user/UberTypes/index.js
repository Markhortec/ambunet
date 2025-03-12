import React from "react";
import { View, Text, Pressable } from "react-native";
import UberTypeRow from '../UberTypeRow';
import typesData from '../../../assets/data/types';

const UberTypes = ({ typeState, onSubmit, distance, calculatePrice }) => {
  const [selectedType, setSelectedType] = typeState;
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={{backgroundColor:'#fff'}}>
      {typesData.map((type) => (
        <UberTypeRow
          type={type}
          key={type.id}
          isSelected={type.type === selectedType}
          onPress={() => setSelectedType(type.type)}
          distance={distance}               
          calculatePrice={calculatePrice}    
          currentTime={currentTime}          
        />
      ))}

      <Pressable
        onPress={onSubmit}
        style={{
          backgroundColor: 'red',
          padding: 10,
          margin: 10,
          alignItems: 'center',
          borderRadius: 5,
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
         Book Ride
        </Text>
      </Pressable>
    </View>
  );
};

export default UberTypes;
