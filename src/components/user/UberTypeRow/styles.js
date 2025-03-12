import { StyleSheet } from 'react-native';

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

export default styles;
