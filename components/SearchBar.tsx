import { MaterialIcons } from '@expo/vector-icons'
import React from 'react'
import { Image, TextInput, View } from 'react-native'
import tailwindConfig from '@/tailwind.config.js';
import resolveConfig from 'tailwindcss/resolveConfig';
import { Background } from '@react-navigation/elements';

interface Props {
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
}

const SearchBar = ({placeholder, value, onChangeText}: Props) => {
  return (
    <View
        className='bg-bgWhite dark:bg-black flex-row items-center mt-5 border-[1px] border-[#D4AF37] rounded-lg px-5 py-2 w-[93%] self-center'
    >
      <MaterialIcons name='search' size={23} color={'#D4AF37'}/>
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        className='flex-1 ml-2 text-white dark:text-textDeep ml-3'
      />
    </View>
  )
}

export default SearchBar