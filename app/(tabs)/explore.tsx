import React, { useState } from 'react'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import SearchBar from "@/components/SearchBar";

// Sample surah data
const SURAH_DATA = [
  { id: 1, nameEn: 'Al-Fatihah', nameAr: 'الفاتحة', ayahs: 7, type: 'Meccan' },
  { id: 2, nameEn: 'Al-Baqarah', nameAr: 'البقرة', ayahs: 286, type: 'Medinan' },
  { id: 3, nameEn: "Ali 'Imran", nameAr: 'آل عمران', ayahs: 200, type: 'Medinan' },
  { id: 4, nameEn: 'An-Nisa', nameAr: 'النساء', ayahs: 176, type: 'Medinan' },
  { id: 5, nameEn: "Al-Ma'idah", nameAr: 'المائدة', ayahs: 120, type: 'Medinan' },
  { id: 6, nameEn: "Al-An'am", nameAr: 'الأنعام', ayahs: 165, type: 'Meccan' },
  { id: 7, nameEn: "Al-A'raf", nameAr: 'الأعراف', ayahs: 206, type: 'Meccan' },
  { id: 8, nameEn: 'Al-Anfal', nameAr: 'الأنفال', ayahs: 75, type: 'Medinan' },
]


const SurahCard = ({id, nameEn, nameAr, ayahs, type, onPress} : any) => {
  let id_padded = `${id}`
  if(id_padded.length === 1) id_padded = "0" + id_padded
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.5}
      className='mt-10 flex-row justify-between'
    >
      {/* Left Number */}
      <View className='flex-row gap-5'>
        <Text className='ml-5 mt-5 text-goldLight'>{id_padded}</Text>
        <View>
          <Text>{nameEn}</Text>
          <View className='flex-row justify-between w-40 mt-2'>
            <Text className='text-mutedWhite'>{ayahs} AYAHS</Text> 
            <Text className='text-mutedWhite'> {type}</Text>
          </View>
        </View>
      </View>

      {/* Arabic Name */}
      <View>
        <Text className='mr-5 text-primaryGold text-2xl font-amiri-bold'>{nameAr}</Text>
      </View>
    </TouchableOpacity>
  )
}

const FilterButton = ({label, active, onPress} : any) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.3}
      className='py-2 px-3 border border-white rounded-full'
    >
      <Text className='text-mutedWhite font-bold text-[14px]'>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const explore = () => {

  const [filter, setFilter] = useState('ALL');

  const handleSurahPress = (surah: any) => {
    console.log('Selected surah:', surah)
    // Add navigation here
  }

  return (
    <SafeAreaView className="flex-1 bg-matteBlack">
          {/* Header Container */}
          <View className='w-[100%] justify-center items-center'>
            <Text className='text-primaryGold mt-10 text-xl font-bold'> SURAH EXPLORER </Text>
          </View>

          {/* Search Bar */}
          <SearchBar
            onPress={() => {}}
            placeholder="Search Surah..."
          />
          {/* Filters */}
          <View className='flex-row gap-3 px-4 mt-6 justify-center'>
            <FilterButton label="ALL" active={filter === 'ALL'} onPress={() => setFilter('ALL')} />
            <FilterButton label="MECCAN" active={filter === 'MECCAN'} onPress={() => setFilter('MECCAN')} />
            <FilterButton label="MEDINAN" active={filter === 'MEDINAN'} onPress={() => setFilter('MEDINAN')} />
            <FilterButton label="FAVORITES" active={filter === 'FAVORITES'} onPress={() => setFilter('FAVORITES')} />
          </View>
          
          {/* Surah List */}
          <FlatList
            data = {SURAH_DATA}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({item}) => (
              <SurahCard 
                id={item.id} 
                nameEn={item.nameEn}
                nameAr={item.nameAr}
                ayahs={item.ayahs}
                type={item.type}
                onPress={() => handleSurahPress(item)}
              />
            )}
            contentContainerStyle={{paddingBottom: 120}}
            ItemSeparatorComponent={() => (
              <View className='h-[1px] bg-white mx-5 mt-10' />
            )}
            showsVerticalScrollIndicator={false}
          >
          </FlatList>
    </SafeAreaView>
  )
}

export default explore