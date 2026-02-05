import { Text, View } from "react-native"

const formatAyahNumber = (number: number): string => {
const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
return number
    .toString()
    .split('')
    .map(digit => arabicNumerals[parseInt(digit)])
    .join('');
}

export const Ayah = ({text, number} : any) => {
  return (
    <>
      <Text className="text-white text-[24px] font-quran leading-loose flex-1 text-right">
        {text}{' '}
        <Text className="text-primaryGold">
          ﴿{formatAyahNumber(number)}﴾ { }
        </Text>
      </Text>
    </>
  );
}