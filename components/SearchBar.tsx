import { MaterialIcons } from '@expo/vector-icons'
import React from 'react'
import { Image, TextInput, View } from 'react-native'

interface Props {
    placeholder: string,
    onPress?: () => void
}

const SearchBar = ({placeholder, onPress}: Props) => {
  return (
    <View
        className='flex-row items-center bg-[#121212] mt-5 border-[1px] border-[#D4AF37] rounded-lg px-5 py-2 w-[93%] self-center'
    >
      <MaterialIcons name='search' size={23} color={'#D4AF37'}/>
      <TextInput
        onPress={onPress}
        placeholder={placeholder}
        value=''
        onChange={() => {}}
        placeholderTextColor={"white"}
        className='flex-1 ml-2 text-white ml-3'
      />
    </View>
  )
}

export default SearchBar