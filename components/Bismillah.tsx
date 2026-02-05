import { Image, View } from "react-native"

const BismillahImg = require('@/assets/surah_names/bismillah.png');

export const Bismillah = () => {
    return (
        <View className="h-[80px] w-full mb-5 justify-center items-center overflow-hidden border-white/30">
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