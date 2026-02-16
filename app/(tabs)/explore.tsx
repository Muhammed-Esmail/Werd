import React, { useCallback, useState } from 'react'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import SearchBar from "@/components/SearchBar";
import { router } from 'expo-router';
import { SURAH_DATA, Surah } from '@/types/reader_data';
import { useMemo } from 'react';

interface FilterButtonProps {
  id: number;
  nameEn: string; 
  nameAr: string;
  ayahs: number;
  type: string;
  onPress : any;
}

const SurahCard = React.memo(({id, nameEn, nameAr, ayahs, type, onPress} : FilterButtonProps) => {
  let id_padded = `${id}`
  if(id_padded.length === 1) id_padded = "0" + id_padded
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.5}
      className='mt-10 flex-row justify-between'
    >
      <View className='flex-row gap-5'>
        <Text className='ml-5 mt-5 text-primaryGold opacity-50'>{id_padded}</Text>
        <View>
          <Text className='text-gray-900 dark:text-white font-bold text-[15px]'>{nameEn}</Text>
          <View className='flex-row justify-between w-40 mt-2'>
            <Text className='text-gray-600 dark:text-mutedWhite'>{ayahs} AYAHS</Text> 
            <Text className='text-gray-600 dark:text-mutedWhite'> {type}</Text>
          </View>
        </View>
      </View>

      <View className='justify-center items-center'>
        <Text className='py-2 mr-5 text-primaryGold text-2xl font-amiri-bold'>{nameAr.slice(7)}</Text>
      </View>
    </TouchableOpacity>
  )
});

const FilterButton = ({ label, active, onPress }: any) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`py-2 px-3 border border-gray-900 dark:border-white rounded-full ${active ? 'opacity-100' : 'opacity-50'}`}
    >
      <Text className='text-gray-600 dark:text-mutedWhite font-bold text-[14px]'>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const explore = () => {

  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const handleFilterAll = useCallback(() => setFilter('ALL'), []);
  const handleFilterMeccan = useCallback(() => setFilter('MECCAN'), []);
  const handleFilterMedinan = useCallback(() => setFilter('MEDINAN'), []);
  const handleFilterFavorites = useCallback(() => setFilter('FAVORITES'), []);

  const filterHandlers: Record<string, () => void> = useMemo(() => ({
    'ALL': handleFilterAll,
    'MECCAN': handleFilterMeccan,
    'MEDINAN': handleFilterMedinan,
    'FAVORITES': handleFilterFavorites,
  }), [handleFilterAll, handleFilterMeccan, handleFilterMedinan, handleFilterFavorites]);


  const filteredSurahs = useMemo(() => {
    const cleanQuery = searchQuery.toLowerCase().trim();
    
    return SURAH_DATA.filter((surah) => {
      const matchesFilter = filter === 'ALL' || surah.type.toUpperCase() === filter;
      
      if (!matchesFilter) return false;
      if (!cleanQuery) return true;

      return (
        surah.englishName.toLowerCase().includes(cleanQuery) ||
        surah.arabicName.includes(cleanQuery) ||
        surah.id.toString() === cleanQuery
      );
    }).sort((a, b) => {
        const aStarts = a.englishName.toLowerCase().startsWith(cleanQuery) ? 1 : 0;
        const bStarts = b.englishName.toLowerCase().startsWith(cleanQuery) ? 1 : 0;
        return bStarts - aStarts;
    });
  }, [filter, searchQuery]);

  const handleSurahPress = useCallback((surahId: number) => {
    router.push({
      pathname: '/reader',
      params: { surahId, sessionType: 'full_surah' } as any
    });
  }, []);

  console.log(filter);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-bgBlack">
          <View className='w-[100%] justify-center items-center'>
            <Text className='text-primaryGold mt-10 text-xl font-bold'> SURAH EXPLORER </Text>
          </View>

          <SearchBar
            placeholder="Search Surah..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          
          <View className='flex-row gap-3 px-4 mt-6 justify-center'>
            {['ALL', 'MECCAN', 'MEDINAN', 'FAVORITES'].map((cat) => (
              <FilterButton 
                key={cat}
                label={cat} 
                active={filter === cat} 
                onPress={filterHandlers[cat]} 
                className={`${filter === cat ? 'opacity-100' : 'opacity-50'}`}
              />
            ))}
          </View>
          
          <FlatList
            data = {filteredSurahs}
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
            initialNumToRender={10}
            maxToRenderPerBatch={20}
            removeClippedSubviews={true}
            ItemSeparatorComponent={() => (
              <View className='h-[1px] bg-gray-300 dark:bg-white mx-5 mt-10' />
            )}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={() => <View className="h-48" />}
          >
          </FlatList>
    </SafeAreaView>
  )
}

export default explore