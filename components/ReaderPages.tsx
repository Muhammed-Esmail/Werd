import { Stack, useLocalSearchParams } from "expo-router";
import { useRef, useState, useEffect } from "react";
import { getMockReadingData } from "@/types/mocks/mock_data";
import { FlatList, View, Text, useWindowDimensions, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PageAtom } from "@/types/quran_data";
import { ReaderPageAtom } from "@/components/ReaderPageAtom";
import { segmentSessionIntoAtoms } from "@/utils/paginationMeasure";
import { PaginatedMeasurer } from "@/components/PaginatedMeasurer";

export const ReaderPages = () => {
  const flatListRef = useRef<FlatList>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState<{items : PageAtom[]}[]>([]);
  const [isMeasuring, setIsMeasuring] = useState(true);
  const { height, width } = useWindowDimensions();

  const { surahId, sessionType } = useLocalSearchParams<{ 
    surahId: string;
    sessionType: string;
  }>();        

  // Data
  const segments = segmentSessionIntoAtoms(getMockReadingData('full').segments);


  // Scroll to specific page
    const goToPage = (pageIndex: number) => {
        flatListRef.current?.scrollToIndex({
        index: pageIndex,
        animated: true,
        });
    }; 

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
        setCurrentPage(viewableItems[0].index || 0);
        }
    });
    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    });

    const renderPage = ({ item }: { item: { items: PageAtom[] } }) => {
    return (
            <View style={{ width, height: height * 0.85 }}>
                <ReaderPageAtom items={item.items} />
            </View>
        );
    };

  return (
    <SafeAreaView className="bg-matteBlack h-full">
        { isMeasuring && (
            <PaginatedMeasurer 
                allItems={segments} // @ts-ignore
                targetHeight={height * 0.85} 
                onPageGenerated={(page: PageAtom[], last: boolean) => {
                    setPages(prev => [...prev, { items: page }]);
                    if (last) setIsMeasuring(false);
                    console.log('Generated page with', page.length, 'atoms. Last?', last);
                }} 
            />
            )
        }
      <Stack.Screen options={{ headerShown: false }} />

      <FlatList
        ref={flatListRef}
        data={pages}
        renderItem={renderPage}
        keyExtractor={(item, index) => `page-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
        inverted
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* Page Controls */}
      <View className="flex-row m-5 justify-between items-center p-4">

        <TouchableOpacity
          onPress={() => goToPage(currentPage + 1)}
          className="bg-surfaceBlack px-6 py-3 rounded-lg w-[35%] items-center"
          style={{ opacity: currentPage === pages.length - 1 ? 0.5 : 1 }}
          disabled={currentPage === pages.length - 1}
        >
          <Text className="text-white">Next</Text>
        </TouchableOpacity>

        <Text className="text-white">
          {Math.min(currentPage + 1, pages.length)} / {pages.length}
        </Text>

        <TouchableOpacity
          onPress={() => goToPage(currentPage - 1)}
          className="bg-surfaceBlack px-6 py-3 rounded-lg w-[35%] items-center"
          style={{ opacity: currentPage === 0 ? 0.5 : 1 }}
          disabled={currentPage === 0}
        >
          <Text className="text-white">Previous</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};