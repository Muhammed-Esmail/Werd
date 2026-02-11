import { Image, View } from "react-native"

const BismillahImg = require('@/assets/surah_names/bismillah.png');

export const Bismillah = () => {
    return (
        <View className="h-[45px] w-full mb-2 mt-6 justify-center items-center border-white/30">
            <Image 
                source={BismillahImg} 
                className="w-full" 
                style={{ 
                    height: 150, 
                    position: 'absolute',
                    tintColor: '#FFFFFF' 
                }} 
                resizeMode="contain"
            />
        </View>
    )
}