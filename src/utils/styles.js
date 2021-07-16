import React from 'react';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scroll: {},
  title: {
    textAlign: 'center',
    color: '#000',
    fontWeight: 'bold',
  },
  text: {
    textAlign: 'center',
    color: '#707070',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 8,
  },
  button: { borderColor: '#fc8132' },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 2,
    shadowOpacity: 1,
  },
});
