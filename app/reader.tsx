import React from 'react'
import { ReaderInfiniteScroll } from '@/components/ReaderInfiniteScroll';
import { ReaderPages } from '@/components/ReaderPages';
import { useAppSettings } from '@/services/useAppSettings';

const ReaderMode = {
    PAGES: 'pages',
    INFINITE_SCROLL: 'infinite_scroll',
}



const Reader = () => {

    const { theme, isScrollMode } = useAppSettings();
    
    if(isScrollMode) {
        return <ReaderInfiniteScroll/>;
    }
    else {
        return <ReaderPages/>;
    }
}

export default Reader