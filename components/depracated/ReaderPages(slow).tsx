import { Stack, useLocalSearchParams } from "expo-router";
import { useRef, useState, useEffect } from "react";
import { getMockReadingData } from "@/types/mocks/mock_data";
import { FlatList, View, Text, useWindowDimensions, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PageItem, SurahSegment } from "@/types/quran_data";
import { ReaderPageItem } from "@/components/depracated/ReaderPageItem";
import { segmentSessionIntoItems } from "@/utils/paginationMeasure";


export const ReaderPages = () => {
  const flatListRef = useRef<FlatList>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState<{items : PageItem[]}[]>([]);
  const [isMeasuring, setIsMeasuring] = useState(true);
  const { height, width } = useWindowDimensions();

  const { surahId, sessionType } = useLocalSearchParams<{ 
    surahId: string;
    sessionType: string;
  }>();        

  // Data
  const segments = segmentSessionIntoItems(getMockReadingData('full').segments);


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

    const renderPage = ({ item }: { item: { items: PageItem[] } }) => {
    return (
            <View style={{ width, height: height * 0.85 }}>
                <ReaderPageItem items={item.items} />
            </View>
        );
    };

  return (
    <SafeAreaView className="bg-matteBlack h-full">
        { isMeasuring && (
            <PaginatedMeasurer 
                allItems={segments} // @ts-ignore
                targetHeight={height * 0.85} 
                onPageGenerated={(page: PageItem[], last: boolean) => {
                    setPages(prev => [...prev, { items: page }]);
                    if (last) setIsMeasuring(false);
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
          {currentPage + 1} / {pages.length}
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

//  Logic for pagination logic:
//  For(int i = 0; i < segments.length; i++) :

//     Try to render

//     if cumulative height > current height:


//         pop last render


//         start a new page

//         i--

//         continue

//     else:

//         add to current page 


//  Pseudocode for the "Try to render" step:
//  
//  Maintain: current page content + next item to add

//  Render this combination in an invisible container

//  Measure the height of this container

//  If height > limit, we know the next item cannot fit on the current page.

//       start a new page with the next item as the first content.

//  Else, we add the next item to the current page and repeat with the following item.


interface PaginatedMeasureProps {
    allItems: PageItem[];
    targetHeight: number;
    onPageGenerated: (page: PageItem[], last: boolean) => void;
}


export const PaginatedMeasurer = ({ allItems, targetHeight, onPageGenerated } : PaginatedMeasureProps) => {
  const { height } = useWindowDimensions();
  const MAX_H = height * 0.82; // Your "current height" limit

  // State mimicking your loop variables
  const [currentIndex, setCurrentIndex] = useState(0); // This is your 'i'
  const [currentItems, setCurrentItems] = useState([]); // Content of page currently being built
  
  // This is the "Try to render" state
  const [measuringItems, setMeasuringItems] = useState([]);

  // @ts-ignore
  const handleLayout = (event) => {
    const measuredHeight = event.nativeEvent.layout.height;

    if (measuredHeight > targetHeight) {
      // --- LOGIC: "if cumulative height > limit" ---

      onPageGenerated([...currentItems], false); // Send the completed page back to parent
      
      // 1. "pop last render": We save currentItems (which was everything BEFORE the overflow)
      // @ts-ignore
      
      // 2. "start a new page": Clear the currentItems
      setCurrentItems([]);
      
      // 3. "i--": We DO NOT increment currentIndex. 
      // The next render will try to put the item that failed onto the fresh empty page.
      // @ts-ignore
      setMeasuringItems([allItems[currentIndex]]);
    } else {
      // --- LOGIC: "else: add to current page" ---
      
      const nextItem = allItems[currentIndex];
      
      // Update our "committed" list
      const updatedCurrent = [...currentItems, nextItem];
      // @ts-ignore
      setCurrentItems(updatedCurrent);

      if (currentIndex + 1 < allItems.length) {
        // Increment 'i' and try to add the next item to the existing pile
        // @ts-ignore
        setMeasuringItems([...updatedCurrent, allItems[currentIndex + 1]]);
        setCurrentIndex(prev => prev + 1);
      } else {
        // WE ARE DONE: Save the final page
        onPageGenerated([...updatedCurrent], true);   
      }
    }
  };

  return (
    <View 
      style={{ position: 'absolute', opacity: 0, width: '100%', left: 0 }}
      onLayout={handleLayout}
      key={`measure-step-${currentIndex}`}
    >
      {/* "Try to render": We render the current page + the next item 
         to see if they fit together 
      */}
      <ReaderPageItem items={measuringItems} />
    </View>
  );
};