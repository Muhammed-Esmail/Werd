import React, { useEffect, useState } from 'react'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import SearchBar from "@/components/SearchBar";
import { router } from 'expo-router';
import { SessionType, ReaderParams } from '@/types/reader_data';
import * as DB from "@/utils/DatabaseManager"

// const SURAH_DATA = await DB.getSurahs();

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
        <Text className='ml-5 mt-5 text-primaryGold opacity-50'>{id_padded}</Text>
        <View>
          <Text className='text-white font-bold text-[15px]'>{nameEn}</Text>
          <View className='flex-row justify-between w-40 mt-2'>
            <Text className='text-mutedWhite'>{ayahs} AYAHS</Text> 
            <Text className='text-mutedWhite'> {type}</Text>
          </View>
        </View>
      </View>

      {/* Arabic Name */}
      <View className='justify-center'>
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

  const [SURAH_DATA, setSurahData] = useState<DB.Surah[]>()  
  const [filter, setFilter] = useState('ALL');

  const handleSurahPress = (surah: any) => {

    const params : ReaderParams = {
      surahId: surah,
      sessionType: 'full_surah'
    };

    router.push({
      pathname: '/reader',
      params: params as any
    })
  }

  useEffect(() => {
    const init = async () => {
      const surhas = await DB.getSurahs() as DB.Surah[]
      setSurahData(surhas)
    };
    init();
  }, []);
  

  return (
    <SafeAreaView className="flex-1 bg-bgBlack">
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
                nameEn={item.englishName}
                nameAr={item.arabicName}
                ayahs={item.ayahs}
                type={item.type}
                onPress={() => handleSurahPress(item.id)}
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